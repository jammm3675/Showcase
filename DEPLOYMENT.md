# Инструкция по развертыванию NFT Showcase Mini App (Новая Архитектура)

Это руководство поможет вам развернуть ваше приложение, состоящее из трех сервисов, на бесплатном хостинге Render.

## Архитектура
Наше приложение состоит из трех независимых сервисов:
1.  **Go Backend:** Основной API для работы с пользователями, коллекциями и витринами.
2.  **Python Service:** Сервис для выполнения специфичных задач (например, генерация коллажей).
3.  **React Frontend:** Пользовательский интерфейс (статический сайт).

Вам нужно будет создать три отдельных сервиса на Render.

---

## Шаг 1: Развертывание Базы Данных

1.  В вашем дашборде на Render нажмите **New +** и выберите **PostgreSQL**.
2.  Придумайте имя (например, `showcase-db`), выберите регион и бесплатный план (Free).
3.  Нажмите **Create Database**.
4.  После создания базы данных, перейдите на ее страницу и скопируйте **Internal Connection URL**. Он понадобится нам для бэкенда.

---

## Шаг 2: Развертывание Go Backend (Web Service)

1.  Нажмите **New +** → **Web Service**. Подключите ваш GitHub репозиторий.
2.  **Настройте сервис:**
    *   **Name:** `showcase-backend` (или любое другое имя)
    *   **Runtime:** `Go`
    *   **Root Directory:** `backend-go`
    *   **Build Command:** `go build -o main .`
    *   **Start Command:** `./main`
3.  **Добавьте переменные окружения (Environment Variables):**
    *   Перейдите в раздел **Environment**.
    *   Нажмите **Add Environment Variable**.
    *   **Key:** `DATABASE_URL`, **Value:** Вставьте Internal Connection URL из Шага 1.
    *   **Key:** `TELEGRAM_BOT_TOKEN`, **Value:** Вставьте ваш токен от BotFather.
4.  Нажмите **Create Web Service**. Дождитесь успешного развертывания. После этого у вас появится URL вида `https://showcase-backend.onrender.com`. Скопируйте его.

---

## Шаг 3: Развертывание Python Service (Web Service)

1.  Нажмите **New +** → **Web Service**. Снова выберите тот же GitHub репозиторий.
2.  **Настройте сервис:**
    *   **Name:** `showcase-python-service`
    *   **Runtime:** `Python 3`
    *   **Root Directory:** `services-python`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3.  Нажмите **Create Web Service**. Этот сервис не требует публичного доступа, он будет общаться с Go бэкендом внутри сети Render.

---

## Шаг 4: Развертывание React Frontend (Static Site)

1.  Нажмите **New +** → **Static Site**. Снова выберите тот же GitHub репозиторий.
2.  **Настройте сервис:**
    *   **Name:** `showcase-frontend`
    *   **Root Directory:** `frontend-react`
    *   **Build Command:** `npm install && npm run build`
    *   **Publish Directory:** `dist` (или `frontend-react/dist`)
3.  **Добавьте переменную окружения:**
    *   Перейдите в раздел **Environment**.
    *   **Key:** `VITE_API_BASE_URL`, **Value:** Вставьте URL вашего Go бэкенда из Шага 2 (`https://showcase-backend.onrender.com`).
4.  **Добавьте правило переадресации (Rewrite Rule):**
    *   Перейдите в раздел **Redirects/Rewrites**.
    *   Нажмите **Add Rule**.
    *   **Source:** `/*`
    *   **Destination:** `/index.html`
    *   **Action:** `Rewrite`
5.  Нажмите **Create Static Site**. После развертывания у вас появится URL вашего фронтенда, например `https://showcase-frontend.onrender.com`. **Это и есть основной URL вашего приложения.**

---

## Шаг 5: Настройка Telegram Бота

1.  Откройте диалог с [@BotFather](https://t.me/BotFather) в Telegram.
2.  Отправьте команду `/mybots` и выберите вашего бота.
3.  Перейдите в **Bot Settings** → **Menu Button**.
4.  Выберите **Configure Menu Button**.
5.  Отправьте BotFather **URL вашего ФРОНТЕНДА** (`https://showcase-frontend.onrender.com`).
6.  Задайте **название для кнопки** (например, `🖼️ NFT Витрина`).

---

## Шаг 6: Готово!

Теперь ваше приложение полностью развернуто и готово к работе. Откройте вашего бота в Telegram и запустите Mini App через кнопку меню.
