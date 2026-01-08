# Déploiement Docker Trajectoires

## One-liner (sur le serveur Docker)

```bash
curl -sL https://raw.githubusercontent.com/dewiweb/trajectoires-modern/main/deploy/install.sh | bash
```

## Installation manuelle

1. **Copier ce dossier** sur votre serveur Docker

2. **Lancer le conteneur :**
```bash
docker-compose up -d --build
```

3. **Accéder à l'application :**
   - `http://<IP-SERVEUR>:3000`

## Configuration OSC (optionnel)

Créer un fichier `.env` dans ce dossier :
```bash
OSC_OUTPUT_IP=192.168.1.100
OSC_OUTPUT_PORT=4003
```

Ces valeurs sont les defaults au démarrage. L'IP et le port peuvent être modifiés via l'interface utilisateur.

## Mise à jour

Pour mettre à jour vers la dernière version :
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Changer de branche/tag

Modifier `GITHUB_REF` dans `docker-compose.yml` :
```yaml
args:
  GITHUB_REF: v2.1.0  # ou main, develop, etc.
```
