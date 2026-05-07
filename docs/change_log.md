# Project Change Log

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
