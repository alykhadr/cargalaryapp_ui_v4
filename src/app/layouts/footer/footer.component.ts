import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { CompanyInfoService } from 'src/app/pages/admin/services/company-info.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit {

  // set the currenr year
  year: number = new Date().getFullYear();
  footerCompanyName = 'Velzon';

  constructor(
    private companyInfoService: CompanyInfoService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadCompanyName();
  }

  private loadCompanyName(): void {
    this.companyInfoService.getCompanyInfos().pipe(first()).subscribe({
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

}
