import firebase_admin
from firebase_admin import credentials, firestore
import json
import sys

cred_path = "/home/dxdx/Descargas/rostrodorado-80279-firebase-adminsdk-fbsvc-59c5ff7cfb.json"
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

def clean_value(val):
    if isinstance(val, dict):
        return {k: clean_value(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [clean_value(v) for v in val]
    elif hasattr(val, 'isoformat'): # Datetime
        return val.isoformat()
    elif hasattr(val, 'latitude') and hasattr(val, 'longitude'): # GeoPoint
        return {'latitude': val.latitude, 'longitude': val.longitude}
    elif hasattr(val, 'path'): # DocumentReference
        return f"__ref__:{val.path}"
    return val

def export_collection(collection_ref):
    data = {}
    docs = collection_ref.stream()
    for doc in docs:
        doc_data = clean_value(doc.to_dict())
        data[doc.id] = doc_data
    return data

for db_id in ["(default)", "rostrodorado-db"]:
    print(f"Connecting to firestore database: '{db_id}'...")
    try:
        db = firestore.client(database_id=db_id)
        root_cols = db.collections()
        backup = {}
        col_names = []
        for col in root_cols:
            print(f"Exporting collection '{col.id}' from '{db_id}'...")
            backup[col.id] = export_collection(col)
            col_names.append(col.id)
        
        if backup:
            output_file = f"/home/dxdx/firestore_backup_{db_id.replace('(', '').replace(')', '')}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(backup, f, indent=2, ensure_ascii=False)
            print(f"✓ Backup for '{db_id}' completed successfully in '{output_file}'! Exported collections: {col_names}")
        else:
            print(f"No collections found in database '{db_id}'.")
    except Exception as e:
        print(f"Error fetching from database '{db_id}': {e}")
