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
- `npm run test:smoke` runs the browser auth smoke suite
- `npm run verify` runs build, typecheck, and the browser smoke suite

## Release checks

Run this before each push:

```sh
npm run verify
```

## Supabase operations

Use these checked-in SQL files in the Supabase SQL Editor:

- `supabase/manual/verify_app_setup.sql`
  - Confirms the expected tables, triggers, functions, and policies exist
- `supabase/manual/promote_user_to_admin.sql`
  - Promotes one existing auth user to `ADMIN`

## Admin creation in production

New signups default to `STAFF`, so production needs one bootstrap admin.

Recommended flow:

1. Create the user normally through signup
2. Run `supabase/manual/promote_user_to_admin.sql` in the Supabase SQL Editor for that user's email
3. After that first bootstrap, manage roles from the app's admin settings UI

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui
