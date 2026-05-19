from fastapi import FastAPI, Depends, HTTPException
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from pymongo.database import Database
import urllib.request
import json

import schemas
from database import get_db
import auth
from datetime import timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

@app.post("/items/", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Database = Depends(get_db)):
    item_dict = item.model_dump()
    result = db["items"].insert_one(item_dict)
    item_dict["_id"] = result.inserted_id
    return fix_id(item_dict)

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Database = Depends(get_db)):
    existing_user = db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]
    
    result = db["users"].insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    user_out = schemas.User(**fix_id(user_dict))
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user_out.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Database = Depends(get_db)):
    db_user = db["users"].find_one({"email": user.email})
    if not db_user or not auth.verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    user_out = schemas.User(**fix_id(db_user))
    
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
    name = google_info.get("name", email.split("@")[0] if email else "Google User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")
        
    # Check if user already exists
    db_user = db["users"].find_one({"email": email})
    
    if not db_user:
        # Create a new user since they logged in via Google for the first time
        user_dict = {
            "email": email,
            "name": name,
            "hashed_password": "",  # Google users don't use standard password auth
        }
        result = db["users"].insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        db_user = user_dict
        
    user_out = schemas.User(**fix_id(db_user))
    
    # Generate access token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user_out.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_out}



@app.get("/items/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db)):
    items = list(db["items"].find().sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(item) for item in items]

@app.delete("/items/{item_id}")
def delete_item(item_id: str, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["items"].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: str, item_update: schemas.ItemCreate, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    update_data = item_update.model_dump()
    result = db["items"].update_one({"_id": obj_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    updated_item = db["items"].find_one({"_id": obj_id})
    return fix_id(updated_item)

@app.post("/distributors/", response_model=schemas.Distributor)
def create_distributor(distributor: schemas.DistributorCreate, db: Database = Depends(get_db)):
    dist_dict = distributor.model_dump()
    result = db["distributors"].insert_one(dist_dict)
    dist_dict["_id"] = result.inserted_id
    return fix_id(dist_dict)

@app.get("/distributors/", response_model=List[schemas.Distributor])
def read_distributors(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db)):
    distributors = list(db["distributors"].find().sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(d) for d in distributors]

@app.put("/distributors/{dist_id}", response_model=schemas.Distributor)
def update_distributor(dist_id: str, distributor: schemas.DistributorCreate, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(dist_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = distributor.model_dump()
    result = db["distributors"].update_one({"_id": obj_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
        
    updated_dist = db["distributors"].find_one({"_id": obj_id})
    return fix_id(updated_dist)

@app.delete("/distributors/{dist_id}")
def delete_distributor(dist_id: str, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(dist_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["distributors"].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Distributor not found")
    return {"message": "Distributor deleted"}

@app.post("/shops/", response_model=schemas.Shop)
def create_shop(shop: schemas.ShopCreate, db: Database = Depends(get_db)):
    shop_dict = shop.model_dump()
    result = db["shops"].insert_one(shop_dict)
    shop_dict["_id"] = result.inserted_id
    return fix_id(shop_dict)

@app.get("/shops/", response_model=List[schemas.Shop])
def read_shops(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db)):
    shops = list(db["shops"].find().sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(s) for s in shops]

@app.put("/shops/{shop_id}", response_model=schemas.Shop)
def update_shop(shop_id: str, shop: schemas.ShopCreate, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(shop_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = shop.model_dump()
    result = db["shops"].update_one({"_id": obj_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    updated_shop = db["shops"].find_one({"_id": obj_id})
    return fix_id(updated_shop)

@app.delete("/shops/{shop_id}")
def delete_shop(shop_id: str, db: Database = Depends(get_db)):
    try:
        obj_id = ObjectId(shop_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    result = db["shops"].delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"message": "Shop deleted"}

@app.post("/business_owners/", response_model=schemas.BusinessOwner)
def create_business_owner(owner: schemas.BusinessOwnerCreate, db: Database = Depends(get_db)):
    owner_dict = owner.model_dump()
    result = db["business_owners"].insert_one(owner_dict)
    owner_dict["_id"] = result.inserted_id
    return fix_id(owner_dict)

@app.get("/business_owners/", response_model=List[schemas.BusinessOwner])
def read_business_owners(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db)):
    owners = list(db["business_owners"].find().sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(o) for o in owners]


@app.post("/mail-invoice/")
def mail_invoice(invoice: schemas.InvoiceRequest, db: Database = Depends(get_db)):
    # 1. Store invoice data in MongoDB
    invoice_dict = invoice.model_dump()
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
def create_invoice(invoice: schemas.InvoiceCreate, db: Database = Depends(get_db)):
    invoice_dict = invoice.model_dump()
    result = db["invoices"].insert_one(invoice_dict)
    invoice_dict["_id"] = result.inserted_id
    return fix_id(invoice_dict)

@app.get("/invoices/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 1000, db: Database = Depends(get_db)):
    invoices = list(db["invoices"].find().sort("_id", -1).skip(skip).limit(limit))
    return [fix_id(inv) for inv in invoices]
