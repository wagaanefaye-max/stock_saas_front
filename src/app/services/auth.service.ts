import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, UserRole } from '../models/user.model';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private readonly USER_KEY = 'currentUser';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Charge l'utilisateur depuis le localStorage (cookie gère la session côté serveur).
   */
  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem(this.USER_KEY);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Erreur lors du chargement de l\'utilisateur:', e);
        this.clearStorage();
      }
    }
  }

  /**
   * Connexion (le JWT est envoyé dans un cookie HttpOnly par le serveur).
   */
  login(email: string, password: string): Observable<User> {
    const loginRequest: LoginRequest = { email, password };

    return this.apiService.post<AuthResponse>('/auth/login', loginRequest).pipe(
      map((response: AuthResponse) => {
        const user: User = {
          id: undefined,
          email: response.email,
          name: response.name,
          role: response.role as UserRole,
          companyId: response.companyId,
          companyName: response.companyName
        };
        this.setCurrentUser(user);
        return user;
      }),
      catchError((error) => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inscription
   */
  register(registerRequest: RegisterRequest): Observable<any> {
    return this.apiService.post<any>('/auth/register', registerRequest).pipe(
      catchError((error) => {
        console.error('Erreur d\'inscription:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Demande de réinitialisation de mot de passe
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('/auth/forgot-password', { email }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Valide le compte et définit le mot de passe. Le serveur envoie le cookie d'authentification, on restaure l'utilisateur.
   */
  verifyAccount(token: string, password: string, passwordConfirmation: string): Observable<{ message: string }> {
    return this.apiService.post<AuthResponse>('/auth/verify-account', {
      token,
      password,
      passwordConfirmation: passwordConfirmation || password
    }).pipe(
      map((response: AuthResponse) => {
        if (response?.email) {
          const user: User = {
            id: undefined,
            email: response.email,
            name: response.name,
            role: response.role as UserRole,
            companyId: response.companyId,
            companyName: response.companyName
          };
          this.setCurrentUser(user);
        }
        return { message: 'Mot de passe défini. Vous êtes connecté.' };
      }),
      catchError((error) => {
        console.error('Erreur de validation de compte:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    // Appeler l'endpoint de déconnexion du backend
    this.apiService.post<any>('/auth/logout', {}).subscribe({
      next: () => {
        // Nettoyer le localStorage et rediriger
        this.clearStorage();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        // Même en cas d'erreur, nettoyer le localStorage et rediriger
        console.error('Erreur lors de la déconnexion:', error);
        this.clearStorage();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Sauvegarde l'utilisateur actuel
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Nettoie le localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Efface la session locale sans appeler l'API (cookie absent ou expiré).
   */
  clearLocalSession(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifie si l'utilisateur est connecté (cookie envoyé automatiquement par le navigateur).
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Vérifie si l'utilisateur est super admin
   */
  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Vérifie si l'utilisateur est admin entreprise
   */
  isAdminEntreprise(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.ADMIN_ENTREPRISE;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Vérifie si l'utilisateur est gestionnaire
   */
  isGestionnaire(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.GESTIONNAIRE;
  }

  /**
   * Vérifie si l'utilisateur a accès à un entrepôt spécifique
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

    // Gestionnaire : accès uniquement aux entrepôts assignés
    if (user.role === UserRole.GESTIONNAIRE) {
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
      return null;
    }

    // Super Admin et Admin Entreprise : null = tous les entrepôts
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN_ENTREPRISE) {
      return null;
    }

    // Gestionnaire : retourner les entrepôts assignés
    return user.assignedWarehouses || [];
  }
}
