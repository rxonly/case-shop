-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ТАБЛИЦЫ

-- Тип роли пользователя
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Тип редкости предмета
DO $$ BEGIN
  CREATE TYPE item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  email       VARCHAR(255)   NOT NULL UNIQUE,
  age         INTEGER        CHECK (age >= 0 AND age <= 150),
  password    VARCHAR(255)   NOT NULL,
  role        user_role      NOT NULL DEFAULT 'user',
  balance     NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (balance >= 0),
  "createdAt" TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Предметы
CREATE TABLE IF NOT EXISTS items (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(200)   NOT NULL,
  rarity    item_rarity    NOT NULL DEFAULT 'common',
  "imageUrl" VARCHAR(500),
  value     NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (value >= 0)
);

-- Кейсы
CREATE TABLE IF NOT EXISTS cases (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200)   NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2)  NOT NULL CHECK (price > 0),
  "imageUrl"   VARCHAR(500),
  "isActive"   BOOLEAN        NOT NULL DEFAULT TRUE
);

-- Связь кейс - предмет
CREATE TABLE IF NOT EXISTS case_items (
  case_id  INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  item_id  INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, item_id)
);

-- Инвентарь
CREATE TABLE IF NOT EXISTS inventory (
  id           SERIAL PRIMARY KEY,
  "userId"     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "itemId"     INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  "obtainedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "isSold"     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Транзакции (история баланса)
CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  type        VARCHAR(50)   NOT NULL, -- 'topup', 'open_case', 'sell_item'
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ПРЕДСТАВЛЕНИЯ

-- Инвентарь с полной информацией о предмете и пользователе
CREATE OR REPLACE VIEW v_user_inventory AS
SELECT
  inv.id            AS inventory_id,
  u.id              AS user_id,
  u.name            AS user_name,
  u.email           AS user_email,
  i.id              AS item_id,
  i.name            AS item_name,
  i.rarity          AS item_rarity,
  i.value           AS item_value,
  inv."obtainedAt"  AS obtained_at,
  inv."isSold"      AS is_sold
FROM inventory inv
JOIN users u ON u.id = inv."userId"
JOIN items i ON i.id = inv."itemId";

-- Содержимое кейсов — какие предметы в каком кейсе
CREATE OR REPLACE VIEW v_case_contents AS
SELECT
  c.id          AS case_id,
  c.name        AS case_name,
  c.price       AS case_price,
  c."isActive"  AS case_active,
  i.id          AS item_id,
  i.name        AS item_name,
  i.rarity      AS item_rarity,
  i.value       AS item_value
FROM cases c
JOIN case_items ci ON ci.case_id = c.id
JOIN items i ON i.id = ci.item_id
ORDER BY c.id, i.rarity;

-- Топ пользователей по суммарной стоимости полученных предметов
CREATE OR REPLACE VIEW v_top_users AS
SELECT
  u.id          AS user_id,
  u.name        AS user_name,
  u.email       AS user_email,
  COUNT(inv.id) AS total_items,
  COALESCE(SUM(i.value) FILTER (WHERE NOT inv."isSold"), 0) AS inventory_value,
  COALESCE(SUM(i.value) FILTER (WHERE inv."isSold"), 0)     AS sold_value,
  u.balance
FROM users u
LEFT JOIN inventory inv ON inv."userId" = u.id
LEFT JOIN items i ON i.id = inv."itemId"
GROUP BY u.id, u.name, u.email, u.balance
ORDER BY inventory_value DESC;


-- ФУНКЦИИ

-- Получить баланс пользователя
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id INTEGER)
RETURNS NUMERIC AS $$
  SELECT balance FROM users WHERE id = p_user_id;
$$ LANGUAGE sql STABLE;

-- Случайный предмет из кейса (равномерное распределение)
CREATE OR REPLACE FUNCTION get_random_item_from_case(p_case_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_item_id INTEGER;
BEGIN
  SELECT item_id INTO v_item_id
  FROM case_items
  WHERE case_id = p_case_id
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'В кейсе % нет предметов', p_case_id;
  END IF;

  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;

-- Суммарная стоимость непроданного инвентаря пользователя
CREATE OR REPLACE FUNCTION get_inventory_value(p_user_id INTEGER)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(i.value), 0)
  FROM inventory inv
  JOIN items i ON i.id = inv."itemId"
  WHERE inv."userId" = p_user_id
    AND inv."isSold" = FALSE;
$$ LANGUAGE sql STABLE;


-- ХРАНИМЫЕ ПРОЦЕДУРЫ

-- Открытие кейса: списывает баланс, добавляет предмет в инвентарь
CREATE OR REPLACE PROCEDURE open_case(
  p_user_id INTEGER,
  p_case_id INTEGER,
  OUT p_item_id INTEGER,
  OUT p_new_balance NUMERIC
)
LANGUAGE plpgsql AS $$
DECLARE
  v_price    NUMERIC;
  v_balance  NUMERIC;
  v_active   BOOLEAN;
BEGIN
  -- Получаем данные кейса
  SELECT price, "isActive" INTO v_price, v_active
  FROM cases WHERE id = p_case_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Кейс % не найден', p_case_id;
  END IF;

  IF NOT v_active THEN
    RAISE EXCEPTION 'Кейс % недоступен', p_case_id;
  END IF;

  -- Проверяем баланс
  SELECT balance INTO v_balance FROM users WHERE id = p_user_id FOR UPDATE;

  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Недостаточно средств: требуется %, доступно %', v_price, v_balance;
  END IF;

  -- Выбираем случайный предмет
  p_item_id := get_random_item_from_case(p_case_id);

  -- Списываем баланс
  UPDATE users SET balance = balance - v_price WHERE id = p_user_id;
  p_new_balance := v_balance - v_price;

  -- Добавляем в инвентарь
  INSERT INTO inventory ("userId", "itemId") VALUES (p_user_id, p_item_id);

  -- Записываем транзакцию
  INSERT INTO transactions ("userId", amount, type, description)
  VALUES (p_user_id, -v_price, 'open_case',
          FORMAT('Открытие кейса #%s', p_case_id));
END;
$$;

-- Пополнение баланса пользователя
CREATE OR REPLACE PROCEDURE replenish_balance(
  p_user_id INTEGER,
  p_amount  NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Сумма пополнения должна быть положительной';
  END IF;

  UPDATE users SET balance = balance + p_amount WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь % не найден', p_user_id;
  END IF;

  INSERT INTO transactions ("userId", amount, type, description)
  VALUES (p_user_id, p_amount, 'topup',
          FORMAT('Пополнение баланса на %s ₽', p_amount));
END;
$$;

-- Продажа предмета из инвентаря
CREATE OR REPLACE PROCEDURE sell_item(
  p_user_id    INTEGER,
  p_inventory_id INTEGER,
  OUT p_earned NUMERIC,
  OUT p_new_balance NUMERIC
)
LANGUAGE plpgsql AS $$
DECLARE
  v_item_value NUMERIC;
  v_owner_id   INTEGER;
  v_is_sold    BOOLEAN;
BEGIN
  SELECT inv."userId", i.value, inv."isSold"
  INTO v_owner_id, v_item_value, v_is_sold
  FROM inventory inv
  JOIN items i ON i.id = inv."itemId"
  WHERE inv.id = p_inventory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Запись инвентаря % не найдена', p_inventory_id;
  END IF;

  IF v_owner_id <> p_user_id THEN
    RAISE EXCEPTION 'Предмет принадлежит другому пользователю';
  END IF;

  IF v_is_sold THEN
    RAISE EXCEPTION 'Предмет уже продан';
  END IF;

  -- Помечаем как проданный
  UPDATE inventory SET "isSold" = TRUE WHERE id = p_inventory_id;

  -- Начисляем баланс
  UPDATE users SET balance = balance + v_item_value WHERE id = p_user_id
  RETURNING balance INTO p_new_balance;

  p_earned := v_item_value;

  INSERT INTO transactions ("userId", amount, type, description)
  VALUES (p_user_id, v_item_value, 'sell_item',
          FORMAT('Продажа предмета из инвентаря #%s', p_inventory_id));
END;
$$;


-- ТРИГГЕРЫ — минимум 3

-- Запрет отрицательного баланса
CREATE OR REPLACE FUNCTION trg_check_balance_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance < 0 THEN
    RAISE EXCEPTION 'Баланс пользователя не может быть отрицательным (попытка: %)', NEW.balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_balance ON users;
CREATE TRIGGER trg_check_balance
  BEFORE UPDATE OF balance ON users
  FOR EACH ROW EXECUTE FUNCTION trg_check_balance_fn();

-- Автоматическая запись транзакции при любом изменении баланса
CREATE OR REPLACE FUNCTION trg_log_balance_change_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_diff NUMERIC;
BEGIN
  v_diff := NEW.balance - OLD.balance;
  IF v_diff <> 0 THEN
    INSERT INTO transactions ("userId", amount, type, description)
    VALUES (NEW.id, v_diff, 'direct_update', 'Прямое изменение баланса');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_balance_change ON users;
CREATE TRIGGER trg_log_balance_change
  AFTER UPDATE OF balance ON users
  FOR EACH ROW EXECUTE FUNCTION trg_log_balance_change_fn();

-- Запрет добавления предмета в инвентарь, которого нет в БД
CREATE OR REPLACE FUNCTION trg_validate_inventory_item_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW."itemId") THEN
    RAISE EXCEPTION 'Предмет с id=% не существует', NEW."itemId";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW."userId") THEN
    RAISE EXCEPTION 'Пользователь с id=% не существует', NEW."userId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_inventory_item ON inventory;
CREATE TRIGGER trg_validate_inventory_item
  BEFORE INSERT ON inventory
  FOR EACH ROW EXECUTE FUNCTION trg_validate_inventory_item_fn();


-- ТЕСТОВЫЕ ДАННЫЕ

-- Пользователи (пароли: "password123" → bcrypt)
INSERT INTO users (name, email, password, role, balance, age) VALUES
  ('Администратор', 'admin@caseshop.ru',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 10000, 25),
  ('Иван Иванов',   'ivan@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user',  500,   22),
  ('Мария Петрова', 'maria@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user',  1000,  19),
  ('Алексей Сидоров','alex@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user',  250,   30)
ON CONFLICT (email) DO NOTHING;

-- Предметы
INSERT INTO items (name, rarity, value) VALUES
  ('Синие наушники',     'common',    50),
  ('Беспроводная мышь',  'common',    80),
  ('USB-хаб',            'common',    60),
  ('Механическая клавиатура', 'rare', 300),
  ('Игровой контроллер', 'rare',      250),
  ('Веб-камера 4K',      'rare',      400),
  ('Наушники Sony XM5',  'epic',      800),
  ('Монитор 27" 144Hz',  'epic',      1500),
  ('iPhone 15',          'legendary', 5000),
  ('RTX 4090',           'legendary', 8000)
ON CONFLICT DO NOTHING;

-- Кейсы
INSERT INTO cases (name, description, price, "isActive") VALUES
  ('Стартовый кейс',   'Для новичков — доступные призы',   100, TRUE),
  ('Продвинутый кейс', 'Редкие и эпические предметы',      500, TRUE),
  ('Легендарный кейс', 'Шанс на легендарный приз!',        1000, TRUE)
ON CONFLICT DO NOTHING;

-- Содержимое кейсов
-- Стартовый: только common
INSERT INTO case_items (case_id, item_id)
SELECT c.id, i.id FROM cases c, items i
WHERE c.name = 'Стартовый кейс' AND i.rarity IN ('common', 'rare')
ON CONFLICT DO NOTHING;

-- Продвинутый: rare + epic
INSERT INTO case_items (case_id, item_id)
SELECT c.id, i.id FROM cases c, items i
WHERE c.name = 'Продвинутый кейс' AND i.rarity IN ('rare', 'epic')
ON CONFLICT DO NOTHING;

-- Легендарный: все
INSERT INTO case_items (case_id, item_id)
SELECT c.id, i.id FROM cases c, items i
WHERE c.name = 'Легендарный кейс'
ON CONFLICT DO NOTHING;


-- Проверка объектов

-- SELECT * FROM v_user_inventory;
-- SELECT * FROM v_case_contents;
-- SELECT * FROM v_top_users;
-- SELECT get_user_balance(1);
-- SELECT get_inventory_value(1);
-- CALL replenish_balance(2, 500);
-- CALL open_case(2, 1, NULL, NULL);
