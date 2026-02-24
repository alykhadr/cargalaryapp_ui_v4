import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { Service, CreateServiceRequest, UpdateServiceRequest, BulkDeleteResponse } from '../interfaces/service.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = `${GlobalComponent.API_URL}/api/Services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }

  getById(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateServiceRequest): Observable<Service> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    formData.append('descriptionAr', request.descriptionAr);
    formData.append('descriptionEn', request.descriptionEn);
    formData.append('discount', request.discount.toString());
    formData.append('isPercentage', request.isPercentage.toString());
    if (request.imageFile) formData.append('imageFile', request.imageFile);
    return this.http.post<Service>(this.apiUrl, formData);
  }

  update(id: number, request: UpdateServiceRequest): Observable<void> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    formData.append('descriptionAr', request.descriptionAr);
    formData.append('descriptionEn', request.descriptionEn);
    formData.append('discount', request.discount.toString());
    formData.append('isPercentage', request.isPercentage.toString());
    if (request.imageFile) formData.append('imageFile', request.imageFile);
    if (request.isAvailable !== undefined) formData.append('isAvailable', request.isAvailable.toString());
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkDelete(serviceIds: number[]): Observable<BulkDeleteResponse> {
    return this.http.post<BulkDeleteResponse>(`${this.apiUrl}/bulk-delete`, { serviceIds });
  }
}
