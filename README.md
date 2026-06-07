# 🎁 CaseShop — Магазин кейсов с рулеткой

CaseShop — полноценное клиент-серверное веб-приложение с механикой лутбоксов. Пользователь регистрируется, пополняет баланс, выбирает кейс, наблюдает анимацию рулетки и получает случайный предмет в инвентарь. Предметы можно продавать обратно за виртуальную валюту. Администратор управляет кейсами и предметами через отдельную панель.

---

## Стек технологий

**Backend** — NestJS (Node.js), PostgreSQL, TypeORM, Passport JWT

**Frontend** — React 18, TypeScript, Vite, чистый CSS без фреймворков

**Хранение на клиенте** — LocalStorage (JWT токен, данные пользователя, корзина)

---

## Функциональность

**Для пользователя:**
- Регистрация и вход с JWT-авторизацией
- Просмотр доступных кейсов и их содержимого
- Открытие кейса с анимацией рулетки
- Инвентарь выигранных предметов с возможностью продажи
- Пополнение баланса в профиле
- Корзина кейсов, сохраняемая в LocalStorage между сессиями

**Для администратора:**
- Полный CRUD кейсов и предметов
- Просмотр всех пользователей и их данных
- Управление видимостью кейсов

---

## 🚀 Быстрый старт

**Требования:** Node.js 18+, PostgreSQL 15+

```bash
# 1. База данных
psql -U postgres -c "CREATE DATABASE caseshop;"
psql -U postgres -d caseshop -f DB/init.sql

# 2. Бэкенд
cd backend
npm install
npm run start:dev

# 3. Фронтенд
cd frontend
npm install
npm run dev
```

Оба процесса должны работать одновременно в разных терминалах.

## 🗂 Структура проекта

```
case-shop/
├── backend/
│   └── src/
│       ├── auth/       # JWT авторизация, Guards, декоратор @Roles()
│       ├── users/      # CRUD пользователей, валидация DTO
│       ├── cases/      # CRUD кейсов
│       ├── items/      # CRUD предметов
│       ├── inventory/  # Инвентарь, продажа предметов
│       └── game/       # Логика рулетки, пополнение баланса
├── frontend/
│   └── src/
│       ├── pages/      # Home, CasePage, Login, Register, Inventory, Profile, Admin
│       ├── components/ # Navbar
│       └── utils/      # api.ts (axios + LocalStorage), AuthContext
└── DB/
    └── init.sql        # Таблицы, Views, Functions, Procedures, Triggers
```

---

## API

```
POST   /auth/login             Вход, получить JWT

GET    /users                  Все пользователи (admin)
GET    /users/:id              Пользователь по ID
POST   /users                  Регистрация

GET    /cases                  Активные кейсы
GET    /cases/:id              Кейс по ID
POST   /cases                  Создать кейс (admin)
PUT    /cases/:id              Обновить кейс (admin)
DELETE /cases/:id              Удалить кейс (admin)

GET    /items                  Все предметы
POST   /items                  Создать предмет (admin)
PUT    /items/:id              Обновить предмет (admin)
DELETE /items/:id              Удалить предмет (admin)

GET    /inventory              Мой инвентарь
POST   /inventory/:id/sell     Продать предмет

POST   /game/open/:caseId      Открыть кейс (рулетка)
POST   /game/topup             Пополнить баланс
```

---

## База данных

6 таблиц: `users`, `items`, `cases`, `case_items`, `inventory`, `transactions`

**Представления:** `v_user_inventory`, `v_case_contents`, `v_top_users`

**Функции:** `get_user_balance()`, `get_random_item_from_case()`, `get_inventory_value()`

**Процедуры:** `open_case()`, `replenish_balance()`, `sell_item()`

**Триггеры:** запрет отрицательного баланса, авто-запись транзакций, валидация инвентаря

---

## Управление доступом

Две роли — `user` и `admin`. Контролируется на бэкенде через `JwtAuthGuard` + `RolesGuard` + декоратор `@Roles()`. На фронтенде защищённые страницы обёрнуты в `RequireAuth` и `RequireAdmin`.

---

## Тестовые аккаунты

```
admin@caseshop.ru  /  password  →  admin
ivan@example.com   /  password  →  user
```

Или зарегистрируйся через форму и выдай права через psql:

```bash
psql -U postgres -d caseshop -c "UPDATE users SET role = 'admin' WHERE email = 'твой@email.com';"
```

---

## 👤 Автор
**Толмачёв Михаил**, 2026
