# SPEC-003: Release Pipeline i wdrożenie produkcyjne na VPS

## Overview

Wprowadzenie release pipeline dla aplikacji SOS wdrażanej na Mikrus VPS
(`tymon343.mikrus.xyz`), domena produkcyjna `sos.marcin00.pl`.

Specyfikacja obejmuje:
1. Czyste rozdzielenie odpowiedzialności między CI a Release — dwa osobne workflow-e GHA.
2. Nowy `release.yml` — buduje obraz Docker, pushuje do Docker Hub, wdraża na VPS przez SSH.
3. Naprawę `ci.yml` — usunięcie job `build-and-push` (przeniesiony do `release.yml`).
4. Usunięcie martwego `deploy.yml`.
5. Drobne poprawki artefaktu: logging rotation w `compose.prod.yaml`, pinowanie obrazu po SHA,
   `binaryTargets` w `prisma/schema.prisma`.
6. Przepisanie `DEPLOYMENT.md` aby opisywał realny flow.

**Problem:**
- `ci.yml` łączy walidację z budowaniem obrazu (job `build-and-push`). Skutek: na każdym PR
  i każdym pushu do `master` budowany jest obraz — to zadanie release pipeline, nie CI.
- `deploy.yml` triggeruje na branch `main` (nie istnieje) i pushuje do `ghcr.io`
  (inne registry niż Docker Hub używane przez `ci.yml`) — **martwy workflow**, nigdy nie odpala.
- Brak jakiegokolwiek mechanizmu wdrożenia na VPS. Obraz trafia do Docker Hub, ale nikt go tam
  nie pobiera.
- `compose.prod.yaml:3` ma `image: pikram/sos-app:latest` — brak pinowania po SHA,
  świadomy rollback jest niemożliwy.
- Brak rotacji logów Dockera — `json-file` rośnie bez ograniczeń, zapychając 25 GB dysk.
- `prisma/schema.prisma` nie ma `binaryTargets` dla Alpine/musl — potencjalny błąd startu
  kontenera lub wolny cold-start na Node 22 Alpine.

**Poza zakresem (explicit non-goals):**
- Provisioning VPS (Docker już zainstalowany).
- Backup, restore, disaster recovery.
- Observability (metryki, alerty, UptimeRobot).
- Tuning PostgreSQL.
- Skalowanie, orchestracja.

---

## User Stories

### Story 1 — Merge PR do `master` → automatyczne wdrożenie na produkcję

**Persona:** Marcin, solo developer SOS. Zmergował PR z poprawką. Chce żeby fix był na
produkcji automatycznie — bez ręcznego SSH — z pełnym audytem kiedy i co poszło live.

**Krok 1 — Merge PR w GitHub UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ CI / Lint & Type Check          passed                       │
│  ✅ CI / Unit & Integration Tests   passed                       │
│  ✅ Security Gate                   passed                       │
│  [Merge pull request]                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Krok 2 — Po merge CI odpala się na `master`:**

```
GitHub Actions:
┌───────────────────────────────────────────────────────┐
│  CI (push to master)                                   │
│  ✅ Lint & Type Check    (1m 12s)                      │
│  ✅ Unit & Integration   (3m 04s)                      │
└───────────────────────────────────────────────────────┘
```

**Za kulisami:** `ci.yml` odpala się na push do `master`. Robi tylko walidację.
**Nie** buduje obrazu. Po sukcesie triggeruje `release.yml` przez `workflow_run`.

**Krok 3 — Release pipeline:**

```
GitHub Actions:
┌───────────────────────────────────────────────────────┐
│  Release (triggered by CI success on master)           │
│  ⏳ Build & Push Docker image     (running)            │
└───────────────────────────────────────────────────────┘
```

**Za kulisami:** `release.yml`:
1. Extrahuje short SHA: `sha-abc1234`.
2. Buduje obraz `pikram/sos-app:sha-abc1234` i `pikram/sos-app:latest`, pushuje do Docker Hub.
3. SSH na `deploy@tymon343.mikrus.xyz`, wykonuje:
   ```bash
   cd /opt/sos
   sed -i "s/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=sha-abc1234/" .env.production
   docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml pull app
   docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml up -d --no-deps app
   echo "$(date -u +%FT%TZ) sha-abc1234 fix(api): tighten enrollment validation" >> .deploy-log
   ```
4. Smoke test: `docker compose --env-file .env.production exec -T app wget --no-verbose --tries=1 --spider http://localhost:3000/api/health` co 2s przez max 60s. Wykonywane wewnątrz kontenera — port nie jest zbindowany na hosta.

**Krok 4 — Weryfikacja:**

```
Marcin:
$ curl -fs https://sos.marcin00.pl/api/health | jq .status
"ok"

GitHub Actions:
✅ Release / Build & Push    (2m 41s)
✅ Release / Deploy to VPS   (1m 08s)
```

**Zmiana vs. stan obecny:**
- Przed: merge → obraz w Docker Hub → nic więcej.
- Po: merge → CI (walidacja) → Release (build + deploy na VPS automatycznie).

---

### Story 2 — Rollback po wykryciu regresji

**Persona:** Marcin. Aplikacja zwraca 500 po ostatnim deployu. Chce cofnąć do poprzedniej
wersji w kilka minut bez oczekiwania na CI/CD.

**Krok 1 — Sprawdzenie historii deployów (na VPS):**

```bash
$ ssh deploy@tymon343.mikrus.xyz "tail -5 /opt/sos/.deploy-log"
2026-05-26T14:32:00Z sha-abc1234 fix(api): tighten enrollment  ← CURRENT, BROKEN
2026-05-26T11:05:00Z sha-9f8e7d6 feat(ui): student grade filters ← LAST KNOWN GOOD
```

**Krok 2 — Rollback:**

```bash
$ ssh deploy@tymon343.mikrus.xyz "
  cd /opt/sos &&
  sed -i 's/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=sha-9f8e7d6/' .env.production &&
  docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml pull app &&
  docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml up -d --no-deps app
"
```

**Za kulisami:** `--no-deps` recreates **tylko** kontener `app`. Baza danych i cloudflared
zostają nienaruszone. Wolumen `postgres_data` nie jest dotykany.

**Krok 3 — Weryfikacja:**

```bash
$ curl -fs https://sos.marcin00.pl/api/health | jq .status
"ok"
```

**Zmiana vs. stan obecny:** Rollback wymagałby revert commitu + 5-8 min CI/CD.
Po zmianie: 1 komenda SSH, ~30-60s.

**Warunek konieczny:** Docker Hub przechowuje obrazy z poprzednich buildów (nigdy nie
kasujemy starych tagów `sha-*`). Rollback działa tylko dla tagów z Docker Hub — usunięcie
tagu usuwa tę możliwość.

---

## Architecture

### Podział odpowiedzialności workflow-ów

```
┌─────────────────────────────────────────────────────────────────┐
│  PULL REQUEST na master                                          │
│                                                                  │
│  security.yml ─── 7 scans (container-scan: build lokalny)       │
│  ci.yml       ─── lint + typecheck + testy                       │
│                                                                  │
│  Brak: budowania obrazu, deployu.                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MERGE do master (push)                                          │
│                                                                  │
│  ci.yml ─── lint + typecheck + testy                             │
│                  │                                               │
│                  └──success──► release.yml ─── build + push      │
│                                                  │               │
│                                                  └─── SSH deploy │
│                                                       + smoke    │
└─────────────────────────────────────────────────────────────────┘
```

**`security.yml`** — bez zmian. Buduje obraz lokalnie (bez push) tylko dla Trivy container-scan.
Niezależny od release build.

### Przepływ release pipeline

```
push do master
      │
      ▼
   ci.yml
   [lint] [test]
      │
   success
      │
      ▼ (workflow_run trigger)
   release.yml
   [build image: sha-abc1234 + latest → Docker Hub]
      │
      ▼
   [SSH → tymon343.mikrus.xyz]
   [docker compose --env-file .env.production pull app]
   [docker compose --env-file .env.production up -d --no-deps app]
   [curl /api/health x30 co 2s]
      │
   smoke OK
      │
      ▼
   DONE
```

### Topologia na VPS (bez zmian, tylko korekty)

```
cloudflared ─── sos.marcin00.pl → users (Cloudflare Edge)
     │
   app (pikram/sos-app:${APP_IMAGE_TAG:-latest})
     │
    db (postgres:16-alpine)
```

Sieci: `public` (app + cloudflared), `private` internal (app + db).
Brak wystawionych portów na hosta w `compose.prod.yaml`.

---

## Plik po pliku — zmiany do wprowadzenia

### Usunąć

| Plik | Powód |
|---|---|
| `.github/workflows/deploy.yml` | Martwy workflow — branch `main` nie istnieje, registry `ghcr.io` nieużywane. Zastąpiony przez `release.yml`. |

### Nowy plik: `.github/workflows/release.yml`

```yaml
name: Release

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [master]

permissions:
  contents: read

jobs:
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    outputs:
      image_tag: ${{ steps.vars.outputs.image_tag }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha }}

      - name: Set image tag
        id: vars
        run: echo "image_tag=sha-$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: pikram/sos-app
          tags: |
            type=raw,value=${{ steps.vars.outputs.image_tag }}
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          target: runner
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: build-and-push
    concurrency:
      group: deploy-prod
      cancel-in-progress: false
    steps:
      - name: Configure SSH
        env:
          DEPLOY_SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H tymon343.mikrus.xyz >> ~/.ssh/known_hosts

      - name: Deploy
        env:
          IMAGE_TAG: ${{ needs.build-and-push.outputs.image_tag }}
          COMMIT_MSG: ${{ github.event.workflow_run.head_commit.message }}
        run: |
          # Quoted heredoc (<< 'ENDSSH') — brak lokalnej ekspansji zmiennych.
          # IMAGE_TAG i COMMIT_MSG przekazywane jako argumenty pozycyjne ($1, $2)
          # aby metaznaki w commit message nie mogły złamać skryptu ani spowodować
          # arbitrary command execution na zdalnym serwerze.
          ssh -i ~/.ssh/id_ed25519 deploy@tymon343.mikrus.xyz \
            bash -s -- "${IMAGE_TAG}" "${COMMIT_MSG%%$'\n'*}" << 'ENDSSH'
            set -euo pipefail
            IMAGE_TAG="$1"
            COMMIT_MSG="$2"
            cd /opt/sos
            sed -i "s/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=${IMAGE_TAG}/" .env.production
            docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml pull app
            docker compose --env-file .env.production -f compose.yaml -f compose.prod.yaml up -d --no-deps app
            printf '%s %s %s\n' \
              "$(date -u +%FT%TZ)" \
              "${IMAGE_TAG}" \
              "${COMMIT_MSG}" \
              >> .deploy-log
          ENDSSH

      - name: Smoke test
        run: |
          ssh -i ~/.ssh/id_ed25519 deploy@tymon343.mikrus.xyz << 'ENDSSH'
            for i in $(seq 1 30); do
              docker compose --env-file /opt/sos/.env.production \
                -f /opt/sos/compose.yaml -f /opt/sos/compose.prod.yaml \
                exec -T app wget --no-verbose --tries=1 --spider \
                http://localhost:3000/api/health && exit 0
              sleep 2
            done
            echo "Health check timed out after 60s"; exit 1
          ENDSSH
```

**Uwaga o `ssh-keyscan`:** Pobiera klucz hosta dynamicznie podczas deployu — prostsze, ale
podatne na MITM przy pierwszym połączeniu. Alternatywa: dodać `DEPLOY_KNOWN_HOST` jako
GH Secret (zawartość `~/.ssh/known_hosts` dla `tymon343.mikrus.xyz`) i echo-ować zamiast
`ssh-keyscan`. Wybór należy do implementatora.

### Zmieniony plik: `.github/workflows/ci.yml`

Usunąć job `build-and-push` (cały blok od linii 91 do końca pliku). CI ma robić
wyłącznie walidację: `lint` + `test`. Trigger bez zmian (`push: [master]` +
`pull_request: [master]`).

```diff
-  build-and-push:
-    name: Build & Push Docker Image
-    runs-on: ubuntu-latest
-    needs: [lint, test]
-    steps:
-      ...  (cały job do usunięcia)
```

### Zmieniony plik: `compose.prod.yaml`

Dwie grupy zmian: pinowanie obrazu po `APP_IMAGE_TAG` + rotacja logów dla wszystkich serwisów.

```diff
 services:
   app:
-    image: pikram/sos-app:latest
+    image: pikram/sos-app:${APP_IMAGE_TAG:-latest}
     environment:
       NODE_ENV: production
     restart: always
+    logging:
+      driver: json-file
+      options:
+        max-size: "10m"
+        max-file: "3"
     deploy:
       resources:
         limits:
           cpus: '1.0'
           memory: 512M
     # healthcheck — bez zmian
     networks:
       - public
       - private

   db:
     restart: always
+    logging:
+      driver: json-file
+      options:
+        max-size: "10m"
+        max-file: "3"
     deploy:
       resources:
         limits:
           cpus: '0.5'
           memory: 256M
     networks:
       - private

   cloudflared:
     image: cloudflare/cloudflared:2026.5.0
     # command, depends_on, restart — bez zmian
+    logging:
+      driver: json-file
+      options:
+        max-size: "5m"
+        max-file: "2"
     networks:
       - public

 networks:
   public:
     driver: bridge
   private:
     driver: bridge
     internal: true
```

### Zmieniony plik: `prisma/schema.prisma`

```diff
 generator client {
   provider = "prisma-client-js"
+  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
 }
```

**Dlaczego:** Node 22 Alpine używa musl libc + OpenSSL 3. Bez tego targetu Prisma przy starcie
kontenera próbuje pobrać binarkę z internetu lub zwraca błąd `PrismaClientInitializationError`.

### Zmieniony plik: `DEPLOYMENT.md`

Przepisać całkowicie. Usunąć sekcje dotyczące Caddy, Let's Encrypt, `git clone` na serwerze
i budowania obrazu na VPS — żadna z tych rzeczy nie jest częścią aktualnego flow.

Nowa struktura:
1. **Architektura** — Cloudflare Tunnel, Docker Hub, release pipeline.
2. **Pierwsze wdrożenie** — wymagania wstępne (Docker zainstalowany, `/opt/sos/` z plikami,
   `.env.production`), jak pobrać i uruchomić obraz.
3. **Codzienna praca** — co się dzieje po merge do `master` (CI → Release automatycznie).
4. **Rollback** — ręczna komenda SSH z tagiem SHA z `.deploy-log`.
5. **Logi i status** — `docker compose --env-file .env.production logs`, `docker compose --env-file .env.production ps`.
6. **Troubleshooting** — app nie startuje (złe `DATABASE_URL`, brak `JWT_SECRET`, brak migracji).

---

## Configuration

### GitHub Secrets (Actions → Settings → Secrets)

| Secret | Cel | Jak uzyskać |
|---|---|---|
| `DOCKERHUB_USERNAME` | login do Docker Hub | istniejący |
| `DOCKERHUB_TOKEN` | push obrazu | istniejący |
| `DEPLOY_SSH_KEY` | klucz prywatny ed25519 dla usera `deploy` na VPS | `ssh-keygen -t ed25519 -f deploy_key`; prywatny → secret, publiczny → `/home/deploy/.ssh/authorized_keys` |

### Zmienne środowiskowe na VPS (`/opt/sos/.env.production`, chmod 600)

Muszą istnieć przed pierwszym `docker compose --env-file .env.production up`. Nie są tworzone przez ten pipeline —
wymagane jest ręczne przygotowanie:

| Zmienna | Przykład |
|---|---|
| `DATABASE_URL` | `postgresql://sos_prod:<pw>@db:5432/sos_prod` |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `POSTGRES_USER` | `sos_prod` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `POSTGRES_DB` | `sos_prod` |
| `CLOUDFLARED_TOKEN` | token z Cloudflare Dashboard |
| `APP_IMAGE_TAG` | ustawiane per-deploy przez `release.yml`; domyślnie `latest` |

---

## Acceptance Criteria

| AC-ID | Kryterium | Weryfikacja |
|---|---|---|
| **AC-003-1** | Na PR: tylko `ci.yml` (lint + test) i `security.yml` odpala się. `release.yml` nie. | Sprawdź zakładkę Actions po otwarciu PR — brak jobu Release. |
| **AC-003-2** | Po merge do `master`: `ci.yml` odpala się, po jego sukcesie `release.yml` startuje automatycznie. | Actions → Release run — trigger: `workflow_run`. |
| **AC-003-3** | `release.yml` NIE odpala się gdy `ci.yml` fail na `master`. | Zepsuj lint celowo, zmerguj — Release nie startuje. |
| **AC-003-4** | Obraz w Docker Hub ma tag `sha-<short>` po udanym release. | `docker pull pikram/sos-app:sha-<short>` — sukces. |
| **AC-003-5** | `https://sos.marcin00.pl/api/health` zwraca `200 {"status":"ok","db":"connected"}` po deployu. | `curl -fs https://sos.marcin00.pl/api/health \| jq .status` = `"ok"`. |
| **AC-003-6** | Rollback do dowolnego SHA z `.deploy-log` działa i jest trwały po restarcie VPS. | SSH na VPS: `sed -i` nadpisuje `APP_IMAGE_TAG` w `.env.production`, następnie `pull app` + `up -d --no-deps app` → `/api/health` 200. Po `docker compose down && up` kontener wstaje na rolowanym tagu. |
| **AC-003-7** | `deploy.yml` nie istnieje. | `ls .github/workflows/` — brak `deploy.yml`. |
| **AC-003-8** | `ci.yml` nie zawiera job `build-and-push`. | `grep "build-and-push" .github/workflows/ci.yml` — pusty wynik. |
| **AC-003-9** | `compose.prod.yaml` używa `${APP_IMAGE_TAG:-latest}` dla obrazu app. | `grep "APP_IMAGE_TAG" compose.prod.yaml` — wynik. |
| **AC-003-10** | Logi Dockera nie rosną bez ograniczeń (rotacja skonfigurowana). | `grep "max-size" compose.prod.yaml` — wynik dla każdego serwisu. |
| **AC-003-11** | `prisma/schema.prisma` zawiera `binaryTargets` z `linux-musl-openssl-3.0.x`. | `grep "binaryTargets" prisma/schema.prisma` — wynik. |
| **AC-003-12** | `DEPLOYMENT.md` nie zawiera wzmianki o Caddy ani Let's Encrypt. | `grep -i "caddy\|let's encrypt" DEPLOYMENT.md` — pusty wynik. |

---

## Implementation Checklist

> Wypełniane podczas fazy Tasks.

- [ ] (placeholder — zostanie wygenerowane podczas fazy Tasks)

---

## Changelog

### 2026-05-26
- Initial specification — release pipeline dla VPS `tymon343.mikrus.xyz`, domena `sos.marcin00.pl`
- Zakres okrojony: tylko CI/Release split + poprawki artefaktu; bez bootstrap, backup, DR
- Architektura: `security.yml` bez zmian; `ci.yml` traci `build-and-push`; nowy `release.yml`
  triggeruje przez `workflow_run` po CI success na `master`
- Hardening deploy script: quoted heredoc `<< 'ENDSSH'`, pozycjonalne args, `sed` dla SHA
- Dodano `--env-file .env.production` do wszystkich `docker compose` komend
- AC-003-6 zaktualizowano: rollback używa `sed` do trwałego nadpisania `APP_IMAGE_TAG` w `.env.production`
- fix(ci): `release.yml` zabezpieczony przed pwn-request (`workflow_run.event == 'push'`)
- fix(ci): `.github/codeql/codeql-config.yml` wyklucza `**/*.md` i `.ai/**` z analizy CodeQL (false positive: `wget http://localhost` w docker exec)
