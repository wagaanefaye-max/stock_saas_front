import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppUpdateService } from '../../services/app-update.service';

@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="app-update-banner"
      role="status"
      aria-live="polite"
      aria-label="Mise à jour disponible">
      <div class="app-update-banner__content">
        <span class="app-update-banner__icon" aria-hidden="true">
          <i class="pi pi-sync"></i>
        </span>
        <div class="app-update-banner__text">
          <strong>Nouvelle version disponible</strong>
          <span>Rechargez l'application pour profiter des dernières améliorations.</span>
        </div>
      </div>
      <div class="app-update-banner__actions">
        <button type="button" class="app-update-banner__btn app-update-banner__btn--ghost" (click)="dismiss()">
          Plus tard
        </button>
        <button
          type="button"
          class="app-update-banner__btn app-update-banner__btn--primary"
          [disabled]="applying"
          (click)="reload()">
          {{ applying ? 'Mise à jour…' : 'Mettre à jour' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .app-update-banner {
      position: fixed;
      left: 50%;
      bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
      transform: translateX(-50%);
      z-index: 8500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: min(720px, calc(100vw - 1.5rem));
      padding: 0.875rem 1rem;
      border-radius: 14px;
      border: 1px solid rgba(37, 99, 235, 0.2);
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
      backdrop-filter: blur(10px);
      animation: app-update-banner-in 0.35s ease both;
    }

    .app-update-banner__content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 0;
    }

    .app-update-banner__icon {
      flex-shrink: 0;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(37, 99, 235, 0.1);
      color: var(--primary, #2563eb);
    }

    .app-update-banner__text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .app-update-banner__text strong {
      font-size: 0.9375rem;
      color: var(--text-main, #111827);
    }

    .app-update-banner__text span {
      font-size: 0.8125rem;
      color: var(--text-muted, #6b7280);
      line-height: 1.4;
    }

    .app-update-banner__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .app-update-banner__btn {
      border: none;
      border-radius: 8px;
      padding: 0.5rem 0.875rem;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .app-update-banner__btn--ghost {
      background: transparent;
      color: var(--text-muted, #6b7280);
    }

    .app-update-banner__btn--ghost:hover {
      background: rgba(15, 23, 42, 0.06);
      color: var(--text-main, #111827);
    }

    .app-update-banner__btn--primary {
      background: var(--primary, #2563eb);
      color: #fff;
    }

    .app-update-banner__btn--primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }

    .app-update-banner__btn--primary:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    @media (max-width: 640px) {
      .app-update-banner {
        flex-direction: column;
        align-items: stretch;
        bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
      }

      .app-update-banner__actions {
        justify-content: flex-end;
      }
    }

    @keyframes app-update-banner-in {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .app-update-banner {
        animation: none;
      }
    }
  `]
})
export class AppUpdateBannerComponent implements OnInit, OnDestroy {
  visible = false;
  applying = false;

  private subscription?: Subscription;

  constructor(private appUpdateService: AppUpdateService) {}

  ngOnInit(): void {
    this.subscription = this.appUpdateService.updateAvailable$.subscribe(available => {
      this.visible = available;
    });
  }

  dismiss(): void {
    this.appUpdateService.dismiss();
  }

  reload(): void {
    this.applying = true;
    void this.appUpdateService.applyUpdate();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
