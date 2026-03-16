import { Component, OnInit, OnDestroy, EventEmitter, Output, Inject, ViewChild, TemplateRef, DOCUMENT } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

import { EventService } from '../../core/services/event.service';

//Logout

import { Router } from '@angular/router';
import { TokenStorageService } from '../../core/services/token-storage.service';

// Language
import { CookieService } from 'ngx-cookie-service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { GlobalComponent } from 'src/app/global-component';
import { RequestNotificationItem, RequestNotificationsResponse } from './topbar.model';
import { Branch } from 'src/app/pages/admin/interfaces/branch.interface';
import { CompanyInfoService } from 'src/app/pages/admin/services/company-info.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
    standalone: false
})
export class TopbarComponent implements OnInit, OnDestroy {
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
  branches: Branch[] = [];
  canSwitchBranch = false;
  selectedBranchId: number | null = null;
  branchSearchTerm = '';
  isDropdownOpen = false;
  companyLightLogoUrl = 'assets/images/logo-light.png';
  private destroy$ = new Subject<void>();

  constructor(@Inject(DOCUMENT) private document: any, private eventService: EventService, public languageService: LanguageService,
    public _cookiesService: CookieService, public translate: TranslateService,
     private authService: MyAuthService,
    private tokenStorageService: TokenStorageService,
    private accessControlService: AccessControlService,
    private router: Router,
    private http: HttpClient,
    private companyInfoService: CompanyInfoService) { }

  ngOnInit(): void {
    this.userData = this.tokenStorageService.getUser();
    this.hydrateCurrentUserProfile();
    this.element = document.documentElement;
    this.canSwitchBranch = this.accessControlService.hasRole(['Admin', 'Manager']);

    // Cookies wise Language set
    this.cookieValue = this.languageService.getCurrentLanguage();
    this.languageService.setLanguage(this.cookieValue);
    const selected = this.listLang.find(x => x.lang === this.cookieValue) || this.listLang.find(x => x.lang === 'ar');
    this.countryName = selected?.text || 'العربية';
    this.flagvalue = selected?.flag || 'assets/images/flags/sa.svg';

    if (this.canSwitchBranch) {
      const userBranchId = Number(this.userData?.branchId) || null;
      this.selectedBranchId = this.tokenStorageService.getSelectedBranchId() ?? userBranchId;
      if (this.selectedBranchId) {
        this.tokenStorageService.setSelectedBranchId(this.selectedBranchId);
      }
      this.loadBranches();
    } else {
      // Prevent stale branch override from another session/user.
      this.selectedBranchId = null;
      this.tokenStorageService.clearSelectedBranchId();
    }

    this.loadRequestNotifications();
    this.loadCompanyLightLogo();
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

  private get currentUserData(): any {
    return this.tokenStorageService.getUser() || this.userData || {};
  }

  get headerProfileImageUrl(): string {
    const user = this.currentUserData;
    const image = this.readUserString(
      user,
      'profileImageUrl',
      'ProfileImageUrl',
      'profile_image_url',
      'imageUrl',
      'ImageUrl',
      'avatarUrl',
      'AvatarUrl'
    );

    if (image) {
      const version = Number(user?.profileImageVersion) || 0;
      if (image.startsWith('http') || image.startsWith('data:')) {
        if (version > 0 && !image.startsWith('data:')) {
          return `${image}${image.includes('?') ? '&' : '?'}v=${version}`;
        }
        return image;
      }
      const clean = image.startsWith('/') ? image.substring(1) : image;
      const base = `${GlobalComponent.API_URL}/${clean}`;
      return version > 0 ? `${base}?v=${version}` : base;
    }

    return 'assets/images/users/avatar-1.jpg';
  }

  onBranchChanged(value: string): void {
    const activeLang = this.languageService.getCurrentLanguage();
    this.languageService.setLanguage(activeLang);
    this.cookieValue = activeLang;

    const branchId = Number(value);
    const normalized = Number.isFinite(branchId) && branchId > 0 ? branchId : null;
    this.selectedBranchId = normalized;
    this.tokenStorageService.setSelectedBranchId(normalized);
    window.location.reload();
  }

  onSelectBranch(branchId: number): void {
    this.branchSearchTerm = '';
    this.onBranchChanged(String(branchId));
  }

  get filteredBranches(): Branch[] {
    const term = (this.branchSearchTerm || '').trim().toLowerCase();
    if (!term) {
      return this.branches;
    }

    return this.branches.filter(branch => {
      const ar = (branch.branchNameAr || '').toLowerCase();
      const en = (branch.branchNameEn || '').toLowerCase();
      return ar.includes(term) || en.includes(term);
    });
  }

  get selectedBranchDisplayName(): string {
    if (!this.selectedBranchId) {
      return this.translate.instant('COMMON.BRANCH');
    }

    const selected = this.branches.find(x => x.id === this.selectedBranchId);
    if (selected) {
      return this.getBranchDisplayName(selected);
    }

    return this.translate.instant('COMMON.BRANCH');
  }

  getBranchDisplayName(branch: Branch): string {
    const isArabic = (this.cookieValue || 'ar').toLowerCase() === 'ar';
    return isArabic
      ? (branch.branchNameAr || branch.branchNameEn || `#${branch.id}`)
      : (branch.branchNameEn || branch.branchNameAr || `#${branch.id}`);
  }

  private getLocalizedUserName(): string {
    const user = this.currentUserData;
    const isArabic = (this.cookieValue || 'ar').toLowerCase() === 'ar';

    // Use localized full-name variants and API login aliases.
    const fullAr = this.readUserString(
      user,
      'fullNameAr', 'FullNameAr',
      'fullnameAr', 'full_name_ar',
      'nameAr', 'NameAr'
    );
    const fullEn = this.readUserString(
      user,
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
    if (this.canSwitchBranch && this.selectedBranchId) {
      const selectedBranch = this.branches.find(x => x.id === this.selectedBranchId);
      if (selectedBranch) {
        return this.getBranchDisplayName(selectedBranch);
      }
    }

    const user = this.currentUserData;
    const isArabic = (this.cookieValue || 'ar').toLowerCase() === 'ar';

    const branchAr = this.readUserString(
      user,
      'branchNameAr', 'BranchNameAr',
      'branch_name_ar', 'branchAr'
    );
    const branchEn = this.readUserString(
      user,
      'branchNameEn', 'BranchNameEn',
      'branch_name_en', 'branchEn',
      'branchName', 'BranchName'
    );

    return isArabic ? (branchAr || branchEn) : (branchEn || branchAr);
  }

  private readUserString(user: any, ...keys: string[]): string {
    for (const key of keys) {
      const value = user?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private loadBranches(): void {
    const url = `${GlobalComponent.API_URL}/api/branches`;
    this.http.get<Branch[]>(url).pipe(first()).subscribe({
      next: (items) => {
        this.branches = items || [];
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  private hydrateCurrentUserProfile(): void {
    const authUser = this.tokenStorageService.getUser() || {};
    const authEmployeeId = Number(authUser.employeeId);
    const authUserId = (authUser.id || authUser.userId || '').toString().trim().toLowerCase();
    const authUserName = (authUser.userName || authUser.username || '').toString().trim().toLowerCase();
    const authEmail = (authUser.email || '').toString().trim().toLowerCase();

    this.http.get<any[]>(`${GlobalComponent.API_URL}/api/employees`).pipe(first()).subscribe({
      next: (employees) => {
        const list = Array.isArray(employees) ? employees : [];
        let employee = list.find(e => Number.isFinite(authEmployeeId) && authEmployeeId > 0 && e.employeeId === authEmployeeId) || null;

        if (!employee && authUserId) {
          employee = list.find(e => (e.id || '').toString().trim().toLowerCase() === authUserId) || null;
        }

        if (!employee && authUserName) {
          employee = list.find(e => (e.userName || '').toString().trim().toLowerCase() === authUserName) || null;
        }

        if (!employee && authEmail) {
          employee = list.find(e => (e.email || '').toString().trim().toLowerCase() === authEmail) || null;
        }

        if (!employee) {
          return;
        }

        const rememberMe = window.localStorage.getItem('rememberMe') === 'true';
        const mergedUser = {
          ...authUser,
          userName: employee.userName || authUser.userName,
          email: employee.email || authUser.email,
          nameEn: employee.nameEn || authUser.nameEn,
          nameAr: employee.nameAr || authUser.nameAr,
          fullNameEn: employee.fullNameEn || employee.nameEn || authUser.fullNameEn || authUser.nameEn,
          fullNameAr: employee.fullNameAr || employee.nameAr || authUser.fullNameAr || authUser.nameAr,
          branchId: employee.branchId ?? authUser.branchId,
          departmentId: employee.departmentId ?? authUser.departmentId,
          branchName: employee.branchName || authUser.branchName,
          departmentName: employee.departmentName || authUser.departmentName,
          profileImageUrl: employee.profileImageUrl || authUser.profileImageUrl,
          profileImageVersion: Date.now()
        };

        this.tokenStorageService.saveUser(mergedUser, rememberMe);
        this.userData = mergedUser;
      }
    });
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

  private loadCompanyLightLogo(): void {
    this.companyInfoService.watchCompanyInfos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        const company = Array.isArray(items) && items.length > 0 ? items[0] : null;
        const resolved = this.resolveCompanyLogoUrl(company?.logoUrl);
        if (resolved) {
          this.companyLightLogoUrl = resolved;
        }
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

  getNotificationCarImageUrl(item: RequestNotificationItem): string | null {
    const raw = item?.carImageUrl?.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
    const base = (GlobalComponent.API_URL || '').replace(/\/+$/, '');
    const normalized = raw.replace(/^\/+/, '');
    return base ? `${base}/${normalized}` : raw;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
