import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { CreateQuotationRequest, Quotation, QuotationHistory, UpdateQuotationStatusRequest } from '../interfaces/quotation.interface';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private readonly baseUrl = `${GlobalComponent.API_URL}/api/Quotations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Quotation[]> {
    return this.http.get<Quotation[]>(this.baseUrl);
  }

  getById(id: number): Observable<Quotation> {
    return this.http.get<Quotation>(`${this.baseUrl}/${id}`);
  }

  getHistory(id: number): Observable<QuotationHistory[]> {
    return this.http.get<QuotationHistory[]>(`${this.baseUrl}/${id}/history`);
  }

  create(payload: CreateQuotationRequest): Observable<Quotation> {
    return this.http.post<Quotation>(this.baseUrl, payload);
  }

  updateStatus(quotationId: number, payload: UpdateQuotationStatusRequest): Observable<Quotation> {
    return this.http.put<Quotation>(`${this.baseUrl}/${quotationId}/status`, payload);
  }
}
