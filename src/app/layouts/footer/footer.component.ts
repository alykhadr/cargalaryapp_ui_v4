import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CompanyInfoService } from 'src/app/pages/admin/services/company-info.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {

  // set the currenr year
  year: number = new Date().getFullYear();
  footerCompanyName = 'Velzon';
  private destroy$ = new Subject<void>();

  constructor(
    private companyInfoService: CompanyInfoService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
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
        this.footerCompanyName = isArabic ? (nameAr || nameEn || 'Velzon') : (nameEn || nameAr || 'Velzon');
      },
      error: () => {
        this.footerCompanyName = 'Velzon';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
