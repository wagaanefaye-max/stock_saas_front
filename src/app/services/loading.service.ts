import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  /** Délai avant d'afficher l'overlay (évite le flash à chaque navigation GET). */
  private static readonly SHOW_DELAY_MS = 280;

  private readonly _loading = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this._loading.asObservable();

  private requestCount = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  show(immediate = false): void {
    this.requestCount++;

    if (this._loading.value) {
      return;
    }

    if (immediate) {
      this.clearShowTimer();
      this._loading.next(true);
      return;
    }

    if (this.showTimer) {
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      if (this.requestCount > 0) {
        this._loading.next(true);
      }
    }, LoadingService.SHOW_DELAY_MS);
  }

  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);

    if (this.requestCount === 0) {
      this.clearShowTimer();
      this._loading.next(false);
    }
  }

  reset(): void {
    this.requestCount = 0;
    this.clearShowTimer();
    this._loading.next(false);
  }

  private clearShowTimer(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }
}
