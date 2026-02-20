# GraviSales CRM Frontend

Modern CRM built with React, TypeScript, Vite, and Tailwind CSS. Integrated with GraviBase (BaaS).

## Features
- **Multi-step Authentication:** Register -> Login -> Join Organization.
- **Organization Enforcement:** Users without an organization link are prompted to join one upon login.
- **i18n Support:** Localization for multiple languages.
- **Premium UI:** Built with Tailwind CSS and Radix UI primitives.

## Flow Details
The application uses two-tier user profile management:
1. **Platform Profile:** Standard GraviBase profile (username, email, roles).
2. **App User Record:** Custom `Users` table for application-specific logic like `isActive` flag and `orgCode` association.

## Development
```bash
cd frontend
npm install
npm run dev
```

## Documentation
- [DB Structure](../DB_STRUCTURE.md)
- [User Manual](../USER_MANUAL.md)
