import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import {
  BulkDeleteCarsRequest,
  BulkDeleteCarsResponse,
  Car,
  CarImage,
  CreateCarRequest,
  CreateCarWithDetailsRequest,
  UpdateCarRequest
} from '../interfaces/car.interface';

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private readonly baseUrl = API_URL + '/api/Cars';

  constructor(private http: HttpClient) {}

  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.baseUrl);
  }

  getCarById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.baseUrl}/${id}`);
  }

  filterCars(modelId?: number, typeId?: number, isAvailable?: boolean): Observable<Car[]> {
    let params: any = {};
    if (modelId !== undefined) params.modelId = modelId;
    if (typeId !== undefined) params.typeId = typeId;
    if (isAvailable !== undefined) params.isAvailable = isAvailable;
    return this.http.get<Car[]>(`${this.baseUrl}/filter`, { params });
  }

  getCarsByModel(modelId: number): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.baseUrl}/by-model/${modelId}`);
  }

  createCar(payload: CreateCarRequest): Observable<Car> {
    return this.http.post<Car>(this.baseUrl, payload);
  }

  createCarWithDetails(payload: CreateCarWithDetailsRequest): Observable<Car> {
    const formData = new FormData();
    if (payload.nameAr !== undefined && payload.nameAr !== null) {
      formData.append('nameAr', payload.nameAr);
    }
    if (payload.nameEn !== undefined && payload.nameEn !== null) {
      formData.append('nameEn', payload.nameEn);
    }
    formData.append('modelId', payload.modelId.toString());
    formData.append('typeId', payload.typeId.toString());
    formData.append('branchId', payload.branchId.toString());
    formData.append('year', payload.year.toString());
    formData.append('mileage', payload.mileage.toString());
    formData.append('vat', payload.vat.toString());
    formData.append('conditionId', payload.conditionId.toString());
    formData.append('seatingCapacity', payload.seatingCapacity.toString());
    formData.append('weelSizeInch', payload.weelSizeInch);
    formData.append('fuelTankCapacityLiter', payload.fuelTankCapacityLiter.toString());
    formData.append('trimLevel', payload.trimLevel.toString());
    formData.append('vehicleClass', payload.vehicleClass.toString());
    formData.append('plateNumberAr', payload.plateNumberAr);
    formData.append('plateNumberEn', payload.plateNumberEn);
    formData.append('transmisionType', payload.transmisionType.toString());
    formData.append('drivetrain', payload.drivetrain.toString());
    formData.append('cylenders', payload.cylenders.toString());
    formData.append('fuelType', payload.fuelType.toString());
    formData.append('manufactureCountryId', payload.manufactureCountryId.toString());
    formData.append('enginNumber', payload.enginNumber);
    if (payload.descriptionAr !== undefined && payload.descriptionAr !== null) {
      formData.append('descriptionAr', payload.descriptionAr);
    }
    if (payload.descriptionEn !== undefined && payload.descriptionEn !== null) {
      formData.append('descriptionEn', payload.descriptionEn);
    }

    if (payload.features?.length) {
      formData.append('featuresJson', JSON.stringify(payload.features));
    }
    if (payload.carColors?.length) {
      formData.append('carColorsJson', JSON.stringify(payload.carColors));
    }
    if (payload.extraDetails?.length) {
      formData.append('extraDetailsJson', JSON.stringify(payload.extraDetails));
    }
    if (payload.galleryImagesMeta?.length) {
      formData.append('galleryImagesMetaJson', JSON.stringify(payload.galleryImagesMeta));
    }
    if (payload.carColorImagesMeta?.length) {
      formData.append('carColorImagesMetaJson', JSON.stringify(payload.carColorImagesMeta));
    }

    payload.galleryImages?.forEach((file) => {
      formData.append('galleryImageFiles', file, file.name);
    });
    payload.carColorImageFiles?.forEach((file) => {
      formData.append('carColorImageFiles', file, file.name);
    });

    return this.http.post<Car>(`${this.baseUrl}/save-all`, formData);
  }

  updateCar(id: number, payload: UpdateCarRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  copyCar(id: number): Observable<Car> {
    return this.http.post<Car>(`${this.baseUrl}/${id}/copy`, {});
  }

  updateAvailability(id: number, isAvailable: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/availability`, { isAvailable });
  }

  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkDeleteCars(payload: BulkDeleteCarsRequest): Observable<BulkDeleteCarsResponse> {
    return this.http.post<BulkDeleteCarsResponse>(`${this.baseUrl}/bulk-delete`, payload);
  }

  // Car Images
  getCarImages(carId: number): Observable<CarImage[]> {
    return this.http.get<CarImage[]>(`${this.baseUrl}/${carId}/images`);
  }

  uploadCarImage(carId: number, file: File, isPrimary: boolean = false, imageType?: number): Observable<CarImage> {
    const formData = new FormData();
    formData.append('imageFile', file);
    let url = `${this.baseUrl}/${carId}/images?isPrimary=${isPrimary}`;
    if (imageType !== undefined) {
      url += `&imageType=${imageType}`;
    }
    return this.http.post<CarImage>(url, formData);
  }

  deleteCarImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/images/${imageId}`);
  }

  setPrimaryImage(imageId: number, isPrimary: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/images/${imageId}/primary`, { isPrimary });
  }
}
