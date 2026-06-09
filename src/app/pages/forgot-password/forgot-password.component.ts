import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  styleUrl: './forgot-password.component.scss',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  submit() {
    if (!this.email) {
      return;
    }
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Email envoyé',
          detail: res?.message || 'Si un compte existe avec cet email, un lien a été envoyé.',
          life: 6000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Une erreur est survenue lors de la demande de réinitialisation.',
          life: 5000
        });
      }
    });
  }
}

