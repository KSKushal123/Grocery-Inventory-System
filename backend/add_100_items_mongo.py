from pymongo import MongoClient
import random

base_items = [
    # Produce
    ("Potato", "Produce", 30, 50), ("Tomato", "Produce", 40, 80), ("Onion", "Produce", 35, 60), ("Garlic", "Produce", 120, 200), ("Ginger", "Produce", 80, 150),
    ("Carrot", "Produce", 40, 70), ("Cabbage", "Produce", 30, 50), ("Cauliflower", "Produce", 40, 60), ("Spinach", "Produce", 20, 40), ("Coriander", "Produce", 15, 30),
    ("Mint Leaves", "Produce", 15, 30), ("Green Chilli", "Produce", 60, 100), ("Lemon", "Produce", 80, 120), ("Apple", "Produce", 150, 250), ("Banana", "Produce", 40, 80),
    ("Orange", "Produce", 80, 150), ("Grapes", "Produce", 100, 200), ("Mango", "Produce", 100, 300), ("Papaya", "Produce", 40, 80), ("Watermelon", "Produce", 20, 50),
    
    # Dairy & Eggs
    ("Milk 500ml", "Dairy & Eggs", 25, 35), ("Curd 500g", "Dairy & Eggs", 30, 45), ("Paneer 200g", "Dairy & Eggs", 70, 100), ("Butter 100g", "Dairy & Eggs", 50, 60),
    ("Cheese Slices", "Dairy & Eggs", 120, 150), ("Eggs 6pcs", "Dairy & Eggs", 40, 60), ("Eggs 30pcs", "Dairy & Eggs", 180, 250), ("Ghee 500ml", "Dairy & Eggs", 250, 400),
    ("Yogurt", "Dairy & Eggs", 40, 60), ("Buttermilk", "Dairy & Eggs", 15, 25), ("Lassi", "Dairy & Eggs", 20, 30), ("Fresh Cream", "Dairy & Eggs", 60, 80),
    
    # Meat & Seafood
    ("Chicken Breast 500g", "Meat & Seafood", 150, 250), ("Mutton 500g", "Meat & Seafood", 350, 500), ("Fish Rohu 1kg", "Meat & Seafood", 200, 300), 
    ("Prawns 250g", "Meat & Seafood", 250, 400), ("Chicken Curry Cut", "Meat & Seafood", 120, 200), ("Chicken Keema", "Meat & Seafood", 180, 250),
    
    # Bakery
    ("White Bread", "Bakery", 30, 50), ("Brown Bread", "Bakery", 40, 60), ("Burger Buns", "Bakery", 30, 50), ("Pizza Base", "Bakery", 40, 60),
    ("Pav 6pcs", "Bakery", 20, 30), ("Croissant", "Bakery", 50, 80), ("Muffins", "Bakery", 60, 100), ("Rusk", "Bakery", 40, 70), ("Cookies", "Bakery", 80, 150),
    
    # Pantry
    ("Basmati Rice 1kg", "Pantry", 80, 150), ("Sona Masoori Rice 5kg", "Pantry", 250, 400), ("Toor Dal 1kg", "Pantry", 120, 180), ("Moong Dal 1kg", "Pantry", 100, 150),
    ("Chana Dal 1kg", "Pantry", 80, 120), ("Urad Dal 1kg", "Pantry", 110, 160), ("Sugar 1kg", "Pantry", 40, 50), ("Jaggery 1kg", "Pantry", 60, 90),
    ("Sunflower Oil 1L", "Pantry", 120, 160), ("Mustard Oil 1L", "Pantry", 140, 180), ("Olive Oil 1L", "Pantry", 600, 1000), ("Salt 1kg", "Pantry", 20, 30),
    ("Turmeric Powder 200g", "Pantry", 50, 80), ("Chilli Powder 200g", "Pantry", 60, 100), ("Coriander Powder 200g", "Pantry", 50, 80), 
    ("Garam Masala 100g", "Pantry", 60, 100), ("Jeera 100g", "Pantry", 40, 80), ("Mustard Seeds 100g", "Pantry", 20, 40), ("Wheat Atta 5kg", "Pantry", 180, 250),
    ("Maida 1kg", "Pantry", 40, 60), ("Besan 500g", "Pantry", 50, 80), ("Sooji 500g", "Pantry", 30, 50), ("Poha 500g", "Pantry", 40, 60),
    ("Peanuts 500g", "Pantry", 80, 120), ("Almonds 200g", "Pantry", 200, 300), ("Cashews 200g", "Pantry", 200, 300), ("Raisins 200g", "Pantry", 100, 150),
    ("Honey 500g", "Pantry", 150, 250), ("Tomato Ketchup", "Pantry", 100, 150), ("Soy Sauce", "Pantry", 50, 80), ("Vinegar", "Pantry", 40, 60),
    ("Pasta 500g", "Pantry", 60, 100), ("Noodles", "Pantry", 20, 50), ("Oats 1kg", "Pantry", 150, 200), ("Corn Flakes", "Pantry", 150, 250),
    
    # Beverages
    ("Tea Powder 500g", "Beverages", 200, 300), ("Coffee Powder 100g", "Beverages", 150, 250), ("Green Tea", "Beverages", 120, 200), 
    ("Cola 1.5L", "Beverages", 80, 100), ("Orange Juice 1L", "Beverages", 100, 130), ("Apple Juice 1L", "Beverages", 100, 130), 
    ("Mineral Water 1L", "Beverages", 20, 20), ("Soda 750ml", "Beverages", 20, 30), ("Energy Drink", "Beverages", 100, 120), ("Coconut Water", "Beverages", 40, 60),
    
    # Snacks
    ("Potato Chips", "Snacks", 20, 50), ("Nachos", "Snacks", 50, 100), ("Bhujia", "Snacks", 80, 120), ("Mixture", "Snacks", 80, 120),
    ("Roasted Peanuts", "Snacks", 40, 60), ("Popcorn", "Snacks", 30, 60), ("Chocolate Bar", "Snacks", 40, 150), ("Dark Chocolate", "Snacks", 100, 200),
    ("Biscuits - Sweet", "Snacks", 20, 50), ("Biscuits - Salty", "Snacks", 20, 50), ("Cream Biscuits", "Snacks", 30, 60), ("Wafers", "Snacks", 40, 80),
    
    # Other
    ("Dishwashing Liquid", "Other", 100, 150), ("Laundry Detergent", "Other", 150, 300), ("Floor Cleaner", "Other", 100, 200), ("Toilet Cleaner", "Other", 80, 120),
    ("Bathing Soap", "Other", 30, 60), ("Shampoo", "Other", 150, 300), ("Toothpaste", "Other", 80, 150), ("Toothbrush", "Other", 30, 60),
    ("Hair Oil", "Other", 100, 200), ("Deodorant", "Other", 150, 250), ("Sanitary Pads", "Other", 100, 200), ("Diapers", "Other", 400, 800),
    ("Garbage Bags", "Other", 60, 100), ("Aluminium Foil", "Other", 80, 150), ("Tissue Paper", "Other", 40, 80)
]

items = []
for i in range(100):
    if i < len(base_items):
        base = base_items[i]
        name = base[0]
    else:
        base = random.choice(base_items)
        name = base[0] + " (Large)"

    category = base[1]
    price = random.randint(base[2], base[3])
    quantity = random.randint(0, 150)
    
    items.append({
        "name": name,
        "description": f"Standard {name.lower()}.",
        "category": category,
        "quantity": quantity,
        "price": price,
        "image": ""
    })

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.grocery_inventory
    collection = db.items
    collection.insert_many(items)
    print("Successfully added 100 items directly to MongoDB.")
except Exception as e:
    print(f"Error: {e}")
