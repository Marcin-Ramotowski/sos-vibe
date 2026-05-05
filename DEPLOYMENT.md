# Deployment Guide

## Wdrożenie na VPS (Docker Compose)

### Wymagania

- VPS z zainstalowanym Docker + Docker Compose
- Dostęp SSH
- Opcjonalnie: domena dla SSL

### Krok 1: Przygotowanie serwera

```bash
# SSH na serwer
ssh user@your-server

# Instalacja Docker (jeśli nie ma)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Weryfikacja
docker --version
docker compose version
```

### Krok 2: Klonowanie i konfiguracja

```bash
git clone <repo-url>
cd sos

# Utwórz plik środowiskowy produkcyjnego
cp .env.example .env.production
nano .env.production
```

**Wymagane wartości produkcyjne** w `.env.production`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://sos_user:STRONG_PASSWORD@db:5432/sos_prod
JWT_SECRET=GENERATE_SECURE_64_CHAR_SECRET
POSTGRES_USER=sos_user
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=sos_prod
```

Generowanie bezpiecznego sekretu:

```bash
openssl rand -base64 48
```

### Krok 3: Deploy

```bash
# Załaduj zmienne środowiskowe
export $(cat .env.production | grep -v '^#' | xargs)

# Zbuduj i uruchom
make prod-up

# Uruchom migracje
make prod-migrate

# Sprawdź status
docker compose -f compose.yaml -f compose.prod.yaml ps
docker compose -f compose.yaml -f compose.prod.yaml logs app
```

### Krok 4: Weryfikacja

```bash
curl http://localhost:3000/api/health
# Oczekiwany wynik: {"status":"ok","db":"connected",...}
```

---

## SSL z Caddy (rekomendowane)

Dodaj do `docker-compose.prod.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    depends_on:
      - app

volumes:
  caddy_data:
  caddy_config:
```

Utwórz `Caddyfile`:

```
your-domain.com {
    reverse_proxy app:3000
}
```

Caddy automatycznie pobierze certyfikat Let's Encrypt.

---

## Aktualizacja wdrożenia

```bash
# Pobierz zmiany
git pull

# Zbuduj nowy obraz i wdróż (zero-downtime jeśli masz repliki)
make build-prod
make prod-up

# Uruchom nowe migracje (jeśli są)
make prod-migrate
```

---

## Zarządzanie

```bash
# Logi aplikacji
make prod-logs

# Restart
docker compose -f compose.yaml -f compose.prod.yaml restart app

# Backup bazy danych
docker compose -f compose.yaml -f compose.prod.yaml exec db \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Przywracanie backupu
docker compose -f compose.yaml -f compose.prod.yaml exec -T db \
  psql -U $POSTGRES_USER $POSTGRES_DB < backup_20240101.sql
```

---

## Monitoring

**Health check** (wbudowany):

```bash
curl https://your-domain.com/api/health
```

Docker health check jest skonfigurowany — nieprawidłowy stan kontenera pojawi się w `docker compose ps`.

**Zalecane narzędzia zewnętrzne**:

| Cel | Narzędzie |
|-----|-----------|
| Uptime monitoring | UptimeRobot (darmowy) |
| Log aggregation | Loki + Grafana |
| Alerting | PagerDuty / OpsGenie |

---

## Rozwiązywanie problemów

### Aplikacja nie startuje

```bash
docker compose -f compose.yaml -f compose.prod.yaml logs app
```

Najczęstsze przyczyny:
- Zła `DATABASE_URL` (sprawdź host `db`, nie `localhost`)
- Brak migracji (`make prod-migrate`)
- Brakujący `JWT_SECRET`

### Błąd połączenia z bazą

```bash
docker compose -f compose.yaml -f compose.prod.yaml exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\l'
```

### Reset bazy (UWAGA: usuwa dane)

```bash
docker compose -f compose.yaml -f compose.prod.yaml down -v
make prod-up
make prod-migrate
```
