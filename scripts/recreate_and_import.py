import json
import requests
import sys

BACKUP_PATH = "/home/dxdx/firestore_backup_rostrodorado-db.json"
TURSO_URL = "https://rostrodorado-db-rostrodoradoclinic.aws-us-east-1.turso.io/v2/pipeline"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJkYWI3ZDNhOC0yNmEzLTRiMmUtOTk0MS05MWQzNjhmY2I2NjkiLCJpYXQiOjE3ODM4Mjg4ODEsImtpZCI6ImxkMW5CQUp6blVuM3Vpc0ViWFZKTWtybHIybWEtakExZkkwVjFBWWZUSWsiLCJyaWQiOiI5MWUzNTk3YS0zY2QxLTQ1Y2QtOWRmZS0xNjM3YjQ3YTIwZjkifQ.__tFme0WATv1iGb0gpZ1wvzscS_YW2kJnAIW3D6rULfcC2SMc8VoqUA_woyLfWUIJ4DFpBeJMmPlM6kQo8PUAg"

def execute_batch(queries):
    if not queries:
        return True
    payload = {"requests": []}
    for stmt in queries:
        payload["requests"].append({
            "type": "execute",
            "stmt": {"sql": stmt}
        })
    headers = {
        "Authorization": f"Bearer {TURSO_TOKEN}",
        "Content-Type": "application/json"
    }
    r = requests.post(TURSO_URL, headers=headers, json=payload)
    if r.status_code != 200:
        print(f"Error HTTP {r.status_code}: {r.text}")
        return False
    res = r.json()
    success = True
    for idx, result in enumerate(res.get("results", [])):
        if result.get("type") == "error":
            print(f"Error en consulta {idx}: {result['error']['message']}")
            success = False
    return success

def clean_sql_str(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "1" if val else "0"
    if isinstance(val, (dict, list)):
        val = json.dumps(val, ensure_ascii=False)
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def main():
    # 1. Recreación de esquemas compatibles con el Frontend
    schema_queries = [
        "DROP TABLE IF EXISTS users;",
        "DROP TABLE IF EXISTS products;",
        "DROP TABLE IF EXISTS categories;",
        "DROP TABLE IF EXISTS orders;",
        "DROP TABLE IF EXISTS media;",
        "DROP TABLE IF EXISTS otp_codes;",
        "DROP TABLE IF EXISTS chats;",
        "DROP TABLE IF EXISTS coupons;",
        "DROP TABLE IF EXISTS leads;",
        "DROP TABLE IF EXISTS forms;",
        "DROP TABLE IF EXISTS form_responses;",
        "DROP TABLE IF EXISTS posts;",
        "DROP TABLE IF EXISTS analytics_sessions;",
        "DROP TABLE IF EXISTS analytics_views;",

        """CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            displayName TEXT,
            firstName TEXT,
            lastName TEXT,
            role TEXT DEFAULT 'customer',
            password TEXT,
            createdAt TEXT
        );""",

        """CREATE TABLE products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            longDescription TEXT,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            category TEXT NOT NULL,
            ingredients TEXT,
            usage TEXT,
            benefits TEXT,
            weight REAL,
            createdAt TEXT
        );""",

        """CREATE TABLE categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        );""",

        """CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            userId TEXT,
            customer TEXT,
            items TEXT,
            total REAL,
            status TEXT,
            trackingNumber TEXT,
            trackingStatus TEXT,
            trackingUpdatedAt TEXT,
            shippingCost REAL,
            isSample INTEGER,
            note TEXT,
            paymentStatus TEXT,
            createdAt TEXT
        );""",

        """CREATE TABLE media (
            id TEXT PRIMARY KEY,
            file TEXT NOT NULL
        );""",

        """CREATE TABLE otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expiresAt INTEGER NOT NULL,
            attempts INTEGER
        );""",

        """CREATE TABLE chats (
            id TEXT PRIMARY KEY,
            messages TEXT,
            orderId TEXT,
            userId TEXT,
            status TEXT,
            createdAt TEXT
        );""",

        """CREATE TABLE coupons (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            type TEXT NOT NULL,
            value REAL NOT NULL,
            expirationDate TEXT,
            isActive INTEGER DEFAULT 1,
            usageLimit INTEGER,
            usageCount INTEGER DEFAULT 0,
            minPurchase REAL,
            createdAt TEXT
        );""",

        """CREATE TABLE leads (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            treatment TEXT,
            city TEXT,
            department TEXT,
            details TEXT,
            status TEXT,
            createdAt TEXT
        );""",

        """CREATE TABLE forms (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            fields TEXT,
            isActive INTEGER DEFAULT 1,
            createdAt TEXT
        );""",

        """CREATE TABLE form_responses (
            id TEXT PRIMARY KEY,
            formId TEXT,
            data TEXT,
            submittedAt TEXT
        );""",

        """CREATE TABLE posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT,
            content TEXT NOT NULL,
            excerpt TEXT,
            coverImage TEXT,
            published INTEGER DEFAULT 1,
            author TEXT,
            views INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        );""",

        """CREATE TABLE analytics_sessions (
            id TEXT PRIMARY KEY,
            startTime TEXT,
            lastActive TEXT,
            referrer TEXT,
            utmMedium TEXT,
            userAgent TEXT,
            device TEXT,
            screenResolution TEXT,
            path TEXT,
            pageViews INTEGER,
            lastPath TEXT
        );""",

        """CREATE TABLE analytics_views (
            id TEXT PRIMARY KEY,
            sessionId TEXT,
            path TEXT,
            timestamp TEXT,
            title TEXT
        );"""
    ]

    print("Recreando las tablas en Turso con esquemas compatibles...")
    if not execute_batch(schema_queries):
        print("Error al recrear las tablas.")
        sys.exit(1)
    print("Tablas recreadas con éxito.\n")

    print("Cargando copia de seguridad JSON...")
    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        backup = json.load(f)

    queries = []

    # 1. users
    if "users" in backup:
        for uid, doc in backup["users"].items():
            password = "NULL"
            if doc.get("email") == "isauradorado@rostrodorado.com":
                password = "'4ff19fb314aac6 09c3814b5edf517e 7e51a255d3a75b1e 84950a91e3b80655 c1c224d02a40406a'"
            
            q = f"""INSERT INTO users (id, email, displayName, firstName, lastName, role, password, createdAt)
                    VALUES ({clean_sql_str(uid)}, {clean_sql_str(doc.get("email", ""))}, {clean_sql_str(doc.get("displayName"))}, 
                            {clean_sql_str(doc.get("firstName"))}, {clean_sql_str(doc.get("lastName"))}, {clean_sql_str(doc.get("role", "customer"))},
                            {password}, {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 2. products
    if "products" in backup:
        for pid, doc in backup["products"].items():
            q = f"""INSERT INTO products (id, name, description, longDescription, price, image, category, ingredients, usage, benefits, weight, createdAt)
                    VALUES ({clean_sql_str(pid)}, {clean_sql_str(doc.get("name", ""))}, {clean_sql_str(doc.get("description", ""))},
                            {clean_sql_str(doc.get("longDescription"))}, {clean_sql_str(doc.get("price", 0.0))}, {clean_sql_str(doc.get("image", ""))},
                            {clean_sql_str(doc.get("category", ""))}, {clean_sql_str(doc.get("ingredients"))}, {clean_sql_str(doc.get("usage"))},
                            {clean_sql_str(doc.get("benefits"))}, {clean_sql_str(doc.get("weight"))}, {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 3. categories
    if "categories" in backup:
        for cid, doc in backup["categories"].items():
            q = f"""INSERT INTO categories (id, name, description)
                    VALUES ({clean_sql_str(cid)}, {clean_sql_str(doc.get("name", ""))}, {clean_sql_str(doc.get("description"))});"""
            queries.append(q)

    # 4. orders
    if "orders" in backup:
        for oid, doc in backup["orders"].items():
            q = f"""INSERT INTO orders (id, userId, customer, items, total, status, trackingNumber, trackingStatus, trackingUpdatedAt, shippingCost, isSample, note, paymentStatus, createdAt)
                    VALUES ({clean_sql_str(oid)}, {clean_sql_str(doc.get("userId"))}, {clean_sql_str(doc.get("customer"))},
                            {clean_sql_str(doc.get("items"))}, {clean_sql_str(doc.get("total", 0.0))}, {clean_sql_str(doc.get("status"))},
                            {clean_sql_str(doc.get("trackingNumber"))}, {clean_sql_str(doc.get("trackingStatus"))}, {clean_sql_str(doc.get("trackingUpdatedAt"))},
                            {clean_sql_str(doc.get("shippingCost", 0.0))}, {clean_sql_str(doc.get("isSample", 0))}, {clean_sql_str(doc.get("note"))},
                            {clean_sql_str(doc.get("paymentStatus", "pending"))}, {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 5. coupons
    if "coupons" in backup:
        for cid, doc in backup["coupons"].items():
            # Handle mapping: 'value' (formerly discount) and 'isActive' (formerly active)
            val = doc.get("value") if doc.get("value") is not None else doc.get("discount", 0.0)
            is_active = doc.get("isActive") if doc.get("isActive") is not None else doc.get("active", True)
            is_active_int = 1 if is_active else 0
            
            q = f"""INSERT INTO coupons (id, code, type, value, expirationDate, isActive, usageLimit, usageCount, minPurchase, createdAt)
                    VALUES ({clean_sql_str(cid)}, {clean_sql_str(doc.get("code", ""))}, {clean_sql_str(doc.get("type", "percentage"))},
                            {clean_sql_str(val)}, {clean_sql_str(doc.get("expirationDate"))}, {is_active_int},
                            {clean_sql_str(doc.get("usageLimit"))}, {clean_sql_str(doc.get("usageCount", 0))}, {clean_sql_str(doc.get("minPurchase"))},
                            {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 6. leads
    if "leads" in backup:
        for lid, doc in backup["leads"].items():
            q = f"""INSERT INTO leads (id, name, email, phone, treatment, city, department, details, status, createdAt)
                    VALUES ({clean_sql_str(lid)}, {clean_sql_str(doc.get("name"))}, {clean_sql_str(doc.get("email"))},
                            {clean_sql_str(doc.get("phone"))}, {clean_sql_str(doc.get("treatment"))}, {clean_sql_str(doc.get("city"))},
                            {clean_sql_str(doc.get("department"))}, {clean_sql_str(doc.get("details"))}, {clean_sql_str(doc.get("status", "new"))},
                            {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 7. forms
    if "forms" in backup:
        for fid, doc in backup["forms"].items():
            # Handle title (formerly name), fields (formerly data)
            title = doc.get("title") if doc.get("title") is not None else doc.get("name", "")
            fields_data = doc.get("fields") if doc.get("fields") is not None else doc.get("data")
            is_active = 1 if doc.get("isActive", True) else 0
            
            q = f"""INSERT INTO forms (id, title, description, fields, isActive, createdAt)
                    VALUES ({clean_sql_str(fid)}, {clean_sql_str(title)}, {clean_sql_str(doc.get("description"))},
                            {clean_sql_str(fields_data)}, {is_active}, {clean_sql_str(doc.get("createdAt"))});"""
            queries.append(q)

    # 8. form_responses
    if "form_responses" in backup:
        for rid, doc in backup["form_responses"].items():
            # Handle submittedAt (formerly createdAt)
            sub_at = doc.get("submittedAt") if doc.get("submittedAt") is not None else doc.get("createdAt")
            q = f"""INSERT INTO form_responses (id, formId, data, submittedAt)
                    VALUES ({clean_sql_str(rid)}, {clean_sql_str(doc.get("formId", ""))}, {clean_sql_str(doc.get("data"))},
                            {clean_sql_str(sub_at)});"""
            queries.append(q)

    # 9. posts
    if "posts" in backup:
        for pid, doc in backup["posts"].items():
            # Handle coverImage (formerly image), published (formerly active)
            img = doc.get("coverImage") if doc.get("coverImage") is not None else doc.get("image")
            pub = doc.get("published") if doc.get("published") is not None else doc.get("active", True)
            pub_int = 1 if pub else 0
            
            q = f"""INSERT INTO posts (id, title, slug, content, excerpt, coverImage, published, author, views, createdAt, updatedAt)
                    VALUES ({clean_sql_str(pid)}, {clean_sql_str(doc.get("title", ""))}, {clean_sql_str(doc.get("slug"))},
                            {clean_sql_str(doc.get("content", ""))}, {clean_sql_str(doc.get("excerpt"))}, {clean_sql_str(img)},
                            {pub_int}, {clean_sql_str(doc.get("author"))}, {clean_sql_str(doc.get("views", 0))},
                            {clean_sql_str(doc.get("createdAt"))}, {clean_sql_str(doc.get("updatedAt"))});"""
            queries.append(q)

    # 10. otp_codes
    if "otp_codes" in backup:
        for email, doc in backup["otp_codes"].items():
            q = f"""INSERT INTO otp_codes (email, code, expiresAt, attempts)
                    VALUES ({clean_sql_str(email)}, {clean_sql_str(doc.get("code", ""))}, {doc.get("expiresAt", 0)}, {doc.get("attempts", 0)});"""
            queries.append(q)

    # 11. analytics_sessions
    if "analytics_sessions" in backup:
        for sid, doc in backup["analytics_sessions"].items():
            q = f"""INSERT INTO analytics_sessions (id, startTime, lastActive, referrer, utmMedium, userAgent, device, screenResolution, path, pageViews, lastPath)
                    VALUES ({clean_sql_str(sid)}, {clean_sql_str(doc.get("startTime"))}, {clean_sql_str(doc.get("lastActive"))},
                            {clean_sql_str(doc.get("referrer"))}, {clean_sql_str(doc.get("utmMedium"))}, {clean_sql_str(doc.get("userAgent"))},
                            {clean_sql_str(doc.get("device"))}, {clean_sql_str(doc.get("screenResolution"))}, {clean_sql_str(doc.get("path"))},
                            {doc.get("pageViews", 0)}, {clean_sql_str(doc.get("lastPath"))});"""
            queries.append(q)

    # 12. analytics_views
    if "analytics_views" in backup:
        for vid, doc in backup["analytics_views"].items():
            q = f"""INSERT INTO analytics_views (id, sessionId, path, timestamp, title)
                    VALUES ({clean_sql_str(vid)}, {clean_sql_str(doc.get("sessionId", ""))}, {clean_sql_str(doc.get("path", ""))},
                            {clean_sql_str(doc.get("timestamp", ""))}, {clean_sql_str(doc.get("title"))});"""
            queries.append(q)

    print(f"Total consultas de inserción preparadas: {len(queries)}")

    # Ejecutar consultas de inserción en lotes de 50
    chunk_size = 50
    for i in range(0, len(queries), chunk_size):
        chunk = queries[i:i+chunk_size]
        print(f"Ejecutando lote {i // chunk_size + 1}/{((len(queries)-1)//chunk_size)+1}...")
        if not execute_batch(chunk):
            print("⚠️ Error al insertar lote de datos")
            sys.exit(1)

    print("\n✓ ¡Base de datos de Turso recreada e importada con éxito absoluto!")

if __name__ == "__main__":
    main()
