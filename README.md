# Grocery-Inventory-System

## Telegram bot setup

1. Create a bot in Telegram with BotFather and copy the bot token.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `TELEGRAM_BOT_TOKEN` in `backend/.env`.
4. Optionally set `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_ALLOWED_CHAT_IDS`.
5. Run the backend, then expose it with a public HTTPS URL such as ngrok.
6. Register the webhook:

```bash
curl -X POST http://localhost:8000/telegram/set-webhook \
  -H "Content-Type: application/json" \
  -d "{\"public_url\":\"https://your-public-url.example\",\"secret\":\"your-secret\"}"
```

You can test the same reply logic locally:

```bash
curl -X POST http://localhost:8000/telegram/ask \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"project details\"}"
```

Example Telegram questions: `project details`, `stock summary`, `low stock`, `out of stock`, `find rice`, `shops`, `distributors`, `owners`, and `invoices`.
