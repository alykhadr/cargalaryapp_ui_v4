import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GalleryImage, CreateGalleryImageRequest, UpdateGalleryImageRequest } from '../interfaces/gallery-image.interface';
import { GlobalComponent } from 'src/app/global-component';

@Injectable({
  providedIn: 'root'
})
export class GalleryImageService {
  private apiUrl = GlobalComponent.API_URL + '/api/GalleryImages';

  constructor(private http: HttpClient) {}

  getGalleryImages(): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(this.apiUrl);
  }

  getGalleryImageById(id: number): Observable<GalleryImage> {
    return this.http.get<GalleryImage>(`${this.apiUrl}/${id}`);
  }

  getGalleryImagesByCarId(carId: number): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${this.apiUrl}/by-car/${carId}`);
  }

  createGalleryImage(request: CreateGalleryImageRequest): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('carId', request.carId.toString());
    formData.append('imageFile', request.imageFile);
    formData.append('isPrimary', request.isPrimary.toString());
    if (request.imageType !== undefined) {
      formData.append('imageType', request.imageType.toString());
    }
    return this.http.post<GalleryImage>(this.apiUrl, formData);
  }

  updateGalleryImage(id: number, request: UpdateGalleryImageRequest): Observable<void> {
    const formData = new FormData();
    formData.append('carId', request.carId.toString());
    formData.append('isPrimary', request.isPrimary.toString());
    if (request.imageFile) {
      formData.append('imageFile', request.imageFile);
    }
    if (request.imageType !== undefined) {
      formData.append('imageType', request.imageType.toString());
    }
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  deleteGalleryImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
