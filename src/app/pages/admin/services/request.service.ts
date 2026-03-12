import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { CreateRequest, Request, RequestHistory, UpdateRequestStatus } from '../interfaces/request.interface';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private readonly baseUrl = `${GlobalComponent.API_URL}/api/Requests`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Request[]> {
    return this.http.get<Request[]>(this.baseUrl);
  }

  getById(id: number): Observable<Request> {
    return this.http.get<Request>(`${this.baseUrl}/${id}`);
  }

  getHistory(id: number): Observable<RequestHistory[]> {
    return this.http.get<RequestHistory[]>(`${this.baseUrl}/${id}/history`);
  }

  create(payload: CreateRequest): Observable<Request> {
    return this.http.post<Request>(this.baseUrl, payload);
  }

  updateStatus(requestId: number, payload: UpdateRequestStatus): Observable<Request> {
    return this.http.put<Request>(`${this.baseUrl}/${requestId}/status`, payload);
  }
}
