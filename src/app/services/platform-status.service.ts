import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface PlatformStatus {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  maintenanceMessage?: string | null;
}

const DEFAULT_STATUS: PlatformStatus = {
  maintenanceMode: false,
  allowNewRegistrations: true,
  maintenanceMessage: null
};

@Injectable({
  providedIn: 'root'
})
export class PlatformStatusService {
  private readonly statusSubject = new BehaviorSubject<PlatformStatus>(DEFAULT_STATUS);
  readonly status$ = this.statusSubject.asObservable();
  private loadPromise: Observable<PlatformStatus> | null = null;

  constructor(private apiService: ApiService) {}

  get snapshot(): PlatformStatus {
    return this.statusSubject.value;
  }

  isMaintenanceMode(): boolean {
    return this.statusSubject.value.maintenanceMode === true;
  }

  isAllowNewRegistrations(): boolean {
    return this.statusSubject.value.allowNewRegistrations !== false;
  }

  loadStatus(force = false): Observable<PlatformStatus> {
    if (!force && this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.apiService.get<PlatformStatus>('/public/platform/status').pipe(
      map((data) => ({
        maintenanceMode: !!data?.maintenanceMode,
        allowNewRegistrations: data?.allowNewRegistrations !== false,
        maintenanceMessage: data?.maintenanceMessage?.trim() || null
      })),
      tap((status) => this.statusSubject.next(status)),
      catchError(() => {
        this.statusSubject.next(DEFAULT_STATUS);
        return of(DEFAULT_STATUS);
      })
    );

    return this.loadPromise;
  }

  refresh(): Observable<PlatformStatus> {
    this.loadPromise = null;
    return this.loadStatus(true);
  }
}
