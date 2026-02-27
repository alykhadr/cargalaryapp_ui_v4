import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { LookupDetail } from "../interfaces/lookup.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class LookupService {
  private readonly baseUrl = `${API_URL}/api/lookups`;

  constructor(private http: HttpClient) {}

  getByMasterCode(masterCode: string): Observable<LookupDetail[]> {
    return this.http.get<LookupDetail[]>(`${this.baseUrl}/${encodeURIComponent(masterCode)}`);
  }
}
