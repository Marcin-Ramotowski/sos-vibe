# Design Tokens

Paleta zaprojektowana pod "nie kolejny nudny USOS" — czysta, nowoczesna, akademicka bez bycia nudną.
Implementacja przez Tailwind CSS 4 custom properties + shadcn/ui.

## Colors

### Brand
- primary: `#2563EB` (blue-600) — główne akcje, przyciski
- primary-hover: `#1D4ED8` (blue-700)
- primary-light: `#EFF6FF` (blue-50) — tła kart, highlights

### Semantic
- success: `#16A34A` (green-600) — "zapisany", "ocena wystawiona"
- success-light: `#F0FDF4` (green-50)
- warning: `#D97706` (amber-600) — "brak miejsc"
- warning-light: `#FFFBEB` (amber-50)
- error: `#DC2626` (red-600) — błędy, destruktywne akcje
- error-light: `#FEF2F2` (red-50)
- info: `#0891B2` (cyan-600) — informacje neutralne

### Neutral (Light mode)
- background: `#FFFFFF`
- surface: `#F8FAFC` (slate-50) — karty, panele
- surface-elevated: `#FFFFFF` z `shadow-sm`
- text-primary: `#0F172A` (slate-900)
- text-secondary: `#475569` (slate-600)
- text-muted: `#94A3B8` (slate-400)
- border: `#E2E8F0` (slate-200)
- border-strong: `#CBD5E1` (slate-300)

## Typography

- font-family: `'Inter', system-ui, -apple-system, sans-serif`
- font-mono: `'JetBrains Mono', 'Fira Code', monospace` (dla ID, kodów)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| text-xs | 0.75rem / 12px | 400 | Etykiety, metadane |
| text-sm | 0.875rem / 14px | 400 | Body small, tabelki |
| text-base | 1rem / 16px | 400 | Body default |
| text-lg | 1.125rem / 18px | 500 | Section headers |
| text-xl | 1.25rem / 20px | 600 | Card titles |
| text-2xl | 1.5rem / 24px | 700 | Page titles |
| text-3xl | 1.875rem / 30px | 700 | Hero headings |

## Spacing (8px grid)

- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)

## Border Radius

- radius-sm: 0.25rem (4px) — input fields
- radius-md: 0.5rem (8px) — cards, buttons
- radius-lg: 0.75rem (12px) — modals, panels
- radius-xl: 1rem (16px) — larger containers
- radius-full: 9999px — badges, pills, avatars

## Shadows

- shadow-sm: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- shadow-md: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- shadow-lg: `0 10px 15px -3px rgb(0 0 0 / 0.1)`

## Status Badges (enrollment & grade)

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| ENROLLED | success-light | success | success/20 |
| AVAILABLE | primary-light | primary | primary/20 |
| FULL | warning-light | warning | warning/20 |
| Brak oceny | surface | text-muted | border |
| Ocena 5.0–5.5 | success-light | success | — |
| Ocena 4.0–4.5 | primary-light | primary | — |
| Ocena 3.0–3.5 | warning-light | warning | — |
| Ocena 2.0 | error-light | error | — |
