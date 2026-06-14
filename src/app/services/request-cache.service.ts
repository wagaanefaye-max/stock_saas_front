import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

/**
 * Cache mémoire court (TTL) pour éviter les appels API répétés
 * lors des navigations rapides (ex. tableaux de bord).
 */
@Injectable({
  providedIn: 'root'
})
export class RequestCacheService {
  private readonly defaultTtlMs = 30_000;
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, loader: () => Observable<T>, ttlMs = this.defaultTtlMs): Observable<T> {
    const cached = this.store.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) {
      return of(cached.value);
    }

    return loader().pipe(
      tap(value => {
        this.store.set(key, {
          value,
          expiresAt: Date.now() + ttlMs
        });
      })
    );
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
      return;
    }
    this.store.clear();
  }
}
