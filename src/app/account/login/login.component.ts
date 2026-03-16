import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { first } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from './toast-service';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { User } from 'src/app/store/Authentication/auth.models';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/core/services/language.service';
import { CompanyInfoService } from 'src/app/pages/admin/services/company-info.service';
import { GlobalComponent } from 'src/app/global-component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})

/**
 * Login Component
 */
export class LoginComponent implements OnInit, OnDestroy {

  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;
  error = '';
  returnUrl!: string;

  toast!: false;

  // set the current year
  year: number = new Date().getFullYear();
  footerCompanyName = 'Global';
  companyLogoUrl = '';
  selectedLanguage = 'ar';
  private destroy$ = new Subject<void>();

  constructor(private formBuilder: UntypedFormBuilder, private router: Router,
    private route: ActivatedRoute, public toastService: ToastService,
    private myAuthService: MyAuthService,
    private tokenStorageService: TokenStorageService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private companyInfoService: CompanyInfoService) {
    // Redirect authenticated users to requested deep link if provided.
    this.returnUrl = this.resolveReturnUrl(this.route.snapshot.queryParams['returnUrl']);
    if (this.myAuthService.currentUserValue) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  ngOnInit(): void {
    // Default to Arabic when no previous selection exists.
    this.selectedLanguage = this.languageService.getCurrentLanguage() || 'ar';
    this.languageService.setLanguage(this.selectedLanguage);
    this.loadCompanyName();

    if (this.tokenStorageService.getUser()) {
      this.router.navigateByUrl(this.returnUrl);
    }
    /**
     * Form Validatyion
     */
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
    // get return url from route parameters or default to '/'
    this.returnUrl = this.resolveReturnUrl(this.route.snapshot.queryParams['returnUrl']);
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    } else {
      this.submitted = true;

      this.myAuthService
        .login(this.f['userName'].value, this.f['password'].value, !!this.f['rememberMe'].value)
        .pipe(first())
        .subscribe({
          next: (user: User) => {
            this.submitted = false;

            sessionStorage.setItem('toast', 'true');
            this.router.navigateByUrl(this.returnUrl);
          },
          error: (error) => {
            this.submitted = false;

            this.error = error ? error : this.translate.instant('AUTH.LOGIN.INVALID_CREDENTIALS');

            this.toastService.show(this.error, {
              classname: 'bg-danger text-white',
              delay: 5000
            });
          }
        });
    }
  }

  private resolveReturnUrl(returnUrl?: string): string {
    return returnUrl && returnUrl.startsWith('/') ? returnUrl : '/';
  }

  onLanguageChange(lang: 'ar' | 'en') {
    this.selectedLanguage = lang;
    this.languageService.setLanguage(lang);
    this.loadCompanyName();
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
        this.footerCompanyName = isArabic ? (nameAr || nameEn) : (nameEn || nameAr );
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

    /**
     * Password Hide/Show
     */
    toggleFieldTextType() {
      this.fieldTextType = !this.fieldTextType;
    }

  }
