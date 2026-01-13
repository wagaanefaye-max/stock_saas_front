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
    return user?.role === UserRole.ADMIN_ENTREPRISE;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

