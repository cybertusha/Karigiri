# Storage Bucket Setup (`product-images`)

Run this after your schema migrations so image upload works from dashboard.

## Option A: Supabase SQL Editor (quickest)

1. Open your Supabase project (`odsnlgctwyrbslwwfdda`)
2. Go to **SQL Editor**
3. Run the SQL from:
   - `supabase/migrations/20260424001000_storage_bucket_setup.sql`

## Option B: Supabase CLI (if installed)

```bash
supabase link --project-ref odsnlgctwyrbslwwfdda
supabase db push
```

## What this creates

- Public bucket: `product-images`
- Storage policies:
  - public read
  - artisan upload only in own folder (`<uid>/...`)
  - artisan update/delete only own files

## Verify

In Supabase dashboard:

- **Storage > Buckets** contains `product-images`
- Upload from app dashboard no longer returns `bucket not found`
