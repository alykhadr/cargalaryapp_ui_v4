import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { Color, CreateColorRequest, UpdateColorRequest } from "../interfaces/color.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class ColorService {
  private readonly baseUrl = API_URL + "/api/colors";

  constructor(private http: HttpClient) {}

  getColors(): Observable<Color[]> {
    return this.http.get<Color[]>(this.baseUrl);
  }

  getColorById(colorId: number): Observable<Color> {
    return this.http.get<Color>(`${this.baseUrl}/${colorId}`);
  }

  createColor(payload: CreateColorRequest): Observable<Color> {
    return this.http.post<Color>(this.baseUrl, payload);
  }

  updateColor(colorId: number, payload: UpdateColorRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${colorId}`, payload);
  }

  deleteColor(colorId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${colorId}`);
  }

  bulkDeleteColors(colorIds: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.baseUrl}/bulk-delete`, { colorIds });
  }
}
