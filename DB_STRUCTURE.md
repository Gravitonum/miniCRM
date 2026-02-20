# Database Structure

## Platform (Security) Entities

### Company
Main tenant entity.
- `id`: UUID (Primary Key)
- `name`: STRING (Company Name)
- `orgCode`: STRING (Unique, used for lookup)
- `isBlocked`: BOOLEAN

## Application Entities

### Users
Stores application-level user data, synchronized with platform profiles.
- `id`: UUID (Primary Key)
- `email`: STRING (Unique) - Links to the user's email.
- `username`: STRING (Unique) - Links to the platform username.
- `orgCode`: STRING (Nullable) - Reference to the `orgCode` of the `Company`.
- `isActive`: BOOLEAN - Controls application access.

---

## Data Synchronization Flow
1. **Login:** User authenticates via **Username** and Password.
2. **Users Check:** The `Users` table is queried by **username**.
3. **Lazy Profile Creation:** If the user is missing from `Users`, a record is created using the username.
4. **Onboarding:** If `orgCode` is null in `Users`, the user is prompted to join an organization.
5. **Join Org:** Updating `orgCode` happens ONLY in the application's `Users` table. Platform security profile is NOT used for this.
