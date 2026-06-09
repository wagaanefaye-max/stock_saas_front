/**
 * Fichier d'exemple pour les variables d'environnement
 * Copiez ce fichier vers environment.ts et environment.prod.ts
 * et modifiez les valeurs selon vos besoins
 */

export const environment = {
  production: false, // true pour la production
  apiUrl: 'http://localhost:8080/api', // URL de l'API backend
  appName: 'Stock SaaS',
  appVersion: '1.0.0',
  enableLogging: true // false pour désactiver les logs en production
};
