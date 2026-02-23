import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer, CreateOfferRequest, UpdateOfferRequest } from '../interfaces/offer.interface';
import { GlobalComponent } from 'src/app/global-component';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private apiUrl = `${GlobalComponent.API_URL}/api/Offers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl);
  }

  getById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateOfferRequest): Observable<Offer> {
    const formData = new FormData();
    formData.append('offerNameAr', request.offerNameAr);
    formData.append('offerNameEn', request.offerNameEn);
    if (request.descriptionAr) formData.append('descriptionAr', request.descriptionAr);
    if (request.descriptionEn) formData.append('descriptionEn', request.descriptionEn);
    formData.append('expiredAt', request.expiredAt.toISOString());
    if (request.imageFile) {
      formData.append('imageFile', request.imageFile);
    }
    return this.http.post<Offer>(this.apiUrl, formData);
  }

  update(id: number, request: UpdateOfferRequest): Observable<void> {
    const formData = new FormData();
    formData.append('offerNameAr', request.offerNameAr);
    formData.append('offerNameEn', request.offerNameEn);
    if (request.descriptionAr) formData.append('descriptionAr', request.descriptionAr);
    if (request.descriptionEn) formData.append('descriptionEn', request.descriptionEn);
    formData.append('expiredAt', request.expiredAt.toISOString());
    formData.append('isAvailable', request.isAvailable.toString());
    if (request.imageFile) {
      formData.append('imageFile', request.imageFile);
    }
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkDelete(ids: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.apiUrl}/bulk-delete`, { offerIds: ids });
  }
}
