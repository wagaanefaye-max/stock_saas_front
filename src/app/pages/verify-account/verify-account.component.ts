import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error-message.util';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    CardModule,
    ProgressBarModule
  ],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.scss'
})
export class VerifyAccountComponent implements OnInit {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly SPECIAL_REGEX = /[@$!%*?&.#^()[\]\-_=+]/;

  token = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'Token de validation manquant';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Token de validation manquant dans l\'URL',
          life: 5000
        });
      }
    });
  }

  get isPasswordStrong(): boolean {
    const p = this.password || '';
    return p.length >= VerifyAccountComponent.MIN_LENGTH &&
           p.length <= VerifyAccountComponent.MAX_LENGTH &&
           /[A-Z]/.test(p) &&
           /[a-z]/.test(p) &&
           /\d/.test(p) &&
           VerifyAccountComponent.SPECIAL_REGEX.test(p);
  }

  /** Score de robustesse du mot de passe (0 à 100) */
  get passwordStrength(): number {
    const p = this.password || '';
    if (!p) return 0;
    let score = 0;
    if (p.length >= VerifyAccountComponent.MIN_LENGTH) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (VerifyAccountComponent.SPECIAL_REGEX.test(p)) score++;
    return (score / 5) * 100;
  }

  get passwordStrengthClass(): string {
    const value = this.passwordStrength;
    if (!this.password) return 'strength-empty';
    if (value < 40) return 'strength-weak';
    if (value < 80) return 'strength-medium';
    return 'strength-strong';
  }

  get passwordStrengthLabel(): string {
    const value = this.passwordStrength;
    if (!this.password) return '';
    if (value < 40) return 'Mot de passe faible';
    if (value < 80) return 'Mot de passe moyen';
    return 'Mot de passe fort';
  }

  get canSubmit(): boolean {
    return !!this.password && !!this.confirmPassword && this.password === this.confirmPassword && this.isPasswordStrong;
  }

  verifyAccount() {
    if (!this.token) {
      this.errorMessage = 'Token de validation manquant';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Veuillez saisir un mot de passe';
      return;
    }

    if (!this.isPasswordStrong) {
      this.errorMessage = 'Le mot de passe ne respecte pas tous les critères de sécurité ci-dessous';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.errorMessage = '';

    this.authService.verifyAccount(this.token, this.password, this.confirmPassword).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Compte activé',
          detail: 'Votre mot de passe a été défini. Vous allez être redirigé vers la page de connexion.',
          life: 5000
        });

        // Rediriger vers la page de connexion pour se connecter
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { activated: 'true' } });
        }, 1500);
      },
      error: (error) => {
        console.error('Erreur de validation:', error);

        const errorDetail = getErrorMessage(
          error,
          'Une erreur est survenue lors de la validation du compte'
        );

        this.errorMessage = errorDetail;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de validation',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }
}
