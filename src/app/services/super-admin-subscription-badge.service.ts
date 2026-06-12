import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, interval, map, of, switchMap, tap } from 'rxjs';
import { SubscriptionService } from './subscription.service';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminSubscriptionBadgeService {
  private readonly pendingCountSubject = new BehaviorSubject(0);
  readonly pendingCount$ = this.pendingCountSubject.asObservable();
  private pollSub?: Subscription;

  constructor(private subscriptionService: SubscriptionService) {}

  get pendingCount(): number {
    return this.pendingCountSubject.value;
  }

  refresh(): Observable<number> {
    return this.subscriptionService.getAllRequests(0, 1).pipe(
      map((response) => response.totalPending ?? 0),
      tap((count) => this.pendingCountSubject.next(count)),
      catchError(() => {
        this.pendingCountSubject.next(0);
        return of(0);
      })
    );
  }

  setPendingCount(count: number): void {
    this.pendingCountSubject.next(Math.max(0, count));
  }

  startPolling(intervalMs = 60_000): void {
    this.stopPolling();
    this.refresh().subscribe();
    this.pollSub = interval(intervalMs)
      .pipe(switchMap(() => this.refresh()))
      .subscribe();
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }
}
