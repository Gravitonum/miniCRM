# Database Structure

## Platform (Security) Entities

### Company
Main tenant entity.
- `id`: UUID (Primary Key)
- `name`: STRING (Company Name)
- `orgCode`: STRING (Unique, used for lookup)
- `isBlocked`: BOOLEAN

## Application Entities (GraviBase)

The application relies on 18 core tables (entities) configured in GraviBase:

### Identity & Access
- `Users`: Stores user profiles mapped to the platform (id, email, username, orgCode, isActive, role).
- `Companies`: Stores tenant info (id, name, orgCode, isBlocked). `isBlocked` is used by SuperAdmin.

### Sales Pipeline
- `CrmFunnel`: Defines pipelines (name, isActive, transitionMode: "any" | "restricted").
- `FunnelStage`: Defines steps (name, statusType: "open"|"won"|"lost", orderIdx, color).
- `StageTransitionRule`: Defines allowed movements between stages (funnel, fromStage, toStage, allowedRoles/JSON-STRING).

### Core CRM Data
- `Deals`: Основные сделки (name, amountValue/DECIMAL, stage/STRING, currentStage/REFERENCE, funnel/REFERENCE, responsible/STRING, deadlineDate/DATETIME, clientCompany/REFERENCE, contactPerson/REFERENCE, closedAt/DATETIME).
- `Clients`: Company records, B2B customers (name, inn, kpp, address, industry).
- `Contacts`: Individual people linked to clients or deals (firstName, lastName, phone, email, position).
- `Tasks`: Activities linked to deals or clients (title, dueDate, assignTo, status).
- `Notes`: Text notes attached to CRM entities.
- `Products`: Catalog of items/services.
- `DealProducts`: Intersection table linking Deals to Products with quantity/price.
- `Interactions`: Logs of calls, emails, or meetings with clients.

---

## Data Synchronization Flow
1. **Login:** User authenticates via **Username** and Password.
2. **Users Check:** The `Users` table is queried by **username**.
3. **Lazy Profile Creation:** If the user is missing from `Users`, a record is created using the username.
4. **Onboarding:** If `orgCode` is null in `Users`, the user is prompted to join an organization.
5. **Join Org:** Updating `orgCode` happens ONLY in the application's `Users` table. Platform security profile is NOT used for this.
