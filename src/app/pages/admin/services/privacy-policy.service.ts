import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import {
  BulkDeletePrivacyPolicyResponse,
  CreatePrivacyPolicyRequest,
  PrivacyPolicy,
  UpdatePrivacyPolicyRequest
} from '../interfaces/privacy-policy.interface';

@Injectable({
  providedIn: 'root'
})
export class PrivacyPolicyService {
  private readonly baseUrl = `${GlobalComponent.API_URL}/api/PrivacyPolicies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PrivacyPolicy[]> {
    return this.http.get<PrivacyPolicy[]>(this.baseUrl);
  }

  getById(id: number): Observable<PrivacyPolicy> {
    return this.http.get<PrivacyPolicy>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreatePrivacyPolicyRequest): Observable<PrivacyPolicy> {
    return this.http.post<PrivacyPolicy>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdatePrivacyPolicyRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkDelete(privacyPolicyIds: number[]): Observable<BulkDeletePrivacyPolicyResponse> {
    return this.http.post<BulkDeletePrivacyPolicyResponse>(`${this.baseUrl}/bulk-delete`, { privacyPolicyIds });
  }
}
