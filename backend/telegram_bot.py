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

GROCERY_CATALOG = {
    "milk": {"category": "Dairy", "price": 60, "description": "Fresh, nutritious farm whole milk."},
    "bread": {"category": "Bakery", "price": 40, "description": "Soft, freshly baked sliced white bread."},
    "egg": {"category": "Dairy", "price": 6, "description": "High-protein farm fresh organic eggs."},
    "eggs": {"category": "Dairy", "price": 60, "description": "High-protein farm fresh organic eggs (pack of 10)."},
    "butter": {"category": "Dairy", "price": 55, "description": "Rich and creamy salted butter."},
    "cheese": {"category": "Dairy", "price": 120, "description": "Premium cheddar cheese slices."},
    "rice": {"category": "Pantry", "price": 80, "description": "Premium long-grain Basmati rice."},
    "wheat": {"category": "Pantry", "price": 45, "description": "Whole wheat flour (Atta) for healthy chapatis."},
    "flour": {"category": "Pantry", "price": 45, "description": "Premium quality all-purpose flour."},
    "sugar": {"category": "Pantry", "price": 50, "description": "Fine refined white sugar."},
    "salt": {"category": "Pantry", "price": 20, "description": "Iodized cooking salt."},
    "oil": {"category": "Pantry", "price": 150, "description": "Healthy refined sunflower cooking oil."},
    "tea": {"category": "Beverages", "price": 90, "description": "Premium aromatic black tea leaves."},
    "coffee": {"category": "Beverages", "price": 180, "description": "Rich and aromatic instant coffee powder."},
    "juice": {"category": "Beverages", "price": 110, "description": "100% pure and refreshing fruit juice."},
    "water": {"category": "Beverages", "price": 20, "description": "Pure mineral drinking water bottle."},
    "apple": {"category": "Produce", "price": 160, "description": "Crisp and sweet fresh red apples."},
    "apples": {"category": "Produce", "price": 160, "description": "Crisp and sweet fresh red apples."},
    "banana": {"category": "Produce", "price": 60, "description": "Fresh and sweet yellow bananas."},
    "bananas": {"category": "Produce", "price": 60, "description": "Fresh and sweet yellow bananas."},
    "potato": {"category": "Produce", "price": 30, "description": "Fresh organic farm potatoes."},
    "potatoes": {"category": "Produce", "price": 30, "description": "Fresh organic farm potatoes."},
    "tomato": {"category": "Produce", "price": 40, "description": "Fresh, juicy red tomatoes."},
    "tomatoes": {"category": "Produce", "price": 40, "description": "Fresh, juicy red tomatoes."},
    "onion": {"category": "Produce", "price": 35, "description": "Fresh, pungent red onions."},
    "onions": {"category": "Produce", "price": 35, "description": "Fresh, pungent red onions."},
    "garlic": {"category": "Produce", "price": 120, "description": "Fresh and aromatic garlic bulbs."},
    "ginger": {"category": "Produce", "price": 100, "description": "Fresh spicy ginger root."},
    "chicken": {"category": "Meat & Seafood", "price": 220, "description": "Freshly cut, tender skinless chicken."},
    "fish": {"category": "Meat & Seafood", "price": 350, "description": "Freshly caught river fish."},
    "mutton": {"category": "Meat & Seafood", "price": 700, "description": "Tender and juicy fresh mutton cuts."},
    "popcorn": {"category": "Snacks", "price": 50, "description": "Crispy and buttery classic popcorn."},
    "chips": {"category": "Snacks", "price": 30, "description": "Crispy salted potato chips."},
    "cookies": {"category": "Snacks", "price": 45, "description": "Delicious chocolate chip cookies."},
    "soap": {"category": "Personal Care", "price": 40, "description": "Gentle moisturizing bathing soap."},
    "shampoo": {"category": "Personal Care", "price": 130, "description": "Nourishing herbal hair shampoo."},
    "toothpaste": {"category": "Personal Care", "price": 65, "description": "Cavity protection fluoride toothpaste."},
    "detergent": {"category": "Household", "price": 140, "description": "High-efficiency laundry washing powder."},
}


def _search_image(query: str) -> str:
    import html
    query_encoded = urllib.parse.quote(query + " product")
    url = f"https://www.bing.com/images/search?q={query_encoded}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            resp_html = response.read().decode('utf-8', errors='ignore')
            decoded_html = html.unescape(resp_html)
            matches = re.findall(r'"murl"\s*:\s*"([^"]+)"', decoded_html)
            if matches:
                return matches[0]
    except Exception as e:
        print(f"Telegram Bot error searching image: {e}")
    return ""


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

    # Check for update item quantity command
    is_update = bool(re.search(r'\b(update|change|set)\b.*\b(quantity|qty|stock)\b', lower))
    if is_update:
        match = re.search(r'\b(?:update|change|set)\s+(?:the\s+)?(?:product\s+|item\s+)?(.+?)\s+(?:quantity|qty|stock)\s+(?:to\s+)?(\d+)', command, re.IGNORECASE)
        if not match:
            match = re.search(r'\b(?:update|change|set)\s+(?:the\s+)?(?:quantity|qty|stock)\s+(?:of\s+)?(.+?)\s+(?:to\s+)?(\d+)', command, re.IGNORECASE)
            
        if match:
            item_name = match.group(1).strip()
            new_qty = int(match.group(2))
            
            pattern = re.compile(f"^{re.escape(item_name)}$", re.IGNORECASE)
            matched_item = db["items"].find_one({"owner_email": "kskushal123456@gmail.com", "name": pattern})
            if not matched_item:
                pattern_sub = re.compile(re.escape(item_name), re.IGNORECASE)
                matched_item = db["items"].find_one({"owner_email": "kskushal123456@gmail.com", "name": pattern_sub})
                
            if matched_item:
                db["items"].update_one(
                    {"_id": matched_item["_id"]},
                    {"$set": {"quantity": new_qty}}
                )
                return f"🎉 Successfully updated quantity of '{matched_item['name']}' to {new_qty}!"
            else:
                return f"I could not find a product named '{item_name}' in your inventory."

    if lower.startswith("add ") or lower.startswith("create "):
        is_other_entity = any(
            x in lower
            for x in ["shop", "store", "distributor", "supplier", "owner", "invoice", "bill"]
        )
        if not is_other_entity:
            name_part = re.sub(
                r'^(?:add|create)\s+(?:a\s+|new\s+)?(?:product|item)?\s*',
                '',
                command,
                flags=re.IGNORECASE
            )
            
            def get_number(key):
                m = re.search(rf'\b(?:{key})\s+(\d+(?:\.\d+)?)', lower)
                return int(float(m.group(1))) if m else None
                
            quantity = get_number("quantity|qty") or 50
            price = get_number("price|rate")
            
            cat_match = re.search(r'\bcategory\s+([a-z &]+?)(?:\s+(?:quantity|qty|price|rate|description)\b|$)', lower)
            category = cat_match.group(1).strip().title() if cat_match else None
            
            desc_match = re.search(r'\bdescription\s+(.+)$', command, re.IGNORECASE)
            description = desc_match.group(1).strip() if desc_match else None
            
            name_clean = re.split(r'\s+(?:quantity|qty|price|rate|category|description)\b', name_part, flags=re.IGNORECASE)[0].strip()
            
            if name_clean:
                cat_lower = name_clean.lower()
                catalog_item = None
                for key, val in GROCERY_CATALOG.items():
                    if key in cat_lower or cat_lower in key:
                        catalog_item = val
                        break
                        
                final_name = name_clean.title()
                final_category = category or (catalog_item["category"] if catalog_item else "Pantry")
                final_price = price if price is not None else (catalog_item["price"] if catalog_item else 50)
                final_description = description or (catalog_item["description"] if catalog_item else f"Premium {final_name}, sourced fresh for our inventory.")
                
                image_url = _search_image(final_name)
                
                item_dict = {
                    "name": final_name,
                    "description": final_description,
                    "category": final_category,
                    "quantity": quantity,
                    "price": final_price,
                    "image": image_url,
                    "owner_email": "kskushal123456@gmail.com"
                }
                
                db["items"].insert_one(item_dict)
                
                reply_lines = [
                    f"🎉 Successfully created product '{final_name}'!",
                    f"- Category: {final_category}",
                    f"- Quantity: {quantity}",
                    f"- Price: Rs. {final_price}",
                    f"- Description: {final_description}"
                ]
                if image_url:
                    reply_lines.append(f"- Image Link: {image_url}")
                else:
                    reply_lines.append("- Image: No image found on search.")
                    
                return "\n".join(reply_lines)

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
