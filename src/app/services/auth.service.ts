import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
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
  private sessionCheckIntervalId: ReturnType<typeof setInterval> | null = null;
  private redirectingToLogin = false;
  private readonly onWindowFocus = () => this.checkSession();
  private readonly SESSION_CHECK_MS = 5 * 60 * 1000;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {
    this.loadUserFromStorage();
    if (this.isAuthenticated()) {
      this.startSessionWatch();
    }
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
        this.startSessionWatch();
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
          this.startSessionWatch();
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
   * Demande de confirmation avant déconnexion.
   */
  confirmLogout(beforeLogout?: () => void): void {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment vous déconnecter ?',
      header: 'Déconnexion',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Oui, me déconnecter',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        beforeLogout?.();
        this.logout();
      }
    });
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.stopSessionWatch();
    this.apiService.post<any>('/auth/logout', {}).subscribe({
      next: () => {
        this.clearStorage();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      },
      error: (error) => {
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

  private syncUserFromSession(user: User): void {
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
    this.stopSessionWatch();
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  /**
   * Redirige vers la page de connexion lorsque la session serveur n'est plus valide.
   */
  handleSessionExpired(
    message = 'Votre session a expiré. Veuillez vous reconnecter.'
  ): void {
    if (this.redirectingToLogin) {
      return;
    }

    const currentUrl = this.router.url || '';
    if (currentUrl.startsWith('/login') || currentUrl.startsWith('/register') || currentUrl.startsWith('/verify-account')) {
      return;
    }

    this.redirectingToLogin = true;
    this.clearLocalSession();

    void this.router
      .navigate(['/login'], { queryParams: { error: message } })
      .finally(() => {
        this.redirectingToLogin = false;
      });
  }

  /**
   * Vérifie auprès du serveur que le cookie de session est encore valide.
   */
  validateSession(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }

    return this.apiService.get<AuthResponse>('/auth/session').pipe(
      map((response) => {
        if (!response?.email) {
          return false;
        }
        const user: User = {
          id: undefined,
          email: response.email,
          name: response.name,
          role: response.role as UserRole,
          companyId: response.companyId,
          companyName: response.companyName
        };
        this.syncUserFromSession(user);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  startSessionWatch(): void {
    this.stopSessionWatch();
    if (!this.isAuthenticated()) {
      return;
    }

    this.checkSession();
    this.sessionCheckIntervalId = setInterval(() => this.checkSession(), this.SESSION_CHECK_MS);
    window.addEventListener('focus', this.onWindowFocus);
  }

  stopSessionWatch(): void {
    if (this.sessionCheckIntervalId !== null) {
      clearInterval(this.sessionCheckIntervalId);
      this.sessionCheckIntervalId = null;
    }
    window.removeEventListener('focus', this.onWindowFocus);
  }

  private checkSession(): void {
    if (!this.isAuthenticated() || this.redirectingToLogin) {
      return;
    }

    this.validateSession().subscribe((valid) => {
      if (!valid) {
        this.handleSessionExpired();
      }
    });
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
