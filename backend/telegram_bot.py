import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

from fastapi import HTTPException
from pymongo.database import Database


LOW_STOCK_LIMIT = 20


def _text(value: Any, fallback: str = "Not set") -> str:
    if value is None:
        return fallback
    value = str(value).strip()
    return value or fallback


def _money(value: Any) -> str:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0
    return f"Rs. {amount:,.2f}".rstrip("0").rstrip(".")


def _find_items(db: Database, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    return list(
        db["items"]
        .find({
            "owner_email": "kskushal123456@gmail.com",
            "$or": [{"name": pattern}, {"category": pattern}, {"description": pattern}]
        })
        .sort("_id", -1)
        .limit(limit)
    )


def _format_items(items: Iterable[Dict[str, Any]]) -> str:
    lines = []
    for item in items:
        quantity = int(item.get("quantity") or 0)
        price = _money(item.get("price"))
        category = _text(item.get("category"), "Uncategorized")
        lines.append(f"- {_text(item.get('name'))}: {quantity} in stock, {price}, {category}")
    return "\n".join(lines)


def _inventory_summary(db: Database) -> str:
    items = list(db["items"].find({"owner_email": "kskushal123456@gmail.com"}))
    total_quantity = sum(int(item.get("quantity") or 0) for item in items)
    total_value = sum(
        int(item.get("quantity") or 0) * float(item.get("price") or 0)
        for item in items
    )
    low_stock = [
        item for item in items
        if 0 < int(item.get("quantity") or 0) <= LOW_STOCK_LIMIT
    ]
    out_of_stock = [item for item in items if int(item.get("quantity") or 0) == 0]

    return (
        "Inventory summary\n"
        f"- Products: {len(items)}\n"
        f"- Total stock units: {total_quantity}\n"
        f"- Total inventory value: {_money(total_value)}\n"
        f"- Low stock products: {len(low_stock)}\n"
        f"- Out of stock products: {len(out_of_stock)}"
    )


def _project_summary(db: Database) -> str:
    return (
        "Grocery Inventory System details\n"
        "- Backend: FastAPI with MongoDB\n"
        "- Frontend: React/Vite inventory dashboard\n"
        f"- Products: {db['items'].count_documents({'owner_email': 'kskushal123456@gmail.com'})}\n"
        f"- Distributors: {db['distributors'].count_documents({'owner_email': 'kskushal123456@gmail.com'})}\n"
        f"- Partner shops: {db['shops'].count_documents({'owner_email': 'kskushal123456@gmail.com'})}\n"
        f"- Business owners: {db['business_owners'].count_documents({'owner_email': 'kskushal123456@gmail.com'})}\n"
        f"- Invoices: {db['invoices'].count_documents({'owner_email': 'kskushal123456@gmail.com'})}\n\n"
        "Ask things like: stock summary, low stock, out of stock, find rice, shops, distributors, owners, or invoices."
    )


def _list_collection(
    db: Database,
    collection: str,
    title: str,
    formatter,
    limit: int = 5,
) -> str:
    rows = list(db[collection].find({"owner_email": "kskushal123456@gmail.com"}).sort("_id", -1).limit(limit))
    if not rows:
        return f"No {title.lower()} found yet."
    return f"{title}\n" + "\n".join(formatter(row) for row in rows)


def build_project_reply(message: str, db: Database) -> str:
    command = (message or "").strip()
    lower = command.lower()

    if not command or lower in {"/start", "start", "/help", "help"}:
        return (
            "Hi. I can answer questions about your Grocery Inventory System.\n\n"
            "Try: project details, stock summary, low stock, out of stock, find milk, shops, distributors, owners, invoices."
        )

    if "project" in lower or "details" in lower or "what can you do" in lower:
        return _project_summary(db)

    if "stock summary" in lower or "inventory summary" in lower or "total stock" in lower:
        return _inventory_summary(db)

    if "low stock" in lower:
        items = list(
            db["items"]
            .find({"owner_email": "kskushal123456@gmail.com", "quantity": {"$gt": 0, "$lte": LOW_STOCK_LIMIT}})
            .sort("quantity", 1)
            .limit(8)
        )
        return "No products are low stock right now." if not items else "Low stock products\n" + _format_items(items)

    if "out of stock" in lower:
        items = list(db["items"].find({"owner_email": "kskushal123456@gmail.com", "quantity": 0}).sort("_id", -1).limit(8))
        return "No products are out of stock." if not items else "Out of stock products\n" + _format_items(items)

    find_match = re.search(r"\b(?:find|search|show item|show product)\s+(.+)", lower)
    if find_match:
        term = find_match.group(1).strip()
        items = _find_items(db, term)
        return f"No matching products found for '{term}'." if not items else f"Products matching '{term}'\n" + _format_items(items)

    if "product" in lower or "inventory" in lower or "items" in lower:
        latest_items = list(db["items"].find({"owner_email": "kskushal123456@gmail.com"}).sort("_id", -1).limit(8))
        return "No products found yet." if not latest_items else "Latest products\n" + _format_items(latest_items)

    if "shop" in lower or "store" in lower:
        return _list_collection(
            db,
            "shops",
            "Partner shops",
            lambda shop: f"- {_text(shop.get('name'))}: {_text(shop.get('type'))}, {_text(shop.get('status'))}, {_text(shop.get('contact'))}",
        )

    if "distributor" in lower or "supplier" in lower:
        return _list_collection(
            db,
            "distributors",
            "Distributors",
            lambda distributor: (
                f"- {_text(distributor.get('name'))}: {_text(distributor.get('contactPerson'))}, "
                f"{_text(distributor.get('phone'))}, rating {_text(distributor.get('rating'), '0')}"
            ),
        )

    if "owner" in lower:
        return _list_collection(
            db,
            "business_owners",
            "Business owners",
            lambda owner: f"- {_text(owner.get('name'))}: {_text(owner.get('company'))}, {_text(owner.get('role'))}, {_text(owner.get('status'))}",
        )

    if "invoice" in lower or "bill" in lower:
        return _list_collection(
            db,
            "invoices",
            "Latest invoices",
            lambda invoice: (
                f"- {_text(invoice.get('invoiceNumber'))}: {_text(invoice.get('shopName'))}, "
                f"{_money(invoice.get('totalAmount'))}, date {_text(invoice.get('invoiceDate'))}"
            ),
        )

    return (
        "I can answer project and inventory questions. Try: project details, stock summary, low stock, out of stock, find rice, shops, distributors, owners, or invoices."
    )


def extract_telegram_message(update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    message = update.get("message") or update.get("edited_message")
    if not message:
        return None

    chat = message.get("chat") or {}
    text = message.get("text") or ""
    chat_id = chat.get("id")
    if chat_id is None or not text:
        return None

    return {"chat_id": chat_id, "text": text}


def send_telegram_message(chat_id: Any, text: str) -> Dict[str, Any]:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is not configured")

    allowed_chat_ids = {
        chat_id.strip()
        for chat_id in os.getenv("TELEGRAM_ALLOWED_CHAT_IDS", "").split(",")
        if chat_id.strip()
    }
    if allowed_chat_ids and str(chat_id) not in allowed_chat_ids:
        raise HTTPException(status_code=403, detail="Telegram chat is not allowed")

    payload = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": text[:4096],
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        try:
            error_json = json.loads(error_body)
            description = error_json.get("description", error_body)
        except json.JSONDecodeError:
            description = error_body
        raise HTTPException(status_code=400, detail=f"Telegram sendMessage failed: {description}")
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail=f"Telegram sendMessage request failed: {exc.reason}")


def set_telegram_webhook(public_url: str, secret: Optional[str] = None) -> Dict[str, Any]:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is not configured")

    if not public_url:
        raise HTTPException(status_code=400, detail="public_url is required")

    parsed_url = urllib.parse.urlparse(public_url)
    if parsed_url.scheme.lower() != "https":
        raise HTTPException(status_code=400, detail="public_url must start with https://")
    if not parsed_url.netloc:
        raise HTTPException(status_code=400, detail="public_url must be a valid URL")

    webhook_url = public_url.rstrip("/") + "/telegram/webhook"
    if secret:
        webhook_url += f"/{urllib.parse.quote(secret, safe='')}"

    payload = urllib.parse.urlencode({"url": webhook_url}).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/setWebhook",
        data=payload,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        try:
            error_json = json.loads(error_body)
            description = error_json.get("description", error_body)
        except json.JSONDecodeError:
            description = error_body
        raise HTTPException(status_code=400, detail=f"Telegram setWebhook failed: {description}")
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail=f"Telegram setWebhook request failed: {exc.reason}")
