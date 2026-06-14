import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { PlatformStatusService } from './services/platform-status.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { APP_CONFIRM_BREAKPOINTS, APP_CONFIRM_STYLE } from './utils/dialog-mobile.util';
import { LoadingService } from './services/loading.service';
import { GlobalLoadingComponent } from './components/shared/global-loading.component';
import { AppUpdateBannerComponent } from './components/shared/app-update-banner.component';
import { AppUpdateService } from './services/app-update.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmDialogModule, GlobalLoadingComponent, AppUpdateBannerComponent],
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
      <app-update-banner></app-update-banner>
    </div>
  `,
  styles: [`
    .app-container {
      position: relative;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Stock SaaS';
  isLoading = false;
  readonly confirmStyle = APP_CONFIRM_STYLE;
  readonly confirmBreakpoints = APP_CONFIRM_BREAKPOINTS;
  private loadingSubscription?: Subscription;

  constructor(
    private loadingService: LoadingService,
    private platformStatusService: PlatformStatusService,
    private appUpdateService: AppUpdateService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadingSubscription = this.loadingService.loading$.subscribe(loading => {
      queueMicrotask(() => {
        this.isLoading = loading;
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit(): void {
    this.platformStatusService.loadStatus().subscribe();
    this.appUpdateService.init();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}

