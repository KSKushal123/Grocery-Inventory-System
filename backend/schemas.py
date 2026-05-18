from pydantic import BaseModel
from typing import Optional

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int
    price: float

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int

    class Config:
        from_attributes = True

class DistributorBase(BaseModel):
    name: str
    company: str
    email: str
    phone: str
    address: str

class DistributorCreate(DistributorBase):
    pass

class Distributor(DistributorBase):
    id: int

    class Config:
        from_attributes = True

class ShopBase(BaseModel):
    name: str
    owner: str
    contact: str
    address: str
    status: str

class ShopCreate(ShopBase):
    pass

class Shop(ShopBase):
    id: int

    class Config:
        from_attributes = True
