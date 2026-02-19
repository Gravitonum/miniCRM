import json
import os
import time
import requests
from urllib.parse import urljoin

try:
    from dotenv import load_dotenv
    # Use override=True because on Windows/Linux 'USERNAME' is a system variable
    # that would otherwise take precedence over the .env file.
    load_dotenv(override=True)
except ImportError:
    pass

# Configuration
GRAVIBASE_URL = os.getenv("GRAVIBASE_URL", "https://app.gravibase.ru")
USERNAME = os.getenv("USERNAME")
PASSWORD = os.getenv("PASSWORD")
PROJECT_CODE = os.getenv("PROJECT_CODE")

if not all([USERNAME, PASSWORD, PROJECT_CODE]):
    print("❌ ERROR: Missing required environment variables: USERNAME, PASSWORD, or PROJECT_CODE")
    print("Please check your .env file or environment variables.")
    exit(1)

EXPECTED_ENTITIES = {
    "PlatformAdmin": ["email", "passwordHash", "name", "isActive"],
    "Company": ["name", "timezone", "currency", "logoUrl", "konturApiKey", "isBlocked", "blockedReason", "defaultLanguage"],
    "CrmFunnel": ["name", "isActive", "company"],
    "FunnelStage": ["name", "orderIdx", "statusType", "funnel"],
    "Directory": ["type", "value", "isActive", "company"],
    "Tag": ["name", "company"],
    "ClientCompany": ["name", "inn", "legalForm", "relationType", "source", "address", "website", "konturDataRaw", "company"],
    "ContactPerson": ["firstName", "lastName", "positionTitle", "phoneWork", "phonePersonal", "emailAddr", "commentaryText", "company"],
    "ContactCompanyLink": ["contactPerson", "clientCompany", "isPrimaryJob"],
    "Deal": ["name", "clientCompany", "contactPerson", "funnel", "currentStage", "amountValue", "responsibleUserId", "deadlineDate", "closedAt", "company"],
    "DealTagLink": ["deal", "tag"],
    "ClientTagLink": ["clientCompany", "tag"],
    "DealProduct": ["deal", "productCategory", "quantityAmount", "unitPrice"],
    "DealStageHistory": ["deal", "fromStage", "toStage", "changedByUserId", "changedAtTime"],
    "Interaction": ["company", "interactionType", "clientCompany", "deal", "contactPerson", "interactionDate", "descriptionText", "authorUserId"],
    "CompanyInvite": ["emailAddr", "company", "roleName", "inviteToken", "invitedByUserId", "acceptedAt", "expiresAt"],
    "UserPreference": ["userId", "company", "language", "theme"]
}

class GravibaseClient:
    def __init__(self, base_url, username, password, project_code):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.project_code = project_code
        self.token = None
        self.session = requests.Session()

    def authenticate(self):
        print(f"Authenticating as {self.username}...")
        url = urljoin(self.base_url, "/auth/projects/apps/token")
        response = self.session.post(url, data={
            "login": self.username,
            "password": self.password
        })
        if response.status_code != 200:
            raise Exception(f"Authentication failed: {response.text}")
        
        self.token = response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print("Authentication successful.")

    def get_entities(self):
        print("Fetching entities...")
        url = urljoin(self.base_url, f"/generator/projects/{self.project_code}/schema/entities")
        response = self.session.get(url)
        if response.status_code != 200:
            print(f"DEBUG: Response Headers: {response.headers}")
            print(f"DEBUG: Response Content: {response.text}")
            raise Exception(f"Failed to fetch entities: {response.text}")
        data = response.json()
        # print(f"DEBUG: get_entities response: {json.dumps(data, indent=2)}")
        return data.get("data", [])

    def get_attributes(self, entity_name):
        url = urljoin(self.base_url, f"/generator/projects/{self.project_code}/schema/entities/{entity_name}/attributes")
        response = self.session.get(url)
        if response.status_code != 200:
            print(f"DEBUG: {entity_name} Attributes Response Content: {response.text}")
            raise Exception(f"Failed to fetch attributes for {entity_name}: {response.text}")
        data = response.json()
        # The key might be 'data' like in entities
        return data.get("data", data.get("attributes", []))

    def check_capabilities(self):
        print(f"Checking capabilities for project {self.project_code}...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/capabilities")
        response = self.session.get(url)
        if response.status_code == 200:
            print(f"Capabilities: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Failed to fetch capabilities: {response.text}")

    def fetch_user_details(self, username):
        print(f"Fetching details for user {username}...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/users/{username}")
        response = self.session.get(url)
        if response.status_code == 200:
            print(f"✅ User Details: {json.dumps(response.json(), indent=2)}")
            return response.json()
        else:
            print(f"❌ Failed to fetch user details: {response.text}")
            return None

    def fetch_user_profile(self, username):
        print(f"Fetching profile for user {username}...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/users/{username}/profile")
        response = self.session.get(url)
        if response.status_code == 200:
            print(f"✅ User Profile: {json.dumps(response.json(), indent=2)}")
            return response.json()
        else:
            print(f"❌ Failed to fetch user profile: {response.text}")
            return None

    def list_roles(self):
        print("Fetching roles list...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/roles")
        response = self.session.get(url)
        if response.status_code == 200:
            roles = response.json().get("data", [])
            print(f"Found {len(roles)} roles.")
            for r in roles:
                print(f" - {r.get('role')} (default: {r.get('default')})")
            return roles
        else:
            print(f"Failed to fetch roles: {response.text}")
            return []

    def get_user_roles(self, username):
        print(f"Fetching roles for user {username}...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/users/{username}/roles")
        response = self.session.get(url)
        if response.status_code == 200:
            roles = response.json().get("data", [])
            print(f"✅ User {username} roles: {[r.get('role') for r in roles]}")
            return roles
        else:
            print(f"❌ Failed to fetch roles for {username}: {response.text}")
            return []

    def list_users(self, search=None):
        print(f"Fetching users list (search='{search}')...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/users")
        params = {"limit": 100}
        if search:
            params['search'] = search
            
        response = self.session.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            users = data.get("data", [])
            total = data.get("total", 0)
            print(f"Found {len(users)} users in response (Total in system: {total}).")
            for u in users:
                print(f" - {u.get('username')} (Email Profile: {u.get('email')})")
            return users
        else:
            print(f"❌ Failed to fetch users: {response.text}")
            return []

    def assign_role(self, username, role):
        print(f"Assigning role {role} to user {username}...")
        url = urljoin(self.base_url, f"/security/projects/{self.project_code}/users/{username}/roles")
        response = self.session.put(url, data={'role': role})
        if response.status_code not in [200, 201, 204]:
            print(f"Warning: Failed to assign role (Status {response.status_code}): {response.text}")
        else:
            print(f"Role {role} assigned successfully.")

    def authenticate_user(self, username, password):
        print(f"Attempting to login as {username}...")
        url = urljoin(self.base_url, f"/auth/projects/{self.project_code}/token")
        data = {"login": username, "password": password}
        response = self.session.post(url, data=data)
        if response.status_code == 200:
            print(f"✅ Login successful for {username}!")
            return response.json()
        else:
            print(f"❌ Login failed for {username}: {response.text}")
            return None

    def register_user(self, username, email, password="TestPassword123!"):
        print(f"\n--- User Registration & Verification ---")
        print(f"Step 1: POST /auth/projects/{self.project_code}/users")
        url = urljoin(self.base_url, f"/auth/projects/{self.project_code}/users")
        registration_data = {
            "username": username,
            "flow": "password",
            "value": password,
            "profile": [{"attribute": "email", "value": email}]
        }
        response = self.session.post(url, json=registration_data)
        if response.status_code not in [200, 201, 202]:
             raise Exception(f"Registration failed: {response.text}")
        print(f"✅ Registration call successful (Status {response.status_code}).")

        print(f"Step 2: Proving existence via Details API")
        details = self.fetch_user_details(username)
        if not details:
            raise Exception("User not found via Details API immediately after registration!")

        print(f"Step 3: Assigning roles and verifying")
        for role in ["Viewer", "Manager"]:
            self.assign_role(username, role)
        self.get_user_roles(username)

        print(f"Step 4: Proving existence via Login")
        if not self.authenticate_user(username, password):
            raise Exception("Newly created user cannot login!")

        # Listing check
        print(f"Step 5: Verifying visibility in global list")
        print("Waiting 2 seconds for indexing...")
        time.sleep(2)
        
        print("Checking Full List (no search):")
        full_list = self.list_users()
        
        print(f"Checking Targeted Search (search='{username}'):")
        search_list = self.list_users(search=username)
        
        present_in_full = any(u.get("username") == username for u in full_list)
        present_in_search = any(u.get("username") == username for u in search_list)

        if present_in_full or present_in_search:
            print(f"✅ User {username} is visible in the list!")
        else:
            print(f"❌ CRITICAL: User {username} is NOT visible in any list view!")
            # We don't raise Exception here to keep the rest of the verification running, 
            # but we show it clearly.
            return False
        return True


def run_verification():
    client = GravibaseClient(GRAVIBASE_URL, USERNAME, PASSWORD, PROJECT_CODE)
    client.authenticate()

    # 0. Check Capabilities
    client.check_capabilities()

    # 1. Verify Structure
    print("\n--- Verifying DB Structure ---")
    entities = client.get_entities()
    entity_names = [e["name"] for e in entities]
    
    missing_entities = set(EXPECTED_ENTITIES.keys()) - set(entity_names)
    if missing_entities:
        print(f"❌ FAIL: Missing entities: {missing_entities}")
    else:
        print("✅ Entities check passed.")

    all_passed = True
    for entity_name, expected_attrs in EXPECTED_ENTITIES.items():
        if entity_name not in entity_names:
            continue
            
        actual_attrs = client.get_attributes(entity_name)
        actual_attr_names = [a["name"] for a in actual_attrs]
        
        missing_attrs = set(expected_attrs) - set(actual_attr_names)
        if missing_attrs:
            print(f"❌ FAIL: {entity_name} missing attributes: {missing_attrs}")
            print(f"  Actual attributes: {actual_attr_names}")
            all_passed = False
        else:
            # print(f"✅ {entity_name} structure OK.")
            pass
    
    if all_passed:
        print("✅ All entity structures verified successfully.")

    # 2. Verify User Registration
    print("\n--- Verifying User Registration ---")
    try:
        test_username = f"test-user-{int(time.time())}"
        test_email = f"{test_username}@example.com"
        # Using a password similar to user's example
        success = client.register_user(test_username, test_email, password="SecureP@ssw0rd123!")
        
        if success:
            print("✅ User registration and visibility verification passed.")
        else:
            print("⚠️ User created and functional, but STILL INVISIBLE in the list.")
            print("This suggests a platform-level delay in indexing or a filter in the list view.")
    except Exception as e:
        print(f"❌ FAIL: User registration failed: {e}")

if __name__ == "__main__":
    try:
        run_verification()
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
