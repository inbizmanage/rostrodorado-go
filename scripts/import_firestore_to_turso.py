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
    # Escape single quotes
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def import_table(table_name, col_data, fields_mapping):
    print(f"Preparando inserciones para '{table_name}'...")
    queries = []
    # fields_mapping is a list of tuples: (sqlite_col_name, firestore_field_name, default_val)
    for doc_id, doc in col_data.items():
        vals = [clean_sql_str(doc_id)] # The first column is always ID
        for sqlite_col, firestore_col, default_val in fields_mapping:
            val = doc.get(firestore_col, default_val)
            vals.append(clean_sql_str(val))
        
        cols = ["id"] + [x[0] for x in fields_mapping]
        query = f"INSERT OR REPLACE INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(vals)});"
        queries.append(query)
    
    # Execute in chunks of 50 queries
    chunk_size = 50
    for i in range(0, len(queries), chunk_size):
        chunk = queries[i:i+chunk_size]
        print(f"Ejecutando lote {i // chunk_size + 1}/{((len(queries)-1)//chunk_size)+1} para '{table_name}'...")
        if not execute_batch(chunk):
            print(f"⚠️ Error al insertar lote para la tabla '{table_name}'")
            return False
    print(f"✓ Tabla '{table_name}' importada con éxito ({len(queries)} registros).")
    return True

def main():
    print("Cargando backup de Firestore...")
    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        backup = json.load(f)
    
    # 1. users
    # schema: id, email, displayName, firstName, lastName, role
    if "users" in backup:
        import_table("users", backup["users"], [
            ("email", "email", ""),
            ("displayName", "displayName", None),
            ("firstName", "firstName", None),
            ("lastName", "lastName", None),
            ("role", "role", "customer")
        ])

    # 2. products
    # schema: id, name, description, longDescription, price, image, category, ingredients, usage, benefits, weight
    if "products" in backup:
        import_table("products", backup["products"], [
            ("name", "name", ""),
            ("description", "description", ""),
            ("longDescription", "longDescription", None),
            ("price", "price", 0.0),
            ("image", "image", ""),
            ("category", "category", ""),
            ("ingredients", "ingredients", None),
            ("usage", "usage", None),
            ("benefits", "benefits", None),
            ("weight", "weight", None)
        ])

    # 3. categories
    # schema: id, name, description
    if "categories" in backup:
        import_table("categories", backup["categories"], [
            ("name", "name", ""),
            ("description", "description", None)
        ])

    # 4. orders
    # schema: id, userId, customer, items, total, status, trackingNumber, trackingStatus, trackingUpdatedAt, shippingCost, isSample, note
    if "orders" in backup:
        import_table("orders", backup["orders"], [
            ("userId", "userId", None),
            ("customer", "customer", None),
            ("items", "items", None),
            ("total", "total", 0.0),
            ("status", "status", "pending"),
            ("trackingNumber", "trackingNumber", None),
            ("trackingStatus", "trackingStatus", None),
            ("trackingUpdatedAt", "trackingUpdatedAt", None),
            ("shippingCost", "shippingCost", 0.0),
            ("isSample", "isSample", 0),
            ("note", "note", None)
        ])

    # 5. coupons
    # schema: id, code, discount, type, active
    if "coupons" in backup:
        import_table("coupons", backup["coupons"], [
            ("code", "code", ""),
            ("discount", "discount", 0.0),
            ("type", "type", "fixed"),
            ("active", "active", 1)
        ])

    # 6. leads
    # schema: id, name, email, phone, status
    if "leads" in backup:
        import_table("leads", backup["leads"], [
            ("name", "name", None),
            ("email", "email", None),
            ("phone", "phone", None),
            ("status", "status", "new")
        ])

    # 7. forms
    # schema: id, name, data
    if "forms" in backup:
        import_table("forms", backup["forms"], [
            ("name", "name", ""),
            ("data", "data", None)
        ])

    # 8. form_responses
    # schema: id, formId, data
    if "form_responses" in backup:
        import_table("form_responses", backup["form_responses"], [
            ("formId", "formId", ""),
            ("data", "data", None)
        ])

    # 9. posts
    # schema: id, title, content, image, active
    if "posts" in backup:
        import_table("posts", backup["posts"], [
            ("title", "title", ""),
            ("content", "content", ""),
            ("image", "image", None),
            ("active", "active", 1)
        ])

    # 10. analytics_sessions
    # schema: id, startTime, lastActive, referrer, utmMedium, userAgent, device, screenResolution, path, pageViews, lastPath
    if "analytics_sessions" in backup:
        import_table("analytics_sessions", backup["analytics_sessions"], [
            ("startTime", "startTime", None),
            ("lastActive", "lastActive", None),
            ("referrer", "referrer", None),
            ("utmMedium", "utmMedium", None),
            ("userAgent", "userAgent", None),
            ("device", "device", None),
            ("screenResolution", "screenResolution", None),
            ("path", "path", None),
            ("pageViews", "pageViews", 0),
            ("lastPath", "lastPath", None)
        ])

    # 11. analytics_views
    # schema: id, sessionId, path, timestamp, title
    if "analytics_views" in backup:
        import_table("analytics_views", backup["analytics_views"], [
            ("sessionId", "sessionId", ""),
            ("path", "path", ""),
            ("timestamp", "timestamp", ""),
            ("title", "title", None)
        ])

    # 12. otp_codes
    # schema: id (autoincrement), email, code, expiresAt, attempts
    if "otp_codes" in backup:
        print("Preparando inserciones para 'otp_codes'...")
        queries = []
        for email, doc in backup["otp_codes"].items():
            code = doc.get("code", "")
            expiresAt = doc.get("expiresAt", 0)
            attempts = doc.get("attempts", 0)
            
            query_del = f"DELETE FROM otp_codes WHERE email = '{email}';"
            query_ins = f"INSERT INTO otp_codes (email, code, expiresAt, attempts) VALUES ('{email}', '{code}', {expiresAt}, {attempts});"
            queries.append(query_del)
            queries.append(query_ins)
            
        chunk_size = 50
        for i in range(0, len(queries), chunk_size):
            chunk = queries[i:i+chunk_size]
            if not execute_batch(chunk):
                print("⚠️ Error al insertar lote para la tabla 'otp_codes'")
                
        print(f"✓ Tabla 'otp_codes' importada con éxito ({len(queries) // 2} registros).")

    print("¡Importación de Firebase a Turso finalizada con éxito!")

if __name__ == "__main__":
    main()
