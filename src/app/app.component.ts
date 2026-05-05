import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { patchSwalDeleteI18n } from './core/utils/swal-delete-i18n';
import { GlobalComponent } from './global-component';
import { CompanyInfo } from './pages/admin/interfaces/company-info.interface';
import { CompanyInfoService } from './pages/admin/services/company-info.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'velzon';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private titleService: Title,
    private translate: TranslateService,
    private companyInfoService: CompanyInfoService
  ) {
    patchSwalDeleteI18n();
  }

  ngOnInit(): void {
    const lang$ = this.translate.onLangChange.pipe(
      startWith({ lang: this.resolveLanguage() })
    );

    combineLatest([
      this.companyInfoService.watchCompanyInfos(),
      lang$
    ]).pipe(takeUntil(this.destroy$)).subscribe(([companyInfos, langChange]) => {
      this.titleService.setTitle(this.buildAppTitle(companyInfos, langChange.lang));
      this.updateFavicon(companyInfos);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildAppTitle(companyInfos: CompanyInfo[], lang: string): string {
    const currentLang = (lang || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
    const activeCompany = companyInfos.find((info) => info.isAvailable) || companyInfos[0];
    const companyName = currentLang === 'ar'
      ? (activeCompany?.companyNameAr || activeCompany?.companyNameEn || '')
      : (activeCompany?.companyNameEn || activeCompany?.companyNameAr || '');
    const dashboardLabel = currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard';

    return companyName ? `${companyName} - ${dashboardLabel}` : dashboardLabel;
  }

  private resolveLanguage(): string {
    const lang = (this.translate.currentLang || document.documentElement.lang || 'ar').toLowerCase();
    return lang.startsWith('en') ? 'en' : 'ar';
  }

  private updateFavicon(companyInfos: CompanyInfo[]): void {
    const activeCompany = companyInfos.find((info) => info.isAvailable) || companyInfos[0];
    const logoUrl = (activeCompany?.logoUrl || '').trim();
    const faviconUrl = logoUrl ? this.resolveMediaUrl(logoUrl) : 'assets/images/favicon.ico';

    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      document.head.appendChild(faviconLink);
    }

    faviconLink.setAttribute('type', 'image/x-icon');
    faviconLink.setAttribute('href', faviconUrl);

    if (logoUrl) {
      this.applyRoundedFavicon(faviconLink, faviconUrl);
    }
  }

  private resolveMediaUrl(url: string): string {
    if (!url) {
      return 'assets/images/favicon.ico';
    }

    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }

    const normalized = url.startsWith('/') ? url.substring(1) : url;
    return `${GlobalComponent.API_URL}/${normalized}`;
  }

  private applyRoundedFavicon(link: HTMLLinkElement, sourceUrl: string): void {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, size, size);
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      const zoom = 1.2;
      const drawSize = size * zoom;
      const offset = (size - drawSize) / 2;
      context.drawImage(image, offset, offset, drawSize, drawSize);

      const roundedDataUrl = canvas.toDataURL('image/png');
      link.setAttribute('type', 'image/png');
      link.setAttribute('href', roundedDataUrl);
    };
    image.src = sourceUrl;
  }
}
