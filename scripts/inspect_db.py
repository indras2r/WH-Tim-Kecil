import os
from pymongo import MongoClient

URI = "mongodb+srv://inventory-event-gear:d9rk27mrqb6c73faohq0@customer-apps.c4d4ax.mongodb.net/?retryWrites=true&w=majority&appName=inventory-event-gear&maxPoolSize=5"

c = MongoClient(URI, serverSelectionTimeoutMS=15000)
print("PING:", c.admin.command("ping"))
print("DATABASES:", c.list_database_names())
for dbname in c.list_database_names():
    if dbname in ("admin", "local", "config"):
        continue
    db = c[dbname]
    cols = db.list_collection_names()
    print(f"\n=== DB: {dbname} | collections: {cols}")
    for col in cols:
        cnt = db[col].count_documents({})
        print(f"  - {col}: {cnt} docs")
    # sample a user + item to learn field names
    if "users" in cols:
        u = db.users.find_one({}, {"_id": 0})
        print("  USER_KEYS:", list(u.keys()) if u else None, "| sample_email:", u.get("email") if u else None)
        # detect password field
        for k in (u or {}):
            if "pass" in k.lower() or "hash" in k.lower():
                print("    PWD_FIELD:", k, "startswith:", str(u[k])[:4])
    if "items" in cols:
        it = db.items.find_one({}, {"_id": 0})
        print("  ITEM_KEYS:", list(it.keys()) if it else None)
