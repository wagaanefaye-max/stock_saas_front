import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

/**
 * Service pour les appels API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  private readonly defaultOptions = { withCredentials: true };

  /**
   * POST request (avec envoi des cookies pour l'authentification).
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, this.defaultOptions);
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, this.defaultOptions);
  }

  /**
   * GET request. Si params est fourni, les paramètres non vides sont ajoutés en query string.
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    const hasParams = params && Object.values(params).some(v => v != null && v !== '');
    const options = { ...this.defaultOptions, ...(hasParams ? { params: httpParams } : {}) };
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options);
  }

  /**
   * GET request qui retourne un blob (ex: PDF).
   */
  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, { responseType: 'blob', ...this.defaultOptions });
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, this.defaultOptions);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, this.defaultOptions);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, this.defaultOptions);
  }
}
