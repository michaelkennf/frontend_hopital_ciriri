#!/bin/bash

# Script de démarrage en production pour le frontend
# Ce script build le projet puis démarre le serveur de preview

set -e

echo "🔨 Building frontend..."
npm run build

echo "✅ Build terminé, démarrage du serveur de preview..."
npm run preview
