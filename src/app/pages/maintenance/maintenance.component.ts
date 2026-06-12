import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { PlatformStatusService } from '../../services/platform-status.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss'
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  checking = false;
  maintenanceMessage: string | null = null;
  private pollSub?: Subscription;
  private statusSub?: Subscription;

  constructor(
    private platformStatusService: PlatformStatusService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.statusSub = this.platformStatusService.status$.subscribe((status) => {
      this.maintenanceMessage = status.maintenanceMessage?.trim() || null;
    });
    this.platformStatusService.loadStatus().subscribe();

    this.pollSub = interval(30_000)
      .pipe(switchMap(() => this.platformStatusService.refresh()))
      .subscribe((status) => {
        this.maintenanceMessage = status.maintenanceMessage?.trim() || null;
        if (!status.maintenanceMode) {
          if (this.authService.isSuperAdmin()) {
            window.location.href = '/super-admin/dashboard';
          } else {
            window.location.href = '/login';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.statusSub?.unsubscribe();
  }

  checkAgain(): void {
    this.checking = true;
    this.platformStatusService.refresh().subscribe({
      next: (status) => {
        this.checking = false;
        this.maintenanceMessage = status.maintenanceMessage?.trim() || null;
        if (!status.maintenanceMode) {
          window.location.href = this.authService.isSuperAdmin()
            ? '/super-admin/dashboard'
            : '/login';
        }
      },
      error: () => {
        this.checking = false;
      }
    });
  }
}
