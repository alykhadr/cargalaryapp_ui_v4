import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { AdminEmployee, CreateAdminEmployeeRequest } from "../interfaces/employee-admin.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class AdminEmployeeService {
  private readonly employeesUrl = `${API_URL}/api/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<AdminEmployee[]> {
    return this.http.get<AdminEmployee[]>(this.employeesUrl);
  }

  getEmployeesByBranch(branchId: number): Observable<AdminEmployee[]> {
    return this.http.get<AdminEmployee[]>(`${this.employeesUrl}/branch/${branchId}`);
  }

  getEmployeesByDepartment(departmentId: number): Observable<AdminEmployee[]> {
    return this.http.get<AdminEmployee[]>(`${this.employeesUrl}/department/${departmentId}`);
  }

  createEmployee(payload: CreateAdminEmployeeRequest): Observable<unknown> {
    const formData = new FormData();
    formData.append('email', payload.email);
    formData.append('userName', payload.userName);
    formData.append('password', payload.password);
    formData.append('nameEn', payload.nameEn || '');
    formData.append('nameAr', payload.nameAr || '');
    formData.append('branchId', payload.branchId.toString());
    if (payload.employeeNo?.trim()) formData.append('employeeNo', payload.employeeNo.trim());
    if (payload.nationalId?.trim()) formData.append('nationalId', payload.nationalId.trim());
    if (payload.jobTitle?.trim()) formData.append('jobTitle', payload.jobTitle.trim());
    formData.append('departmentId', payload.departmentId.toString());

    const hireDate = this.normalizeDateForFormData(payload.hireDate);
    if (hireDate) formData.append('hireDate', hireDate);

    const terminationDate = this.normalizeDateForFormData(payload.terminationDate);
    if (terminationDate) formData.append('terminationDate', terminationDate);

    if (payload.employmentStatus) formData.append('employmentStatus', payload.employmentStatus);
    if (payload.workEmail) formData.append('workEmail', payload.workEmail);
    if (payload.workPhone) formData.append('workPhone', payload.workPhone);
    if (payload.extension) formData.append('extension', payload.extension);

    const dateOfBirth = this.normalizeDateForFormData(payload.dateOfBirth);
    if (dateOfBirth) formData.append('dateOfBirth', dateOfBirth);

    if (payload.gender) formData.append('gender', payload.gender);
    if (payload.nationality) formData.append('nationality', payload.nationality);
    if (payload.addressLine1) formData.append('addressLine1', payload.addressLine1);
    if (payload.addressLine2) formData.append('addressLine2', payload.addressLine2);
    if (payload.city) formData.append('city', payload.city);
    if (payload.region) formData.append('region', payload.region);
    if (payload.postalCode) formData.append('postalCode', payload.postalCode);
    payload.roles.forEach(role => formData.append('roles', role));
    if (payload.profileImage) {
      formData.append('profileImage', payload.profileImage);
    }
    return this.http.post(this.employeesUrl, formData);
  }

  updateEmployee(userId: string, payload: {
    userName: string;
    email: string;
    nameEn: string;
    nameAr: string;
    branchId: number;
    profileImage?: File;
    employeeNo?: string;
    nationalId?: string;
    jobTitle?: string;
    departmentId?: number;
    hireDate?: string | Date;
    terminationDate?: string | Date;
    employmentStatus?: string;
    workEmail?: string;
    workPhone?: string;
    extension?: string;
    dateOfBirth?: string | Date;
    gender?: string;
    nationality?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
  }): Observable<void> {
    const formData = new FormData();
    formData.append('userName', payload.userName);
    formData.append('email', payload.email);
    formData.append('nameEn', payload.nameEn || '');
    formData.append('nameAr', payload.nameAr || '');
    formData.append('branchId', payload.branchId.toString());
    if (payload.employeeNo) formData.append('employeeNo', payload.employeeNo);
    if (payload.nationalId) formData.append('nationalId', payload.nationalId);
    if (payload.jobTitle) formData.append('jobTitle', payload.jobTitle);
    if (payload.departmentId) formData.append('departmentId', payload.departmentId.toString());

    const hireDate = this.normalizeDateForFormData(payload.hireDate);
    if (hireDate) formData.append('hireDate', hireDate);

    const terminationDate = this.normalizeDateForFormData(payload.terminationDate);
    if (terminationDate) formData.append('terminationDate', terminationDate);

    if (payload.employmentStatus) formData.append('employmentStatus', payload.employmentStatus);
    if (payload.workEmail) formData.append('workEmail', payload.workEmail);
    if (payload.workPhone) formData.append('workPhone', payload.workPhone);
    if (payload.extension) formData.append('extension', payload.extension);

    const dateOfBirth = this.normalizeDateForFormData(payload.dateOfBirth);
    if (dateOfBirth) formData.append('dateOfBirth', dateOfBirth);

    if (payload.gender) formData.append('gender', payload.gender);
    if (payload.nationality) formData.append('nationality', payload.nationality);
    if (payload.addressLine1) formData.append('addressLine1', payload.addressLine1);
    if (payload.addressLine2) formData.append('addressLine2', payload.addressLine2);
    if (payload.city) formData.append('city', payload.city);
    if (payload.region) formData.append('region', payload.region);
    if (payload.postalCode) formData.append('postalCode', payload.postalCode);
    if (payload.profileImage) {
      formData.append('profileImage', payload.profileImage);
    }
    return this.http.put<void>(`${this.employeesUrl}/${userId}`, formData);
  }

  changeEmployeePassword(userId: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.employeesUrl}/${userId}/change-password`, { newPassword }, { responseType: "text" });
  }

  deleteEmployee(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.employeesUrl}/${userId}`);
  }

  bulkDeleteEmployees(userIds: string[]): Observable<{ deletedCount: number; failedIds: string[] }> {
    return this.http.post<{ deletedCount: number; failedIds: string[] }>(`${this.employeesUrl}/bulk-delete`, { userIds });
  }

  lockEmployee(userId: string): Observable<string> {
    return this.http.post(`${this.employeesUrl}/${userId}/lock`, {}, { responseType: "text" });
  }

  unlockEmployee(userId: string): Observable<string> {
    return this.http.post(`${this.employeesUrl}/${userId}/unlock`, {}, { responseType: "text" });
  }

  getEmployeeRoles(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.employeesUrl}/${userId}/roles`);
  }

  assignRole(userId: string, roleName: string): Observable<string> {
    return this.http.post(
      `${this.employeesUrl}/${userId}/roles/${encodeURIComponent(roleName)}`,
      {},
      { responseType: "text" }
    );
  }

  removeRole(userId: string, roleName: string): Observable<string> {
    return this.http.delete(
      `${this.employeesUrl}/${userId}/roles/${encodeURIComponent(roleName)}`,
      { responseType: "text" }
    );
  }

  private normalizeDateForFormData(value?: string | Date | Date[] | null): string | null {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return null;
      }
      return this.normalizeDateForFormData(value[0]);
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }
      return value.toISOString();
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return trimmed;
  }
}
