import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { Branch, CreateBranchRequest, UpdateBranchRequest } from "../interfaces/branch.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class BranchService {
  private readonly baseUrl = API_URL + "/api/branches";

  constructor(private http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.baseUrl);
  }

  getBranchById(branchId: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.baseUrl}/${branchId}`);
  }

  createBranch(payload: CreateBranchRequest): Observable<Branch> {
    return this.http.post<Branch>(this.baseUrl, payload);
  }

  updateBranch(branchId: number, payload: UpdateBranchRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${branchId}`, payload);
  }

  deleteBranch(branchId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${branchId}`);
  }
}
