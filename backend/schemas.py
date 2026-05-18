from pydantic import BaseModel, ConfigDict
from typing import Optional

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    price: float
    image: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class DistributorBase(BaseModel):
    name: str
    company: str
    email: str
    phone: str
    address: str

class DistributorCreate(DistributorBase):
    pass

class Distributor(DistributorBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class ShopBase(BaseModel):
    name: str
    owner: str
    contact: str
    address: str
    status: str

class ShopCreate(ShopBase):
    pass

class Shop(ShopBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class BusinessOwnerBase(BaseModel):
    name: str
    company: str
    email: str
    phone: str
    address: str
    role: str
    storesCount: int
    status: str

class BusinessOwnerCreate(BusinessOwnerBase):
    pass

class BusinessOwner(BusinessOwnerBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)
