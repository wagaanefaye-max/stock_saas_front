import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { APP_CONFIRM_BREAKPOINTS, APP_CONFIRM_STYLE } from './utils/dialog-mobile.util';
import { LoadingService } from './services/loading.service';
import { GlobalLoadingComponent } from './components/shared/global-loading.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmDialogModule, GlobalLoadingComponent],
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

      <app-global-loading *ngIf="isLoading"></app-global-loading>
    </div>
  `,
  styles: [`
    .app-container {
      position: relative;
      min-height: 100vh;
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

