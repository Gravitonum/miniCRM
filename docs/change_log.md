# Project Change Log

## [2026-05-07T12:37:00Z] Settings access control based on roles
- Type: feature | security
- Affected: `frontend/src/App.tsx`, `frontend/src/components/layout/DashboardLayout.tsx`
- Summary: Restricted access to the Settings page. The menu item is now hidden for non-admin users, and direct navigation to `/settings` redirects unauthorized users to the dashboard.
- Context: Regular users (e.g., Viewers, Managers) should not be able to modify application configurations or directories.
- Risk: Low. Uses the synchronous JWT token decoder to verify roles.
- Lesson learned: Always enforce role-based access control (RBAC) both in the UI (hiding elements) and at the routing layer.
- Next steps: Verify that all settings APIs on the backend also correctly enforce admin roles.

## [2026-05-07T12:33:00Z] Decode user roles from JWT token
- Type: feature | refactor
- Affected: `frontend/src/lib/api.ts`, `frontend/src/pages/deals/DealsPage.tsx`
- Summary: Refactored role retrieval to decode the JWT token directly on the client instead of making a separate API request to the backend. GraviBase now embeds user roles directly into the token.
- Context: Reduces redundant network requests and allows synchronous access to user roles across the application.
- Risk: Low. Assumes the JWT structure includes the `roles.minicrm` array as per GraviBase updates.
- Lesson learned: Always leverage token claims when available to minimize backend calls and improve frontend responsiveness.
- Next steps: Consider migrating this into a global AuthContext if other components begin requiring synchronous access to user roles.

## [2026-05-07T12:30:00Z] CRM Transition Rules UI Polish & Security Bypass
- Type: feature | refactor | docs

- Affected: `frontend/src/pages/settings/FunnelsSettings.tsx`, `frontend/src/pages/deals/DealsPage.tsx`, `frontend/src/pages/settings/SettingsPage.tsx`, `USER_MANUAL.md`

- Summary: Improved the settings layout to use full-width containers and optimized the funnel grid ratio (3/12 and 9/12). Implemented role-based filtering in the rules UI to hide Admins (bypass) and Viewers (no move). Added Admin bypass logic in the deals kanban board to allow CompanyAdmin and SuperAdmin to ignore transition restrictions.

- Context: The UI was previously cramped and difficult to use on large screens. Admins were being restricted by rules, which is against standard CRM practices where higher-privilege roles have absolute control.

- Risk: Low. Changes mostly affect UI layout and local permission checks.

- Lesson learned: Double-check HTML nesting (avoid button-in-button). Use flexible max-widths for settings pages to accommodate complex tables and grids.

- Next steps: Verify that SuperAdmin role is correctly identified across all application contexts.

## [2026-05-07T11:30:00Z] CRM Stage Transition Rules & Build Fixes
- Type: feature | bugfix | docs

- Affected: `frontend/src/pages/settings/FunnelsSettings.tsx`, `frontend/src/pages/deals/DealsPage.tsx`, `frontend/src/api/settings.ts`, `frontend/src/locales/ru.json`, `frontend/src/components/ui/tabs.tsx`, `frontend/src/components/ui/checkbox.tsx`, `USER_MANUAL.md`, `DB_STRUCTURE.md`

- Summary: Finalized the implementation of Stage Transition Rules and resolved critical build errors. Added missing UI components (Tabs, Checkbox), fixed property naming inconsistencies (type -> statusType, order -> orderIdx), and corrected role-based access logic (removed redundant JSON.parse).

- Context: The previous implementation had syntax errors and missing dependencies. Users needed role-based and flow-based restrictions for deal movements.

- Risk: High risk of locking users out of transitions if rules are misconfigured; mitigated by 'Any' mode by default and 'Seed Default Rules' helper.

- Lesson learned: Always verify Shadcn UI component existence before importing. Ensure property names in frontend types exactly match backend models to avoid runtime/compile-time confusion. Use `import type` for type-only imports in strict TS projects.

- Next steps: Monitor user feedback on transition restrictions. Implement backend-side enforcement for rules in the future (currently client-side only).

## [2026-05-07 14:20] Stage Transition Rules & Role-Based Flow Control
- Type: feature

- Affected: `frontend/src/api/settings.ts`, `frontend/src/pages/settings/FunnelsSettings.tsx`, `frontend/src/pages/deals/DealsPage.tsx`, `frontend/src/locales/*.json`

- Summary: Implemented a comprehensive stage transition system for CRM funnels. Added "Free" vs "Restricted" transition modes. Restricted mode enforces rules defined in the database, including role-based access control (e.g., only Managers can move to "Won").

- Context: Small/Medium businesses often need to prevent accidental or unauthorized stage changes (e.g., skipping qualification). 

- Risk: Setting a funnel to "Restricted" without defining rules will block all transitions. Mitigated by adding a "Seed Default Rules" (linear scheme) button.

- Lesson learned: Always provide a "reset to defaults" or "seed" option for complex rule-based configurations to avoid user frustration.

- Next steps: Update USER_MANUAL.md with screenshots of the new interface.


All notable changes to this project will be documented in this file.

## [2026-05-07 13:47] Fixed Directories Settings UI and functionality
- Type: feature
- Affected: `frontend/src/api/clients.ts`, `frontend/src/pages/settings/DirectoriesSettings.tsx`, `frontend/src/locales/ru.json`, `frontend/src/locales/en.json`
- Summary: Added inline editing for directory items (Lead Sources, Legal Forms, Relationship Types). Fixed layout issues with 'New value' input field overflowing on focus. Added delete confirmation dialog.
- Context: User report about missing edit functionality and UI layout bugs in settings.
- Risk: None.
- Lesson learned: Using `min-width-0` on flex items containing inputs prevents layout breaks. Inline editing improves UX for simple lists.
- Next steps: None.

## [2026-05-07 13:40] Added Edit and Delete actions to Contacts list
- Type: feature
- Affected: `frontend/src/pages/contacts/ContactsPage.tsx`, `frontend/src/locales/ru.json`, `frontend/src/locales/en.json`
- Summary: Added "Edit" and "Delete" icons to each row in the Contacts table. The edit icon opens a modal to update contact details, and the delete icon opens a confirmation dialog. Removed the redundant arrow icon from the table.
- Context: User request to improve quick management of contact persons.
- Risk: Potential stopPropagation issues if not handled correctly (handled).
- Lesson learned: Standardized "ContactForm" to handle both create and update operations reduces code duplication.
- Next steps: Verify in browser.

## [2026-05-07 13:30] Initial Change Log Creation
- Type: docs
- Affected: `docs/change_log.md`
- Summary: Created the primary project memory file as per project rules.
- Context: Initializing the change log to track future changes and maintain project history.
- Risk: None.
- Lesson learned: Always start with the change log to ensure transparency and continuity.
- Next steps: Document upcoming changes for the Contacts module.
