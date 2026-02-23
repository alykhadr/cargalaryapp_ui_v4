import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MemberService, CreateMemberServiceRequest, UpdateMemberServiceRequest } from '../interfaces/member-service.interface';
import { GlobalComponent } from 'src/app/global-component';

@Injectable({
  providedIn: 'root'
})
export class MemberServiceService {
  private apiUrl = `${GlobalComponent.API_URL}/api/MemberService`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MemberService[]> {
    return this.http.get<MemberService[]>(this.apiUrl);
  }

  getById(id: number): Observable<MemberService> {
    return this.http.get<MemberService>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateMemberServiceRequest): Observable<MemberService> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    if (request.descriptionAr) formData.append('descriptionAr', request.descriptionAr);
    if (request.descriptionEn) formData.append('descriptionEn', request.descriptionEn);
    if (request.imageFile) {
      formData.append('imageFile', request.imageFile);
    }
    return this.http.post<MemberService>(this.apiUrl, formData);
  }

  update(id: number, request: UpdateMemberServiceRequest): Observable<void> {
    const formData = new FormData();
    formData.append('nameAr', request.nameAr);
    formData.append('nameEn', request.nameEn);
    if (request.descriptionAr) formData.append('descriptionAr', request.descriptionAr);
    if (request.descriptionEn) formData.append('descriptionEn', request.descriptionEn);
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
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.apiUrl}/bulk-delete`, { memberServiceIds: ids });
  }
}
