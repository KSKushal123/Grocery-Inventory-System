from fastapi import FastAPI, Depends, HTTPException
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from bson.objectid import ObjectId
from pymongo.database import Database

import schemas
from database import get_db

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

@app.get("/items/", response_model=List[schemas.Item])
def read_items(skip: int = 0, limit: int = 100, db: Database = Depends(get_db)):
    items = list(db["items"].find().skip(skip).limit(limit))
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
def read_distributors(skip: int = 0, limit: int = 100, db: Database = Depends(get_db)):
    distributors = list(db["distributors"].find().skip(skip).limit(limit))
    return [fix_id(d) for d in distributors]

@app.post("/shops/", response_model=schemas.Shop)
def create_shop(shop: schemas.ShopCreate, db: Database = Depends(get_db)):
    shop_dict = shop.model_dump()
    result = db["shops"].insert_one(shop_dict)
    shop_dict["_id"] = result.inserted_id
    return fix_id(shop_dict)

@app.get("/shops/", response_model=List[schemas.Shop])
def read_shops(skip: int = 0, limit: int = 100, db: Database = Depends(get_db)):
    shops = list(db["shops"].find().skip(skip).limit(limit))
    return [fix_id(s) for s in shops]
