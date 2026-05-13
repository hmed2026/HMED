#!/bin/sh
set -e

echo "🚀 Iniciando H MED DISTRIBUIDORA Backend..."

# Aguardar banco de dados
echo "⏳ Aguardando PostgreSQL..."
until npx prisma migrate deploy 2>/dev/null; do
  echo "  DB ainda não disponível, aguardando..."
  sleep 3
done

echo "✅ Migrations aplicadas"

# Executar seed apenas se banco está vazio
npx ts-node prisma/seed.ts 2>/dev/null || echo "⚠️  Seed já executado ou erro"

echo "✅ Sistema pronto!"
echo "🌐 Iniciando servidor na porta 3001..."

node dist/server.js
