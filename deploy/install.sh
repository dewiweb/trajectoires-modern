#!/bin/bash
set -e

echo "🎯 Déploiement Trajectoires..."

# Create directory
mkdir -p /opt/trajectoires
cd /opt/trajectoires

# Download files from GitHub
echo "📥 Téléchargement des fichiers..."
curl -sL https://raw.githubusercontent.com/dewiweb/trajectoires-modern/main/deploy/Dockerfile -o Dockerfile
curl -sL https://raw.githubusercontent.com/dewiweb/trajectoires-modern/main/deploy/docker-compose.yml -o docker-compose.yml

# Build and start
echo "🐳 Construction et démarrage du conteneur..."
docker-compose up -d --build

echo ""
echo "✅ Trajectoires déployé!"
echo "🌐 Accès: http://$(hostname -I | awk '{print $1}'):3000"
