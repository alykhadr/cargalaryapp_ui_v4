import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car } from '../interfaces/gallery-image.interface';
import { GlobalComponent } from 'src/app/global-component';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = GlobalComponent.API_URL + '/api/Cars';

  constructor(private http: HttpClient) {}

  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  getCarById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`);
  }
}
