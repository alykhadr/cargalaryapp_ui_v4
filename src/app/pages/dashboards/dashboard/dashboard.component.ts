import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast-service';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { first } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { PaginationService } from 'src/app/core/services/pagination.service';

import { circle, circleMarker, latLng, latLngBounds, Map, tileLayer } from 'leaflet';

import { ChartType } from './dashboard.model';
import { statData } from 'src/app/core/data';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})

/**
 * Ecommerce Component
 */
export class DashboardComponent implements OnInit, OnDestroy {

  // bread crumb items
  breadCrumbItems!: Array<{}>;
  analyticsChart!: ChartType;
  latestCars: Array<{
    id: number;
    nameAr?: string | null;
    nameEn?: string | null;
    createdAt: string;
    isAvailable: boolean;
    primaryImageUrl?: string | null;
    year?: number;
    requestsCount: number;
    totalStock: number;
  }> = [];
  latestCarsTotalCount = 0;
  latestCarsPager = new PaginationService();
  isLoadingLatestCars = false;
  latestBrands: Array<{
    id: number;
    nameAr?: string | null;
    nameEn?: string | null;
    imageUrl?: string | null;
    createdAt: string;
    isAvailable: boolean;
  }> = [];
  latestBrandsTotalCount = 0;
  latestBrandsPager = new PaginationService();
  isLoadingLatestBrands = false;
  favoriteCars: Array<{
    carId: number;
    userId: string;
    createdAt: string;
    priority: number;
    notes?: string | null;
    carNameAr?: string | null;
    carNameEn?: string | null;
    userName?: string | null;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    primaryImageUrl?: string | null;
  }> = [];
  favoriteCarsTotalCount = 0;
  favoriteCarsPager = new PaginationService();
  isLoadingFavoriteCars = false;
  bestSellerCars: Array<{
    carId: number;
    nameAr?: string | null;
    nameEn?: string | null;
    salesCount: number;
    lastSoldAt?: string | null;
    primaryImageUrl?: string | null;
  }> = [];
  bestSellerCarsTotalCount = 0;
  bestSellerCarsPager = new PaginationService();
  isLoadingBestSellerCars = false;
  latestRequests: Array<{
    id: number;
    name: string;
    email: string;
    mobileNo: string;
    createdAt: string;
    currentStatus: number;
    currentStatusNameAr?: string | null;
    currentStatusNameEn?: string | null;
    currentStatusCode?: string | null;
    carId: number;
    carNameAr?: string | null;
    carNameEn?: string | null;
  }> = [];
  latestRequestsTotalCount = 0;
  latestRequestsPager = new PaginationService();
  isLoadingLatestRequests = false;
  totalUsersCount = 0;
  isLoadingTotalUsers = false;
  totalBranchesCount = 0;
  isLoadingTotalBranches = false;
  totalEmployeesCount = 0;
  isLoadingTotalEmployees = false;
  totalOffersCount = 0;
  totalDepartmentsCount = 0;
  isLoadingTotalDepartments = false;
  totalCardsCounterOptions = {
    startVal: 0,
    useEasing: true,
    duration: 3.2,
    decimalPlaces: 0
  };
  productReviews: Array<{
    id: number;
    carId?: number | null;
    carNameAr?: string | null;
    carNameEn?: string | null;
    reviewerNameAr?: string | null;
    reviewerNameEn?: string | null;
    commentAr?: string | null;
    commentEn?: string | null;
    rateValue: number;
    createdAt: string;
  }> = [];
  isLoadingProductReviews = false;
  customerReviewSummary = {
    totalReviews: 0,
    averageRating: 0,
    distribution: [
      { star: 5, count: 0, percentage: 0 },
      { star: 4, count: 0, percentage: 0 },
      { star: 3, count: 0, percentage: 0 },
      { star: 2, count: 0, percentage: 0 },
      { star: 1, count: 0, percentage: 0 }
    ] as Array<{ star: number; count: number; percentage: number }>
  };
  isLoadingCustomerReviews = false;
  requestStatusCounts = {
    newCount: 0,
    contactCount: 0,
    inProgressCount: 0,
    closedSuccessCount: 0,
    closedLossCount: 0,
    conversionRatio: 0
  };
  isLoadingRequestStatusCounts = false;
  selectedStatusPeriod = '1m';
  statusPeriodOptions: Array<{
    code: string;
    nameAr?: string | null;
    nameEn?: string | null;
  }> = [];
  previewImageUrl: string | null = null;
  previewImageTitle = '';
  branchSales: Array<{
    branchId: number;
    nameAr?: string | null;
    nameEn?: string | null;
    salesCount: number;
    percentage: number;
    latitude?: number | null;
    longitude?: number | null;
  }> = [];
  dashboardOffers: Array<{
    id: number;
    offerNameAr?: string | null;
    offerNameEn?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    offerImageUrl?: string | null;
    expiredAt?: string | null;
    createdAt: string;
  }> = [];
  isLoadingDashboardOffers = false;
  dashboardMemberServices: Array<{
    id: number;
    nameAr?: string | null;
    nameEn?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    imageUrl?: string | null;
    createdAt: string;
  }> = [];
  isLoadingDashboardMemberServices = false;
  dashboardSalesContacts: Array<{
    id: number;
    contactValue?: string | null;
    contactType: number;
    typeNameAr?: string | null;
    typeNameEn?: string | null;
    contactIconUrl?: string | null;
    createdAt: string;
    branchId: number;
  }> = [];
  isLoadingDashboardSalesContacts = false;
  dashboardActiveEmployees: Array<{
    id: number;
    userId: string;
    branchId: number;
    createdAt: string;
    profileImageUrl?: string | null;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    departmentNameAr?: string | null;
    departmentNameEn?: string | null;
  }> = [];
  isLoadingDashboardActiveEmployees = false;
  employeeScope: 'branch' | 'all' = 'branch';
  employeeCanViewAllBranches = false;
  dashboardLoggedInUsers: Array<{
    id: string;
    employeeId?: number | null;
    userName?: string | null;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    branchId: number;
    branchNameAr?: string | null;
    branchNameEn?: string | null;
    profileImageUrl?: string | null;
    email?: string | null;
    mobileNo?: string | null;
    lastLoginAt?: string | null;
    lastActivityAt?: string | null;
  }> = [];
  dashboardLoggedInUsersTotalCount = 0;
  dashboardLoggedInUsersPager = new PaginationService();
  isLoadingDashboardLoggedInUsers = false;
  loggedInUsersScope: 'branch' | 'all' = 'branch';
  loggedInUsersCanViewAllBranches = false;
  totalBranchSales = 0;
  isLoadingBranchSales = false;
  mapFitBounds: any = null;
  SalesCategoryChart!: ChartType;
  bestSellerCarsChart!: ChartType;
  statData!: any;
  currentDate: any;
  userData: any;
  private destroy$ = new Subject<void>();
  // Current Date
  // currentDate: Date = new Date();

  constructor(
    public toastService: ToastService,
    private translate: TranslateService,
    private tokenStorageService: TokenStorageService,
    private http: HttpClient
  ) {
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.currentDate = { from: firstDay, to: lastDay };
    this.latestCarsPager.pageSize = 5;
    this.latestBrandsPager.pageSize = 5;
    this.favoriteCarsPager.pageSize = 5;
    this.bestSellerCarsPager.pageSize = 5;
    this.latestRequestsPager.pageSize = 6;
    this.dashboardLoggedInUsersPager.pageSize = 5;
  }

  ngOnInit(): void {
    this.userData = this.tokenStorageService.getUser();

    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.DASHBOARD.TEXT') },
      { label: this.translate.instant('MENUITEMS.DASHBOARD.LIST.ECOMMERCE'), active: true }
    ];

    if (sessionStorage.getItem('toast')) {
      this.toastService.show(this.translate.instant('DASHBOARD_PAGE.LOGIN_SUCCESS'), { classname: 'bg-success text-center text-white', delay: 5000 });
      sessionStorage.removeItem('toast');
    }

    /**
    * Fetches the data
    */
    this.fetchData();

    // Chart Color Data Get Function
    this._analyticsChart('["--vz-primary", "--vz-success", "--vz-danger"]');
    this._SalesCategoryChart();
    this._bestSellerCarsChart();

    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.breadCrumbItems = [
          { label: this.translate.instant('MENUITEMS.DASHBOARD.TEXT') },
          { label: this.translate.instant('MENUITEMS.DASHBOARD.LIST.ECOMMERCE'), active: true }
        ];
        this.applyRealAnalyticsSeries();
        this.applyBestSellerCarsChartSeries();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dashboardFullName(): string {
    const user = this.userData || {};
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');

    const fullAr = (user.fullNameAr || user.FullNameAr || user.fullnameAr || user.full_name_ar || user.nameAr || user.NameAr || '').toString().trim();
    const fullEn = (user.fullNameEn || user.FullNameEn || user.fullnameEn || user.full_name_en || user.nameEn || user.NameEn || '').toString().trim();

    return isArabic ? (fullAr || fullEn) : (fullEn || fullAr);
  }


  num: number = 0;
  option = {
    startVal: this.num,
    useEasing: true,
    duration: 2,
    decimalPlaces: 2,
  };

  // Chart Colors Set
  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
        if (color) {
          color = color.replace(" ", "");
          return color;
        }
        else return newValue;;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  /**
 * Sales Analytics Chart
 */
  setrevenuevalue(value: any) {
    this.applyRealAnalyticsSeries();
  }

  private _analyticsChart(colors: any) {
    const labels = this.getStatusChartLabels();
    this.analyticsChart = {
      chart: {
        height: 320,
        type: "bar",
        toolbar: {
          show: false,
        },
        style: {
          direction: 'rtl'
        }
      },
      stroke: {
        width: 0
      },
      colors: ['#405189', '#f7b84b', '#299cdb', '#0ab39c', '#f06548'],
      series: [{
        name: this.translate.instant('COMMON.TOTAL'),
        type: 'bar',
        data: [0, 0, 0, 0, 0]
      }],
      fill: {
        opacity: 0.9
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: labels,
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
      },
      grid: {
        show: true,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 8,
          bottom: 8,
          left: 8,
        },
      },
      legend: {
        show: false
      },
      plotOptions: {
        bar: {
          columnWidth: "45%",
          borderRadius: 4,
          distributed: true,
          dataLabels: {
            position: 'top'
          }
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -16,
        style: {
          fontSize: '11px'
        },
        formatter: (value: number) => `${Math.round(value)}`
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${Math.round(value)}`
        }
      }
    };
  }

  private getStatusChartLabels(): string[] {
    return [
      this.translate.instant('DASHBOARD_PAGE.REQUEST_STATUS.NEW'),
      this.translate.instant('DASHBOARD_PAGE.REQUEST_STATUS.CONTACT'),
      this.translate.instant('DASHBOARD_PAGE.REQUEST_STATUS.IN_PROGRESS'),
      this.translate.instant('DASHBOARD_PAGE.REQUEST_STATUS.CLOSED_SUCCESS'),
      this.translate.instant('DASHBOARD_PAGE.REQUEST_STATUS.CLOSED_LOSS')
    ];
  }

  private applyRealAnalyticsSeries() {
    const labels = this.getStatusChartLabels();

    this.analyticsChart.series = [{
      name: this.translate.instant('COMMON.TOTAL'),
      type: 'bar',
      data: [
        this.requestStatusCounts.newCount,
        this.requestStatusCounts.contactCount,
        this.requestStatusCounts.inProgressCount,
        this.requestStatusCounts.closedSuccessCount,
        this.requestStatusCounts.closedLossCount
      ]
    }];

    if (this.analyticsChart.xaxis) {
      this.analyticsChart.xaxis = {
        ...this.analyticsChart.xaxis,
        categories: labels
      };
    }

    this.applyRealSalesCategorySeries();
  }

  /**
 *  Sales Category
 */
  private _SalesCategoryChart() {
    this.SalesCategoryChart = {
      series: [0, 0, 0, 0, 0],
      labels: this.getStatusChartLabels(),
      chart: {
        height: 333,
        type: "donut",
      },
      legend: {
        position: "bottom",
      },
      stroke: {
        show: false
      },
      dataLabels: {
        dropShadow: {
          enabled: false,
        },
      },
      colors: ['#405189', '#f7b84b', '#299cdb', '#0ab39c', '#f06548']
    };
  }

  private _bestSellerCarsChart() {
    this.bestSellerCarsChart = {
      series: [],
      labels: [],
      chart: {
        height: 333,
        type: "donut",
      },
      legend: {
        position: "bottom",
      },
      stroke: {
        show: false
      },
      dataLabels: {
        dropShadow: {
          enabled: false,
        },
      },
      colors: ['#405189', '#f7b84b', '#299cdb', '#0ab39c', '#f06548']
    };
  }

  private applyBestSellerCarsChartSeries(): void {
    if (!this.bestSellerCarsChart) {
      return;
    }

    const labels = this.localizedBestSellerCars.map(x => x.displayCarName);
    const series = this.localizedBestSellerCars.map(x => Number(x.salesCount) || 0);

    this.bestSellerCarsChart = {
      ...this.bestSellerCarsChart,
      labels,
      series
    };
  }

  private applyRealSalesCategorySeries(): void {
    if (!this.SalesCategoryChart) {
      return;
    }

    this.SalesCategoryChart = {
      ...this.SalesCategoryChart,
      labels: this.getStatusChartLabels(),
      series: [
        this.requestStatusCounts.newCount,
        this.requestStatusCounts.contactCount,
        this.requestStatusCounts.inProgressCount,
        this.requestStatusCounts.closedSuccessCount,
        this.requestStatusCounts.closedLossCount
      ]
    };
  }

  /**
  * Fetches the data
  */
  private fetchData() {
    this.statData = statData;
    this.loadLatestCars();
    this.loadLatestBrands();
    this.loadFavoriteCars();
    this.loadBestSellerCars();
    this.loadLatestRequests();
    this.loadProductReviews();
    this.loadCustomerReviewSummary();
    this.loadRequestStatusCounts();
    this.loadBranchSales();
    this.loadDashboardOffers();
    this.loadDashboardMemberServices();
    this.loadDashboardSalesContacts();
    this.loadDashboardActiveEmployees();
    this.loadDashboardLoggedInUsers();
    this.loadTotalUsersCount();
    this.loadTotalBranchesCount();
    this.loadTotalEmployeesCount();
    this.loadTotalDepartmentsCount();
  }

  get localizedLatestCars(): Array<{
    id: number;
    displayName: string;
    createdAt: string;
    isAvailable: boolean;
    primaryImageUrl?: string | null;
    year?: number;
    requestsCount: number;
    totalStock: number;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.latestCars.map(item => ({
      id: item.id,
      displayName: isArabic
        ? (item.nameAr || item.nameEn || `#${item.id}`)
        : (item.nameEn || item.nameAr || `#${item.id}`),
      createdAt: item.createdAt,
      isAvailable: !!item.isAvailable,
      primaryImageUrl: item.primaryImageUrl,
      year: item.year,
      requestsCount: item.requestsCount ?? 0,
      totalStock: item.totalStock ?? 0
    }));
  }

  private loadLatestCars(): void {
    this.isLoadingLatestCars = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          nameAr?: string | null;
          nameEn?: string | null;
          createdAt: string;
          isAvailable: boolean;
          primaryImageUrl?: string | null;
          year?: number;
          requestsCount: number;
          totalStock: number;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/cars-by-created-date?page=${this.latestCarsPager.page}&pageSize=${this.latestCarsPager.pageSize}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.latestCars = Array.isArray(response?.items) ? response.items : [];
          this.latestCarsTotalCount = Number(response?.totalCount) || 0;
          this.latestCarsPager.startIndex = this.latestCarsTotalCount > 0
            ? (this.latestCarsPager.page - 1) * this.latestCarsPager.pageSize + 1
            : 0;
          this.latestCarsPager.endIndex = this.latestCarsTotalCount > 0
            ? Math.min(this.latestCarsPager.page * this.latestCarsPager.pageSize, this.latestCarsTotalCount)
            : 0;
          this.isLoadingLatestCars = false;
        },
        error: () => {
          this.latestCars = [];
          this.latestCarsTotalCount = 0;
          this.latestCarsPager.startIndex = 0;
          this.latestCarsPager.endIndex = 0;
          this.isLoadingLatestCars = false;
        }
      });
  }

  get localizedLatestBrands(): Array<{
    id: number;
    displayName: string;
    imageUrl?: string | null;
    createdAt: string;
    isAvailable: boolean;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.latestBrands.map(item => ({
      id: item.id,
      displayName: isArabic
        ? (item.nameAr || item.nameEn || `#${item.id}`)
        : (item.nameEn || item.nameAr || `#${item.id}`),
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      isAvailable: !!item.isAvailable
    }));
  }

  private loadLatestBrands(): void {
    this.isLoadingLatestBrands = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          nameAr?: string | null;
          nameEn?: string | null;
          imageUrl?: string | null;
          createdAt: string;
          isAvailable: boolean;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/brands?page=${this.latestBrandsPager.page}&pageSize=${this.latestBrandsPager.pageSize}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.latestBrands = Array.isArray(response?.items) ? response.items : [];
          this.latestBrandsTotalCount = Number(response?.totalCount) || 0;
          this.latestBrandsPager.startIndex = this.latestBrandsTotalCount > 0
            ? (this.latestBrandsPager.page - 1) * this.latestBrandsPager.pageSize + 1
            : 0;
          this.latestBrandsPager.endIndex = this.latestBrandsTotalCount > 0
            ? Math.min(this.latestBrandsPager.page * this.latestBrandsPager.pageSize, this.latestBrandsTotalCount)
            : 0;
          this.isLoadingLatestBrands = false;
        },
        error: () => {
          this.latestBrands = [];
          this.latestBrandsTotalCount = 0;
          this.latestBrandsPager.startIndex = 0;
          this.latestBrandsPager.endIndex = 0;
          this.isLoadingLatestBrands = false;
        }
      });
  }

  get localizedFavoriteCars(): Array<{
    carId: number;
    displayCarName: string;
    displayUserName: string;
    userName: string;
    createdAt: string;
    notes?: string | null;
    priority: number;
    primaryImageUrl?: string | null;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.favoriteCars.map(item => ({
      carId: item.carId,
      displayCarName: isArabic
        ? (item.carNameAr || item.carNameEn || `#${item.carId}`)
        : (item.carNameEn || item.carNameAr || `#${item.carId}`),
      displayUserName: isArabic
        ? (item.fullNameAr || item.fullNameEn || item.userName || '')
        : (item.fullNameEn || item.fullNameAr || item.userName || ''),
      userName: item.userName || '',
      createdAt: item.createdAt,
      notes: item.notes,
      priority: Number(item.priority) || 0,
      primaryImageUrl: item.primaryImageUrl
    }));
  }

  private loadFavoriteCars(): void {
    this.isLoadingFavoriteCars = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          carId: number;
          userId: string;
          createdAt: string;
          priority: number;
          notes?: string | null;
          carNameAr?: string | null;
          carNameEn?: string | null;
          userName?: string | null;
          fullNameAr?: string | null;
          fullNameEn?: string | null;
          primaryImageUrl?: string | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/favorite-cars?page=${this.favoriteCarsPager.page}&pageSize=${this.favoriteCarsPager.pageSize}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.favoriteCars = Array.isArray(response?.items) ? response.items : [];
          this.favoriteCarsTotalCount = Number(response?.totalCount) || 0;
          this.favoriteCarsPager.startIndex = this.favoriteCarsTotalCount > 0
            ? (this.favoriteCarsPager.page - 1) * this.favoriteCarsPager.pageSize + 1
            : 0;
          this.favoriteCarsPager.endIndex = this.favoriteCarsTotalCount > 0
            ? Math.min(this.favoriteCarsPager.page * this.favoriteCarsPager.pageSize, this.favoriteCarsTotalCount)
            : 0;
          this.isLoadingFavoriteCars = false;
        },
        error: () => {
          this.favoriteCars = [];
          this.favoriteCarsTotalCount = 0;
          this.favoriteCarsPager.startIndex = 0;
          this.favoriteCarsPager.endIndex = 0;
          this.isLoadingFavoriteCars = false;
        }
      });
  }

  get localizedBestSellerCars(): Array<{
    carId: number;
    displayCarName: string;
    salesCount: number;
    lastSoldAt?: string | null;
    primaryImageUrl?: string | null;
  }> {
    return this.bestSellerCars.map(item => ({
      carId: item.carId,
      displayCarName: (() => {
        const nameEn = (item.nameEn || '').trim();
        const nameAr = (item.nameAr || '').trim();
        if (nameEn && nameAr) {
          return nameEn === nameAr ? nameEn : `${nameEn} - ${nameAr}`;
        }

        return nameEn || nameAr || '-';
      })(),
      salesCount: Number(item.salesCount) || 0,
      lastSoldAt: item.lastSoldAt,
      primaryImageUrl: item.primaryImageUrl
    }));
  }

  private loadBestSellerCars(): void {
    this.isLoadingBestSellerCars = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          carId: number;
          nameAr?: string | null;
          nameEn?: string | null;
          salesCount: number;
          lastSoldAt?: string | null;
          primaryImageUrl?: string | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/best-seller-cars?page=${this.bestSellerCarsPager.page}&pageSize=${this.bestSellerCarsPager.pageSize}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          const responseAny = response as any;
          const rawItems = Array.isArray(responseAny?.items)
            ? responseAny.items as any[]
            : (Array.isArray(responseAny?.Items) ? responseAny.Items as any[] : []);
          this.bestSellerCars = rawItems.map(item => ({
            carId: Number(item?.carId ?? item?.CarId) || 0,
            nameAr: item?.nameAr ?? item?.NameAr ?? item?.carNameAr ?? item?.CarNameAr ?? null,
            nameEn: item?.nameEn ?? item?.NameEn ?? item?.carNameEn ?? item?.CarNameEn ?? null,
            salesCount: Number(item?.salesCount ?? item?.SalesCount) || 0,
            lastSoldAt: item?.lastSoldAt ?? item?.LastSoldAt ?? null,
            primaryImageUrl: item?.primaryImageUrl ?? item?.PrimaryImageUrl ?? null
          }));
          this.bestSellerCarsTotalCount = Number((response as any)?.totalCount ?? (response as any)?.TotalCount) || 0;
          this.bestSellerCarsPager.startIndex = this.bestSellerCarsTotalCount > 0
            ? (this.bestSellerCarsPager.page - 1) * this.bestSellerCarsPager.pageSize + 1
            : 0;
          this.bestSellerCarsPager.endIndex = this.bestSellerCarsTotalCount > 0
            ? Math.min(this.bestSellerCarsPager.page * this.bestSellerCarsPager.pageSize, this.bestSellerCarsTotalCount)
            : 0;
          this.applyBestSellerCarsChartSeries();
          this.isLoadingBestSellerCars = false;
        },
        error: () => {
          this.bestSellerCars = [];
          this.bestSellerCarsTotalCount = 0;
          this.bestSellerCarsPager.startIndex = 0;
          this.bestSellerCarsPager.endIndex = 0;
          this.applyBestSellerCarsChartSeries();
          this.isLoadingBestSellerCars = false;
        }
      });
  }

  get localizedLatestRequests(): Array<{
    id: number;
    requestNo: string;
    name: string;
    email: string;
    mobileNo: string;
    createdAt: string;
    statusText: string;
    statusCode?: string | null;
    carDisplayName: string;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.latestRequests.map(item => {
      const statusName = isArabic
        ? (item.currentStatusNameAr || item.currentStatusNameEn || String(item.currentStatus))
        : (item.currentStatusNameEn || item.currentStatusNameAr || String(item.currentStatus));
      const carDisplayName = isArabic
        ? (item.carNameAr || item.carNameEn || `#${item.carId}`)
        : (item.carNameEn || item.carNameAr || `#${item.carId}`);

      return {
        id: item.id,
        requestNo: `#${item.id}`,
        name: item.name,
        email: item.email,
        mobileNo: item.mobileNo,
        createdAt: item.createdAt,
        statusText: `${item.currentStatus} - ${statusName}`,
        statusCode: item.currentStatusCode,
        carDisplayName
      };
    });
  }

  get localizedProductReviews(): Array<{
    id: number;
    displayReviewerName: string;
    displayCarName: string;
    displayComment: string;
    rateValue: number;
    createdAt: string;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.productReviews.map(item => ({
      id: item.id,
      displayReviewerName: isArabic
        ? (item.reviewerNameAr || item.reviewerNameEn || this.translate.instant('DASHBOARD_PAGE.ANONYMOUS'))
        : (item.reviewerNameEn || item.reviewerNameAr || this.translate.instant('DASHBOARD_PAGE.ANONYMOUS')),
      displayCarName: isArabic
        ? (item.carNameAr || item.carNameEn || '-')
        : (item.carNameEn || item.carNameAr || '-'),
      displayComment: isArabic
        ? (item.commentAr || item.commentEn || '-')
        : (item.commentEn || item.commentAr || '-'),
      rateValue: Number(item.rateValue) || 0,
      createdAt: item.createdAt
    }));
  }

  getStarIconClasses(rateValue: number): string[] {
    const normalized = Math.max(0, Math.min(5, Number(rateValue) || 0));
    const full = Math.floor(normalized);
    const hasHalf = normalized - full >= 0.5;

    return Array.from({ length: 5 }, (_, index) => {
      if (index < full) {
        return 'ri-star-fill';
      }

      if (index === full && hasHalf) {
        return 'ri-star-half-fill';
      }

      return 'ri-star-line';
    });
  }

  private loadProductReviews(): void {
    this.isLoadingProductReviews = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          carId?: number | null;
          carNameAr?: string | null;
          carNameEn?: string | null;
          reviewerNameAr?: string | null;
          reviewerNameEn?: string | null;
          commentAr?: string | null;
          commentEn?: string | null;
          rateValue: number;
          createdAt: string;
        }>;
      }>(`${GlobalComponent.API_URL}/api/rate/product-reviews?page=1&pageSize=10`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.productReviews = Array.isArray(response?.items) ? response.items : [];
          this.isLoadingProductReviews = false;
        },
        error: () => {
          this.productReviews = [];
          this.isLoadingProductReviews = false;
        }
      });
  }

  private loadCustomerReviewSummary(): void {
    this.isLoadingCustomerReviews = true;
    this.http
      .get<{
        totalReviews: number;
        averageRating: number;
        distribution: Array<{
          star: number;
          count: number;
          percentage: number;
        }>;
      }>(`${GlobalComponent.API_URL}/api/rate/customer-reviews`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          const distribution = Array.isArray(response?.distribution)
            ? response.distribution
                .map(item => ({
                  star: Number(item?.star) || 0,
                  count: Number(item?.count) || 0,
                  percentage: Number(item?.percentage) || 0
                }))
                .sort((a, b) => b.star - a.star)
            : [];

          this.customerReviewSummary = {
            totalReviews: Number(response?.totalReviews) || 0,
            averageRating: Number(response?.averageRating) || 0,
            distribution: distribution.length > 0
              ? distribution
              : [
                  { star: 5, count: 0, percentage: 0 },
                  { star: 4, count: 0, percentage: 0 },
                  { star: 3, count: 0, percentage: 0 },
                  { star: 2, count: 0, percentage: 0 },
                  { star: 1, count: 0, percentage: 0 }
                ]
          };
          this.isLoadingCustomerReviews = false;
        },
        error: () => {
          this.customerReviewSummary = {
            totalReviews: 0,
            averageRating: 0,
            distribution: [
              { star: 5, count: 0, percentage: 0 },
              { star: 4, count: 0, percentage: 0 },
              { star: 3, count: 0, percentage: 0 },
              { star: 2, count: 0, percentage: 0 },
              { star: 1, count: 0, percentage: 0 }
            ]
          };
          this.isLoadingCustomerReviews = false;
        }
      });
  }

  get localizedBranchSales(): Array<{
    branchId: number;
    displayName: string;
    salesCount: number;
    percentage: number;
    latitude?: number | null;
    longitude?: number | null;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.branchSales.map(item => ({
      branchId: item.branchId,
      displayName: isArabic
        ? (item.nameAr || item.nameEn || `#${item.branchId}`)
        : (item.nameEn || item.nameAr || `#${item.branchId}`),
      salesCount: Number(item.salesCount) || 0,
      percentage: Number(item.percentage) || 0,
      latitude: item.latitude,
      longitude: item.longitude
    }));
  }

  get localizedDashboardOffers(): Array<{
    id: number;
    displayName: string;
    displayDescription: string;
    offerImageUrl?: string | null;
    expiredAt?: string | null;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.dashboardOffers.map(item => ({
      id: item.id,
      displayName: isArabic
        ? (item.offerNameAr || item.offerNameEn || `#${item.id}`)
        : (item.offerNameEn || item.offerNameAr || `#${item.id}`),
      displayDescription: isArabic
        ? (item.descriptionAr || item.descriptionEn || '-')
        : (item.descriptionEn || item.descriptionAr || '-'),
      offerImageUrl: item.offerImageUrl,
      expiredAt: item.expiredAt
    }));
  }

  get localizedDashboardMemberServices(): Array<{
    id: number;
    displayName: string;
    imageUrl?: string | null;
    createdAt: string;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.dashboardMemberServices.map(item => ({
      id: item.id,
      displayName: isArabic
        ? (item.nameAr || item.nameEn || `#${item.id}`)
        : (item.nameEn || item.nameAr || `#${item.id}`),
      imageUrl: item.imageUrl,
      createdAt: item.createdAt
    }));
  }

  get localizedDashboardSalesContacts(): Array<{
    id: number;
    contactValue: string;
    typeName: string;
    contactIconUrl?: string | null;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.dashboardSalesContacts.map(item => ({
      id: item.id,
      contactValue: (item.contactValue || '').trim() || '-',
      typeName: isArabic
        ? (item.typeNameAr || item.typeNameEn || String(item.contactType))
        : (item.typeNameEn || item.typeNameAr || String(item.contactType)),
      contactIconUrl: item.contactIconUrl
    }));
  }

  get localizedDashboardActiveEmployees(): Array<{
    id: number;
    profileImageUrl?: string | null;
    displayName: string;
    displayDepartment: string;
    createdAt: string;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.dashboardActiveEmployees.map(item => ({
      id: item.id,
      profileImageUrl: item.profileImageUrl,
      displayName: isArabic
        ? (item.fullNameAr || item.fullNameEn || `#${item.id}`)
        : (item.fullNameEn || item.fullNameAr || `#${item.id}`),
      displayDepartment: isArabic
        ? (item.departmentNameAr || item.departmentNameEn || '-')
        : (item.departmentNameEn || item.departmentNameAr || '-'),
      createdAt: item.createdAt
    }));
  }

  get localizedDashboardLoggedInUsers(): Array<{
    id: string;
    employeeId?: number | null;
    profileImageUrl?: string | null;
    displayName: string;
    email: string;
    mobileNo: string;
    displayBranch: string;
    lastActivityAt?: string | null;
  }> {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    return this.dashboardLoggedInUsers.map(item => ({
      id: item.id,
      employeeId: item.employeeId,
      profileImageUrl: item.profileImageUrl,
      displayName: isArabic
        ? (item.fullNameAr || item.fullNameEn || item.userName || item.id)
        : (item.fullNameEn || item.fullNameAr || item.userName || item.id),
      email: (item.email || '').trim() || '-',
      mobileNo: (item.mobileNo || '').trim() || '-',
      displayBranch: isArabic
        ? (item.branchNameAr || item.branchNameEn || '-')
        : (item.branchNameEn || item.branchNameAr || '-'),
      lastActivityAt: item.lastActivityAt
    }));
  }

  private loadDashboardOffers(): void {
    this.isLoadingDashboardOffers = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          offerNameAr?: string | null;
          offerNameEn?: string | null;
          descriptionAr?: string | null;
          descriptionEn?: string | null;
          offerImageUrl?: string | null;
          expiredAt?: string | null;
          createdAt: string;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/offers?page=1&pageSize=10`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.dashboardOffers = Array.isArray(response?.items) ? response.items : [];
          this.totalOffersCount = Number(response?.totalCount) || 0;
          this.isLoadingDashboardOffers = false;
        },
        error: () => {
          this.dashboardOffers = [];
          this.totalOffersCount = 0;
          this.isLoadingDashboardOffers = false;
        }
      });
  }

  private loadDashboardMemberServices(): void {
    this.isLoadingDashboardMemberServices = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          nameAr?: string | null;
          nameEn?: string | null;
          descriptionAr?: string | null;
          descriptionEn?: string | null;
          imageUrl?: string | null;
          createdAt: string;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/member-services?page=1&pageSize=6`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.dashboardMemberServices = Array.isArray(response?.items) ? response.items : [];
          this.isLoadingDashboardMemberServices = false;
        },
        error: () => {
          this.dashboardMemberServices = [];
          this.isLoadingDashboardMemberServices = false;
        }
      });
  }

  private loadDashboardSalesContacts(): void {
    this.isLoadingDashboardSalesContacts = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          contactValue?: string | null;
          contactType: number;
          typeNameAr?: string | null;
          typeNameEn?: string | null;
          contactIconUrl?: string | null;
          createdAt: string;
          branchId: number;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/sales-contacts?page=1&pageSize=6`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.dashboardSalesContacts = Array.isArray(response?.items) ? response.items : [];
          this.isLoadingDashboardSalesContacts = false;
        },
        error: () => {
          this.dashboardSalesContacts = [];
          this.isLoadingDashboardSalesContacts = false;
        }
      });
  }

  private loadDashboardActiveEmployees(): void {
    this.isLoadingDashboardActiveEmployees = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        scope: 'branch' | 'all';
        canViewAllBranches?: boolean;
        items: Array<{
          id: number;
          userId: string;
          branchId: number;
          createdAt: string;
          profileImageUrl?: string | null;
          fullNameAr?: string | null;
          fullNameEn?: string | null;
          departmentNameAr?: string | null;
          departmentNameEn?: string | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/active-employees?page=1&pageSize=6&scope=${this.employeeScope}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.dashboardActiveEmployees = Array.isArray(response?.items) ? response.items : [];
          const responseScope = ((response?.scope || '') as string).toLowerCase();
          if (responseScope === 'all' || responseScope === 'branch') {
            this.employeeScope = responseScope;
          }
          this.employeeCanViewAllBranches = response?.canViewAllBranches === true;
          this.isLoadingDashboardActiveEmployees = false;
        },
        error: () => {
          this.dashboardActiveEmployees = [];
          this.employeeCanViewAllBranches = false;
          this.employeeScope = 'branch';
          this.isLoadingDashboardActiveEmployees = false;
        }
      });
  }

  onEmployeeScopeChange(scope: 'branch' | 'all'): void {
    if (scope !== 'branch' && scope !== 'all') {
      return;
    }

    this.employeeScope = scope;
    this.loadDashboardActiveEmployees();
  }

  private loadDashboardLoggedInUsers(): void {
    this.isLoadingDashboardLoggedInUsers = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        scope: 'branch' | 'all';
        canViewAllBranches?: boolean;
        onlineWithinMinutes?: number;
        items: Array<{
          id: string;
          employeeId?: number | null;
          userName?: string | null;
          fullNameAr?: string | null;
          fullNameEn?: string | null;
          branchId: number;
          branchNameAr?: string | null;
          branchNameEn?: string | null;
          profileImageUrl?: string | null;
          email?: string | null;
          mobileNo?: string | null;
          lastLoginAt?: string | null;
          lastActivityAt?: string | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/logged-in-users?page=${this.dashboardLoggedInUsersPager.page}&pageSize=${this.dashboardLoggedInUsersPager.pageSize}&scope=${this.loggedInUsersScope}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.dashboardLoggedInUsers = Array.isArray(response?.items) ? response.items : [];
          this.dashboardLoggedInUsersTotalCount = Number(response?.totalCount) || 0;
          this.dashboardLoggedInUsersPager.startIndex = this.dashboardLoggedInUsersTotalCount > 0
            ? (this.dashboardLoggedInUsersPager.page - 1) * this.dashboardLoggedInUsersPager.pageSize + 1
            : 0;
          this.dashboardLoggedInUsersPager.endIndex = this.dashboardLoggedInUsersTotalCount > 0
            ? Math.min(this.dashboardLoggedInUsersPager.page * this.dashboardLoggedInUsersPager.pageSize, this.dashboardLoggedInUsersTotalCount)
            : 0;
          const responseScope = ((response?.scope || '') as string).toLowerCase();
          if (responseScope === 'all' || responseScope === 'branch') {
            this.loggedInUsersScope = responseScope;
          }
          this.loggedInUsersCanViewAllBranches = response?.canViewAllBranches === true;
          this.isLoadingDashboardLoggedInUsers = false;
        },
        error: () => {
          this.dashboardLoggedInUsers = [];
          this.dashboardLoggedInUsersTotalCount = 0;
          this.dashboardLoggedInUsersPager.startIndex = 0;
          this.dashboardLoggedInUsersPager.endIndex = 0;
          this.loggedInUsersCanViewAllBranches = false;
          this.loggedInUsersScope = 'branch';
          this.isLoadingDashboardLoggedInUsers = false;
        }
      });
  }

  onLoggedInUsersScopeChange(scope: 'branch' | 'all'): void {
    if (scope !== 'branch' && scope !== 'all') {
      return;
    }

    this.loggedInUsersScope = scope;
    this.dashboardLoggedInUsersPager.page = 1;
    this.loadDashboardLoggedInUsers();
  }

  onDashboardLoggedInUsersPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.dashboardLoggedInUsersPager.page;
    this.dashboardLoggedInUsersPager.page = resolvedPage;
    this.loadDashboardLoggedInUsers();
  }

  get dashboardLoggedInUsersTotalPages(): number {
    const pageSize = Number(this.dashboardLoggedInUsersPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.dashboardLoggedInUsersTotalCount / pageSize));
  }

  get dashboardLoggedInUsersVisiblePages(): number[] {
    const totalPages = this.dashboardLoggedInUsersTotalPages;
    const currentPage = Number(this.dashboardLoggedInUsersPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToDashboardLoggedInUsersPage(page: number): void {
    if (page < 1 || page > this.dashboardLoggedInUsersTotalPages || page === this.dashboardLoggedInUsersPager.page) {
      return;
    }

    this.onDashboardLoggedInUsersPageChange(page);
  }

  private loadBranchSales(): void {
    this.isLoadingBranchSales = true;
    this.http
      .get<{
        totalSales: number;
        items: Array<{
          branchId: number;
          nameAr?: string | null;
          nameEn?: string | null;
          salesCount: number;
          percentage: number;
          latitude?: number | null;
          longitude?: number | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/sales-by-branches`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.totalBranchSales = Number(response?.totalSales) || 0;
          this.branchSales = (response?.items || []).map(x => ({
            branchId: Number(x?.branchId) || 0,
            nameAr: x?.nameAr,
            nameEn: x?.nameEn,
            salesCount: Number(x?.salesCount) || 0,
            percentage: Number(x?.percentage) || 0,
            latitude: x?.latitude == null ? null : Number(x.latitude),
            longitude: x?.longitude == null ? null : Number(x.longitude)
          }));

          this.rebuildBranchMapLayers();
          this.isLoadingBranchSales = false;
        },
        error: () => {
          this.totalBranchSales = 0;
          this.branchSales = [];
          this.layers = [];
          this.mapFitBounds = null;
          this.isLoadingBranchSales = false;
        }
      });
  }

  private loadLatestRequests(): void {
    this.isLoadingLatestRequests = true;
    this.http
      .get<{
        page: number;
        pageSize: number;
        totalCount: number;
        items: Array<{
          id: number;
          name: string;
          email: string;
          mobileNo: string;
          createdAt: string;
          currentStatus: number;
          currentStatusNameAr?: string | null;
          currentStatusNameEn?: string | null;
          currentStatusCode?: string | null;
          carId: number;
          carNameAr?: string | null;
          carNameEn?: string | null;
        }>;
      }>(`${GlobalComponent.API_URL}/api/dashboard/recent-requests?page=${this.latestRequestsPager.page}&pageSize=${this.latestRequestsPager.pageSize}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.latestRequests = Array.isArray(response?.items) ? response.items : [];
          this.latestRequestsTotalCount = Number(response?.totalCount) || 0;
          this.latestRequestsPager.startIndex = this.latestRequestsTotalCount > 0
            ? (this.latestRequestsPager.page - 1) * this.latestRequestsPager.pageSize + 1
            : 0;
          this.latestRequestsPager.endIndex = this.latestRequestsTotalCount > 0
            ? Math.min(this.latestRequestsPager.page * this.latestRequestsPager.pageSize, this.latestRequestsTotalCount)
            : 0;
          this.isLoadingLatestRequests = false;
        },
        error: () => {
          this.latestRequests = [];
          this.latestRequestsTotalCount = 0;
          this.latestRequestsPager.startIndex = 0;
          this.latestRequestsPager.endIndex = 0;
          this.isLoadingLatestRequests = false;
        }
      });
  }

  private loadTotalUsersCount(): void {
    this.isLoadingTotalUsers = true;
    this.http
      .get<Array<{ id?: string | null }>>(`${GlobalComponent.API_URL}/api/users`)
      .pipe(first())
      .subscribe({
        next: (users) => {
          this.totalUsersCount = Array.isArray(users) ? users.length : 0;
          this.isLoadingTotalUsers = false;
        },
        error: () => {
          this.totalUsersCount = 0;
          this.isLoadingTotalUsers = false;
        }
      });
  }

  private loadTotalBranchesCount(): void {
    this.isLoadingTotalBranches = true;
    this.http
      .get<Array<{ id?: number | null }>>(`${GlobalComponent.API_URL}/api/branches`)
      .pipe(first())
      .subscribe({
        next: (branches) => {
          this.totalBranchesCount = Array.isArray(branches) ? branches.length : 0;
          this.isLoadingTotalBranches = false;
        },
        error: () => {
          this.totalBranchesCount = 0;
          this.isLoadingTotalBranches = false;
        }
      });
  }

  private loadTotalEmployeesCount(): void {
    this.isLoadingTotalEmployees = true;
    this.http
      .get<Array<{ userId?: string | null }>>(`${GlobalComponent.API_URL}/api/employees`)
      .pipe(first())
      .subscribe({
        next: (employees) => {
          this.totalEmployeesCount = Array.isArray(employees) ? employees.length : 0;
          this.isLoadingTotalEmployees = false;
        },
        error: () => {
          this.totalEmployeesCount = 0;
          this.isLoadingTotalEmployees = false;
        }
      });
  }

  private loadTotalDepartmentsCount(): void {
    this.isLoadingTotalDepartments = true;
    this.http
      .get<Array<{ id?: number | null }>>(`${GlobalComponent.API_URL}/api/departments`)
      .pipe(first())
      .subscribe({
        next: (departments) => {
          this.totalDepartmentsCount = Array.isArray(departments) ? departments.length : 0;
          this.isLoadingTotalDepartments = false;
        },
        error: () => {
          this.totalDepartmentsCount = 0;
          this.isLoadingTotalDepartments = false;
        }
      });
  }

  private loadRequestStatusCounts(): void {
    this.isLoadingRequestStatusCounts = true;
    this.http
      .get<{
        period: string;
        periodOptions?: Array<{
          code: string;
          nameAr?: string | null;
          nameEn?: string | null;
        }>;
        fromDate?: string | null;
        toDate?: string | null;
        total: number;
        newCount: number;
        contactCount: number;
        inProgressCount: number;
        closedSuccessCount: number;
        closedLossCount: number;
        conversionRatio: number;
      }>(`${GlobalComponent.API_URL}/api/dashboard/request-status-counts?period=${this.selectedStatusPeriod}`)
      .pipe(first())
      .subscribe({
        next: (response) => {
          const options = (response?.periodOptions || [])
            .filter(x => !!x?.code)
            .map(x => ({
              code: x.code.toString().trim().toLowerCase(),
              nameAr: x.nameAr,
              nameEn: x.nameEn
            }));

          if (options.length > 0) {
            this.statusPeriodOptions = options;
          } else if (this.statusPeriodOptions.length === 0) {
            this.statusPeriodOptions = [
              { code: '1w', nameAr: '1W', nameEn: '1W' },
              { code: '2w', nameAr: '2W', nameEn: '2W' },
              { code: '1m', nameAr: '1M', nameEn: '1M' },
              { code: '2m', nameAr: '2M', nameEn: '2M' },
              { code: '3m', nameAr: '3M', nameEn: '3M' },
              { code: '6m', nameAr: '6M', nameEn: '6M' },
              { code: '1y', nameAr: '1Y', nameEn: '1Y' }
            ];
          }

          const normalizedResponsePeriod = (response?.period || '').toString().trim().toLowerCase();
          if (normalizedResponsePeriod) {
            this.selectedStatusPeriod = normalizedResponsePeriod;
          } else if (!this.statusPeriodOptions.some(x => x.code === this.selectedStatusPeriod)) {
            this.selectedStatusPeriod = this.statusPeriodOptions[0]?.code || '1m';
          }

          this.requestStatusCounts = {
            newCount: Number(response?.newCount) || 0,
            contactCount: Number(response?.contactCount) || 0,
            inProgressCount: Number(response?.inProgressCount) || 0,
            closedSuccessCount: Number(response?.closedSuccessCount) || 0,
            closedLossCount: Number(response?.closedLossCount) || 0,
            conversionRatio: Number(response?.conversionRatio) || 0
          };
          this.isLoadingRequestStatusCounts = false;
          this.applyRealAnalyticsSeries();
        },
        error: () => {
          if (this.statusPeriodOptions.length === 0) {
            this.statusPeriodOptions = [
              { code: '1w', nameAr: '1W', nameEn: '1W' },
              { code: '2w', nameAr: '2W', nameEn: '2W' },
              { code: '1m', nameAr: '1M', nameEn: '1M' },
              { code: '2m', nameAr: '2M', nameEn: '2M' },
              { code: '3m', nameAr: '3M', nameEn: '3M' },
              { code: '6m', nameAr: '6M', nameEn: '6M' },
              { code: '1y', nameAr: '1Y', nameEn: '1Y' }
            ];
          }

          this.requestStatusCounts = {
            newCount: 0,
            contactCount: 0,
            inProgressCount: 0,
            closedSuccessCount: 0,
            closedLossCount: 0,
            conversionRatio: 0
          };
          this.isLoadingRequestStatusCounts = false;
          this.applyRealAnalyticsSeries();
        }
      });
  }

  onStatusPeriodChange(period: string): void {
    const normalizedPeriod = (period || '').toString().trim().toLowerCase();
    if (!normalizedPeriod || !this.statusPeriodOptions.some(x => x.code === normalizedPeriod)) {
      return;
    }

    this.selectedStatusPeriod = normalizedPeriod;
    this.loadRequestStatusCounts();
  }

  getStatusPeriodLabel(option: { code: string; nameAr?: string | null; nameEn?: string | null }): string {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    const label = isArabic ? option.nameAr : option.nameEn;
    return (label || option.code || '').toString().trim().toUpperCase();
  }

  onLatestCarsPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.latestCarsPager.page;
    this.latestCarsPager.page = resolvedPage;
    this.loadLatestCars();
  }

  onLatestBrandsPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.latestBrandsPager.page;
    this.latestBrandsPager.page = resolvedPage;
    this.loadLatestBrands();
  }

  onLatestRequestsPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.latestRequestsPager.page;
    this.latestRequestsPager.page = resolvedPage;
    this.loadLatestRequests();
  }

  onFavoriteCarsPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.favoriteCarsPager.page;
    this.favoriteCarsPager.page = resolvedPage;
    this.loadFavoriteCars();
  }

  onBestSellerCarsPageChange(page: number | Event): void {
    const resolvedPage = typeof page === 'number' ? page : this.bestSellerCarsPager.page;
    this.bestSellerCarsPager.page = resolvedPage;
    this.loadBestSellerCars();
  }

  get latestCarsTotalPages(): number {
    const pageSize = Number(this.latestCarsPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.latestCarsTotalCount / pageSize));
  }

  get latestCarsVisiblePages(): number[] {
    const totalPages = this.latestCarsTotalPages;
    const currentPage = Number(this.latestCarsPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToLatestCarsPage(page: number): void {
    if (page < 1 || page > this.latestCarsTotalPages || page === this.latestCarsPager.page) {
      return;
    }

    this.onLatestCarsPageChange(page);
  }

  get latestBrandsTotalPages(): number {
    const pageSize = Number(this.latestBrandsPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.latestBrandsTotalCount / pageSize));
  }

  get favoriteCarsTotalPages(): number {
    const pageSize = Number(this.favoriteCarsPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.favoriteCarsTotalCount / pageSize));
  }

  get bestSellerCarsTotalPages(): number {
    const pageSize = Number(this.bestSellerCarsPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.bestSellerCarsTotalCount / pageSize));
  }

  get favoriteCarsVisiblePages(): number[] {
    const totalPages = this.favoriteCarsTotalPages;
    const currentPage = Number(this.favoriteCarsPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToFavoriteCarsPage(page: number): void {
    if (page < 1 || page > this.favoriteCarsTotalPages || page === this.favoriteCarsPager.page) {
      return;
    }

    this.onFavoriteCarsPageChange(page);
  }

  get bestSellerCarsVisiblePages(): number[] {
    const totalPages = this.bestSellerCarsTotalPages;
    const currentPage = Number(this.bestSellerCarsPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToBestSellerCarsPage(page: number): void {
    if (page < 1 || page > this.bestSellerCarsTotalPages || page === this.bestSellerCarsPager.page) {
      return;
    }

    this.onBestSellerCarsPageChange(page);
  }

  get latestBrandsVisiblePages(): number[] {
    const totalPages = this.latestBrandsTotalPages;
    const currentPage = Number(this.latestBrandsPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToLatestBrandsPage(page: number): void {
    if (page < 1 || page > this.latestBrandsTotalPages || page === this.latestBrandsPager.page) {
      return;
    }

    this.onLatestBrandsPageChange(page);
  }

  get latestRequestsTotalPages(): number {
    const pageSize = Number(this.latestRequestsPager.pageSize) || 1;
    return Math.max(1, Math.ceil(this.latestRequestsTotalCount / pageSize));
  }

  get latestRequestsVisiblePages(): number[] {
    const totalPages = this.latestRequestsTotalPages;
    const currentPage = Number(this.latestRequestsPager.page) || 1;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToLatestRequestsPage(page: number): void {
    if (page < 1 || page > this.latestRequestsTotalPages || page === this.latestRequestsPager.page) {
      return;
    }

    this.onLatestRequestsPageChange(page);
  }

  getLatestRequestStatusBadgeClass(statusCode?: string | null): string {
    return `badge ${this.getLatestRequestStatusToneClass(statusCode)}`;
  }

  private getLatestRequestStatusToneClass(statusCode?: string | null): string {
    switch ((statusCode || '').trim()) {
      case '1':
        return 'bg-primary-subtle text-primary';
      case '2':
        return 'bg-warning-subtle text-warning';
      case '3':
        return 'bg-info-subtle text-info';
      case '4':
        return 'bg-success-subtle text-success';
      case '5':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }

  getLatestCarImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('assets/')) {
      return imageUrl;
    }

    return `${GlobalComponent.API_URL}/${imageUrl.replace(/^\/+/, '')}`;
  }

  openImagePreview(imageUrl?: string | null, title?: string): void {
    const resolvedImageUrl = this.getLatestCarImageUrl(imageUrl);
    if (!resolvedImageUrl) {
      return;
    }

    this.previewImageUrl = resolvedImageUrl;
    this.previewImageTitle = title || '';
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
    this.previewImageTitle = '';
  }

  getBrandImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
      return 'assets/images/users/user-dummy-img.jpg';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('assets/')) {
      return imageUrl;
    }

    return `${GlobalComponent.API_URL}/${imageUrl.replace(/^\/+/, '')}`;
  }

  getOfferImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) {
      return 'assets/images/users/user-dummy-img.jpg';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('assets/')) {
      return imageUrl;
    }

    return `${GlobalComponent.API_URL}/${imageUrl.replace(/^\/+/, '')}`;
  }

  /**
 * Sale Location Map
 */
  options = {
    attributionControl: true,
    layers: [
      tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      })
    ],
    zoom: 1.1,
    center: latLng(28, 1.5)
  };
  layers: any[] = [];

  onMapReady(map: Map): void {
    map.attributionControl.setPrefix('');
  }

  private rebuildBranchMapLayers(): void {
    const mappedBranches = this.localizedBranchSales
      .filter(item =>
        item.latitude != null &&
        item.longitude != null &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude))
      .map(item => ({
        ...item,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude)
      }));

    if (mappedBranches.length === 0) {
      this.layers = [];
      this.mapFitBounds = null;
      this.options = {
        ...this.options,
        zoom: 1.1,
        center: latLng(28, 1.5)
      };
      return;
    }

    this.layers = mappedBranches.flatMap(item => {
      const circleRadius = Math.max(50000, item.salesCount * 4000);
      const areaLayer = circle([item.latitude, item.longitude], {
        color: "#0d6efd",
        opacity: 0.3,
        weight: 4,
        fillColor: "#0d6efd",
        fillOpacity: 0.2,
        radius: circleRadius
      }).bindTooltip(`${item.displayName}: ${item.salesCount}`, { direction: 'top' });

      const pointLayer = circleMarker([item.latitude, item.longitude], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#dc3545",
        fillOpacity: 1
      }).bindTooltip(`${item.displayName}`, { direction: 'top' });

      return [areaLayer, pointLayer];
    });

    this.mapFitBounds = latLngBounds(
      mappedBranches.map(item => [item.latitude, item.longitude] as [number, number])
    );
  }

  /**
 * Swiper Vertical  
   */
  Vertical = {
    infinite: true,
    autoplay: true,
    autoplaySpeed: 2000,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
    vertical: true // Enable vertical sliding
  };

  /**
   * Recent Activity
   */
  toggleActivity() {
    const recentActivity = document.querySelector('.layout-rightside-col');
    if (recentActivity != null) {
      recentActivity.classList.toggle('d-none');
    }

    if (document.documentElement.clientWidth <= 767) {
      const recentActivity = document.querySelector('.layout-rightside-col');
      if (recentActivity != null) {
        recentActivity.classList.add('d-block');
        recentActivity.classList.remove('d-none');
      }
    }
  }

  /**
   * SidebarHide modal
   * @param content modal content
   */
  SidebarHide() {
    const recentActivity = document.querySelector('.layout-rightside-col');
    if (recentActivity != null) {
      recentActivity.classList.remove('d-block');
    }
  }

}
