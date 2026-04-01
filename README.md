# Inventory and Sales System

## Overview

This project is a React and TypeScript application for inventory management and point-of-sale workflows.

## Local development

Requirements:

- Node.js
- npm

Install dependencies and start the app:

```sh
npm install
npm run dev
```

## Environment variables

Create a local `.env` from `.env.example` and supply your Supabase project values.

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Available scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build
- `npm run preview` serves the production build locally
- `npm run lint` runs ESLint
- `npm run test` runs the Vitest test suite
- `npm run typecheck` runs TypeScript without emitting output
- `npm run test:smoke` runs the Playwright browser smoke suite
- `npm run verify` runs build, typecheck, and the browser smoke suite

## Release checks

Run this before each push:

```sh
npm run verify
```

## Supabase operations

Use these checked-in SQL files in the Supabase SQL Editor:

- `supabase/manual/verify_app_setup.sql`
  - Confirms the expected tables, RLS configuration, triggers, functions, and policies exist
- `supabase/manual/promote_user_to_admin.sql`
  - Promotes one existing auth user to `ADMIN`
- `supabase/manual/test_setup_seed.sql`
  - Assigns one seeded `ADMIN`, one seeded `STAFF`, and inserts sample suppliers and products for browser smoke tests

## Admin creation in production

New signups default to `STAFF`, so production needs one bootstrap admin.

Recommended flow:

1. Create the user normally through signup
2. Run `supabase/manual/promote_user_to_admin.sql` in the Supabase SQL Editor for that user's email
3. After that first bootstrap, manage roles from the app's admin settings UI

## Browser smoke setup

The Playwright suite always runs auth and staff smoke coverage. Admin and sale-creation smoke coverage become active when you provide seeded credentials and sample data.

Recommended setup:

1. Create one future admin account and one future staff account through the app signup flow
2. Run `supabase/manual/test_setup_seed.sql` in the Supabase SQL Editor after replacing the emails
3. Add the matching `E2E_*` variables from `.env.example` to your local `.env`

Seeded smoke coverage then exercises:

- admin visibility and access to `Suppliers` and `Reports`
- sale creation against a known sample product

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui
