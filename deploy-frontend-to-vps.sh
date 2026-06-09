#!/usr/bin/env bash
set -e

########################################
# Variables à adapter une seule fois
########################################
VPS_USER="ubuntu"               # utilisateur SSH sur le VPS
VPS_HOST="51.91.58.3"           # IP / hostname du VPS
REMOTE_DIR="/var/www/stock-saas-frontend"
BUILD_DIR="dist/stock-saas"

########################################
# 1. Build Angular en local (prod)
########################################
echo ">> Build du frontend Angular (production)..."
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm n'est pas installé sur cette machine. Installe Node.js / npm puis relance ce script."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo ">> Installation des dépendances npm..."
  npm install
fi

npm run build

if [ ! -d "${BUILD_DIR}" ]; then
  echo "❌ Le dossier de build ${BUILD_DIR} n'existe pas. Vérifie angular.json et la commande de build."
  exit 1
fi

########################################
# 2. Copie des fichiers vers le VPS
########################################
echo ">> Copie du build vers le VPS..."
ssh ${VPS_USER}@${VPS_HOST} "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R ${VPS_USER}:${VPS_USER} ${REMOTE_DIR}"

# On synchronise le contenu du build avec le dossier du VPS
rsync -avz --delete "${BUILD_DIR}/" ${VPS_USER}@${VPS_HOST}:"${REMOTE_DIR}/"

echo "✅ Déploiement frontend terminé."

