from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from pymongo.database import Database
import urllib.request
import json
import os
import re

import schemas
from database import get_db
import auth
import telegram_bot
from datetime import timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://grocery-shopks.vercel.app",
]

configured_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
cors_origins = list(dict.fromkeys(DEFAULT_CORS_ORIGINS + configured_cors_origins))
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def is_allowed_origin(origin: str) -> bool:
    return origin in cors_origins or bool(cors_origin_regex and re.fullmatch(cors_origin_regex, origin))

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error for {request.method} {request.url.path}: {exc}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check backend deployment logs."},
    )
    origin = request.headers.get("origin")
    if origin and is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Grocery Inventory System API is running successfully!"}

def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

def send_login_attempt_notification(user_email: str):
    print("\n" + "!" * 60)
    print("             NOTIFICATION TO kskushal123456@gmail.com")
    print("!" * 60)
    print(f"New/Restricted User Login Attempt:")
    print(f"User Email: {user_email}")
    print(f"Status: PENDING ADMIN APPROVAL")
    print(f"Action Required: Please approve or reject this login request in the Admin Panel.")
    print("!" * 60 + "\n")

def user_from_db_doc(user_doc):
    user_data = fix_id(user_doc.copy())
    if not user_data.get("name"):
        user_data["name"] = user_data.get("email", "User").split("@")[0]
    return schemas.User(**user_data)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Database = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing email")
        email = email.strip().lower()
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    db_user = db["users"].find_one({"email": email})
    if db_user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user_from_db_doc(db_user)

@app.post("/items/", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    item_dict = item.model_dump()
    item_dict["owner_email"] = current_user.email
    result = db["items"].insert_one(item_dict)
    item_dict["_id"] = result.inserted_id
    return fix_id(item_dict)

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Database = Depends(get_db)):
    user.email = user.email.strip().lower()
    existing_user = db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["email"] = user.email
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    
    status = "approved" if user.email == "kskushal123456@gmail.com" else "pending"
    user_dict["status"] = status
    
    result = db["users"].insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    user_out = user_from_db_doc(user_dict)
    
    if status == "pending":
        send_login_attempt_notification(user.email)
        raise HTTPException(
            status_code=403,
            detail="Registration successful! Your login is pending approval from kskushal123456@gmail.com."
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user_out.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Database = Depends(get_db)):
    user.email = user.email.strip().lower()
    db_user = db["users"].find_one({"email": user.email})
    if not db_user or not auth.verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    status = db_user.get("status", "pending")
    if db_user["email"] == "kskushal123456@gmail.com":
        status = "approved"
        if db_user.get("status") != "approved":
            db["users"].update_one({"email": db_user["email"]}, {"$set": {"status": "approved"}})
            
    if status == "pending":
        send_login_attempt_notification(db_user["email"])
        raise HTTPException(status_code=403, detail="Login restricted. Awaiting approval from kskushal123456@gmail.com.")
    elif status == "rejected":
        raise HTTPException(status_code=403, detail="Login access denied by the administrator.")
        
    user_out = user_from_db_doc(db_user)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user_out.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}

@app.post("/auth/google", response_model=schemas.Token)
def google_auth(request_data: schemas.GoogleLoginRequest, db: Database = Depends(get_db)):
    token = request_data.token
    # Verify the Google ID Token via Google's tokeninfo API
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            google_info = json.loads(response.read().decode())
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Google token or verification failed")

    # Ensure the token has an email
    email = google_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")
    email = email.strip().lower()
    name = google_info.get("name", email.split("@")[0])
    
    # Check if user already exists
    db_user = db["users"].find_one({"email": email})
    
    if not db_user:
        # Create a new user since they logged in via Google for the first time
        status = "approved" if email == "kskushal123456@gmail.com" else "pending"
        user_dict = {
            "email": email,
            "name": name,
            "hashed_password": "",  # Google users don't use standard password auth
            "status": status,
        }
        result = db["users"].insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        db_user = user_dict
        
    status = db_user.get("status", "pending")
    if db_user["email"] == "kskushal123456@gmail.com":
        status = "approved"
        if db_user.get("status") != "approved":
            db["users"].update_one({"email": db_user["email"]}, {"$set": {"status": "approved"}})
            
    if status == "pending":
        send_login_attempt_notification(db_user["email"])
        raise HTTPException(status_code=403, detail="Login restricted. Awaiting approval from kskushal123456@gmail.com.")
    elif status == "rejected":
        raise HTTPException(status_code=403, detail="Login access denied by the administrator.")
        
    user_out = user_from_db_doc(db_user)
    
    # Generate access token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user_out.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}



@app.get("/items/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    items = list(db["items"].find({"owner_email": current_user.email}).sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(item) for item in items]

@app.delete("/items/{item_id}")
def delete_item(item_id: str, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["items"].delete_one({"_id": obj_id, "owner_email": current_user.email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: str, item_update: schemas.ItemCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    update_data = item_update.model_dump()
    update_data["owner_email"] = current_user.email
    result = db["items"].update_one({"_id": obj_id, "owner_email": current_user.email}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    updated_item = db["items"].find_one({"_id": obj_id})
    return fix_id(updated_item)

@app.post("/distributors/", response_model=schemas.Distributor)
def create_distributor(distributor: schemas.DistributorCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    dist_dict = distributor.model_dump()
    dist_dict["owner_email"] = current_user.email
    result = db["distributors"].insert_one(dist_dict)
    dist_dict["_id"] = result.inserted_id
    return fix_id(dist_dict)

@app.get("/distributors/", response_model=List[schemas.Distributor])
def read_distributors(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    distributors = list(db["distributors"].find({"owner_email": current_user.email}).sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(d) for d in distributors]

@app.put("/distributors/{dist_id}", response_model=schemas.Distributor)
def update_distributor(dist_id: str, distributor: schemas.DistributorCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(dist_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = distributor.model_dump()
    update_data["owner_email"] = current_user.email
    result = db["distributors"].update_one({"_id": obj_id, "owner_email": current_user.email}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
        
    updated_dist = db["distributors"].find_one({"_id": obj_id})
    return fix_id(updated_dist)

@app.delete("/distributors/{dist_id}")
def delete_distributor(dist_id: str, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(dist_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["distributors"].delete_one({"_id": obj_id, "owner_email": current_user.email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return {"message": "Distributor deleted"}

@app.post("/shops/", response_model=schemas.Shop)
def create_shop(shop: schemas.ShopCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    shop_dict = shop.model_dump()
    shop_dict["owner_email"] = current_user.email
    result = db["shops"].insert_one(shop_dict)
    shop_dict["_id"] = result.inserted_id
    return fix_id(shop_dict)

@app.get("/shops/", response_model=List[schemas.Shop])
def read_shops(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    shops = list(db["shops"].find({"owner_email": current_user.email}).sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(s) for s in shops]

@app.put("/shops/{shop_id}", response_model=schemas.Shop)
def update_shop(shop_id: str, shop: schemas.ShopCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(shop_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Diagnostics: Fetch the shop to see who owns it
    existing_shop = db["shops"].find_one({"_id": obj_id})
    if not existing_shop:
        raise HTTPException(status_code=404, detail=f"Shop with ID {shop_id} does not exist in the database.")
    
    actual_owner = existing_shop.get("owner_email") or ""
    if actual_owner.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=403, 
            detail=f"Permission denied. This shop belongs to '{actual_owner}', but you are logged in as '{current_user.email}'."
        )
    
    update_data = shop.model_dump()
    update_data["owner_email"] = current_user.email.lower()
    result = db["shops"].update_one({"_id": obj_id, "owner_email": actual_owner}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Failed to update shop: document not matched.")
        
    updated_shop = db["shops"].find_one({"_id": obj_id})
    return fix_id(updated_shop)

@app.delete("/shops/{shop_id}")
def delete_shop(shop_id: str, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        obj_id = ObjectId(shop_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["shops"].delete_one({"_id": obj_id, "owner_email": current_user.email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"message": "Shop deleted"}

@app.post("/business_owners/", response_model=schemas.BusinessOwner)
def create_business_owner(owner: schemas.BusinessOwnerCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    owner_dict = owner.model_dump()
    owner_dict["owner_email"] = current_user.email
    result = db["business_owners"].insert_one(owner_dict)
    owner_dict["_id"] = result.inserted_id
    return fix_id(owner_dict)

@app.get("/business_owners/", response_model=List[schemas.BusinessOwner])
def read_business_owners(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    owners = list(db["business_owners"].find({"owner_email": current_user.email}).sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(o) for o in owners]


@app.post("/mail-invoice/")
def mail_invoice(invoice: schemas.InvoiceRequest, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Store invoice data in MongoDB
    invoice_dict = invoice.model_dump()
    invoice_dict["owner_email"] = current_user.email
    result = db["invoices"].insert_one(invoice_dict)
    
    # 2. Mock sending the email (print to terminal/logs)
    print("\n" + "="*50)
    print("                     INVOICE SENT")
    print("="*50)
    print(f"To Shop:       {invoice.shop_name}")
    print(f"Partner Email: {invoice.email}")
    print("-"*50)
    for item in invoice.items:
        print(f"- {item.name:25} x{item.quantity:<3} (₹{item.price}) = ₹{item.total}")
    print("-"*50)
    print(f"Total Amount:  ₹{invoice.total_amount}")
    print("="*50 + "\n")
    
    return {
        "status": "success",
        "invoice_id": str(result.inserted_id),
        "message": f"Invoice successfully sent to partner shop ({invoice.email})!"
    }


@app.post("/invoices/", response_model=schemas.Invoice)
def create_invoice(invoice: schemas.InvoiceCreate, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    invoice_dict = invoice.model_dump()
    invoice_dict["owner_email"] = current_user.email
    result = db["invoices"].insert_one(invoice_dict)
    invoice_dict["_id"] = result.inserted_id
    return fix_id(invoice_dict)

@app.get("/invoices/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    invoices = list(db["invoices"].find({"owner_email": current_user.email}).sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(inv) for inv in invoices]


@app.post("/telegram/ask", response_model=schemas.TelegramAskResponse)
def ask_telegram_assistant(request_data: schemas.TelegramAskRequest, db: Database = Depends(get_db)):
    return {"reply": telegram_bot.build_project_reply(request_data.message, db)}


@app.post("/telegram/webhook")
@app.post("/telegram/webhook/{secret}")
def telegram_webhook(update: dict, secret: str = "", db: Database = Depends(get_db)):
    expected_secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if expected_secret and secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid Telegram webhook secret")

    message = telegram_bot.extract_telegram_message(update)
    if not message:
        return {"ok": True, "message": "No text message to answer"}

    reply = telegram_bot.build_project_reply(message["text"], db)
    telegram_bot.send_telegram_message(message["chat_id"], reply)
    return {"ok": True}


@app.post("/telegram/set-webhook")
def telegram_set_webhook(request_data: schemas.TelegramWebhookSetup):
    secret = request_data.secret or os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    return telegram_bot.set_telegram_webhook(request_data.public_url, secret)


# ADMIN ENDPOINTS
@app.get("/admin/users", response_model=List[schemas.User])
def get_admin_users(db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.email != "kskushal123456@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized. Only kskushal123456@gmail.com has access.")
    users = list(db["users"].find().sort("_id", -1))
    return [fix_id(u) for u in users]

@app.put("/admin/users/{email}/approve")
def approve_user(email: str, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.email != "kskushal123456@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized. Only kskushal123456@gmail.com has access.")
    result = db["users"].update_one({"email": email}, {"$set": {"status": "approved"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User approved successfully"}

@app.put("/admin/users/{email}/reject")
def reject_user(email: str, db: Database = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.email != "kskushal123456@gmail.com":
        raise HTTPException(status_code=403, detail="Not authorized. Only kskushal123456@gmail.com has access.")
    if email == "kskushal123456@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot reject the main administrator")
    result = db["users"].update_one({"email": email}, {"$set": {"status": "rejected"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User rejected successfully"}
