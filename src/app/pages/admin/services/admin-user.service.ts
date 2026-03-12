import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { AspNetUser, UpdateAspNetUserRequest } from '../interfaces/aspnet-user.interface';

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly usersUrl = `${API_URL}/api/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AspNetUser[]> {
    return this.http.get<AspNetUser[]>(this.usersUrl);
  }

  updateUser(userId: string, payload: UpdateAspNetUserRequest): Observable<void> {
    return this.http.put<void>(`${this.usersUrl}/${userId}`, payload);
  }

  activateUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.usersUrl}/${userId}/activate`, {});
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.usersUrl}/${userId}/deactivate`, {});
  }
}
