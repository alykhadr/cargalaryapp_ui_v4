import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  public languages: string[] = ['en', 'ar'];

  constructor(public translate: TranslateService, private cookieService: CookieService) {

    /***
     * cookie Language Get
    */
    this.translate.addLangs(this.languages);
    const initialLang = this.cookieService.check('lang') ? this.cookieService.get('lang') : 'ar';
    this.applyLanguage(initialLang);
  }

  /***
   * Cookie Language set
   */
  public setLanguage(lang: any) {
    this.applyLanguage(lang);
  }

  public getCurrentLanguage(): string {
    return (this.cookieService.get('lang') || this.translate.currentLang || 'ar').toLowerCase();
  }

  private applyLanguage(lang: string) {
    const normalized = (lang || 'ar').toLowerCase();
    const safeLang = normalized.match(/en|ar/) ? normalized : 'ar';
    const isArabic = safeLang === 'ar';

    this.translate.use(safeLang);
    this.cookieService.set('lang', safeLang);
    document.documentElement.setAttribute('lang', safeLang);
    document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    if (document.body) {
      document.body.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    }
  }

}
