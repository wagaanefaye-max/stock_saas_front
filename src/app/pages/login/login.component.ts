import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
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
    CheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  rememberMe = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  login() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        // Rediriger selon le rôle
        if (this.authService.isSuperAdmin()) {
          this.router.navigate(['/super-admin/dashboard']);
        } else if (this.authService.isAdminEntreprise()) {
          this.router.navigate(['/company-admin/dashboard']);
        } else if (this.authService.isGestionnaire()) {
          // Gestionnaire
          this.router.navigate(['/gestionnaire/dashboard']);
        } else {
          // Utilisateur
          this.router.navigate(['/gestion/dashboard']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur de connexion:', error);
        // TODO: Afficher un message d'erreur
      }
    });
  }
}

