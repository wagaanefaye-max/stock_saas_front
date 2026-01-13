import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_ENTREPRISE = 'ADMIN_ENTREPRISE',
  GESTIONNAIRE = 'GESTIONNAIRE',
  UTILISATEUR = 'UTILISATEUR'
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  entrepriseId?: number;
  entrepriseName?: string;
  assignedWarehouses?: number[]; // IDs des entrepôts assignés (pour les gestionnaires)
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    // Récupérer l'utilisateur depuis le localStorage au démarrage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<User> {
    // TODO: Implémenter l'appel API réel
    // Pour l'instant, simulation basée sur l'email
    return new Observable(observer => {
      setTimeout(() => {
        let user: User;
        
        if (email.includes('superadmin') || email.includes('admin@platform')) {
          user = {
            id: 1,
            email: email,
            name: 'Super Administrateur',
            role: UserRole.SUPER_ADMIN
          };
        } else if (email.includes('admin@')) {
          user = {
            id: 2,
            email: email,
            name: 'Admin Entreprise',
            role: UserRole.ADMIN_ENTREPRISE,
            entrepriseId: 1,
            entrepriseName: 'Entreprise Test'
          };
        } else {
          user = {
            id: 3,
            email: email,
            name: 'Utilisateur',
            role: UserRole.UTILISATEUR,
            entrepriseId: 1,
            entrepriseName: 'Entreprise Test'
          };
        }

        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        observer.next(user);
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.SUPER_ADMIN;
  }

  isAdminEntreprise(): boolean {
    const user = this.getCurrentUser();
    // return user?.role === UserRole.ADMIN_ENTREPRISE;
    return true;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isGestionnaire(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.GESTIONNAIRE;
  }

  /**
   * Vérifie si l'utilisateur a accès à un entrepôt spécifique
   * - Super Admin : accès à tous
   * - Admin Entreprise : accès à tous les entrepôts de son entreprise
   * - Gestionnaire : accès uniquement aux entrepôts assignés
   * - Utilisateur : accès uniquement aux entrepôts assignés
   */
  hasWarehouseAccess(warehouseId: number): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super Admin a accès à tout
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin Entreprise a accès à tous les entrepôts de son entreprise
    if (user.role === UserRole.ADMIN_ENTREPRISE) {
      return true; // TODO: Vérifier que l'entrepôt appartient à l'entreprise
    }

    // Gestionnaire et Utilisateur : accès uniquement aux entrepôts assignés
    if (user.role === UserRole.GESTIONNAIRE || user.role === UserRole.UTILISATEUR) {
      return user.assignedWarehouses?.includes(warehouseId) ?? false;
    }

    return false;
  }

  /**
   * Retourne la liste des IDs d'entrepôts accessibles par l'utilisateur
   */
  getAccessibleWarehouseIds(): number[] | null {
    const user = this.getCurrentUser();
    if (!user) {
      // Si pas d'utilisateur, retourner null pour afficher tous (pour les tests)
      return null;
    }

    // Super Admin et Admin Entreprise : null = tous les entrepôts
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN_ENTREPRISE) {
      return null;
    }

    // Gestionnaire et Utilisateur : retourner les entrepôts assignés
    return user.assignedWarehouses || [];
  }
}

