# Deployment Guide

## Architektura

```
GitHub Actions (Release pipeline)
  └─► Docker Hub: pikram/sos-app:sha-<short>
        └─► SSH → deploy@tymon343.mikrus.xyz
              └─► docker compose pull + up
                    ├── app (Next.js standalone)
                    ├── db  (PostgreSQL 16)
                    └── cloudflared → sos.marcin00.pl
```

- **CI** (`ci.yml`) — walidacja: lint + typecheck + testy. Odpala się na każdym PR i pushu do `master`.
- **Release** (`release.yml`) — budowanie obrazu + wdrożenie. Odpala się automatycznie po sukcesie CI na `master`.
- **Security** (`security.yml`) — 7 skanów bezpieczeństwa na każdym PR. Buduje obraz lokalnie (bez push) tylko do skanowania.
- Ruch HTTP wyłącznie przez **Cloudflare Tunnel** — brak otwartych portów 80/443 na VPS.

---

## Pierwsze wdrożenie

### Wymagania wstępne (na VPS)

- Docker zainstalowany, user `deploy` w grupie `docker`.
- Katalog `/opt/sos/` z plikami `compose.yaml` i `compose.prod.yaml` (sklonowane lub skopiowane z repo).
- Plik `/opt/sos/.env.production` (`chmod 600`):

```bash
NODE_ENV=production
POSTGRES_USER=sos_prod
POSTGRES_PASSWORD=<openssl rand -base64 32>
POSTGRES_DB=sos_prod
DATABASE_URL=postgresql://sos_prod:<password>@db:5432/sos_prod
JWT_SECRET=<openssl rand -base64 48>
CLOUDFLARED_TOKEN=<token z Cloudflare Dashboard → Zero Trust → Tunnels>
APP_IMAGE_TAG=latest
```

### GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Wartość |
|---|---|
| `DOCKERHUB_USERNAME` | login Docker Hub |
| `DOCKERHUB_TOKEN` | token Docker Hub |
| `DEPLOY_SSH_KEY` | klucz prywatny ed25519 dla usera `deploy` na VPS |

### Pierwsze uruchomienie

```bash
ssh -p 20343 deploy@tymon343.mikrus.xyz
cd /opt/sos

# Pobierz najnowszy obraz i uruchom
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml pull
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml up -d

# Sprawdź status
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml ps
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml exec app wget -qO- http://localhost:3000/api/health
```

Przy starcie `entrypoint.sh` automatycznie uruchamia `prisma migrate deploy`.

---

## Codzienna praca

Po każdym merge do `master`:

1. `ci.yml` uruchamia lint + testy.
2. Po sukcesie CI automatycznie startuje `release.yml`.
3. `release.yml` buduje obraz z tagiem `sha-<short>` i `latest`, pushuje do Docker Hub.
4. SSH na VPS: `docker compose --env-file .env.production pull app` + `up -d --no-deps app`.
5. Smoke test `/api/health` — jeśli fail, job kończy się czerwono (GH wysyła email).
6. Każdy udany deploy dopisuje wpis do `/opt/sos/.deploy-log`.

Nic nie wymaga ręcznej interwencji przy normalnym deploy.

---

## Rollback

Sprawdź historię deployów:

```bash
ssh -p 20343 deploy@tymon343.mikrus.xyz "tail -10 /opt/sos/.deploy-log"
# 2026-05-26T14:32:00Z sha-abc1234 fix(api): tighten enrollment validation
# 2026-05-26T11:05:00Z sha-9f8e7d6 feat(ui): student grade filters
```

Cofnij do wybranego tagu:

```bash
ssh -p 20343 deploy@tymon343.mikrus.xyz "
  cd /opt/sos &&
  sed -i 's/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=sha-9f8e7d6/' .env.production &&
  docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml pull app &&
  docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml up -d --no-deps app
"
```

`--no-deps` recreates tylko kontener `app` — baza danych i cloudflared zostają nienaruszone.

---

## Logi i status

```bash
# Status kontenerów
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml ps

# Logi aplikacji (ostatnie 100 linii)
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml logs --tail=100 app

# Śledzenie logów na żywo
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml logs -f app

# Health check (port nie jest zbindowany na hosta — exec wewnątrz kontenera)
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml exec app wget -qO- http://localhost:3000/api/health
```

---

## Troubleshooting

### Aplikacja nie startuje

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml logs app
```

Najczęstsze przyczyny:
- Błędna `DATABASE_URL` — host musi być `db` (nie `localhost`).
- Brakujący `JWT_SECRET` w `.env.production`.
- Baza nie gotowa — sprawdź `docker compose --env-file .env.production ps db` (powinno być `healthy`).
- Brak migracji — `entrypoint.sh` uruchamia je automatycznie, ale jeśli baza jest pusta i migracja nie powiodła się, sprawdź logi.

### Błąd połączenia z bazą

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml exec db \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\l'
```

### Tunel Cloudflare nie działa

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml logs cloudflared
```

Sprawdź czy `CLOUDFLARED_TOKEN` w `.env.production` jest aktualny (dashboard Cloudflare → Zero Trust → Tunnels).

### Backup bazy danych

```bash
docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml exec db \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql
```
