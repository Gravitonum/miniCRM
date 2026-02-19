
import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

GRAVIBASE_URL = os.getenv("GRAVIBASE_URL", "https://app.gravibase.ru")
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")
PROJECT_CODE = os.getenv("PROJECT_CODE")

def get_token():
    # Use the 'apps' project for platform authentication as seen in verify_structure.py
    url = f"{GRAVIBASE_URL}/auth/projects/apps/token"
    payload = {
        "login": USERNAME,
        "password": PASSWORD
    }
    # application/x-www-form-urlencoded
    response = requests.post(url, data=payload)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to get token: {response.status_code} {response.text}")
        exit(1)

def create_company(token):
    # Correct Data API endpoint (no v1, add /data)
    base_data_url = f"{GRAVIBASE_URL}/api/projects/{PROJECT_CODE}/entities/Company/data"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://app.gravibase.ru",
        "Referer": "https://app.gravibase.ru/"
    }
    
    # Check if exists first
    # Try listing all just to check connection
    check_url = f"{base_data_url}"
    # Frontend does not send auth for lookup
    check_res = requests.get(check_url, headers={
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    print(f"DEBUG: Check Status {check_res.status_code}")
    
    if check_res.status_code == 200:
        try:
            data = check_res.json()
            # Response format usually { "data": [...] }
            items = data.get("data", [])
            if len(items) > 0:
                print("Company with orgCode 'TEST-01' already exists.")
                return
        except Exception as e:
            print(f"Failed to decode JSON: {e}")
            print(f"Response text: {check_res.text}")
            return
    else:
         print(f"Check failed: {check_res.text}")

    payload = {
        "name": "Test Company",
        "orgCode": "TEST-01",
        "currency": "RUB",
        "timezone": "Europe/Moscow",
        "defaultLanguage": "ru",
        "isBlocked": False
    }
    
    response = requests.post(base_data_url, json=payload, headers=headers)
    if response.status_code in [200, 201]:
        print("Successfully created company: Test Company (TEST-01)")
        print(response.json())
    else:
        print(f"Failed to create company: {response.status_code} {response.text}")

if __name__ == "__main__":
    print(f"Connecting to {GRAVIBASE_URL} for project {PROJECT_CODE}...")
    token = get_token()
    create_company(token)
