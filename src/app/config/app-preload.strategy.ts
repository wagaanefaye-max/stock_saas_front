import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Précharge en arrière-plan les pages marquées `data.preload: true`
 * (après 2 s) pour accélérer les clics suivants dans le menu.
 */
@Injectable({ providedIn: 'root' })
export class AppPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload']) {
      return timer(2000).pipe(mergeMap(() => load()));
    }
    return of(null);
  }
}
