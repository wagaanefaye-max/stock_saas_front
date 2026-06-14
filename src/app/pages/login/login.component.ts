import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../services/auth.service';
import { PlatformStatusService } from '../../services/platform-status.service';
import { getErrorMessage } from '../../utils/error-message.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    CheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;

  errorMessage = '';
  successMessage = '';
  maintenanceMode = false;
  submitting = false;
  fieldErrors: { email?: string; password?: string } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private platformStatusService: PlatformStatusService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.queryParams?.['registered'] === 'true') {
      this.successMessage = 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.';
    }

    this.route.queryParams.subscribe(params => {
      if (params['activated'] === 'true') {
        this.successMessage = 'Votre mot de passe a été défini. Connectez-vous avec votre email et votre mot de passe.';
      }
      if (params['error']) {
        this.errorMessage = params['error'];
      }
    });

    this.platformStatusService.loadStatus().subscribe((status) => {
      this.maintenanceMode = status.maintenanceMode;
    });

    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  private redirectToDashboard() {
    if (this.authService.isSuperAdmin()) {
      this.router.navigate(['/super-admin/dashboard']);
    } else if (this.authService.isAdminEntreprise()) {
      this.router.navigate(['/company-admin/dashboard']);
    } else if (this.authService.isGestionnaire()) {
      this.router.navigate(['/gestionnaire/dashboard']);
    } else {
      this.router.navigate(['/gestion/dashboard']);
    }
  }

  onEmailInput(): void {
    this.clearFieldError('email');
    this.errorMessage = '';
  }

  onPasswordInput(): void {
    this.clearFieldError('password');
    this.errorMessage = '';
  }

  validateEmail(): string | undefined {
    const value = this.email.trim();
    if (!value) {
      return 'L\'email est obligatoire.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Format d\'email invalide.';
    }
    return undefined;
  }

  validatePassword(): string | undefined {
    if (!this.password) {
      return 'Le mot de passe est obligatoire.';
    }
    return undefined;
  }

  private validateForm(): boolean {
    const emailError = this.validateEmail();
    const passwordError = this.validatePassword();
    this.fieldErrors = {
      email: emailError,
      password: passwordError
    };
    return !emailError && !passwordError;
  }

  private clearFieldError(field: 'email' | 'password'): void {
    if (this.fieldErrors[field]) {
      const next = { ...this.fieldErrors };
      delete next[field];
      this.fieldErrors = next;
    }
  }

  login() {
    if (!this.validateForm()) {
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.submitting = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectToDashboard();
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Erreur de connexion:', error);
        this.errorMessage = getErrorMessage(error, 'Une erreur est survenue lors de la connexion');
      }
    });
  }
}
