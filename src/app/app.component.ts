import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { APP_CONFIRM_BREAKPOINTS, APP_CONFIRM_STYLE } from './utils/dialog-mobile.util';
import { LoadingService } from './services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ProgressSpinnerModule, ConfirmDialogModule],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>

      <p-confirmDialog
        styleClass="app-confirm-dialog"
        [style]="confirmStyle"
        [breakpoints]="confirmBreakpoints"
        acceptIcon="pi pi-check"
        rejectIcon="pi pi-times"
        acceptLabel="Confirmer"
        rejectLabel="Annuler"
        [draggable]="false"
        [closable]="true"
        [closeOnEscape]="true">
      </p-confirmDialog>

      <!-- Indicateur de chargement global -->
      <div *ngIf="isLoading" class="loading-overlay">
        <p-progressSpinner 
          [style]="{width: '50px', height: '50px'}" 
          strokeWidth="4"
          animationDuration=".5s">
        </p-progressSpinner>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      position: relative;
      min-height: 100vh;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      pointer-events: none;
    }

    .loading-overlay ::ng-deep .p-progressspinner {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      padding: 10px;
    }
  `]
})
export class AppComponent implements OnDestroy {
  title = 'Stock SaaS';
  isLoading = false;
  readonly confirmStyle = APP_CONFIRM_STYLE;
  readonly confirmBreakpoints = APP_CONFIRM_BREAKPOINTS;
  private loadingSubscription?: Subscription;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {
    // S'abonner aux changements de l'état de chargement
    this.loadingSubscription = this.loadingService.loading$.subscribe(loading => {
      // Utiliser queueMicrotask pour éviter ExpressionChangedAfterItHasBeenCheckedError
      queueMicrotask(() => {
        this.isLoading = loading;
        this.cdr.markForCheck();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}

