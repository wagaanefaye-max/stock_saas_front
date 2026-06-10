import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
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
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;

  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    // Vérifier si on vient de l'inscription
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.queryParams?.['registered'] === 'true') {
      this.messageService.add({
        severity: 'success',
        summary: 'Inscription réussie',
        detail: 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
        life: 5000
      });
    }

    // Vérifier s'il y a un message d'erreur ou une activation réussie
    this.route.queryParams.subscribe(params => {
      if (params['activated'] === 'true') {
        this.messageService.add({
          severity: 'success',
          summary: 'Compte activé',
          detail: 'Votre mot de passe a été défini. Connectez-vous avec votre email et votre mot de passe.',
          life: 6000
        });
      }
      if (params['error']) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Session expirée',
          detail: params['error'],
          life: 5000
        });
        this.errorMessage = params['error'];
      }
    });

    // Si l'utilisateur est déjà connecté, rediriger vers le dashboard approprié
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

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectToDashboard();
        }
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        
        const errorDetail = getErrorMessage(error, 'Une erreur est survenue lors de la connexion');
        
        this.errorMessage = errorDetail;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de connexion',
          detail: errorDetail,
          life: 5000
        });
      }
    });
  }
}

