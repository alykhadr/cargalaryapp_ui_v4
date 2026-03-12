import { Component, OnInit, EventEmitter, Output, Inject, ViewChild, TemplateRef, DOCUMENT } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';

import { EventService } from '../../core/services/event.service';

//Logout

import { Router } from '@angular/router';
import { TokenStorageService } from '../../core/services/token-storage.service';

// Language
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { GlobalComponent } from 'src/app/global-component';
import { RequestNotificationItem, RequestNotificationsResponse } from './topbar.model';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
    standalone: false
})
export class TopbarComponent implements OnInit {
  element: any;
  mode: string | undefined;
  @Output() mobileMenuButtonClicked = new EventEmitter();
  requestNotifications: RequestNotificationItem[] = [];
  notificationCount = 0;
  isLoadingNotifications = false;
  notificationsLoadFailed = false;
  flagvalue = 'assets/images/flags/sa.svg';
  countryName = 'العربية';
  cookieValue = 'ar';
  userData: any;
  isDropdownOpen = false;

  constructor(@Inject(DOCUMENT) private document: any, private eventService: EventService, public languageService: LanguageService,
    public _cookiesService: CookieService, public translate: TranslateService,
     private authService: MyAuthService,
    private router: Router, private TokenStorageService: TokenStorageService,
    private http: HttpClient) { }

  ngOnInit(): void {
    this.userData = this.TokenStorageService.getUser();
    this.element = document.documentElement;

    // Cookies wise Language set
    this.cookieValue = (this._cookiesService.get('lang') || 'ar').toLowerCase();
    const selected = this.listLang.find(x => x.lang === this.cookieValue) || this.listLang.find(x => x.lang === 'ar');
    this.countryName = selected?.text || 'العربية';
    this.flagvalue = selected?.flag || 'assets/images/flags/sa.svg';

    this.loadRequestNotifications();
  }

  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    document.querySelector('.hamburger-icon')?.classList.toggle('open')
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }
  /**
  * Topbar Light-Dark Mode Change
  */
  changeMode(mode: string) {
    this.mode = mode;
    this.eventService.broadcast('changeMode', mode);

    switch (mode) {
      case 'light':
        document.documentElement.setAttribute('data-bs-theme', "light");
        break;
      case 'dark':
        document.documentElement.setAttribute('data-bs-theme', "dark");
        break;
      default:
        document.documentElement.setAttribute('data-bs-theme', "light");
        break;
    }
  }

  /***
   * Language Listing
   */
  listLang = [
    { text: 'English', flag: 'assets/images/flags/us.svg', lang: 'en' },
    { text: 'العربية', flag: 'assets/images/flags/sa.svg', lang: 'ar' },
  ];

  /***
   * Language Value Set
   */
  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.cookieValue = (lang || 'ar').toLowerCase();
    this.languageService.setLanguage(lang);
  }

  get welcomeUserText(): string {
    const prefix = this.translate.instant('HEADER.WELCOME_USER');
    const name = this.getLocalizedUserName();
    return name ? `${prefix} ${name}` : prefix;
  }

  get currentDateText(): string {
    const locale = (this.cookieValue || 'ar').toLowerCase() === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  }

  get localizedBranchText(): string {
    const branchName = this.getLocalizedBranchName();
    if (!branchName) {
      return '';
    }
    return `${this.translate.instant('COMMON.BRANCH')}: ${branchName}`;
  }

  private getLocalizedUserName(): string {
    const user = this.userData || {};
    const isArabic = (this.cookieValue || 'ar').toLowerCase() === 'ar';

    const read = (...keys: string[]): string => {
      for (const key of keys) {
        const value = user?.[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
      return '';
    };

    // Use localized full-name variants and API login aliases.
    const fullAr = read(
      'fullNameAr', 'FullNameAr',
      'fullnameAr', 'full_name_ar',
      'nameAr', 'NameAr'
    );
    const fullEn = read(
      'fullNameEn', 'FullNameEn',
      'fullnameEn', 'full_name_en',
      'nameEn', 'NameEn'
    );

    if (isArabic) {
      return fullAr || fullEn;
    }

    return fullEn || fullAr;
  }

  private getLocalizedBranchName(): string {
    const user = this.userData || {};
    const isArabic = (this.cookieValue || 'ar').toLowerCase() === 'ar';

    const read = (...keys: string[]): string => {
      for (const key of keys) {
        const value = user?.[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
      return '';
    };

    const branchAr = read(
      'branchNameAr', 'BranchNameAr',
      'branch_name_ar', 'branchAr'
    );
    const branchEn = read(
      'branchNameEn', 'BranchNameEn',
      'branch_name_en', 'branchEn',
      'branchName', 'BranchName'
    );

    return isArabic ? (branchAr || branchEn) : (branchEn || branchAr);
  }

  /**
   * Logout the user
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  windowScroll() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      (document.getElementById("back-to-top") as HTMLElement).style.display = "block";
      document.getElementById('page-topbar')?.classList.add('topbar-shadow');
    } else {
      (document.getElementById("back-to-top") as HTMLElement).style.display = "none";
      document.getElementById('page-topbar')?.classList.remove('topbar-shadow');
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (this.isDropdownOpen) {
      this.isDropdownOpen = false;
    } else {
      this.isDropdownOpen = true;
    }
  }
  // Search Topbar
  Search() {
    var searchOptions = document.getElementById("search-close-options") as HTMLAreaElement;
    var dropdown = document.getElementById("search-dropdown") as HTMLAreaElement;
    var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
    input = document.getElementById("search-options") as HTMLAreaElement;
    filter = input.value.toUpperCase();
    var inputLength = filter.length;

    if (inputLength > 0) {
      dropdown.classList.add("show");
      searchOptions.classList.remove("d-none");
      var inputVal = input.value.toUpperCase();
      var notifyItem = document.getElementsByClassName("notify-item");

      Array.from(notifyItem).forEach(function (element: any) {
        var notifiTxt = ''
        if (element.querySelector("h6")) {
          var spantext = element.getElementsByTagName("span")[0].innerText.toLowerCase()
          var name = element.querySelector("h6").innerText.toLowerCase()
          if (name.includes(inputVal)) {
            notifiTxt = name
          } else {
            notifiTxt = spantext
          }
        } else if (element.getElementsByTagName("span")) {
          notifiTxt = element.getElementsByTagName("span")[0].innerText.toLowerCase()
        }
        if (notifiTxt)
          element.style.display = notifiTxt.includes(inputVal) ? "block" : "none";

      });
    } else {
      dropdown.classList.remove("show");
      searchOptions.classList.add("d-none");
    }
  }

  /**
   * Search Close Btn
   */
  closeBtn() {
    var searchOptions = document.getElementById("search-close-options") as HTMLAreaElement;
    var dropdown = document.getElementById("search-dropdown") as HTMLAreaElement;
    var searchInputReponsive = document.getElementById("search-options") as HTMLInputElement;
    dropdown.classList.remove("show");
    searchOptions.classList.add("d-none");
    searchInputReponsive.value = "";
  }

  private loadRequestNotifications() {
    this.isLoadingNotifications = true;
    this.notificationsLoadFailed = false;
    this.http.get<RequestNotificationsResponse>(`${GlobalComponent.API_URL}/api/Requests/notifications`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.notificationCount = response?.count ?? 0;
          this.requestNotifications = response?.items ?? [];
          this.isLoadingNotifications = false;
          this.notificationsLoadFailed = false;
        },
        error: () => {
          this.notificationCount = 0;
          this.requestNotifications = [];
          this.isLoadingNotifications = false;
          this.notificationsLoadFailed = true;
        }
      });
  }

  getNotificationCarImageUrl(item: RequestNotificationItem): string | null {
    const raw = item?.carImageUrl?.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
    const base = (GlobalComponent.API_URL || '').replace(/\/+$/, '');
    const normalized = raw.replace(/^\/+/, '');
    return base ? `${base}/${normalized}` : raw;
  }
}
