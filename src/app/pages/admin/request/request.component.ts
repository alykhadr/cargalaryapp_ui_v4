import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, of, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Car, CarImage } from '../interfaces/car.interface';
import { CarCarColor } from '../interfaces/car-car-color.interface';
import { CarCarFeature, CarFeature } from '../interfaces/car-feature.interface';
import { CarExtraDetails } from '../interfaces/car-extra-details.interface';
import { Color } from '../interfaces/color.interface';
import { LookupDetail } from '../interfaces/lookup.interface';
import { Request, RequestHistory } from '../interfaces/request.interface';
import { Branch } from '../interfaces/branch.interface';
import { Brand } from '../interfaces/brand.interface';
import { CarModel } from '../interfaces/car-model.interface';
import { CarType } from '../interfaces/car-type.interface';
import { BranchService } from '../services/branch.service';
import { BrandService } from '../services/brand.service';
import { CarCarColorService } from '../services/car-car-color.service';
import { CarExtraDetailsService } from '../services/car-extra-details.service';
import { CarFeatureService } from '../services/car-feature.service';
import { CarModelService } from '../services/car-model.service';
import { CarService } from '../services/car.service';
import { CarTypeService } from '../services/car-type.service';
import { ColorService } from '../services/color.service';
import { LookupService } from '../services/lookup.service';
import { RequestService } from '../services/request.service';
import { RequestRealtimeService } from '../services/request-realtime.service';
import { ErrorMessageService } from '../shared/error-message.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrl: './request.component.scss',
  standalone: false
})
export class RequestComponent implements OnInit, OnDestroy {
  @Input() mode: 'create' | 'list' | 'track' = 'list';
  @ViewChild('realtimeToastTpl') realtimeToastTpl!: TemplateRef<any>;
  @ViewChild('statusRealtimeToastTpl') statusRealtimeToastTpl!: TemplateRef<any>;

  breadCrumbItems!: Array<{}>;
  requestForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  isSubmitting = false;
  searchTerm = '';
  selectedStatusFilter: number | null = null;
  createdFromDate = '';
  createdToDate = '';
  idSortDirection: 'asc' | 'desc' = 'desc';
  trackRequestId: number | null = null;
  isTracking = false;
  trackedRequest: Request | null = null;
  trackedTimeline: RequestHistory[] = [];
  filteredRequests: Request[] = [];
  requests: Request[] = [];
  pagedRequests: Request[] = [];
  cars: Car[] = [];
  availableCarColors: Array<{
    colorId: number;
    nameAr?: string | null;
    nameEn?: string | null;
    colorCode?: string | null;
    colorStatus?: number;
    colorStatusNameAr?: string | null;
    colorStatusNameEn?: string | null;
    colorStatusDetailCode?: string | null;
  }> = [];
  paymentMethodLookups: LookupDetail[] = [];
  vehicleOwnerTypeLookups: LookupDetail[] = [];
  regionLookups: LookupDetail[] = [];
  cityLookups: LookupDetail[] = [];
  requestStatusLookups: LookupDetail[] = [];
  allRequestStatusLookups: LookupDetail[] = [];
  latestRealtimeRequest: Request | null = null;
  latestRealtimeStatusRequest: Request | null = null;
  statusUpdatingByRequestId = new Set<number>();
  showMoreInfoModal = false;
  selectedRequestForMore: Request | null = null;
  showCarInfoModal = false;
  selectedCarForInfo: Car | null = null;
  selectedRequestForCarInfo: Request | null = null;
  isCarInfoLoading = false;
  carInfoTab: 'overview' | 'colors' | 'features' | 'details' | 'gallery' = 'overview';
  carInfoColors: CarCarColor[] = [];
  pagedCarInfoColors: CarCarColor[] = [];
  carInfoFeatures: CarCarFeature[] = [];
  pagedCarInfoFeatures: CarCarFeature[] = [];
  carInfoExtraDetails: CarExtraDetails[] = [];
  pagedCarInfoExtraDetails: CarExtraDetails[] = [];
  carInfoImages: CarImage[] = [];
  pagedCarInfoImages: CarImage[] = [];
  carFeaturesCatalog: CarFeature[] = [];
  colorsCatalog: Color[] = [];
  branchesCatalog: Branch[] = [];
  modelsCatalog: CarModel[] = [];
  typesCatalog: CarType[] = [];
  brandsCatalog: Brand[] = [];
  imageTypeLookups: LookupDetail[] = [];
  conditionLookups: LookupDetail[] = [];
  trimLevelLookups: LookupDetail[] = [];
  vehicleClassLookups: LookupDetail[] = [];
  transmisionTypeLookups: LookupDetail[] = [];
  drivetrainLookups: LookupDetail[] = [];
  fuelTypeLookups: LookupDetail[] = [];
  manufactureCountryLookups: LookupDetail[] = [];
  extraDetailTypeLookups: LookupDetail[] = [];
  carInfoColorPagination = new PaginationService();
  carInfoFeaturePagination = new PaginationService();
  carInfoDetailsPagination = new PaginationService();
  carInfoImagesPagination = new PaginationService();
  private readonly notificationSoundUrl = 'assets/sounds/request-notification.mp3';
  private isSoundUnlocked = false;
  private soundHintShown = false;
  private readonly unlockSoundHandler = () => this.unlockSound();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private requestService: RequestService,
    private requestRealtimeService: RequestRealtimeService,
    private carService: CarService,
    private branchService: BranchService,
    private carModelService: CarModelService,
    private carTypeService: CarTypeService,
    private brandService: BrandService,
    private carCarColorService: CarCarColorService,
    private carFeatureService: CarFeatureService,
    private carExtraDetailsService: CarExtraDetailsService,
    private colorService: ColorService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private errorMessageService: ErrorMessageService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carInfoColorPagination.pageSize = 5;

    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.REQUEST.TEXT') },
      { label: this.mode === 'track' ? 'Track Request' : 'Request', active: true }
    ];

    this.requestForm = this.formBuilder.group({
      userId: [''],
      vehicleOwnerType: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      mobileNo: ['', [Validators.required, Validators.maxLength(20)]],
      carId: [null, Validators.required],
      colorId: [null, Validators.required],
      paymentMethod: [null, Validators.required],
      regionId: [null, Validators.required],
      cityId: [null, Validators.required],
      notes: ['', [Validators.maxLength(1000)]]
    });

    this.form['carId'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((carId: number | null) => {
        this.loadCarColorsForSelectedCar(carId);
      });

    this.loadFormDependencies();

    if (this.mode === 'list') {
      this.setupSoundUnlock();
      this.loadRequests();
      this.connectRealtime();
    }
  }

  async ngOnDestroy(): Promise<void> {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.mode === 'list') {
      this.removeSoundUnlockListeners();
      await this.requestRealtimeService.stop();
    }
  }

  get form() {
    return this.requestForm.controls;
  }

  loadFormDependencies() {
    forkJoin({
      cars: this.carService.getCars().pipe(first()),
      colors: this.colorService.getColors().pipe(first()),
      paymentMethods: this.lookupService.getByMasterCode('PAYMENT_METHOD').pipe(first()),
      ownerTypes: this.lookupService.getByMasterCode('VEHICLE_OWNER_TYPE').pipe(first()),
      regions: this.lookupService.getByMasterCode('REGION').pipe(first()),
      cities: this.lookupService.getByMasterCode('CITY').pipe(first()),
      statuses: this.lookupService.getByMasterCode('REQUEST_STATUS').pipe(first()),
      legacyStatuses: this.lookupService.getByMasterCode('QUOTATION_STATUS').pipe(
        first(),
        catchError(() => of([]))
      ),
      imageTypes: this.lookupService.getByMasterCode('IMAGE_TYPE').pipe(first()),
      conditions: this.lookupService.getByMasterCode('CAR_CONDITION').pipe(first()),
      trimLevels: this.lookupService.getByMasterCode('CAR_TRIM_LEVEL').pipe(first()),
      vehicleClasses: this.lookupService.getByMasterCode('CAR_VEHICLE_CLASS').pipe(first()),
      transmisionTypes: this.lookupService.getByMasterCode('CAR_TRANSMISION_TYPE').pipe(first()),
      drivetrains: this.lookupService.getByMasterCode('CAR_DRIVETRAIN').pipe(first()),
      fuelTypes: this.lookupService.getByMasterCode('CAR_FUEL_TYPE').pipe(first()),
      countries: this.lookupService.getByMasterCode('COUNTRY').pipe(first()),
      extraDetailTypes: this.lookupService.getByMasterCode('EXTRA_TYPE').pipe(first())
    }).subscribe({
      next: ({ cars, colors, paymentMethods, ownerTypes, regions, cities, statuses, legacyStatuses, imageTypes, conditions, trimLevels, vehicleClasses, transmisionTypes, drivetrains, fuelTypes, countries, extraDetailTypes }) => {
        this.cars = cars.filter(c => c.isAvailable);
        this.colorsCatalog = colors || [];
        this.paymentMethodLookups = paymentMethods;
        this.vehicleOwnerTypeLookups = ownerTypes;
        this.regionLookups = regions;
        this.cityLookups = cities;
        const preferredStatuses = statuses || [];
        const fallbackStatuses = legacyStatuses || [];
        this.allRequestStatusLookups = [...preferredStatuses, ...fallbackStatuses]
          .filter(item => item?.id)
          .filter((item, index, array) => array.findIndex(x => x.id === item.id) === index);
        const seenStatusKeys = new Set<string>();
        this.requestStatusLookups = [...preferredStatuses, ...fallbackStatuses].filter(item => {
          const key = (item.detailCode || String(item.id || '')).trim();
          if (!key || seenStatusKeys.has(key)) {
            return false;
          }
          seenStatusKeys.add(key);
          return true;
        });
        this.imageTypeLookups = imageTypes || [];
        this.conditionLookups = conditions || [];
        this.trimLevelLookups = trimLevels || [];
        this.vehicleClassLookups = vehicleClasses || [];
        this.transmisionTypeLookups = transmisionTypes || [];
        this.drivetrainLookups = drivetrains || [];
        this.fuelTypeLookups = fuelTypes || [];
        this.manufactureCountryLookups = countries || [];
        this.extraDetailTypeLookups = extraDetailTypes || [];

        const selectedCarId = Number(this.form['carId'].value);
        if (Number.isFinite(selectedCarId) && selectedCarId > 0) {
          this.loadCarColorsForSelectedCar(selectedCarId);
        }
      },
      error: (error) => {
        this.isCarInfoLoading = false;
        this.showError(error);
      }
    });
  }

  loadRequests() {
    this.isLoading = true;
    this.requestService.getAll().pipe(first()).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedStatusFilter = null;
    this.createdFromDate = '';
    this.createdToDate = '';
    this.applyFilters(true);
  }

  onStatusFilterChange(value: any) {
    this.selectedStatusFilter = value !== null && value !== '' ? Number(value) : null;
    this.applyFilters(true);
  }

  onDateFilterChange() {
    this.applyFilters(true);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedRequests = this.service.changePage(this.filteredRequests);
  }

  toggleIdSort() {
    this.idSortDirection = this.idSortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(true);
  }

  createRequest() {
    this.submitted = true;
    if (this.requestForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      userId: this.form['userId'].value || undefined,
      vehicleOwnerType: Number(this.form['vehicleOwnerType'].value),
      name: this.form['name'].value,
      email: this.form['email'].value,
      mobileNo: this.form['mobileNo'].value,
      carId: Number(this.form['carId'].value),
      colorId: Number(this.form['colorId'].value),
      paymentMethod: Number(this.form['paymentMethod'].value),
      regionId: Number(this.form['regionId'].value),
      cityId: Number(this.form['cityId'].value),
      notes: this.form['notes'].value || undefined
    };

    this.requestService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess('Request created successfully');
        this.requestForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError(error);
      }
    });
  }

  getCarName(carId: number): string {
    const car = this.cars.find(c => c.id === carId);
    return car?.nameEn || car?.nameAr || `#${carId}`;
  }

  getRequestColorName(item: Request): string {
    const nameFromResponse = this.getLocalizedText(item.colorNameAr, item.colorNameEn, '');
    if (nameFromResponse) {
      return nameFromResponse;
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
    if (!color) {
      return item.colorId ? `#${item.colorId}` : '-';
    }

    return this.isArabicLanguage()
      ? (color.colorNameAr || color.colorNameEn || `#${item.colorId}`)
      : (color.colorNameEn || color.colorNameAr || `#${item.colorId}`);
  }

  getRequestColorCode(item: Request): string {
    if (item.colorCode && item.colorCode.trim()) {
      return item.colorCode;
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
    return color?.colorCode || '#d4d4d4';
  }

  getRequestColorStatusName(item: Request): string {
    if (item.colorStatusNameAr || item.colorStatusNameEn) {
      return this.getLocalizedText(item.colorStatusNameAr, item.colorStatusNameEn, '-');
    }

    if (item.colorStatusDetailCode) {
      return item.colorStatusDetailCode;
    }

    return item.colorStatus ? `#${item.colorStatus}` : '-';
  }

  getLookupLabel(items: LookupDetail[], id: number): string {
    const found = items.find(x => x.id === id || x.detailCode === String(id));
    if (!found) return String(id);
    return this.getLookupDisplayName(found, String(id));
  }

  getLookupDisplayName(item?: LookupDetail | null, fallback = '-'): string {
    if (!item) {
      return fallback;
    }

    const preferArabic = this.isArabicLanguage();
    const preferredName = preferArabic ? item.nameAr : item.nameEn;
    const alternateName = preferArabic ? item.nameEn : item.nameAr;

    return preferredName || alternateName || item.displayName || fallback;
  }

  getLocalizedText(nameAr?: string | null, nameEn?: string | null, fallback = '-'): string {
    const preferArabic = this.isArabicLanguage();
    const preferred = preferArabic ? nameAr : nameEn;
    const alternate = preferArabic ? nameEn : nameAr;
    return preferred || alternate || fallback;
  }

  getRequestStatusLabel(statusId?: number): string {
    if (!statusId) return '-';
    const status = this.findRequestStatusLookup(statusId);
    return status ? this.getLookupDisplayName(status, String(statusId)) : String(statusId);
  }

  getRequestStatusValueWithNames(statusId?: number, statusNameAr?: string | null, statusNameEn?: string | null): string {
    if (!statusId) return '-';

    if (statusNameAr || statusNameEn) {
      const namesFromResponse = this.getLocalizedText(statusNameAr, statusNameEn, '-');
      return `${statusId} - ${namesFromResponse}`;
    }

    const status = this.findRequestStatusLookup(statusId);
    if (!status) return String(statusId);

    const ar = status.nameAr || '-';
    const en = status.nameEn || '-';
    const names = this.isArabicLanguage() ? `${ar} / ${en}` : `${en} / ${ar}`;
    return `${statusId} - ${names}`;
  }

  getRequestStatusBadgeClass(statusId?: number): string {
    return `badge ${this.getRequestStatusToneClass(statusId)}`;
  }

  getRequestStatusToneClass(statusId?: number): string {
    const statusCode = this.getRequestStatusCode(statusId);
    switch (statusCode) {
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

  getRequestStatusIcon(statusId?: number): string {
    const statusCode = this.getRequestStatusCode(statusId);
    switch (statusCode) {
      case '1':
        return 'ri-add-circle-line';
      case '2':
        return 'ri-time-line';
      case '3':
        return 'ri-phone-line';
      case '4':
        return 'ri-checkbox-circle-line';
      case '5':
        return 'ri-close-circle-line';
      default:
        return 'ri-information-line';
    }
  }

  getTimelineStatusTime(statusDate?: string): string {
    if (!statusDate) return '-';
    const parsed = new Date(statusDate);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
  }

  isStatusUpdating(requestId: number): boolean {
    return this.statusUpdatingByRequestId.has(requestId);
  }

  updateRequestStatus(item: Request, statusId: number) {
    if (!statusId || this.isStatusUpdating(item.id)) return;

    this.statusUpdatingByRequestId.add(item.id);
    this.requestService.updateStatus(item.id, { currentStatus: statusId }).pipe(first()).subscribe({
      next: (updated) => {
        const idx = this.requests.findIndex(q => q.id === item.id);
        if (idx >= 0) {
          this.requests[idx] = { ...this.requests[idx], ...updated };
        }
        this.applyFilters(false);
        this.showStatusUpdateSuccess();
        this.statusUpdatingByRequestId.delete(item.id);
      },
      error: (error) => {
        this.statusUpdatingByRequestId.delete(item.id);
        this.showStatusUpdateError(error);
      }
    });
  }

  trackByRequestId() {
    if (!this.trackRequestId || this.trackRequestId <= 0) {
      this.showError('Please enter a valid request id');
      return;
    }

    this.isTracking = true;
    this.trackedRequest = null;
    this.trackedTimeline = [];

    forkJoin({
      request: this.requestService.getById(this.trackRequestId).pipe(first()),
      timeline: this.requestService.getHistory(this.trackRequestId).pipe(first())
    }).subscribe({
      next: ({ request, timeline }) => {
        this.trackedRequest = request;
        this.trackedTimeline = timeline || [];
        this.isTracking = false;
      },
      error: (error) => {
        this.isTracking = false;
        this.showError(error);
      }
    });
  }

  openMoreInfoModal(item: Request) {
    this.selectedRequestForMore = item;
    this.showMoreInfoModal = true;
  }

  openRequestPrintReport(requestId: number) {
    const reportUrl = this.router.serializeUrl(
      this.router.createUrlTree(['/admin/request/print-report', requestId], {
        queryParams: { autoPrint: 1 }
      })
    );

    window.open(reportUrl, '_blank', 'noopener');
  }

  closeMoreInfoModal() {
    this.showMoreInfoModal = false;
    this.selectedRequestForMore = null;
  }

  openCarInfoModal(item: Request) {
    this.showCarInfoModal = true;
    this.selectedRequestForCarInfo = item;
    this.isCarInfoLoading = true;
    this.onCarInfoTabChange('overview');

    const cachedCar = this.cars.find(c => c.id === item.carId);

    forkJoin({
      car: cachedCar ? of(cachedCar) : this.carService.getCarById(item.carId),
      colors: this.carCarColorService.getByCarId(item.carId),
      features: this.carFeatureService.getCarFeaturesByCarId(item.carId),
      extraDetails: this.carExtraDetailsService.getExtraDetailsByCarId(item.carId),
      images: this.carService.getCarImages(item.carId),
      featureCatalog: this.carFeaturesCatalog.length > 0 ? of(this.carFeaturesCatalog) : this.carFeatureService.getCarFeatures(),
      colorCatalog: this.colorsCatalog.length > 0 ? of(this.colorsCatalog) : this.colorService.getColors(),
      branchCatalog: this.branchesCatalog.length > 0 ? of(this.branchesCatalog) : this.branchService.getBranches(),
      modelCatalog: this.modelsCatalog.length > 0 ? of(this.modelsCatalog) : this.carModelService.getModels(),
      typeCatalog: this.typesCatalog.length > 0 ? of(this.typesCatalog) : this.carTypeService.getCarTypes(),
      brandCatalog: this.brandsCatalog.length > 0 ? of(this.brandsCatalog) : this.brandService.getBrands()
    }).pipe(first()).subscribe({
      next: ({ car, colors, features, extraDetails, images, featureCatalog, colorCatalog, branchCatalog, modelCatalog, typeCatalog, brandCatalog }) => {
        this.selectedCarForInfo = car;
        this.carInfoColors = colors || [];
        this.carInfoFeatures = features || [];
        this.carInfoExtraDetails = extraDetails || [];
        this.carInfoImages = images || [];
        this.carFeaturesCatalog = featureCatalog || [];
        this.colorsCatalog = colorCatalog || [];
        this.branchesCatalog = branchCatalog || [];
        this.modelsCatalog = modelCatalog || [];
        this.typesCatalog = typeCatalog || [];
        this.brandsCatalog = brandCatalog || [];
        this.carInfoColorPagination.page = 1;
        this.carInfoFeaturePagination.page = 1;
        this.carInfoDetailsPagination.page = 1;
        this.carInfoImagesPagination.page = 1;
        this.pagedCarInfoColors = this.carInfoColorPagination.changePage(this.carInfoColors);
        this.pagedCarInfoFeatures = this.carInfoFeaturePagination.changePage(this.carInfoFeatures);
        this.pagedCarInfoExtraDetails = this.carInfoDetailsPagination.changePage(this.carInfoExtraDetails);
        this.pagedCarInfoImages = this.carInfoImagesPagination.changePage(this.carInfoImages);
        this.isCarInfoLoading = false;
      },
      error: (error) => {
        this.isCarInfoLoading = false;
        this.showError(error);
      }
    });
  }

  closeCarInfoModal() {
    this.showCarInfoModal = false;
    this.selectedCarForInfo = null;
    this.selectedRequestForCarInfo = null;
    this.isCarInfoLoading = false;
    this.carInfoColors = [];
    this.pagedCarInfoColors = [];
    this.carInfoFeatures = [];
    this.pagedCarInfoFeatures = [];
    this.carInfoExtraDetails = [];
    this.pagedCarInfoExtraDetails = [];
    this.carInfoImages = [];
    this.pagedCarInfoImages = [];
  }

  onCarInfoTabChange(tab: 'overview' | 'colors' | 'features' | 'details' | 'gallery') {
    this.carInfoTab = tab;

    if (tab === 'colors') {
      this.pagedCarInfoColors = this.carInfoColorPagination.changePage(this.carInfoColors);
    } else if (tab === 'features') {
      this.pagedCarInfoFeatures = this.carInfoFeaturePagination.changePage(this.carInfoFeatures);
    } else if (tab === 'details') {
      this.pagedCarInfoExtraDetails = this.carInfoDetailsPagination.changePage(this.carInfoExtraDetails);
    } else if (tab === 'gallery') {
      this.pagedCarInfoImages = this.carInfoImagesPagination.changePage(this.carInfoImages);
    }
  }

  getBranchLabel(branchId: number): string {
    const branch = this.branchesCatalog.find(x => x.id === branchId);
    if (!branch) {
      return `#${branchId}`;
    }

    return this.isArabicLanguage()
      ? (branch.branchNameAr || branch.branchNameEn || `#${branchId}`)
      : (branch.branchNameEn || branch.branchNameAr || `#${branchId}`);
  }

  getTypeLabel(typeId: number): string {
    const type = this.typesCatalog.find(x => x.id === typeId);
    if (!type) {
      return `#${typeId}`;
    }

    return this.isArabicLanguage()
      ? (type.nameAr || type.nameEn || `#${typeId}`)
      : (type.nameEn || type.nameAr || `#${typeId}`);
  }

  getModelLabel(modelId: number): string {
    const model = this.modelsCatalog.find(x => x.id === modelId);
    if (!model) {
      return `#${modelId}`;
    }

    return this.isArabicLanguage()
      ? (model.nameAr || model.nameEn || `#${modelId}`)
      : (model.nameEn || model.nameAr || `#${modelId}`);
  }

  getBrandLabelByModel(modelId: number): string {
    const model = this.modelsCatalog.find(x => x.id === modelId);
    if (!model) {
      return '-';
    }

    const brand = this.brandsCatalog.find(x => x.id === model.brandId);
    if (!brand) {
      return `#${model.brandId}`;
    }

    return this.isArabicLanguage()
      ? (brand.nameAr || brand.nameEn || `#${model.brandId}`)
      : (brand.nameEn || brand.nameAr || `#${model.brandId}`);
  }

  getCarConditionLabel(conditionId?: number): string {
    if (!conditionId) return '-';
    return this.getLookupLabel(this.conditionLookups, conditionId);
  }

  getCarVehicleClassLabel(vehicleClass?: number): string {
    if (!vehicleClass) return '-';
    return this.getLookupLabel(this.vehicleClassLookups, vehicleClass);
  }

  getCarTrimLevelLabel(trimLevel?: number): string {
    if (!trimLevel) return '-';
    return this.getLookupLabel(this.trimLevelLookups, trimLevel);
  }

  getCarTransmissionLabel(transmisionType?: number): string {
    if (!transmisionType) return '-';
    return this.getLookupLabel(this.transmisionTypeLookups, transmisionType);
  }

  getCarDrivetrainLabel(drivetrain?: number): string {
    if (!drivetrain) return '-';
    return this.getLookupLabel(this.drivetrainLookups, drivetrain);
  }

  getCarFuelTypeLabel(fuelType?: number): string {
    if (!fuelType) return '-';
    return this.getLookupLabel(this.fuelTypeLookups, fuelType);
  }

  getCarManufactureCountryLabel(manufactureCountryId?: number): string {
    if (!manufactureCountryId) return '-';
    return this.getLookupLabel(this.manufactureCountryLookups, manufactureCountryId);
  }

  getCarExtraDetailsTypeLabel(typeId?: number): string {
    if (!typeId) return '-';
    return this.getLookupLabel(this.extraDetailTypeLookups, typeId);
  }

  getFeatureName(featureId: number): string {
    const feature = this.carFeaturesCatalog.find(x => x.id === featureId);
    if (!feature) {
      return `#${featureId}`;
    }
    return `${feature.nameAr || '-'} / ${feature.nameEn || '-'}`;
  }

  getColorLabel(colorId: number): string {
    const color = this.colorsCatalog.find(x => x.id === colorId);
    if (!color) {
      return `#${colorId}`;
    }
    return `${color.colorNameAr || '-'} / ${color.colorNameEn || '-'}`;
  }

  getColorCode(colorId: number): string {
    const color = this.colorsCatalog.find(x => x.id === colorId);
    return color?.colorCode || '#d4d4d4';
  }

  getCarColorStatusLabel(item: CarCarColor): string {
    if (item.colorStatusNameAr || item.colorStatusNameEn) {
      return this.getLocalizedText(item.colorStatusNameAr, item.colorStatusNameEn, '-');
    }

    if (item.colorStatusDetailCode) {
      return item.colorStatusDetailCode;
    }

    return item.colorStatus ? `#${item.colorStatus}` : '-';
  }

  getImageTypeLabel(imageType?: number): string {
    if (!imageType) {
      return '-';
    }

    const lookup = this.imageTypeLookups.find(x => x.id === imageType || x.detailCode === String(imageType));
    if (!lookup) {
      return String(imageType);
    }

    return this.getLookupDisplayName(lookup, String(imageType));
  }

  onCarInfoColorPageChange(page: number) {
    this.carInfoColorPagination.page = Math.max(1, Number(page) || 1);
    this.pagedCarInfoColors = this.carInfoColorPagination.changePage(this.carInfoColors);
  }

  onCarInfoFeaturePageChange(page: number) {
    this.carInfoFeaturePagination.page = Math.max(1, Number(page) || 1);
    this.pagedCarInfoFeatures = this.carInfoFeaturePagination.changePage(this.carInfoFeatures);
  }

  onCarInfoDetailsPageChange(page: number) {
    this.carInfoDetailsPagination.page = Math.max(1, Number(page) || 1);
    this.pagedCarInfoExtraDetails = this.carInfoDetailsPagination.changePage(this.carInfoExtraDetails);
  }

  onCarInfoImagesPageChange(page: number) {
    this.carInfoImagesPagination.page = Math.max(1, Number(page) || 1);
    this.pagedCarInfoImages = this.carInfoImagesPagination.changePage(this.carInfoImages);
  }

  private getRequestStatusCode(statusId?: number): string {
    if (!statusId) return '';
    const statusLookup = this.findRequestStatusLookup(statusId);
    if (!statusLookup) return String(statusId);
    return statusLookup.detailCode || String(statusLookup.id);
  }

  private findRequestStatusLookup(statusId?: number): LookupDetail | undefined {
    if (!statusId) {
      return undefined;
    }

    return this.allRequestStatusLookups.find(x => x.id === statusId || x.detailCode === String(statusId));
  }

  private isArabicLanguage(): boolean {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || '').toLowerCase();
    return lang.startsWith('ar');
  }

  private loadCarColorsForSelectedCar(carId: number | null): void {
    const numericCarId = Number(carId);
    this.availableCarColors = [];
    this.form['colorId'].setValue(null);

    if (!Number.isFinite(numericCarId) || numericCarId <= 0) {
      return;
    }

    this.carCarColorService.getByCarId(numericCarId).pipe(first()).subscribe({
      next: (carColors) => {
        this.availableCarColors = (carColors || [])
          .filter(x => x.isAvailable)
          .map(x => {
            const color = this.colorsCatalog.find(c => c.id === x.colorId);
            return {
              colorId: x.colorId,
              nameAr: x.colorNameAr || color?.colorNameAr || null,
              nameEn: x.colorNameEn || color?.colorNameEn || null,
              colorCode: x.colorCode || color?.colorCode || null,
              colorStatus: x.colorStatus,
              colorStatusNameAr: x.colorStatusNameAr || null,
              colorStatusNameEn: x.colorStatusNameEn || null,
              colorStatusDetailCode: x.colorStatusDetailCode || null
            };
          });
      },
      error: () => {
        this.availableCarColors = [];
      }
    });
  }

  private applyFilters(resetPage = false) {
    let data = [...this.requests];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(q =>
        (q.name || '').toLowerCase().includes(term) ||
        (q.email || '').toLowerCase().includes(term) ||
        (q.mobileNo || '').toLowerCase().includes(term) ||
        String(q.id).includes(term)
      );
    }

    if (this.selectedStatusFilter) {
      data = data.filter(q => q.currentStatus === this.selectedStatusFilter);
    }

    if (this.createdFromDate) {
      const from = new Date(this.createdFromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter(q => {
        const created = new Date(q.createdAt);
        return !isNaN(created.getTime()) && created >= from;
      });
    }

    if (this.createdToDate) {
      const to = new Date(this.createdToDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(q => {
        const created = new Date(q.createdAt);
        return !isNaN(created.getTime()) && created <= to;
      });
    }

    data.sort((a, b) => this.idSortDirection === 'asc' ? a.id - b.id : b.id - a.id);

    this.filteredRequests = data;
    if (resetPage) this.service.page = 1;
    this.pagedRequests = this.service.changePage(this.filteredRequests);
  }

  private showSuccess(message: string) {
    this.toastService.show(message, {
      classname: 'bg-success text-white',
      delay: 3000
    });
  }

  private showError(error: any) {
    const message = this.errorMessageService.getMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }

  private showStatusUpdateSuccess() {
    void Swal.fire({
      icon: 'success',
      title: 'Status Updated',
      text: 'Request status updated successfully',
      confirmButtonText: 'OK'
    });
  }

  private showStatusUpdateError(error: any) {
    const raw = this.errorMessageService.getMessage(error);
    const match = raw.match(/^(\d+)\s*-\s*(.+)$/);
    const message = match ? match[2] : raw;
    const codeLine = match ? `<div style="margin-top:8px;font-size:12px;color:#6c757d;">Code: ${match[1]}</div>` : '';
    void Swal.fire({
      icon: 'error',
      title: 'Status Update Failed',
      html: `<div>${message}</div>${codeLine}`,
      confirmButtonText: 'OK'
    });
  }

  private async connectRealtime() {
    try {
      await this.requestRealtimeService.start(
        (payload) => {
          const request = payload as Request;
          if (!request?.id) return;
          if (this.requests.some(q => q.id === request.id)) return;

          this.requests = [request, ...this.requests];
          this.applyFilters(true);
          this.latestRealtimeRequest = request;
          this.toastService.show(this.realtimeToastTpl, {
            classname: 'border-0 shadow-sm request-realtime-toast',
            delay: 4000
          });
          this.playNotificationSound();
        },
        (payload) => {
          const updated = payload as Request;
          if (!updated?.id) return;

          const idx = this.requests.findIndex(x => x.id === updated.id);
          if (idx < 0) return;

          this.requests[idx] = { ...this.requests[idx], ...updated };
          this.applyFilters(false);
          this.latestRealtimeStatusRequest = updated;
          this.toastService.show(this.statusRealtimeToastTpl, {
            classname: 'border-0 shadow-sm request-realtime-toast',
            delay: 4000
          });
          this.playNotificationSound();
        }
      );
    } catch {
      this.toastService.show('Realtime notifications unavailable right now.', {
        classname: 'bg-warning text-dark',
        delay: 3000,
        nativeToast: true
      });
    }
  }

  private playNotificationSound() {
    if (!this.isSoundUnlocked) {
      if (!this.soundHintShown) {
        this.soundHintShown = true;
        this.toastService.show('Click anywhere once to enable notification sound.', {
          classname: 'bg-warning text-dark',
          delay: 3500
        });
      }
      return;
    }

    try {
      const audio = new Audio(this.notificationSoundUrl);
      audio.volume = 0.65;
      void audio.play().catch(() => this.playFallbackBeep());
    } catch {
      this.playFallbackBeep();
    }
  }

  private playFallbackBeep() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(830, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.22);
    } catch {
      // Keep UI flow even if browser blocks autoplay audio.
    }
  }

  private setupSoundUnlock() {
    window.addEventListener('pointerdown', this.unlockSoundHandler, { passive: true });
    window.addEventListener('keydown', this.unlockSoundHandler, { passive: true });
    window.addEventListener('touchstart', this.unlockSoundHandler, { passive: true });
  }

  private removeSoundUnlockListeners() {
    window.removeEventListener('pointerdown', this.unlockSoundHandler);
    window.removeEventListener('keydown', this.unlockSoundHandler);
    window.removeEventListener('touchstart', this.unlockSoundHandler);
  }

  private unlockSound() {
    this.isSoundUnlocked = true;
    this.removeSoundUnlockListeners();
  }
}
