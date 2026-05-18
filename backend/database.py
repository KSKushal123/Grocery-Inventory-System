from pymongo import MongoClient

MONGO_DETAILS = "mongodb://localhost:27017/"

client = MongoClient(MONGO_DETAILS)
database = client.grocery_inventory

def get_db():
    return database
