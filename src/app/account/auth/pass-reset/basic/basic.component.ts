import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { getErrorMessage } from 'src/app/pages/admin/shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { LanguageService } from 'src/app/core/services/language.service';
import { CompanyInfoService } from 'src/app/pages/admin/services/company-info.service';
import { GlobalComponent } from 'src/app/global-component';

@Component({
    selector: 'app-basic',
    templateUrl: './basic.component.html',
    styleUrls: ['./basic.component.scss'],
    standalone: false
})

/**
 * Pass-Reset Basic Component
 */
export class BasicComponent implements OnInit, OnDestroy {

  // Login Form
  passresetForm!: UntypedFormGroup;
  requestSubmitted = false;
  resetSubmitted = false;
  requestLoading = false;
  resetLoading = false;
  isResetStep = false;
  fieldTextType = false;
  confirmFieldTextType = false;
  successMessage = '';
  errorMessage = '';

  // set the current year
  year: number = new Date().getFullYear();
  footerCompanyName = '';
  companyLogoUrl = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private myAuthService: MyAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private languageService: LanguageService,
    private companyInfoService: CompanyInfoService
  ) { }

  ngOnInit(): void {
     // Use the language selected previously on login page.
     this.languageService.setLanguage(this.languageService.getCurrentLanguage());
     this.loadCompanyName();

     this.passresetForm = this.formBuilder.group({
      userNameOrEmail: ['', [Validators.required]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    this.route.queryParamMap.pipe(first()).subscribe(params => {
      const token = params.get('token')?.trim() || '';
      const user = params.get('user')?.trim() || params.get('email')?.trim() || '';

      if (user) {
        this.f['userNameOrEmail'].setValue(user);
      }

      if (token) {
        this.f['token'].setValue(token);
        this.isResetStep = true;
      }
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.passresetForm.controls; }

  onRequestReset() {
    this.requestSubmitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    const identifier = this.f['userNameOrEmail'].value?.trim();
    if (!identifier) {
      return;
    }

    this.requestLoading = true;

    this.myAuthService
      .forgotPassword(identifier)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.requestLoading = false;
          this.isResetStep = true;
          this.successMessage = this.translate.instant('AUTH.PASS_RESET.REQUEST_SUCCESS');
        },
        error: (error) => {
          this.requestLoading = false;
          this.errorMessage = getErrorMessage(error, this.translate.instant('AUTH.PASS_RESET.REQUEST_FAILED'));
          this.showErrorSwal(this.errorMessage);
        }
      });
  }

  onResetPassword() {
    this.resetSubmitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    const identifier = this.f['userNameOrEmail'].value?.trim();
    const token = this.f['token'].value?.trim();
    const newPassword = this.f['newPassword'].value ?? '';
    const confirmPassword = this.f['confirmPassword'].value ?? '';

    if (!identifier || !token || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = this.translate.instant('AUTH.PASS_RESET.CONFIRM_MATCH');
      return;
    }

    this.resetLoading = true;

    this.myAuthService
      .resetPassword(identifier, token, newPassword)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.resetLoading = false;
          this.successMessage = this.translate.instant('AUTH.PASS_RESET.RESET_SUCCESS');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.resetLoading = false;
          this.errorMessage = getErrorMessage(error, this.translate.instant('AUTH.PASS_RESET.RESET_FAILED'));
          this.showErrorSwal(this.errorMessage);
        }
      });
  }

  private showErrorSwal(message: string) {
    Swal.fire({
      icon: 'error',
      title: this.translate.instant('AUTH.PASS_RESET.ERROR_TITLE'),
      text: message || this.translate.instant('AUTH.PASS_RESET.GENERIC_ERROR'),
      confirmButtonText: this.translate.instant('AUTH.PASS_RESET.OK')
    });
  }

  togglePasswordField() {
    this.fieldTextType = !this.fieldTextType;
  }

  toggleConfirmPasswordField() {
    this.confirmFieldTextType = !this.confirmFieldTextType;
  }

  private loadCompanyName(): void {
    this.companyInfoService.watchCompanyInfos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        const company = Array.isArray(items) && items.length > 0 ? items[0] : null;
        if (!company) {
          return;
        }

        const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
        const nameAr = (company.companyNameAr || '').trim();
        const nameEn = (company.companyNameEn || '').trim();
        this.companyLogoUrl = this.resolveCompanyLogoUrl(company.logoUrl);
        this.footerCompanyName = isArabic ? (nameAr || nameEn || '') : (nameEn || nameAr || '');
      },
      error: () => {
        this.companyLogoUrl = '';
        this.footerCompanyName = '';
      }
    });
  }

  private resolveCompanyLogoUrl(url?: string): string {
    const value = (url || '').trim();
    if (!value) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
      return value;
    }

    const base = (GlobalComponent.API_URL || '').replace(/\/+$/, '');
    const path = value.replace(/^\/+/, '');
    return base ? `${base}/${path}` : value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
