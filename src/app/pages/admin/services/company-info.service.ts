import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { CompanyInfo, CreateCompanyInfoRequest, UpdateCompanyInfoRequest } from '../interfaces/company-info.interface';
import { GlobalComponent } from 'src/app/global-component';

@Injectable({
  providedIn: 'root'
})
export class CompanyInfoService {
  private apiUrl = GlobalComponent.API_URL + '/api/CompanyInformations';
  private refreshCompanyInfos$ = new Subject<void>();
  private companyInfos$ = this.refreshCompanyInfos$.pipe(
    startWith(void 0),
    switchMap(() => this.http.get<CompanyInfo[]>(this.apiUrl).pipe(
      catchError(() => of([] as CompanyInfo[]))
    )),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {}

  getCompanyInfos(): Observable<CompanyInfo[]> {
    return this.http.get<CompanyInfo[]>(this.apiUrl);
  }

  watchCompanyInfos(): Observable<CompanyInfo[]> {
    return this.companyInfos$;
  }

  refreshCompanyInfos(): void {
    this.refreshCompanyInfos$.next();
  }

  getCompanyInfoById(id: number): Observable<CompanyInfo> {
    return this.http.get<CompanyInfo>(`${this.apiUrl}/${id}`);
  }

  createCompanyInfo(request: CreateCompanyInfoRequest): Observable<CompanyInfo> {
    const formData = new FormData();
    if (request.companyNameAr) formData.append('companyNameAr', request.companyNameAr);
    if (request.companyNameEn) formData.append('companyNameEn', request.companyNameEn);
    if (request.crNumber) formData.append('crNumber', request.crNumber);
    if (request.logoFile) formData.append('logoFile', request.logoFile);
    if (request.mobileNo) formData.append('mobileNo', request.mobileNo);
    if (request.telNo) formData.append('telNo', request.telNo);
    if (request.email) formData.append('email', request.email);
    if (request.aboutUsAr) formData.append('aboutUsAr', request.aboutUsAr);
    if (request.aboutUsEn) formData.append('aboutUsEn', request.aboutUsEn);
    if (request.ourMissionAr) formData.append('ourMissionAr', request.ourMissionAr);
    if (request.ourMissionEn) formData.append('ourMissionEn', request.ourMissionEn);
    if (request.ourGoalsAr) formData.append('ourGoalsAr', request.ourGoalsAr);
    if (request.ourGoalsEn) formData.append('ourGoalsEn', request.ourGoalsEn);
    return this.http.post<CompanyInfo>(this.apiUrl, formData).pipe(
      tap(() => this.refreshCompanyInfos())
    );
  }

  updateCompanyInfo(id: number, request: UpdateCompanyInfoRequest): Observable<void> {
    const formData = new FormData();
    if (request.companyNameAr) formData.append('companyNameAr', request.companyNameAr);
    if (request.companyNameEn) formData.append('companyNameEn', request.companyNameEn);
    if (request.crNumber) formData.append('crNumber', request.crNumber);
    if (request.logoFile) formData.append('logoFile', request.logoFile);
    if (request.mobileNo) formData.append('mobileNo', request.mobileNo);
    if (request.telNo) formData.append('telNo', request.telNo);
    if (request.email) formData.append('email', request.email);
    if (request.aboutUsAr) formData.append('aboutUsAr', request.aboutUsAr);
    if (request.aboutUsEn) formData.append('aboutUsEn', request.aboutUsEn);
    if (request.ourMissionAr) formData.append('ourMissionAr', request.ourMissionAr);
    if (request.ourMissionEn) formData.append('ourMissionEn', request.ourMissionEn);
    if (request.ourGoalsAr) formData.append('ourGoalsAr', request.ourGoalsAr);
    if (request.ourGoalsEn) formData.append('ourGoalsEn', request.ourGoalsEn);
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData).pipe(
      tap(() => this.refreshCompanyInfos())
    );
  }

  deleteCompanyInfo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshCompanyInfos())
    );
  }
}
