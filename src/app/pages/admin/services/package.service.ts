import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import {
  BulkDeletePackagesResponse,
  CreatePackageRequest,
  PackageItem,
  UpdatePackageRequest
} from '../interfaces/package.interface';

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private apiUrl = `${GlobalComponent.API_URL}/api/Packages`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PackageItem[]> {
    return this.http.get<PackageItem[]>(this.apiUrl);
  }

  getById(id: number): Observable<PackageItem> {
    return this.http.get<PackageItem>(`${this.apiUrl}/${id}`);
  }

  create(request: CreatePackageRequest): Observable<PackageItem> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    if (request.imageFile) formData.append('imageFile', request.imageFile);
    return this.http.post<PackageItem>(this.apiUrl, formData);
  }

  update(id: number, request: UpdatePackageRequest): Observable<void> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    formData.append('isAvailable', request.isAvailable.toString());
    if (request.imageFile) formData.append('imageFile', request.imageFile);
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkDelete(ids: number[]): Observable<BulkDeletePackagesResponse> {
    return this.http.post<BulkDeletePackagesResponse>(`${this.apiUrl}/bulk-delete`, { packageIds: ids });
  }
}
