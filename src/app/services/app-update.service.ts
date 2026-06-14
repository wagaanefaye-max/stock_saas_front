import { Injectable, OnDestroy } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Subscription, filter, fromEvent, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppUpdateService implements OnDestroy {
  private readonly updateAvailableSubject = new BehaviorSubject(false);
  readonly updateAvailable$ = this.updateAvailableSubject.asObservable();

  private readonly subscriptions = new Subscription();
  private applying = false;

  constructor(private swUpdate: SwUpdate) {}

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.subscriptions.add(
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => this.updateAvailableSubject.next(true))
    );

    this.subscriptions.add(
      this.swUpdate.unrecoverable.subscribe(() => {
        this.updateAvailableSubject.next(true);
      })
    );

    this.subscriptions.add(
      fromEvent(window, 'focus').subscribe(() => {
        void this.checkForUpdate();
      })
    );

    this.subscriptions.add(
      interval(30 * 60 * 1000).subscribe(() => {
        void this.checkForUpdate();
      })
    );

    void this.checkForUpdate();
  }

  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // Ignorer les erreurs réseau ou SW indisponible.
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled || this.applying) {
      return;
    }

    this.applying = true;

    try {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    } catch {
      this.applying = false;
      window.location.reload();
    }
  }

  dismiss(): void {
    this.updateAvailableSubject.next(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
