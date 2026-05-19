from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    price: int
    image: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class DistributorBase(BaseModel):
    name: str
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[float] = 0.0
    totalDeliveries: Optional[int] = 0
    memberSince: Optional[str] = None
    status: Optional[str] = None

class DistributorCreate(DistributorBase):
    pass

class Distributor(DistributorBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class ShopBase(BaseModel):
    name: str
    distance: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    contact: Optional[str] = None

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

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: str
    
    model_config = ConfigDict(populate_by_name=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class GoogleLoginRequest(BaseModel):
    token: str


class InvoiceItem(BaseModel):
    name: str
    quantity: int
    price: int
    total: int

class InvoiceRequest(BaseModel):
    shop_name: str
    email: str
    items: List[InvoiceItem]
    total_amount: int



