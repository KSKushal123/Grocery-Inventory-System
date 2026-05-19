from main import app

print("Registered FastAPI Routes:")
for route in app.routes:
    methods = getattr(route, "methods", None)
    print(f"Path: {route.path:35} Methods: {methods}")
