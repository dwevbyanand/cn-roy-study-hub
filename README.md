# CN Roy Study Hub — React migration starter

This is the first migration of the supplied static project to React + TypeScript + Vite.

## Included
- Original dark-green visual identity and portrait.
- React Router pages for Overview, Lectures, GA Solutions, Notes, Past Papers, Calculators, Courses and About.
- Four Statistics for Data Science 1 GA video entries preserved from the original `app.js`.
- Existing grade calculation source modules preserved under `src/features/grades/`.
- Supabase client initialization that remains disabled until environment variables are configured.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Supabase setup (not yet connected)
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the Supabase publishable/anon key).
4. Never put a service-role key or Google OAuth client secret in frontend environment variables.
5. Configure Google provider and allowed redirect URLs in Supabase Auth.
6. Add database schema and Row Level Security policies before exposing student records or admin functions.

## Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `dist`
- Add the two `VITE_SUPABASE_*` environment variables in Cloudflare Pages settings after Supabase is configured.

## Important migration notes
- The original `app.js` made calls to `/api/items` and `/api/file/...`. Those endpoints are not available in a static deployment. Notes, Past Papers and Courses therefore show honest empty states until a resource catalogue/database is connected.
- Creator Studio is not included in this first public frontend migration. It must be rebuilt with authenticated server-side authorization and RLS-protected operations; a frontend-only password is not secure.
- The current calculator page includes a basic weighted CGPA calculator. The original grade predictor algorithms are preserved, but their full UI still needs to be migrated and tested as a separate step.
- No Supabase project, OAuth credentials, database, or Cloudflare deployment has been created by this code bundle.
