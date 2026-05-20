import os
from pymongo import MongoClient

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import certifi
    ca = certifi.where()
except ImportError:
    ca = None

MONGO_DETAILS = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") 
MONGO_DB_NAME = os.getenv("MONGODB_DB", "grocery_inventory")
MONGO_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "5000"))

client_kwargs = {
    "serverSelectionTimeoutMS": MONGO_TIMEOUT_MS
}
if ca:
    client_kwargs["tlsCAFile"] = ca

client = MongoClient(MONGO_DETAILS, **client_kwargs)
database = client[MONGO_DB_NAME]

def check_connection():
    client.admin.command("ping")

# Seed default data if empty on startup
def seed_data():
    check_connection()
    db = database
    if db["distributors"].count_documents({}) == 0:
        db["distributors"].insert_one({
            "name": "FreshFoods Logistics & Distribution",
            "contactPerson": "Michael Chen",
            "email": "supply@freshfoods.logistics",
            "phone": "+1 (555) 123-4567",
            "location": "Metro Industrial Park, Hub 4",
            "rating": 4.8,
            "totalDeliveries": 1240,
            "memberSince": "2021",
            "status": "Verified Platinum Partner"
        })
    if db["shops"].count_documents({}) == 0:
        db["shops"].insert_many([
            {
                "name": "City Center Mart",
                "distance": "1.2 km",
                "address": "123 Main St, Downtown",
                "type": "Supermarket",
                "status": "Open Now",
                "contact": "(555) 234-5678"
            },
            {
                "name": "Green Valley Organics",
                "distance": "2.5 km",
                "address": "45 West Avenue, Suburbia",
                "type": "Specialty Store",
                "status": "Closes at 8 PM",
                "contact": "(555) 987-6543"
            },
            {
                "name": "Corner Convenience",
                "distance": "0.5 km",
                "address": "88 East Blvd, Retail District",
                "type": "Convenience",
                "status": "Open 24/7",
                "contact": "(555) 345-6789"
            },
            {
                "name": "Wholesale Club Direct",
                "distance": "5.0 km",
                "address": "500 Industrial Pkwy",
                "type": "Wholesale",
                "status": "Open Now",
                "contact": "(555) 111-2222"
            }
        ])

try:
    seed_data()
except Exception as e:
    print(f"Error seeding database: {e}")

def get_db():
    return database
