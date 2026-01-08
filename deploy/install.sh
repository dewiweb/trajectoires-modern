#!/bin/bash
set -e

echo "🎯 Déploiement Trajectoires..."

# Create directory (use sudo if needed)
INSTALL_DIR="${TRAJECTOIRES_DIR:-/opt/trajectoires}"
if [ -w "$(dirname "$INSTALL_DIR")" ]; then
  mkdir -p "$INSTALL_DIR"
else
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown $USER:$USER "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# Download files from GitHub
echo "📥 Téléchargement des fichiers..."
curl -sL https://raw.githubusercontent.com/dewiweb/trajectoires-modern/main/deploy/Dockerfile -o Dockerfile
curl -sL https://raw.githubusercontent.com/dewiweb/trajectoires-modern/main/deploy/docker-compose.yml -o docker-compose.yml

# Build and start (support both docker-compose v1 and docker compose v2)
echo "🐳 Construction et démarrage du conteneur..."
if command -v docker-compose &> /dev/null; then
  docker-compose up -d --build
else
  docker compose up -d --build
fi

echo ""
echo "✅ Trajectoires déployé!"
echo "🌐 Accès: http://$(hostname -I | awk '{print $1}'):3000"
