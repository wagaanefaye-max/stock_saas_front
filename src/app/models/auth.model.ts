/**
 * Modèles pour l'authentification
 */

/**
 * Requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Requête d'inscription
 */
export interface RegisterRequest {
  name: string;
  email: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyRegion?: string;
  planCode?: string; // Code du plan d'abonnement sélectionné
}

/**
 * Réponse d'authentification (le token n'est plus dans le body, il est dans un cookie HttpOnly).
 */
export interface AuthResponse {
  token?: string;
  type?: string;
  email: string;
  name: string;
  role: string;
  companyId?: number;
  companyName?: string;
}
