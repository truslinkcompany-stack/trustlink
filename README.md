# ДоброСлед (TrustLink): прототип Фазы 1

Next.js 15 + Supabase + Vercel. Фото с камеры → сервер фиксирует время и SHA-256 → PDF-сертификат с QR → страница проверки `/verify/{id}`.

## Запуск
1. Supabase: создайте проект, выполните `supabase/schema.sql` в SQL Editor.
2. `cp .env.example .env.local` и заполните ключи (`PDF_TOKEN_SECRET`: `openssl rand -hex 32`).
3. `npm install && npm run dev`. Камера на телефоне требует HTTPS: используйте деплой на Vercel или `npx localtunnel --port 3000`.
4. Vercel: импортируйте репозиторий, добавьте те же переменные, `NEXT_PUBLIC_SITE_URL` = адрес деплоя.

## Структура
- `app/capture.tsx`: камера, геолокация, сжатие, форма.
- `app/api/records/route.ts`: приём файла, хеш, хранилище, запись в БД.
- `app/api/records/[id]/pdf/route.ts`: PDF (нужен токен создателя).
- `app/verify/[id]/page.tsx`: Valid/Invalid, хеш пересчитывается по файлу.
- `content/news/*.md`: новости.

## Дополнительно
- `supabase/migration_002.sql`: только если вы уже выполняли первую версию schema.sql.
- `DEMO.md`: чек-лист KPI № 1 и сценарий демо.
- Логотипы партнёров: `components/Partners.tsx` и `public/partners/`.
