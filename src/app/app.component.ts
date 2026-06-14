import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { filter, Subscription } from 'rxjs';
import { PlatformStatusService } from './services/platform-status.service';
import { SeoService } from './services/seo.service';
import { APP_CONFIRM_BREAKPOINTS, APP_CONFIRM_STYLE } from './utils/dialog-mobile.util';
import { LoadingService } from './services/loading.service';
import { GlobalLoadingComponent } from './components/shared/global-loading.component';
import { AppUpdateBannerComponent } from './components/shared/app-update-banner.component';
import { AppUpdateService } from './services/app-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmDialogModule, ToastModule, GlobalLoadingComponent, AppUpdateBannerComponent],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>

      <p-toast position="top-right" styleClass="app-global-toast"></p-toast>

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
  private routerSubscription?: Subscription;

  constructor(
    private loadingService: LoadingService,
    private platformStatusService: PlatformStatusService,
    private appUpdateService: AppUpdateService,
    private seoService: SeoService,
    private router: Router,
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
    this.seoService.updateForUrl(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.seoService.updateForUrl(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}

