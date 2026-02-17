# Chronicle — Next.js + Google OAuth + PostgreSQL

## Стек
- **Framework**: Next.js 14 (App Router, fullstack — фронт и API в одном проекте)
- **Auth**: NextAuth v4 + Google OAuth 2.0
- **Database**: PostgreSQL (Railway в проде)
- **Deploy**: Vercel (фронт + API) + Railway (PostgreSQL)

---

## Структура проекта

```
chronicle/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.js   ← NextAuth handler
│   │   └── tasks/
│   │       ├── route.js                  ← GET /api/tasks, POST /api/tasks
│   │       └── [id]/route.js             ← PATCH /api/tasks/:id, DELETE
│   ├── auth/page.js                      ← Экран входа (Google кнопка)
│   ├── app/page.js                       ← Защищённая страница планировщика
│   ├── layout.js
│   └── page.js                           ← Редирект на /auth или /app
├── components/
│   ├── Providers.js                      ← SessionProvider wrapper
│   └── PlannerClient.js                  ← Весь UI планировщика
├── hooks/
│   └── useTasks.js                       ← Task CRUD с оптимистичными апдейтами
├── lib/
│   ├── db.js                             ← pg Pool singleton
│   ├── auth.js                           ← NextAuth config
│   └── auth-adapter.js                   ← Кастомный PostgreSQL адаптер
├── scripts/
│   └── migrate.js                        ← Создание таблиц
└── .env.local.example
```

---

## Настройка за 5 шагов

### Шаг 1 — Google OAuth credentials

1. Открой [console.cloud.google.com](https://console.cloud.google.com)
2. Создай новый проект (или выбери существующий)
3. **APIs & Services → OAuth consent screen**
   - User Type: External
   - Заполни название приложения и email
4. **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins:
     - `http://localhost:3000`
     - `https://your-app.vercel.app`
   - Authorised redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app.vercel.app/api/auth/callback/google`
5. Скопируй **Client ID** и **Client Secret**

---

### Шаг 2 — PostgreSQL на Railway

1. Открой [railway.app](https://railway.app) → New Project → **PostgreSQL**
2. После создания: вкладка **Variables** → скопируй `DATABASE_URL`
3. Запусти миграции локально (или через Railway CLI):
   ```bash
   DATABASE_URL=<your_url> node scripts/migrate.js
   ```

---

### Шаг 3 — Локальная разработка

```bash
# Клонируй и установи зависимости
git clone <repo> && cd chronicle
npm install

# Создай .env.local
cp .env.local.example .env.local
```

Заполни `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<из шага 1>
GOOGLE_CLIENT_SECRET=<из шага 1>
DATABASE_URL=<из шага 2>
```

```bash
# Создай таблицы
node scripts/migrate.js

# Запусти
npm run dev
```

Открой http://localhost:3000 → войди через Google ✅

---

### Шаг 4 — Деплой на Vercel

```bash
# Установи Vercel CLI
npm i -g vercel

# Деплой
vercel

# Или через GitHub:
# vercel.com → Import Git Repository → выбери репо
```

**Environment Variables на Vercel** (Settings → Environment Variables):

| Key | Value |
|-----|-------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | `<openssl rand -base64 32>` |
| `GOOGLE_CLIENT_ID` | из Google Console |
| `GOOGLE_CLIENT_SECRET` | из Google Console |
| `DATABASE_URL` | из Railway |

---

### Шаг 5 — Обнови redirect URIs в Google Console

Добавь продакшен URL в **Authorised redirect URIs**:
```
https://your-app.vercel.app/api/auth/callback/google
```

---

## Как работает авторизация

```
Пользователь нажимает "Войти через Google"
         ↓
  NextAuth перенаправляет на accounts.google.com
         ↓
  Google возвращает на /api/auth/callback/google
         ↓
  NextAuth вызывает наш PostgresAdapter:
    - createUser() или getUserByEmail()
    - linkAccount() — сохраняет Google токены
    - createSession() — создаёт сессию в БД
         ↓
  httpOnly cookie с session token
         ↓
  Каждый запрос к /api/tasks проверяет сессию
  через getServerSession(authOptions)
```

---

## API

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/tasks` | Список задач текущего юзера |
| POST | `/api/tasks` | Создать задачу |
| PATCH | `/api/tasks/:id` | Обновить задачу |
| DELETE | `/api/tasks/:id` | Удалить задачу |

Все эндпоинты защищены — возвращают 401 без активной сессии.
Задачи изолированы по `user_id` на уровне SQL.

---

## Безопасность

- Сессии хранятся в PostgreSQL (не в JWT cookies)
- `user_id` проверяется в каждом SQL запросе — юзеры не могут видеть чужие задачи
- Google OAuth — пароли вообще не хранятся
- `NEXTAUTH_SECRET` защищает CSRF токены и шифрует куки
