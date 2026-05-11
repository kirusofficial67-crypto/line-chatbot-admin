# LINE Chatbot Admin — Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- LINE Developers Account

## Quick Start

### 1. Install dependencies
```bash
cd line-chatbot-admin
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret (run `openssl rand -base64 32`)
- `LINE_CHANNEL_ACCESS_TOKEN` — from LINE Developers Console
- `LINE_CHANNEL_SECRET` — from LINE Developers Console

### 3. Setup database
```bash
npm run db:push      # create tables
npm run db:seed      # seed demo data
```

### 4. Run dev server
```bash
npm run dev
```

Open http://localhost:3000
Login: admin@example.com / admin1234

---

## LINE Developers Setup

1. Go to https://developers.line.biz/
2. Create a new channel → Messaging API
3. Copy **Channel Access Token** and **Channel Secret** to `.env`
4. Set Webhook URL: `https://yourdomain.com/api/webhook/line`
5. Enable **Use webhook**
6. Disable **Auto-reply messages**

---

## Docker Deploy

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma db push
docker-compose exec app npx ts-node prisma/seed.ts
```

---

## Features

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview & bot status toggle |
| `/dashboard/menus` | Add/edit/delete chatbot menus |
| `/dashboard/notifications` | Manage LINE notification targets |
| `/dashboard/logs` | Chat & notification history + CSV export |
| `/dashboard/settings` | Bot messages & webhook URL |
| `/api/webhook/line` | LINE webhook endpoint |

---

## Get Admin LINE User ID

To receive notifications, you need your LINE User ID:
1. Add your bot as a friend on LINE
2. Send any message to the bot
3. Check the webhook logs — your `lineUserId` appears there
4. Add it in Dashboard → Notifications → Add Target
