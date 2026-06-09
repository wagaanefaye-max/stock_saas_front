/**
 * Modèle utilisateur
 */

/**
 * Rôles utilisateurs disponibles dans l'application
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_ENTREPRISE = 'ADMIN_ENTREPRISE',
  GESTIONNAIRE = 'GESTIONNAIRE'
}

/**
 * Interface représentant un utilisateur
 */
export interface User {
  id?: number;
  email: string;
  name: string;
  role: UserRole;
  companyId?: number;
  companyName?: string;
  assignedWarehouses?: number[]; // IDs des entrepôts assignés (pour les gestionnaires)
}
