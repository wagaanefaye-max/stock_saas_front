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
      next: (user) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Connexion réussie',
          detail: `Bienvenue ${user.name} !`,
          life: 3000
        });
        
        // Récupérer l'URL de retour ou rediriger selon le rôle
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
        
        setTimeout(() => {
          if (returnUrl) {
            // Rediriger vers l'URL demandée initialement
            this.router.navigateByUrl(returnUrl);
          } else {
            // Rediriger selon le rôle
            this.redirectToDashboard();
          }
        }, 500);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        
        let errorDetail = 'Une erreur est survenue lors de la connexion';
        
        if (error.status === 401) {
          errorDetail = 'Email ou mot de passe incorrect';
        } else if (error.status === 0) {
          errorDetail = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
        } else if (error.status === 400) {
          // Gérer les erreurs de validation
          if (error.error?.errors) {
            // Erreurs de validation détaillées
            const validationErrors = error.error.errors;
            const errorMessages = Object.values(validationErrors).join(', ');
            errorDetail = `Erreur de validation: ${errorMessages}`;
          } else if (error.error?.message) {
            errorDetail = error.error.message;
          } else {
            errorDetail = 'Les données fournies sont invalides';
          }
        } else if (error.error?.message) {
          errorDetail = error.error.message;
        }
        
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

