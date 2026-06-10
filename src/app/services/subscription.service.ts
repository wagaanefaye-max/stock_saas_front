import { Injectable } from '@angular/core';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';

function readBlobErrorMessage(error: unknown, fallback: string): Observable<never> {
  const httpError = error as { error?: unknown; message?: string };
  const blob = httpError?.error;
  if (blob instanceof Blob) {
    return from(blob.text()).pipe(
      mergeMap((text) => {
        let message = fallback;
        try {
          const parsed = JSON.parse(text) as { message?: string };
          if (parsed?.message) {
            message = parsed.message;
          }
        } catch {
          // Réponse non JSON
        }
        return throwError(() => ({ ...(httpError as object), userMessage: message }));
      })
    );
  }
  const jsonMessage = (httpError?.error as { message?: string } | undefined)?.message;
  return throwError(() => ({
    ...(httpError as object),
    userMessage: jsonMessage || httpError?.message || fallback
  }));
}

export interface SubscriptionStatus {
  companyId: number;
  planCode: string;
  planLabel: string;
  planMonthlyPrice: number;
  subscriptionStatus: string;
  subscriptionStatusLabel: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  durationCode: string | null;
  durationLabel: string | null;
  readOnly: boolean;
  canUpgrade: boolean;
  hasPendingRequest: boolean;
  daysRemaining: number;
  nextCumulativeStartAt?: string | null;
  willStackSubscription?: boolean;
}

export interface SubscriptionPlan {
  code: string;
  label: string;
  monthlyPrice: number;
  maxUsers: number;
  maxWarehouses: number;
}

export interface SubscriptionDuration {
  code: string;
  label: string;
  months: number;
  discountPercent?: number;
  totalPrice?: number;
}

export interface SubscriptionRequestsPage {
  content: SubscriptionRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  totalAll: number;
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
}

export interface SubscriptionRecord {
  id: number;
  companyId?: number;
  companyName?: string;
  planCode: string;
  planLabel: string;
  durationCode: string;
  durationLabel: string;
  months: number;
  amountPaid: number;
  periodStart: string | null;
  periodEnd: string | null;
  subscribedByEmail: string;
  createdAt: string;
  requestStatus: string;
  requestStatusLabel: string;
  paymentProvider?: string;
  paymentProviderLabel?: string;
  proofUrl?: string | null;
  validatedByEmail?: string | null;
  validatedAt?: string | null;
  rejectionReason?: string | null;
}

export interface SubscriptionQuote {
  planCode: string;
  durationCode: string;
  months: number;
  monthlyPrice: number;
  discountPercent?: number;
  grossTotal?: number;
  totalPrice: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  willStack?: boolean;
}

export interface PaymentProviderOption {
  code: string;
  label: string;
  /** false = affiché mais pas encore disponible à la soumission */
  enabled?: boolean;
}

export const PAYMENT_PROVIDERS: PaymentProviderOption[] = [
  { code: 'WAVE', label: 'Wave', enabled: true },
  { code: 'ORANGE_MONEY', label: 'Orange Money', enabled: true },
  { code: 'CASH', label: 'Espèce', enabled: false }
];

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private api: ApiService) {}

  getStatus(): Observable<SubscriptionStatus> {
    return this.api.get<SubscriptionStatus>('/subscriptions/status');
  }

  getDurations(): Observable<SubscriptionDuration[]> {
    return this.api.get<SubscriptionDuration[]>('/subscriptions/durations');
  }

  getHistory(): Observable<SubscriptionRecord[]> {
    return this.api.get<SubscriptionRecord[]>('/subscriptions/history');
  }

  getPendingRequests(): Observable<SubscriptionRecord[]> {
    return this.api.get<SubscriptionRecord[]>('/subscriptions/requests/pending');
  }

  getAllRequests(page = 0, size = 10, status?: string): Observable<SubscriptionRequestsPage> {
    const params: Record<string, string | number> = { page, size };
    if (status) {
      params['status'] = status;
    }
    return this.api.get<SubscriptionRequestsPage>('/subscriptions/requests', params);
  }

  getQuote(durationCode: string): Observable<SubscriptionQuote> {
    return this.api.get<SubscriptionQuote>('/subscriptions/quote', { durationCode });
  }

  submitRequest(
    durationCode: string,
    paymentProvider: string,
    proofFile: File
  ): Observable<SubscriptionRecord> {
    const form = new FormData();
    form.append('durationCode', durationCode);
    form.append('paymentProvider', paymentProvider);
    form.append('proof', proofFile);
    return this.api.postFormData<SubscriptionRecord>('/subscriptions/request', form);
  }

  approveRequest(id: number): Observable<SubscriptionRecord> {
    return this.api.post<SubscriptionRecord>(`/subscriptions/requests/${id}/approve`, {});
  }

  rejectRequest(id: number, reason?: string): Observable<SubscriptionRecord> {
    return this.api.post<SubscriptionRecord>(`/subscriptions/requests/${id}/reject`, { reason });
  }

  getProofBlob(recordId: number): Observable<Blob> {
    return this.api.getBlob(`/subscriptions/requests/${recordId}/proof`).pipe(
      catchError((err) => readBlobErrorMessage(err, 'Impossible d\'afficher le justificatif.'))
    );
  }
}
