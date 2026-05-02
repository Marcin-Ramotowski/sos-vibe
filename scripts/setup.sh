#!/bin/bash

set -e

echo "🚀 Konfiguracja projektu SOS..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany. Zainstaluj Docker i spróbuj ponownie."
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany."
    exit 1
fi

# Copy .env file
if [ ! -f .env ]; then
    echo "📝 Tworzenie pliku .env..."
    cp .env.example .env
    echo "⚠️  Uzupełnij .env swoją konfiguracją przed uruchomieniem produkcji."
fi

# Start services
echo "🐳 Uruchamianie kontenerów Docker..."
docker compose up -d

# Wait for database
echo "⏳ Oczekiwanie na bazę danych..."
timeout 30 bash -c 'until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done'

# Run migrations
echo "📊 Uruchamianie migracji..."
docker compose exec app npx prisma migrate deploy

# Seed database
echo "🌱 Seedowanie bazy danych..."
docker compose exec app npx prisma db seed

echo ""
echo "✅ Gotowe! Aplikacja dostępna pod http://localhost:3000"
echo ""
echo "Konta testowe:"
echo "  Admin:      admin@uni.pl / admin123"
echo "  Wykładowca: lecturer@uni.pl / lecturer123"
echo "  Student:    student@uni.pl / student123"
echo ""
echo "Przydatne komendy:"
echo "  make dev       - Uruchom środowisko deweloperskie"
echo "  make test      - Uruchom testy"
echo "  make help      - Wszystkie komendy"
