import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast-service';
import { TranslateService } from '@ngx-translate/core';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { first } from 'rxjs/operators';
import { GlobalComponent } from 'src/app/global-component';
import { PaginationService } from 'src/app/core/services/pagination.service';

import { circle, latLng, tileLayer } from 'leaflet';

import { ChartType } from './dashboard.model';
import { TopSelling, statData } from 'src/app/core/data';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})

/**
 * Ecommerce Component
 */
export class DashboardComponent implements OnInit {

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
  TopSelling: any;
  SalesCategoryChart!: ChartType;
  statData!: any;
  currentDate: any;
  userData: any;
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
    this.latestRequestsPager.pageSize = 5;
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
    this._SalesCategoryChart('["--vz-primary", "--vz-success", "--vz-warning", "--vz-danger", "--vz-info"]');
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
  }

  /**
 *  Sales Category
 */
  private _SalesCategoryChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.SalesCategoryChart = {
      series: [44, 55, 41, 17, 15],
      labels: ["Direct", "Social", "Email", "Other", "Referrals"],
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
      colors: colors
    };
  }

  /**
  * Fetches the data
  */
  private fetchData() {
    this.TopSelling = TopSelling;
    this.statData = statData;
    this.loadLatestCars();
    this.loadLatestBrands();
    this.loadLatestRequests();
    this.loadRequestStatusCounts();
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

  /**
 * Sale Location Map
 */
  options = {
    layers: [
      tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        id: "mapbox/light-v9",
        tileSize: 512,
        zoomOffset: 0,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      })
    ],
    zoom: 1.1,
    center: latLng(28, 1.5)
  };
  layers = [
    circle([41.9, 12.45], { color: "#435fe3", opacity: 0.5, weight: 10, fillColor: "#435fe3", fillOpacity: 1, radius: 400000, }),
    circle([12.05, -61.75], { color: "#435fe3", opacity: 0.5, weight: 10, fillColor: "#435fe3", fillOpacity: 1, radius: 400000, }),
    circle([1.3, 103.8], { color: "#435fe3", opacity: 0.5, weight: 10, fillColor: "#435fe3", fillOpacity: 1, radius: 400000, }),
  ];

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
