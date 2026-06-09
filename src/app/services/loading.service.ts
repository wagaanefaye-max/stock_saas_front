import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this._loading.asObservable();

  private requestCount = 0;

  constructor() { }

  /**
   * Affiche l'indicateur de chargement
   */
  show() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this._loading.next(true);
    }
  }

  /**
   * Masque l'indicateur de chargement
   */
  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this._loading.next(false);
    }
  }

  /**
   * Réinitialise l'état de chargement (en cas d'erreur)
   */
  reset() {
    this.requestCount = 0;
    this._loading.next(false);
  }
}
