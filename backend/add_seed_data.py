import urllib.request
import json

items = [
    {
        "name": "Fresho Onion - 1kg",
        "description": "Farm fresh locally sourced onions.",
        "category": "Produce",
        "quantity": 150,
        "price": 35,
        "image": "https://www.bigbasket.com/media/uploads/p/l/10000148_30-fresho-onion.jpg"
    },
    {
        "name": "Fresho Tomato Hybrid - 1kg",
        "description": "Red and fresh hybrid tomatoes.",
        "category": "Produce",
        "quantity": 85,
        "price": 40,
        "image": "https://www.bigbasket.com/media/uploads/p/l/10000200_17-fresho-tomato-hybrid.jpg"
    },
    {
        "name": "Nandini Good Life Toned Milk - 500ml",
        "description": "UHT Pasteurized toned milk.",
        "category": "Dairy & Eggs",
        "quantity": 200,
        "price": 26,
        "image": "https://www.bigbasket.com/media/uploads/p/l/269131_5-nandini-good-life-toned-milk.jpg"
    },
    {
        "name": "Tata Salt - Iodised - 1kg",
        "description": "Vacuum evaporated iodised salt.",
        "category": "Pantry",
        "quantity": 500,
        "price": 28,
        "image": "https://www.bigbasket.com/media/uploads/p/l/241600_5-tata-salt-evaporated-iodised.jpg"
    },
    {
        "name": "Aashirvaad Whole Wheat Atta - 5kg",
        "description": "100% whole wheat chakki fresh atta.",
        "category": "Pantry",
        "quantity": 60,
        "price": 250,
        "image": "https://www.bigbasket.com/media/uploads/p/l/126903_8-aashirvaad-atta-whole-wheat.jpg"
    },
    {
        "name": "Lay's Potato Chips - Classic Salted - 50g",
        "description": "Classic salted crispy potato chips.",
        "category": "Snacks",
        "quantity": 30,
        "price": 20,
        "image": "https://www.bigbasket.com/media/uploads/p/l/266070_12-lays-potato-chips-classic-salted.jpg"
    }
]

url = "http://localhost:8000/items/"

for item in items:
    try:
        data = json.dumps(item).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"Successfully added: {item['name']}")
            else:
                print(f"Failed to add {item['name']}: {response.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error adding {item['name']}: {e}")
