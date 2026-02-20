# User Manual: Authentication & Organization Flow

## 1. Registration
- Access the `/register` page.
- Enter your **Username**, **Email**, and **Password**.
- Click **Register**.
- You will be assigned the default "Viewer" role and redirected to the login page.

## 2. Login
- Use your **Username** and **Password** to log in.
- The system will check if your account is active and if you are already part of an organization.

### Scenario A: New User (No Organization)
- You will be automatically redirected to the **Join Organization** page.
- You must enter a valid **Organization Code** (provided by your administrator).

### Scenario B: Returning User (With Organization)
- You will be redirected directly to the **Dashboard**.

### Scenario C: Account Disabled
- If your `isActive` status in the database is set to `false`, you will see an error message and won't be able to access the application.

## 3. Joining an Organization
- On the `/join-organization` page:
    1. Enter the **Organization Code**.
    2. Click **Lookup**.
    3. If found, the company name will be displayed.
    4. Click **Join Organization** to confirm.
- Once confirmed, your settings are saved, and you are redirected to the dashboard.

## 4. Deals (Beta)
- Access the **Deals** section from the left sidebar navigation menu (Briefcase icon).
- The Deals page provides an overview of your sales pipeline.
- **View Modes:** Toggle between a Kanban board view and a tabular list view using the icons in the toolbar.
- **Deal Details:** Click on any deal in the list to open its detailed view, which includes:
    - Current stage tracking in the sales funnel.
    - Opportunity details (amount, closure probability, close date).
    - Financial information and related contacts/company details.
- *Note: In this version, Deal fields display the required CRM information along with preview data for advanced metrics.*
