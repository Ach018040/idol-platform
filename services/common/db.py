import os
import requests

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}


def insert_raw(record: dict):
    url = f"{SUPABASE_URL}/rest/v1/raw_ingestion"
    res = requests.post(url, headers=HEADERS, json=record)

    if res.status_code >= 300:
        print('Insert error:', res.text)
