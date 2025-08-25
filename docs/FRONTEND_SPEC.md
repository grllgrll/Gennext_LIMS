# Frontend Spec (Next.js 14, App Router)

## Common
- State queries: use React Query (later) or simple fetch for MVP.
- Environment: NEXT_PUBLIC_API_URL → http://localhost:8000
- Styling: Tailwind + minimal CSS; adopt shadcn/ui later.
- i18n ready: text labels collected in a single constants file for EN/TR later.

## Routes
- `/` Dashboard — counts, recent items, quick links
- `/intake` — Kit + Sample creation
- `/qc` — Extraction Batch creation + QC table
- `/plate` — Plate builder
- `/runs` — Run creation + metrics upload
- `/prs` — Package creation + jobs list
- `/settings` — thresholds & manifests (read-only placeholders for now)

## Components
- Badge(status): maps status→color
- Table, Pagination (MVP: no pagination; later add)
- Modal: confirm destructive/locking actions (e.g., create plate, run)
- FileUploader: for CSV/JSON (metrics)

## Validations
- Well: ^[A-H](?:[1-9]|1[0-2])$
- SentrixPosition: ^R\d{2}C\d{2}$
- CallRate: 0..1, DishQC: 0..1, A260 ratios reasonable ranges

## Error UX
- Use a top-level <Toast /> and show actionable messages.
