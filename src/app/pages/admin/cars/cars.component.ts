import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Car, CarImage, CreateCarRequest, CreateCarWithDetailsRequest, UpdateCarRequest } from '../interfaces/car.interface';
import { CarService } from '../services/car.service';
import { CarType } from '../interfaces/car-type.interface';
import { CarTypeService } from '../services/car-type.service';
import { CarModel } from '../interfaces/car-model.interface';
import { CarModelService } from '../services/car-model.service';
import { getErrorMessage } from '../shared/error-message.util';
import { NgbNav, NgbNavChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { CarFeatureService } from '../services/car-feature.service';
import { CarFeature, CarCarFeature, AssignCarFeatureRequest } from '../interfaces/car-feature.interface';
import { Branch } from '../interfaces/branch.interface';
import { BranchService } from '../services/branch.service';
import { Brand } from '../interfaces/brand.interface';
import { BrandService } from '../services/brand.service';
import { GlobalComponent } from 'src/app/global-component';
import { Color } from '../interfaces/color.interface';
import { ColorService } from '../services/color.service';
import { CarExtraDetails as CarExtraDetailItem } from '../interfaces/car-extra-details.interface';
import { CarExtraDetailsService } from '../services/car-extra-details.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { CarCarColor } from '../interfaces/car-car-color.interface';
import { CarCarColorService } from '../services/car-car-color.service';
import { LookupDetail } from '../interfaces/lookup.interface';
import { LookupService } from '../services/lookup.service';
import { CarRealtimeService } from '../services/car-realtime.service';
import { TranslateService } from '@ngx-translate/core';

interface CarListActionCounts {
  features: number;
  colors: number;
  details: number;
  images: number;
  loading: boolean;
}

@Component({
  selector: 'app-cars',
  templateUrl: './cars.component.html',
  styleUrl: './cars.component.scss',
  standalone: false
})
export class CarsComponent implements OnInit, OnDestroy {
  @Input() mode: 'create' | 'list' | null = null;
  @ViewChild('nav') nav!: NgbNav;
  @ViewChild('carRealtimeToastTpl') carRealtimeToastTpl!: TemplateRef<any>;
  
  breadCrumbItems!: Array<{}>;
  carForm!: UntypedFormGroup;
  featureDetailForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isEditMode = false;
  selectedCar?: Car;
  activeTab = 1;
  pageMode: 'create' | 'list' = 'create';
  pageTitle = 'Create Car';
  canViewCar = false;
  canCreateCar = false;
  canEditCar = false;
  canDeleteCar = false;
  canSelectBranch = false;
  currentUserBranchId: number | null = null;
  private requestedCarIdToOpen: number | null = null;
  private requestedTabToOpen: number = 1;
  private readonly mainInfoFields = ['nameEn', 'nameAr', 'brandFilterId', 'modelId', 'typeId', 'branchId', 'year', 'mileage', 'vat', 'conditionId', 'seatingCapacity', 'weelSizeInch', 'fuelTankCapacityLiter', 'trimLevel', 'vehicleClass', 'manufactureCountryId', 'plateNumberAr', 'plateNumberEn', 'transmisionType', 'drivetrain', 'cylenders', 'fuelType', 'enginNumber', 'descriptionEn', 'descriptionAr'];

  // Lists
  cars: Car[] = [];
  filteredCars: Car[] = [];
  pagedCars: Car[] = [];
  carTypes: CarType[] = [];
  carModels: CarModel[] = [];
  brands: Brand[] = [];
  filterCarModels: CarModel[] = [];
  formCarModels: CarModel[] = [];
  branches: Branch[] = [];
  carImages: CarImage[] = [];
  pagedUploadedImages: CarImage[] = [];
  
  // Search & Filter
  searchTerm = '';
  filterNameEn = '';
  filterNameAr = '';
  selectedBranchFilterId?: number;
  selectedYearFilter?: number;
  selectedBrandId?: number;
  selectedModelId?: number;
  carSortDirection: 'asc' | 'desc' = 'asc';
  latestRealtimeCar: Car | null = null;
  latestRealtimeAction: 'created' | 'updated' | 'deleted' = 'created';
  private readonly notificationSoundUrl = 'assets/sounds/car-notification.mp3';
  private audioContext: AudioContext | null = null;
  private isSoundUnlocked = false;
  private soundHintShown = false;
  private readonly unlockSoundHandler = () => this.unlockSound();
  selectedCarIds = new Set<number>();
  carListActionCounts = new Map<number, CarListActionCounts>();

  // Image upload
  selectedImageFile?: File;
  selectedImageType?: number | null;
  selectedImageIsPrimary = true;
  imagePreviewUrl?: string;
  isUploadingImage = false;
  imageFileSubmitted = false;
  imageTypeSubmitted = false;
  private readonly maxGalleryImageSizeBytes = 5 * 1024 * 1024;
  pendingGalleryImages: Array<{
    pendingId: number;
    file: File;
    previewUrl: string;
    imageType?: number | null;
    isPrimary: boolean;
  }> = [];
  pagedPendingGalleryImages: Array<{
    pendingId: number;
    file: File;
    previewUrl: string;
    imageType?: number | null;
    isPrimary: boolean;
  }> = [];
  pendingGalleryImageIdSeq = 1;
  editingPendingGalleryImageId: number | null = null;
  pendingGalleryPagination = new PaginationService();
  uploadedImagePagination = new PaginationService();
  selectedPendingGalleryImageIds = new Set<number>();
  imageTypeOptions: Array<{ id: number; name: string; nameAr: string; nameEn: string }> = [];
  imageTypeLookups: LookupDetail[] = [];
  conditionOptions: Array<{ value: number; label: string }> = [];
  conditionLookups: LookupDetail[] = [];
  trimLevelOptions: Array<{ value: number; label: string }> = [];
  trimLevelLookups: LookupDetail[] = [];
  vehicleClassOptions: Array<{ value: number; label: string }> = [];
  vehicleClassLookups: LookupDetail[] = [];
  transmisionTypeOptions: Array<{ value: number; label: string }> = [];
  transmisionTypeLookups: LookupDetail[] = [];
  drivetrainOptions: Array<{ value: number; label: string }> = [];
  drivetrainLookups: LookupDetail[] = [];
  fuelTypeOptions: Array<{ value: number; label: string }> = [];
  fuelTypeLookups: LookupDetail[] = [];
  colorStatusOptions: Array<{ id: number; detailCode: string; nameAr: string; nameEn: string; label: string }> = [];
  colorStatusLookups: LookupDetail[] = [];
  manufactureCountryOptions: Array<{ value: number; label: string }> = [];
  manufactureCountryLookups: LookupDetail[] = [];
  showColorImagePreview = false;
  colorImagePreviewUrl?: string;
  colorImagePreviewName?: string;
  hoveredPendingGalleryImageId?: number | null;
  hoveredUploadedImageId?: number | null;
  showSelectedGalleryImagePreview = false;
  showExtraDetailsAddModal = false;
  showExtraDetailsStatsModal = false;
  showCarPreviewModal = false;
  isCarPreviewLoading = false;
  carPreviewTab: 'features' | 'colors' | 'details' | 'images' = 'features';
  previewCar?: Car;
  showCarInfoModal = false;
  infoCar?: Car;
  previewFeatures: CarCarFeature[] = [];
  pagedPreviewFeatures: CarCarFeature[] = [];
  previewFeaturePagination = new PaginationService();
  previewColors: CarCarColor[] = [];
  pagedPreviewColors: CarCarColor[] = [];
  previewColorPagination = new PaginationService();
  previewDetails: CarExtraDetailItem[] = [];
  pagedPreviewDetails: CarExtraDetailItem[] = [];
  previewDetailsPagination = new PaginationService();
  previewImages: CarImage[] = [];
  pagedPreviewImages: CarImage[] = [];
  previewImagesPagination = new PaginationService();
  showCreateSuccessTab = false;
  finishTabAction: 'created' | 'updated' | null = null;
  extraDetailAddSubmitted = false;
  editingPendingExtraDetailIndex: number | null = null;

  // Tab Validation
  invalidTabs: Set<number> = new Set();
  validatedTabs: Set<number> = new Set();
  private skipNextTabValidation = false;

  // Car Features
  carFeatures: CarFeature[] = [];
  pagedCarFeatures: CarFeature[] = [];
  carCarFeatures: CarCarFeature[] = [];
  pagedCarCarFeatures: CarCarFeature[] = [];
  availableFeatures: CarFeature[] = [];
  featurePagination = new PaginationService();
  pendingFeaturePagination = new PaginationService();
  selectedFeatureId?: number;
  selectedFeatureAssignmentAvailable = true;
  isAssigningFeature = false;
  featureAssignSubmitted = false;
  isCreatingFeature = false;
  featureSubmitted = false;
  featureTabSubmitted = false;
  colorTabSubmitted = false;
  detailsTabSubmitted = false;
  imageTabSubmitted = false;
  plateArLetters = '';
  plateArDigits = '';
  plateEnLetters = '';
  plateEnDigits = '';

  // Car Colors
  colors: Color[] = [];
  pagedColors: Color[] = [];
  pendingCarColors: Array<{
    colorId: number;
    colorStatus: number;
    stockQuantity?: number | null;
    colorImageUrl?: string;
    colorImageFile?: File;
    pricingPerColor?: number | null;
    pricePefore?: number | null;
    vatAmount?: number | null;
    discount?: number | null;
    discountType?: number | null;
    totalPrice?: number | null;
    createdAt?: string;
    isAvailable: boolean;
  }> = [];
  pagedPendingCarColors: Array<{
    colorId: number;
    colorStatus: number;
    stockQuantity?: number | null;
    colorImageUrl?: string;
    colorImageFile?: File;
    pricingPerColor?: number | null;
    pricePefore?: number | null;
    vatAmount?: number | null;
    discount?: number | null;
    discountType?: number | null;
    totalPrice?: number | null;
    createdAt?: string;
    isAvailable: boolean;
  }> = [];
  colorPagination = new PaginationService();
  pendingColorPagination = new PaginationService();
  pendingExtraDetails: Array<{
    pendingId: number;
    sourceExtraDetailId?: number;
    nameAr?: string;
    nameEn?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    carExtraDetailsType: number;
    isAvailable: boolean;
  }> = [];
  pagedPendingExtraDetails: Array<{
    pendingId: number;
    sourceExtraDetailId?: number;
    nameAr?: string;
    nameEn?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    carExtraDetailsType: number;
    isAvailable: boolean;
  }> = [];
  extraDetailsCatalog: CarExtraDetailItem[] = [];
  pagedExtraDetailsCatalog: CarExtraDetailItem[] = [];
  extraDetailsCatalogPagination = new PaginationService();
  extraDetailsPagination = new PaginationService();
  pendingExtraDetailIdSeq = 1;
  selectedPendingExtraDetailIds = new Set<number>();
  extraDetailDraft: {
    nameAr?: string;
    nameEn?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    carExtraDetailsType?: number | null;
    isAvailable: boolean;
  } = {
    nameAr: '',
    nameEn: '',
    descriptionEn: '',
    descriptionAr: '',
    carExtraDetailsType: null,
    isAvailable: true
  };
  extraDetailTypeOptions: Array<{ id: number; name: string; nameAr: string }> = [];
  extraDetailTypeLookups: LookupDetail[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private carService: CarService,
    private carTypeService: CarTypeService,
    private carModelService: CarModelService,
    private carFeatureService: CarFeatureService,
    private colorService: ColorService,
    private carCarColorService: CarCarColorService,
    private carExtraDetailsService: CarExtraDetailsService,
    private branchService: BranchService,
    private brandService: BrandService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private accessControlService: AccessControlService,
    private myAuthService: MyAuthService,
    private lookupService: LookupService,
    private carRealtimeService: CarRealtimeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const mode = this.mode ?? this.route.snapshot.data['mode'];
    this.pageMode = mode === 'list' ? 'list' : 'create';
    this.pageTitle = this.pageMode === 'list'
      ? this.translate.instant('CARS_PAGE.CAR_LIST')
      : this.translate.instant('CARS_PAGE.CREATE_CAR');
    this.canViewCar = this.accessControlService.hasPermission('cars.view');
    this.canCreateCar = this.accessControlService.hasPermission('cars.create');
    this.canEditCar = this.accessControlService.hasPermission('cars.edit');
    this.canDeleteCar = this.accessControlService.hasPermission('cars.delete');
    this.canSelectBranch = this.accessControlService.hasRole(['Manager', 'Admin']);
    this.currentUserBranchId = Number(this.myAuthService.currentUserValue?.branchId) || null;

    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.pageTitle, active: true }
    ];

    const carIdParam = this.route.snapshot.queryParamMap.get('carId');
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    const parsedCarId = carIdParam ? Number(carIdParam) : NaN;
    const parsedTab = tabParam ? Number(tabParam) : NaN;
    if (Number.isFinite(parsedCarId) && parsedCarId > 0) {
      this.requestedCarIdToOpen = parsedCarId;
      this.requestedTabToOpen = Number.isFinite(parsedTab) && parsedTab >= 1 && parsedTab <= 5 ? parsedTab : 1;
    }

    this.carForm = this.formBuilder.group({
      nameEn: ['', [Validators.required]],
      nameAr: ['', [Validators.required]],
      brandFilterId: [null, [Validators.required]],
      modelId: [null, [Validators.required]],
      typeId: [null, [Validators.required]],
      branchId: [this.currentUserBranchId, this.canSelectBranch ? [Validators.required] : []],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
      mileage: [0, [Validators.required, Validators.min(0)]],
      vat: [15, [Validators.required, Validators.min(0)]],
      conditionId: [null, [Validators.required, Validators.min(1)]],
      seatingCapacity: [null, [Validators.required, Validators.min(1)]],
      weelSizeInch: ['', [Validators.required]],
      fuelTankCapacityLiter: [null, [Validators.required, Validators.min(0.01)]],
      trimLevel: [null, [Validators.required, Validators.min(1)]],
      vehicleClass: [null, [Validators.required, Validators.min(1)]],
      manufactureCountryId: [null, [Validators.required, Validators.min(1)]],
      plateNumberAr: ['', [Validators.pattern(/^[A-Z]{1,3}-[0-9]{1,4}$/)]],
      plateNumberEn: ['', [Validators.pattern(/^[A-Z]{1,3}-[0-9]{1,4}$/)]],
      transmisionType: [null, [Validators.required, Validators.min(1)]],
      drivetrain: [null, [Validators.required, Validators.min(1)]],
      cylenders: [null, [Validators.required, Validators.min(1)]],
      fuelType: [null, [Validators.required, Validators.min(1)]],
      enginNumber: ['', [Validators.required]],
      descriptionEn: ['', [Validators.required]],
      descriptionAr: ['', [Validators.required]],
      isAvailable: [true]
    });

    this.featureDetailForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      isAvailable: [true]
    });

    this.featurePagination.pageSize = 8;
    this.pendingFeaturePagination.pageSize = 8;
    this.colorPagination.pageSize = 8;
    this.pendingColorPagination.pageSize = 8;
    this.extraDetailsPagination.pageSize = 8;
    this.pendingGalleryPagination.pageSize = 8;
    this.uploadedImagePagination.pageSize = 8;
    this.previewFeaturePagination.pageSize = 6;
    this.previewColorPagination.pageSize = 6;
    this.previewDetailsPagination.pageSize = 6;
    this.previewImagesPagination.pageSize = 8;
    this.extraDetailsCatalogPagination.pageSize = 8;

    if (this.canViewCar) {
      this.loadCars();
      if (this.isListPage) {
        this.setupSoundUnlock();
        this.connectRealtime();
      }
    }
    this.loadCarTypes();
    this.loadCarModels();
    this.loadBrands();
    this.loadBranches();
    this.loadColors();
    this.loadConditionOptions();
    this.loadTrimLevelOptions();
    this.loadVehicleClassOptions();
    this.loadManufactureCountryOptions();
    this.loadTransmisionTypeOptions();
    this.loadDrivetrainOptions();
    this.loadFuelTypeOptions();
    this.loadColorStatusOptions();
    this.loadExtraDetailTypeOptions();
    this.loadImageTypeOptions();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.isListPage) {
      this.removeSoundUnlockListeners();
      await this.carRealtimeService.stop();
    }
  }

  get form() {
    return this.carForm.controls;
  }

  get featureForm() {
    return this.featureDetailForm.controls;
  }

  get isCreatePage(): boolean {
    return this.pageMode === 'create';
  }

  get isListPage(): boolean {
    return this.pageMode === 'list';
  }

  get availableCarsCount(): number {
    return this.filteredCars.filter(car => car.isAvailable).length;
  }

  get unavailableCarsCount(): number {
    return this.filteredCars.length - this.availableCarsCount;
  }

  loadCars() {
    this.isLoading = true;
    this.carService.getCars().pipe(first()).subscribe({
      next: (cars) => {
        this.cars = cars;
        this.carListActionCounts.clear();
        this.applyFilters(true);
        this.isLoading = false;
        this.tryOpenRequestedCar();
      },
      error: (error) => {
        this.showError(error);
        this.isLoading = false;
      }
    });
  }

  private tryOpenRequestedCar() {
    if (this.requestedCarIdToOpen === null) return;

    const car = this.cars.find(c => c.id === this.requestedCarIdToOpen);
    if (!car) return;

    const targetTab = this.requestedTabToOpen;
    this.requestedCarIdToOpen = null;
    this.requestedTabToOpen = 1;

    this.openEditModal(car);
    this.activeTab = targetTab;
  }

  loadCarTypes() {
    this.carTypeService.getCarTypes().pipe(first()).subscribe({
      next: (types) => {
        this.carTypes = types;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadCarModels() {
    this.carModelService.getModels().pipe(first()).subscribe({
      next: (models) => {
        this.carModels = models;
        this.filterCarModels = models;
        this.formCarModels = [];
        if (this.selectedCar && !this.carForm?.get('brandFilterId')?.value) {
          const selectedModel = models.find(m => m.id === this.selectedCar?.modelId);
          if (selectedModel) {
            this.carForm.patchValue({ brandFilterId: selectedModel.brandId }, { emitEvent: false });
            this.onFormBrandChange(selectedModel.brandId);
          }
        }
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadBrands() {
    this.brandService.getBrands().pipe(first()).subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadConditionOptions() {
    this.lookupService.getByMasterCode('CAR_CONDITION').pipe(first()).subscribe({
      next: (lookups) => {
        this.conditionLookups = lookups || [];
        this.conditionOptions = this.conditionLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  getConditionLabel(conditionId?: number | null): string {
    if (!conditionId) return '-';
    return this.conditionOptions.find(item => item.value === conditionId)?.label || `#${conditionId}`;
  }

  loadTrimLevelOptions() {
    this.lookupService.getByMasterCode('CAR_TRIM_LEVEL').pipe(first()).subscribe({
      next: (lookups) => {
        this.trimLevelLookups = lookups || [];
        this.trimLevelOptions = this.trimLevelLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  getTrimLevelLabel(trimLevel?: number | null): string {
    if (!trimLevel) return '-';
    return this.trimLevelOptions.find(item => item.value === trimLevel)?.label || `#${trimLevel}`;
  }

  loadVehicleClassOptions() {
    this.lookupService.getByMasterCode('CAR_VEHICLE_CLASS').pipe(first()).subscribe({
      next: (lookups) => {
        this.vehicleClassLookups = lookups || [];
        this.vehicleClassOptions = this.vehicleClassLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => this.showError(error)
    });
  }

  getVehicleClassLabel(vehicleClass?: number | null): string {
    if (!vehicleClass) return '-';
    return this.vehicleClassOptions.find(item => item.value === vehicleClass)?.label || `#${vehicleClass}`;
  }

  loadTransmisionTypeOptions() {
    this.lookupService.getByMasterCode('CAR_TRANSMISION_TYPE').pipe(first()).subscribe({
      next: (lookups) => {
        this.transmisionTypeLookups = lookups || [];
        this.transmisionTypeOptions = this.transmisionTypeLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => this.showError(error)
    });
  }

  getTransmisionTypeLabel(transmisionType?: number | null): string {
    if (!transmisionType) return '-';
    return this.transmisionTypeOptions.find(item => item.value === transmisionType)?.label || `#${transmisionType}`;
  }

  loadDrivetrainOptions() {
    this.lookupService.getByMasterCode('CAR_DRIVETRAIN').pipe(first()).subscribe({
      next: (lookups) => {
        this.drivetrainLookups = lookups || [];
        this.drivetrainOptions = this.drivetrainLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => this.showError(error)
    });
  }

  getDrivetrainLabel(drivetrain?: number | null): string {
    if (!drivetrain) return '-';
    return this.drivetrainOptions.find(item => item.value === drivetrain)?.label || `#${drivetrain}`;
  }

  loadFuelTypeOptions() {
    this.lookupService.getByMasterCode('CAR_FUEL_TYPE').pipe(first()).subscribe({
      next: (lookups) => {
        this.fuelTypeLookups = lookups || [];
        this.fuelTypeOptions = this.fuelTypeLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => this.showError(error)
    });
  }

  getFuelTypeLabel(fuelType?: number | null): string {
    if (!fuelType) return '-';
    return this.fuelTypeOptions.find(item => item.value === fuelType)?.label || `#${fuelType}`;
  }

  loadColorStatusOptions() {
    this.lookupService.getByMasterCode('CAR_COLOR_STATUS').pipe(first()).subscribe({
      next: (lookups) => {
        this.colorStatusLookups = lookups || [];
        this.colorStatusOptions = this.colorStatusLookups
          .map(item => {
            const id = Number(item?.id);
            if (!Number.isFinite(id) || id <= 0) {
              return null;
            }

            return {
              id,
              detailCode: item?.detailCode || '',
              nameAr: item?.nameAr || '',
              nameEn: item?.nameEn || '',
              label: `${item?.nameAr || ''} - ${item?.nameEn || ''}`
            };
          })
          .filter((item): item is { id: number; detailCode: string; nameAr: string; nameEn: string; label: string } => item !== null)
          .sort((a, b) => a.id - b.id);
      },
      error: (error) => this.showError(error)
    });
  }

  getColorStatusLabel(colorStatusId?: number | null): string {
    if (!colorStatusId) return '-';
    const status = this.colorStatusOptions.find(item => item?.id === colorStatusId);
    if (!status) return `#${colorStatusId}`;
    return this.translate.currentLang?.startsWith('ar')
      ? (status.nameAr || status.nameEn || status.detailCode || `#${colorStatusId}`)
      : (status.nameEn || status.nameAr || status.detailCode || `#${colorStatusId}`);
  }

  private getDefaultColorStatusId(): number {
    if (!this.colorStatusOptions.length) {
      return 0;
    }

    const availableStatus = this.colorStatusOptions.find(item =>
      (item?.detailCode || '').toLowerCase() === 'available');
    return availableStatus?.id ?? this.colorStatusOptions[0].id;
  }

  trackByColorStatusId(index: number, status?: { id: number } | null): number {
    return status?.id ?? index;
  }

  loadImageTypeOptions() {
    this.lookupService.getByMasterCode('IMAGE_TYPE').pipe(first()).subscribe({
      next: (lookups) => {
        this.imageTypeLookups = lookups || [];
        this.imageTypeOptions = this.imageTypeLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            if (!Number.isFinite(parsedValue)) {
              return null;
            }
            return {
              id: parsedValue,
              name: `${item.nameAr} - ${item.nameEn}`,
              nameAr: item.nameAr,
              nameEn: item.nameEn
            };
          })
          .filter((item): item is { id: number; name: string; nameAr: string; nameEn: string } => item !== null)
          .sort((a, b) => a.id - b.id);
      },
      error: (error) => this.showError(error)
    });
  }

  loadExtraDetailTypeOptions() {
    this.lookupService.getByMasterCode('EXTRA_TYPE').pipe(first()).subscribe({
      next: (lookups) => {
        this.extraDetailTypeLookups = lookups || [];
        this.extraDetailTypeOptions = this.extraDetailTypeLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            if (!Number.isFinite(parsedValue)) {
              return null;
            }
            return {
              id: parsedValue,
              name: item.nameEn,
              nameAr: item.nameAr
            };
          })
          .filter((item): item is { id: number; name: string; nameAr: string } => item !== null)
          .sort((a, b) => a.id - b.id);
      },
      error: (error) => this.showError(error)
    });
  }

  loadManufactureCountryOptions() {
    this.lookupService.getByMasterCode('COUNTRY').pipe(first()).subscribe({
      next: (lookups) => {
        this.manufactureCountryLookups = lookups || [];
        this.manufactureCountryOptions = this.manufactureCountryLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => this.showError(error)
    });
  }

  getManufactureCountryLabel(manufactureCountryId?: number | null): string {
    if (!manufactureCountryId) return '-';
    return this.manufactureCountryOptions.find(item => item.value === manufactureCountryId)?.label || `#${manufactureCountryId}`;
  }

  loadBranches() {
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadCarImages(carId: number) {
    this.carService.getCarImages(carId).pipe(first()).subscribe({
      next: (images) => {
        this.carImages = images;
        this.refreshUploadedImagePagination(true);
        this.syncImageTabValidationState();
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadCarCarColors(carId: number) {
    this.carCarColorService.getByCarId(carId).pipe(first()).subscribe({
      next: (carColors: CarCarColor[]) => {
        this.pendingCarColors = carColors.map((item) => ({
          colorId: item.colorId,
          colorStatus: item.colorStatus || this.getDefaultColorStatusId(),
          stockQuantity: item.stockQuantity ?? null,
          colorImageUrl: item.colorImageUrl || '',
          colorImageFile: undefined,
          pricingPerColor: item.pricingPerColor ?? null,
          pricePefore: item.pricePefore ?? null,
          vatAmount: item.vatAmount ?? null,
          discount: item.discount ?? null,
          discountType: item.discountType ?? null,
          totalPrice: item.totalPrice ?? null,
          createdAt: undefined,
          isAvailable: item.isAvailable
        }));
        this.refreshPendingColorPagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  loadCarExtraDetails(carId: number) {
    this.carExtraDetailsService.getExtraDetailsByCarId(carId).pipe(first()).subscribe({
      next: (items) => {
        this.pendingExtraDetails = items.map((item, index) => ({
          pendingId: index + 1,
          sourceExtraDetailId: undefined,
          nameAr: item.nameAr?.trim(),
          nameEn: item.nameEn?.trim(),
          descriptionEn: item.descriptionEn?.trim(),
          descriptionAr: item.descriptionAr?.trim(),
          carExtraDetailsType: item.carExtraDetailsType || 1,
          isAvailable: item.isAvailable
        }));
        this.pendingExtraDetailIdSeq = this.pendingExtraDetails.length + 1;
        this.selectedPendingExtraDetailIds.clear();
        this.refreshPendingExtraDetailsPagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  loadCarFeatures() {
    this.carFeatureService.getCarFeatures().pipe(first()).subscribe({
      next: (features) => {
        this.carFeatures = features;
        this.updateAvailableFeatures();
        this.refreshFeaturePagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  loadColors() {
    this.colorService.getColors().pipe(first()).subscribe({
      next: (colors) => {
        this.colors = colors;
        this.refreshColorPagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  reloadColors() {
    this.loadColors();
  }

  loadExtraDetailsCatalog() {
    this.carExtraDetailsService.getExtraDetails().pipe(first()).subscribe({
      next: (items) => {
        this.extraDetailsCatalog = items;
        this.refreshExtraDetailsCatalogPagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  reloadExtraDetailsCatalog() {
    this.loadExtraDetailsCatalog();
  }

  reloadFeatureCatalog() {
    this.loadCarFeatures();
    if (this.selectedCar) {
      this.loadCarCarFeatures(this.selectedCar.id);
    }
  }

  refreshFeaturePagination(resetPage = false) {
    if (resetPage) {
      this.featurePagination.page = 1;
    }
    this.pagedCarFeatures = this.featurePagination.changePage(this.carFeatures);
  }

  onFeaturePageChange(page: number) {
    this.featurePagination.page = page;
    this.pagedCarFeatures = this.featurePagination.changePage(this.carFeatures);
  }

  refreshColorPagination(resetPage = false) {
    if (resetPage) {
      this.colorPagination.page = 1;
    }
    this.pagedColors = this.colorPagination.changePage(this.colors);
  }

  onColorPageChange(page: number) {
    this.colorPagination.page = page;
    this.pagedColors = this.colorPagination.changePage(this.colors);
  }

  refreshPendingColorPagination(resetPage = false) {
    if (resetPage) {
      this.pendingColorPagination.page = 1;
    }
    this.pagedPendingCarColors = this.pendingColorPagination.changePage(this.pendingCarColors);
    this.syncColorTabValidationState();
  }

  onPendingColorPageChange(page: number) {
    this.pendingColorPagination.page = page;
    this.pagedPendingCarColors = this.pendingColorPagination.changePage(this.pendingCarColors);
  }

  refreshPendingExtraDetailsPagination(resetPage = false) {
    if (resetPage) {
      this.extraDetailsPagination.page = 1;
    }
    this.pagedPendingExtraDetails = this.extraDetailsPagination.changePage(this.pendingExtraDetails);
    this.syncDetailsTabValidationState();
  }

  onPendingExtraDetailsPageChange(page: number) {
    this.extraDetailsPagination.page = page;
    this.pagedPendingExtraDetails = this.extraDetailsPagination.changePage(this.pendingExtraDetails);
  }

  refreshExtraDetailsCatalogPagination(resetPage = false) {
    if (resetPage) {
      this.extraDetailsCatalogPagination.page = 1;
    }
    this.pagedExtraDetailsCatalog = this.extraDetailsCatalogPagination.changePage(this.extraDetailsCatalog);
  }

  onExtraDetailsCatalogPageChange(page: number) {
    this.extraDetailsCatalogPagination.page = page;
    this.pagedExtraDetailsCatalog = this.extraDetailsCatalogPagination.changePage(this.extraDetailsCatalog);
  }

  refreshPendingFeaturePagination(resetPage = false) {
    if (resetPage) {
      this.pendingFeaturePagination.page = 1;
    }
    this.pagedCarCarFeatures = this.pendingFeaturePagination.changePage(this.carCarFeatures);
    this.syncFeatureTabValidationState();
  }

  onPendingFeaturePageChange(page: number) {
    this.pendingFeaturePagination.page = page;
    this.pagedCarCarFeatures = this.pendingFeaturePagination.changePage(this.carCarFeatures);
  }

  createFeatureFromTab() {
    this.featureSubmitted = true;
    if (this.featureDetailForm.invalid) {
      this.featureDetailForm.markAllAsTouched();
      return;
    }

    this.isCreatingFeature = true;
    const isAvailable = !!this.featureForm['isAvailable'].value;
    const payload = {
      nameEn: this.featureForm['nameEn'].value,
      nameAr: this.featureForm['nameAr'].value
    };

    this.carFeatureService.createCarFeature(payload).pipe(first()).subscribe({
      next: (createdFeature) => {
        this.isCreatingFeature = false;
        this.showSuccess('Feature created successfully');

        const resetForm = () => {
          this.featureDetailForm.reset({ nameEn: '', nameAr: '', isAvailable: true });
          this.featureSubmitted = false;
          this.loadCarFeatures();
        };

        if (!isAvailable) {
          this.carFeatureService.updateCarFeature(createdFeature.id, {
            nameEn: createdFeature.nameEn,
            nameAr: createdFeature.nameAr,
            isAvailable: false
          }).pipe(first()).subscribe({
            next: () => resetForm(),
            error: (error) => {
              this.showError(error);
              resetForm();
            }
          });
          return;
        }

        resetForm();
      },
      error: (error) => {
        this.isCreatingFeature = false;
        this.showError(error);
      }
    });
  }

  loadCarCarFeatures(carId: number) {
    this.carFeatureService.getCarFeaturesByCarId(carId).pipe(first()).subscribe({
      next: (carFeatures) => {
        this.carCarFeatures = carFeatures;
        this.updateAvailableFeatures();
        this.refreshPendingFeaturePagination(true);
      },
      error: (error) => this.showError(error)
    });
  }

  updateAvailableFeatures() {
    const assignedFeatureIds = new Set(this.carCarFeatures.map(cf => cf.featureId));
    this.availableFeatures = this.carFeatures.filter(f => !assignedFeatureIds.has(f.id));
  }

  isFeatureAssigned(featureId: number): boolean {
    return this.carCarFeatures.some(cf => cf.featureId === featureId);
  }

  getCarFeatureAssignment(featureId: number): CarCarFeature | undefined {
    return this.carCarFeatures.find(cf => cf.featureId === featureId);
  }

  assignFeatureToCar() {
    this.featureAssignSubmitted = true;
    if (!this.selectedFeatureId) return;
    
    this.isAssigningFeature = true;
    const payload: AssignCarFeatureRequest = {
      featureId: this.selectedFeatureId,
      isAvailable: this.selectedFeatureAssignmentAvailable
    };

    if (!this.selectedCar) {
      const alreadyExists = this.carCarFeatures.some(cf => cf.featureId === payload.featureId);
      if (alreadyExists) {
        this.isAssigningFeature = false;
        this.showError('Feature already added to pending list');
        return;
      }

      this.carCarFeatures = [
        ...this.carCarFeatures,
        {
          carId: 0,
          featureId: payload.featureId,
          isAvailable: payload.isAvailable,
          createdBy: undefined,
          createdAt: undefined
        }
      ];
      this.updateAvailableFeatures();
      this.refreshPendingFeaturePagination();
      this.isAssigningFeature = false;
      this.selectedFeatureId = undefined;
      this.selectedFeatureAssignmentAvailable = true;
      this.featureAssignSubmitted = false;
      this.showSuccess('Feature added to list. It will be saved with the car.');
      return;
    }
    
    this.carFeatureService.assignFeatureToCar(this.selectedCar.id, payload).pipe(first()).subscribe({
      next: () => {
        this.isAssigningFeature = false;
        this.selectedFeatureId = undefined;
        this.selectedFeatureAssignmentAvailable = true;
        this.featureAssignSubmitted = false;
        this.showSuccess('Feature assigned successfully');
        this.loadCarCarFeatures(this.selectedCar!.id);
      },
      error: (error) => {
        this.isAssigningFeature = false;
        this.showError(error);
      }
    });
  }

  onFeatureAssignedToggle(featureId: number, checked: boolean) {
    if (checked) {
      this.selectedFeatureId = featureId;
      this.selectedFeatureAssignmentAvailable = true;
      this.assignFeatureToCar();
      return;
    }

    this.removeFeatureFromCar(featureId);
  }

  selectAllFeaturesForCar() {
    if (this.isEditMode) {
      this.showError('Select all features is available in create mode only right now.');
      return;
    }

    const existingIds = new Set(this.carCarFeatures.map(cf => cf.featureId));
    const toAdd = this.carFeatures
      .filter(f => !existingIds.has(f.id))
      .map(f => ({
        carId: 0,
        featureId: f.id,
        isAvailable: true,
        createdBy: undefined,
        createdAt: undefined
      }));

    if (!toAdd.length) return;

    this.carCarFeatures = [...this.carCarFeatures, ...toAdd];
    this.updateAvailableFeatures();
    this.refreshPendingFeaturePagination(true);
  }

  clearAllFeaturesForCar() {
    if (this.isEditMode) {
      this.showError('Clear all features is available in create mode only right now.');
      return;
    }

    if (!this.carCarFeatures.length) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Remove all ${this.carCarFeatures.length} feature(s) from the list?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.carCarFeatures = [];
      this.updateAvailableFeatures();
      this.refreshPendingFeaturePagination(true);
      this.showSuccess('All features removed from list');
    });
  }

  isColorAssigned(colorId: number): boolean {
    return this.pendingCarColors.some(c => c.colorId === colorId);
  }

  onColorAssignedToggle(color: Color, checked: boolean) {
    if (checked) {
      if (!this.colorStatusOptions.length) {
        this.showError('Color statuses are not loaded yet. Please wait a moment and try again.');
        return;
      }
      if (this.isColorAssigned(color.id)) return;

      this.pendingCarColors = [
        ...this.pendingCarColors,
        {
          colorId: color.id,
          colorStatus: this.getDefaultColorStatusId(),
          stockQuantity: null,
          colorImageUrl: '',
          colorImageFile: undefined,
          pricingPerColor: null,
          pricePefore: null,
          vatAmount: null,
          discount: null,
          discountType: null,
          totalPrice: null,
          createdAt: new Date().toISOString(),
          isAvailable: true
        }
      ];
      this.refreshPendingColorPagination();
      this.showSuccess('Color added to list. It will be saved with the car.');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this car color details from the list?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.pendingCarColors = this.pendingCarColors.filter(c => c.colorId !== color.id);
      this.refreshPendingColorPagination();
      this.showSuccess('Color removed from list');
    });
  }

  selectAllColorsForCar() {
    if (this.isEditMode) {
      this.showError('Select all colors is available in create mode only right now.');
      return;
    }
    if (!this.colorStatusOptions.length) {
      this.showError('Color statuses are not loaded yet. Please wait a moment and try again.');
      return;
    }

    const existingIds = new Set(this.pendingCarColors.map(c => c.colorId));
    const toAdd = this.colors
      .filter(c => !existingIds.has(c.id))
      .map(c => ({
        colorId: c.id,
        colorStatus: this.getDefaultColorStatusId(),
        stockQuantity: null,
        colorImageUrl: '',
        colorImageFile: undefined,
        pricingPerColor: null,
        pricePefore: null,
        vatAmount: null,
        discount: null,
        discountType: null,
        totalPrice: null,
        createdAt: new Date().toISOString(),
        isAvailable: true
      }));

    if (!toAdd.length) return;

    this.pendingCarColors = [...this.pendingCarColors, ...toAdd];
    this.refreshPendingColorPagination(true);
  }

  clearAllColorsForCar() {
    if (this.isEditMode) {
      this.showError('Clear all colors is available in create mode only right now.');
      return;
    }

    if (!this.pendingCarColors.length) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Remove all ${this.pendingCarColors.length} color(s) from the list?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.pendingCarColors = [];
      this.refreshPendingColorPagination(true);
      this.showSuccess('All colors removed from list');
    });
  }

  getColorById(colorId: number): Color | undefined {
    return this.colors.find(c => c.id === colorId);
  }

  isExtraDetailAssigned(extraDetailId: number): boolean {
    return this.pendingExtraDetails.some(d => d.sourceExtraDetailId === extraDetailId);
  }

  onExtraDetailAssignedToggle(detail: CarExtraDetailItem, checked: boolean) {
    if (this.isEditMode) {
      this.showError('Extra details catalog assign is available in create mode only right now.');
      return;
    }

    if (checked) {
      if (this.isExtraDetailAssigned(detail.id)) return;

      this.pendingExtraDetails = [
        ...this.pendingExtraDetails,
        {
          pendingId: this.pendingExtraDetailIdSeq++,
          sourceExtraDetailId: detail.id,
          nameAr: detail.nameAr?.trim(),
          nameEn: detail.nameEn?.trim(),
          descriptionEn: detail.descriptionEn?.trim(),
          descriptionAr: detail.descriptionAr?.trim(),
          carExtraDetailsType: this.getExtraDetailTypeIdFromItem(detail),
          isAvailable: detail.isAvailable ?? true
        }
      ];
      this.refreshPendingExtraDetailsPagination();
      this.showSuccess('Extra detail added to list. It will be saved with the car.');
      return;
    }

    const removedIds = this.pendingExtraDetails
      .filter(d => d.sourceExtraDetailId === detail.id)
      .map(d => d.pendingId);
    removedIds.forEach(id => this.selectedPendingExtraDetailIds.delete(id));
    this.pendingExtraDetails = this.pendingExtraDetails.filter(d => d.sourceExtraDetailId !== detail.id);
    this.refreshPendingExtraDetailsPagination();
    this.showSuccess('Extra detail removed from list');
  }

  selectAllExtraDetailsForCar() {
    if (this.isEditMode) {
      this.showError('Select all extra details is available in create mode only right now.');
      return;
    }

    const existingIds = new Set(
      this.pendingExtraDetails
        .map(d => d.sourceExtraDetailId)
        .filter((id): id is number => typeof id === 'number')
    );

    const toAdd = this.extraDetailsCatalog
      .filter(d => !existingIds.has(d.id))
      .map(d => ({
        pendingId: this.pendingExtraDetailIdSeq++,
        sourceExtraDetailId: d.id,
        nameAr: d.nameAr?.trim(),
        nameEn: d.nameEn?.trim(),
        descriptionEn: d.descriptionEn?.trim(),
        descriptionAr: d.descriptionAr?.trim(),
        carExtraDetailsType: this.getExtraDetailTypeIdFromItem(d),
        isAvailable: d.isAvailable ?? true
      }));

    if (!toAdd.length) return;

    this.pendingExtraDetails = [...this.pendingExtraDetails, ...toAdd];
    this.refreshPendingExtraDetailsPagination(true);
  }

  clearCatalogExtraDetailsForCar() {
    if (this.isEditMode) {
      this.showError('Clear selected extra details is available in create mode only right now.');
      return;
    }

    this.pendingExtraDetails = this.pendingExtraDetails.filter(d => d.sourceExtraDetailId === undefined);
    this.refreshPendingExtraDetailsPagination(true);
  }

  addExtraDetailToList() {
    this.extraDetailAddSubmitted = true;

    if (!this.extraDetailDraft.carExtraDetailsType) {
      this.showError('Extra detail type is required');
      return;
    }
    if (!this.extraDetailDraft.nameEn?.trim()) {
      this.showError('Name (EN) is required');
      return;
    }
    if (!this.extraDetailDraft.nameAr?.trim()) {
      this.showError('Name (AR) is required');
      return;
    }

    const existingItem = this.editingPendingExtraDetailIndex !== null
      ? this.pendingExtraDetails[this.editingPendingExtraDetailIndex]
      : undefined;

    const item = {
      pendingId: existingItem?.pendingId ?? this.pendingExtraDetailIdSeq++,
      sourceExtraDetailId: existingItem?.sourceExtraDetailId,
      nameAr: this.extraDetailDraft.nameAr?.trim(),
      nameEn: this.extraDetailDraft.nameEn?.trim(),
      descriptionEn: this.extraDetailDraft.descriptionEn?.trim(),
      descriptionAr: this.extraDetailDraft.descriptionAr?.trim(),
      carExtraDetailsType: this.extraDetailDraft.carExtraDetailsType,
      isAvailable: this.extraDetailDraft.isAvailable
    };

    if (this.editingPendingExtraDetailIndex !== null) {
      this.pendingExtraDetails = this.pendingExtraDetails.map((d, i) =>
        i === this.editingPendingExtraDetailIndex ? item : d
      );
    } else {
      this.pendingExtraDetails = [...this.pendingExtraDetails, item];
    }

    this.extraDetailDraft = {
      nameAr: '',
      nameEn: '',
      descriptionEn: '',
      descriptionAr: '',
      carExtraDetailsType: null,
      isAvailable: true
    };
    this.refreshPendingExtraDetailsPagination(true);
    this.showExtraDetailsAddModal = false;
    this.extraDetailAddSubmitted = false;
    const wasEditing = this.editingPendingExtraDetailIndex !== null;
    this.editingPendingExtraDetailIndex = null;
    this.showSuccess(wasEditing ? 'Extra detail updated successfully' : 'Extra detail added to list. It will be saved with the car.');
  }

  openExtraDetailsAddModal() {
    this.extraDetailAddSubmitted = false;
    this.editingPendingExtraDetailIndex = null;
    this.showExtraDetailsAddModal = true;
  }

  closeExtraDetailsAddModal() {
    this.extraDetailAddSubmitted = false;
    this.editingPendingExtraDetailIndex = null;
    this.showExtraDetailsAddModal = false;
  }

  editPendingExtraDetail(indexInPaged: number) {
    const actualIndex = this.getPendingExtraDetailActualIndex(indexInPaged);
    const item = this.pendingExtraDetails[actualIndex];
    if (!item) return;

    this.editingPendingExtraDetailIndex = actualIndex;
    this.extraDetailAddSubmitted = false;
    this.extraDetailDraft = {
      nameAr: item.nameAr || '',
      nameEn: item.nameEn || '',
      descriptionEn: item.descriptionEn || '',
      descriptionAr: item.descriptionAr || '',
      carExtraDetailsType: item.carExtraDetailsType,
      isAvailable: item.isAvailable
    };
    this.showExtraDetailsAddModal = true;
  }

  openExtraDetailsStatsModal() {
    this.showExtraDetailsStatsModal = true;
  }

  closeExtraDetailsStatsModal() {
    this.showExtraDetailsStatsModal = false;
  }

  removePendingExtraDetail(indexInPaged: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this extra detail from the list?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const actualIndex = this.getPendingExtraDetailActualIndex(indexInPaged);
      const removedItem = this.pendingExtraDetails[actualIndex];
      if (removedItem) {
        this.selectedPendingExtraDetailIds.delete(removedItem.pendingId);
      }
      this.pendingExtraDetails = this.pendingExtraDetails.filter((_, i) => i !== actualIndex);
      this.refreshPendingExtraDetailsPagination();
      this.showSuccess('Extra detail removed from list');
    });
  }

  private getPendingExtraDetailActualIndex(indexInPaged: number): number {
    const startIndex = (this.extraDetailsPagination.page - 1) * this.extraDetailsPagination.pageSize;
    return startIndex + indexInPaged;
  }

  clearAllExtraDetails() {
    if (!this.pendingExtraDetails.length) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Remove all ${this.pendingExtraDetails.length} extra detail(s) from the list?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.pendingExtraDetails = [];
      this.selectedPendingExtraDetailIds.clear();
      this.refreshPendingExtraDetailsPagination(true);
      this.showSuccess('All extra details removed from list');
    });
  }

  togglePendingExtraDetailSelection(pendingId: number, checked: boolean) {
    if (checked) {
      this.selectedPendingExtraDetailIds.add(pendingId);
    } else {
      this.selectedPendingExtraDetailIds.delete(pendingId);
    }
  }

  toggleSelectAllPendingExtraDetails(checked: boolean) {
    if (checked) {
      this.pendingExtraDetails.forEach(item => this.selectedPendingExtraDetailIds.add(item.pendingId));
      return;
    }
    this.selectedPendingExtraDetailIds.clear();
  }

  isAllPendingExtraDetailsSelected(): boolean {
    return this.pendingExtraDetails.length > 0 && this.pendingExtraDetails.every(item => this.selectedPendingExtraDetailIds.has(item.pendingId));
  }

  clearSelectedPendingExtraDetails() {
    if (this.selectedPendingExtraDetailIds.size === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Remove ${this.selectedPendingExtraDetailIds.size} selected extra detail(s) from the list?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.pendingExtraDetails = this.pendingExtraDetails.filter(item => !this.selectedPendingExtraDetailIds.has(item.pendingId));
      this.selectedPendingExtraDetailIds.clear();
      this.refreshPendingExtraDetailsPagination(true);
      this.showSuccess('Selected extra details removed from list');
    });
  }

  getExtraDetailTypeName(typeId: number): string {
    return this.extraDetailTypeOptions.find(t => t.id === typeId)?.name || `Type ${typeId}`;
  }

  isExtraDetailDraftFieldInvalid(field: 'type' | 'nameEn' | 'nameAr'): boolean {
    if (!this.extraDetailAddSubmitted) return false;
    if (field === 'type') return !this.extraDetailDraft.carExtraDetailsType;
    if (field === 'nameEn') return !this.extraDetailDraft.nameEn?.trim();
    return !this.extraDetailDraft.nameAr?.trim();
  }

  getExtraDetailTypeIcon(typeId: number): string {
    switch (typeId) {
      case 1: return 'ri-volume-up-line'; // Audio And Communication System
      case 2: return 'ri-steering-2-line'; // Ease And Comfort
      case 3: return 'ri-settings-3-line'; // Engine Specification
      case 4: return 'ri-roadster-line'; // Exterior
      case 5: return 'ri-star-smile-line'; // Extra Feature
      case 6: return 'ri-ruler-line'; // Measurements
      case 7: return 'ri-shield-check-line'; // Safety
      case 8: return 'ri-user-star-line'; // Seating
      case 9: return 'ri-arrow-left-right-line'; // Transmission
      default: return 'ri-list-check-2';
    }
  }

  getExtraDetailsTypeStats() {
    return this.extraDetailTypeOptions.map(type => {
      const allCount = this.extraDetailsCatalog.filter(d => (d.carExtraDetailsType || 1) === type.id).length;
      const assignedCount = this.pendingExtraDetails.filter(d => d.carExtraDetailsType === type.id).length;
      return {
        id: type.id,
        name: type.name,
        nameAr: (type as any).nameAr || '',
        allCount,
        assignedCount,
        availableCount: Math.max(allCount - assignedCount, 0)
      };
    });
  }

  private getExtraDetailTypeIdFromItem(detail: CarExtraDetailItem): number {
    const raw = (detail as any).carExtraDetailsType;
    return typeof raw === 'number' && raw > 0 ? raw : 1;
  }

  onPendingCarColorImageSelected(
    pending: {
      colorId: number;
      stockQuantity?: number | null;
      colorImageUrl?: string;
      colorImageFile?: File;
      pricingPerColor?: number | null;
      pricePefore?: number | null;
      vatAmount?: number | null;
      discount?: number | null;
      discountType?: number | null;
      totalPrice?: number | null;
      createdAt?: string;
      isAvailable: boolean;
    },
    event: Event
  ) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    pending.colorImageFile = file;
    if (file) {
      pending.colorImageUrl = '';
    }
  }

  onPlateArLettersInput(value: string) {
    this.plateArLetters = (value || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3);
    this.syncPlateNumberAr();
  }

  onPlateArDigitsInput(value: string) {
    this.plateArDigits = (value || '')
      .replace(/\D/g, '')
      .slice(0, 4);
    this.syncPlateNumberAr();
  }

  onPlateEnLettersInput(value: string) {
    this.plateEnLetters = (value || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3);
    this.syncPlateNumberEn();
  }

  onPlateEnDigitsInput(value: string) {
    this.plateEnDigits = (value || '')
      .replace(/\D/g, '')
      .slice(0, 4);
    this.syncPlateNumberEn();
  }

  private syncPlateNumberAr() {
    const plateNumberAr = this.plateArLetters && this.plateArDigits
      ? `${this.plateArLetters}-${this.plateArDigits}`
      : '';
    this.carForm.patchValue({ plateNumberAr }, { emitEvent: false });
    this.carForm.get('plateNumberAr')?.markAsTouched();
  }

  private syncPlateNumberEn() {
    const plateNumberEn = this.plateEnLetters && this.plateEnDigits
      ? `${this.plateEnLetters}-${this.plateEnDigits}`
      : '';
    this.carForm.patchValue({ plateNumberEn }, { emitEvent: false });
    this.carForm.get('plateNumberEn')?.markAsTouched();
  }

  private setPlateParts(plateNumberAr?: string | null, plateNumberEn?: string | null) {
    const arMatch = (plateNumberAr || '').toUpperCase().trim().match(/^([A-Z]{1,3})-?([0-9]{1,4})$/);
    this.plateArLetters = arMatch?.[1] ?? '';
    this.plateArDigits = arMatch?.[2] ?? '';

    const enMatch = (plateNumberEn || '').toUpperCase().trim().match(/^([A-Z]{1,3})-?([0-9]{1,4})$/);
    this.plateEnLetters = enMatch?.[1] ?? '';
    this.plateEnDigits = enMatch?.[2] ?? '';

    this.carForm.patchValue({
      plateNumberAr: this.plateArLetters && this.plateArDigits ? `${this.plateArLetters}-${this.plateArDigits}` : '',
      plateNumberEn: this.plateEnLetters && this.plateEnDigits ? `${this.plateEnLetters}-${this.plateEnDigits}` : ''
    }, { emitEvent: false });
  }

  private isPendingCarColorStatusValid(item: {
    colorStatus: number;
  }): boolean {
    return Number.isFinite(item.colorStatus) && item.colorStatus > 0;
  }

  private isPendingCarColorStockValid(item: {
    stockQuantity?: number | null;
  }): boolean {
    return item.stockQuantity !== null && item.stockQuantity !== undefined && item.stockQuantity >= 0;
  }

  private isPendingCarColorPricingValid(item: {
    pricingPerColor?: number | null;
  }): boolean {
    return item.pricingPerColor !== null && item.pricingPerColor !== undefined && item.pricingPerColor >= 0;
  }

  private isPendingCarColorPriceBeforeValid(item: {
    pricePefore?: number | null;
  }): boolean {
    if (item.pricePefore === null || item.pricePefore === undefined) {
      return true;
    }
    return item.pricePefore >= 0;
  }

  private isPendingCarColorDiscountValid(item: {
    discount?: number | null;
  }): boolean {
    return item.discount !== null && item.discount !== undefined && item.discount >= 0;
  }

  private isPendingCarColorDiscountTypeValid(item: {
    discountType?: number | null;
  }): boolean {
    return item.discountType === 0 || item.discountType === 1;
  }

  private roundCurrencyAwayFromZero(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    const sign = value < 0 ? -1 : 1;
    return sign * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
  }

  private calculatePendingCarColorAmounts(item: {
    pricingPerColor?: number | null;
    pricePefore?: number | null;
    discount?: number | null;
    discountType?: number | null;
  }): { vatAmount: number; totalPrice: number } | null {
    const pricingPerColor = item.pricingPerColor ?? 0;
    const pricePefore = item.pricePefore ?? item.pricingPerColor ?? 0;
    const vat = Number(this.form['vat']?.value ?? 0);
    const discount = item.discount ?? 0;
    const discountType = item.discountType === 1 ? 1 : 0;

    if (pricingPerColor < 0 || pricePefore < 0 || vat < 0 || discount < 0) {
      return null;
    }

    const discountAmount = discountType === 0
      ? pricePefore * (discount / 100)
      : discount;
    const safeDiscountAmount = Math.min(discountAmount, pricePefore);
    const priceAfterDiscount = pricePefore - safeDiscountAmount;
    const vatAmount = this.roundCurrencyAwayFromZero(priceAfterDiscount * (vat / 100));
    const totalPrice = this.roundCurrencyAwayFromZero(priceAfterDiscount + vatAmount);

    return { vatAmount, totalPrice };
  }

  getPendingCarColorVatAmount(item: {
    pricingPerColor?: number | null;
    pricePefore?: number | null;
    discount?: number | null;
    discountType?: number | null;
  }): number | null {
    return this.calculatePendingCarColorAmounts(item)?.vatAmount ?? null;
  }

  getPendingCarColorTotalPrice(item: {
    pricingPerColor?: number | null;
    pricePefore?: number | null;
    discount?: number | null;
    discountType?: number | null;
  }): number | null {
    return this.calculatePendingCarColorAmounts(item)?.totalPrice ?? null;
  }

  private isPendingCarColorImageValid(item: {
    colorImageUrl?: string;
    colorImageFile?: File;
  }): boolean {
    return !!item.colorImageFile || !!(item.colorImageUrl && item.colorImageUrl.trim());
  }

  isPendingCarColorFieldInvalid(
    item: {
      colorStatus: number;
      stockQuantity?: number | null;
      pricingPerColor?: number | null;
      pricePefore?: number | null;
      discount?: number | null;
      discountType?: number | null;
      colorImageUrl?: string;
      colorImageFile?: File;
    },
    field: 'colorStatus' | 'stockQuantity' | 'pricingPerColor' | 'pricePefore' | 'discount' | 'discountType' | 'colorImage'
  ): boolean {
    if (!(this.colorTabSubmitted || this.invalidTabs.has(3))) return false;
    if (field === 'colorStatus') return !this.isPendingCarColorStatusValid(item);
    if (field === 'stockQuantity') return !this.isPendingCarColorStockValid(item);
    if (field === 'pricingPerColor') return !this.isPendingCarColorPricingValid(item);
    if (field === 'pricePefore') return !this.isPendingCarColorPriceBeforeValid(item);
    if (field === 'discount') return !this.isPendingCarColorDiscountValid(item);
    if (field === 'discountType') return !this.isPendingCarColorDiscountTypeValid(item);
    return !this.isPendingCarColorImageValid(item);
  }

  previewPendingCarColorImage(file?: File) {
    if (!file) return;
    if (this.colorImagePreviewUrl) {
      URL.revokeObjectURL(this.colorImagePreviewUrl);
    }
    this.colorImagePreviewUrl = URL.createObjectURL(file);
    this.colorImagePreviewName = file.name;
    this.showColorImagePreview = true;
  }

  closeColorImagePreview() {
    this.showColorImagePreview = false;
    if (this.colorImagePreviewUrl) {
      URL.revokeObjectURL(this.colorImagePreviewUrl);
    }
    this.colorImagePreviewUrl = undefined;
    this.colorImagePreviewName = undefined;
  }

  toggleFeatureAvailability(featureId: number, isAvailable: boolean) {
    if (!this.selectedCar) {
      this.carCarFeatures = this.carCarFeatures.map(cf =>
        cf.featureId === featureId ? { ...cf, isAvailable } : cf
      );
      this.refreshPendingFeaturePagination();
      return;
    }
    
    this.carFeatureService.updateCarFeatureAssignment(this.selectedCar.id, featureId, isAvailable).pipe(first()).subscribe({
      next: () => {
        this.showSuccess('Feature availability updated');
        this.loadCarCarFeatures(this.selectedCar!.id);
      },
      error: (error) => this.showError(error)
    });
  }

  removeFeatureFromCar(featureId: number) {
    if (!this.selectedCar) {
      this.carCarFeatures = this.carCarFeatures.filter(cf => cf.featureId !== featureId);
      this.updateAvailableFeatures();
      this.refreshPendingFeaturePagination();
      this.showSuccess('Feature removed from list');
      return;
    }
    
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this feature from the car?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carFeatureService.removeFeatureFromCar(this.selectedCar!.id, featureId).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Feature removed successfully');
            this.loadCarCarFeatures(this.selectedCar!.id);
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  getFeatureName(featureId: number): string {
    const feature = this.carFeatures.find(f => f.id === featureId);
    return feature ? `${feature.nameEn} (${feature.nameAr})` : 'Unknown';
  }

  getFeatureById(featureId: number): CarFeature | undefined {
    return this.carFeatures.find(f => f.id === featureId);
  }

  getFeatureDisplayName(featureId: number): string {
    const feature = this.getFeatureById(featureId);
    return feature?.nameAr || feature?.nameEn || `Feature #${featureId}`;
  }

  trackByFeatureId(index: number, cf: CarCarFeature): number {
    return cf.featureId;
  }

  applyFilters(resetPage = false) {
    let data = [...this.cars];
    const term = this.searchTerm.trim().toLowerCase();
    const nameEnTerm = this.filterNameEn.trim().toLowerCase();
    const nameArTerm = this.filterNameAr.trim().toLowerCase();
    const branchId = this.normalizeNumericFilter(this.selectedBranchFilterId);
    const brandId = this.normalizeNumericFilter(this.selectedBrandId);
    const modelId = this.normalizeNumericFilter(this.selectedModelId);
    const year = this.normalizeNumericFilter(this.selectedYearFilter);

    if (term) {
      data = data.filter(car => this.getCarColumnSearchValue(car).includes(term));
    }

    if (nameEnTerm) {
      data = data.filter(car => (car.nameEn || '').toLowerCase().includes(nameEnTerm));
    }

    if (nameArTerm) {
      data = data.filter(car => (car.nameAr || '').toLowerCase().includes(nameArTerm));
    }

    if (branchId !== undefined) {
      data = data.filter(car => car.branchId === branchId);
    }

    if (brandId !== undefined) {
      data = data.filter(car => this.getModelBrandId(car.modelId) === brandId);
    }

    if (modelId !== undefined) {
      data = data.filter(car => car.modelId === modelId);
    }

    if (year !== undefined) {
      const yearTerm = year.toString();
      data = data.filter(car => car.year.toString().includes(yearTerm));
    }

    data.sort((a, b) => {
      const left = `${a.nameEn || ''} ${a.nameAr || ''}`.trim().toLowerCase();
      const right = `${b.nameEn || ''} ${b.nameAr || ''}`.trim().toLowerCase();
      const result = left.localeCompare(right, undefined, { sensitivity: 'base' });
      return this.carSortDirection === 'asc' ? result : -result;
    });

    this.filteredCars = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedCars = this.service.changePage(this.filteredCars);
    this.loadVisibleCarActionCounts();
  }

  private getCarColumnSearchValue(car: Car): string {
    const branch = this.getBranchName(car.branchId) || '';
    const brand = this.getBrandName(this.getModelBrandId(car.modelId) || 0) || '';
    const model = this.getCarModelName(car.modelId) || '';
    return `${car.nameEn || ''} ${car.nameAr || ''} ${branch} ${brand} ${model} ${car.year || ''}`.toLowerCase();
  }

  private normalizeNumericFilter(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterNameEn = '';
    this.filterNameAr = '';
    this.selectedBranchFilterId = undefined;
    this.selectedYearFilter = undefined;
    this.selectedBrandId = undefined;
    this.selectedModelId = undefined;
    this.filterCarModels = this.carModels;
    this.applyFilters(true);
  }

  toggleCarSort() {
    this.carSortDirection = this.carSortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(true);
  }

  onBrandFilterChange(brandValue?: number | Brand | null) {
    const brandId = this.extractBrandId(brandValue);
    this.selectedBrandId = brandId ?? undefined;
    this.selectedModelId = undefined;

    if (!this.selectedBrandId) {
      this.filterCarModels = this.carModels;
      this.applyFilters(true);
      return;
    }

    this.brandService.getCarModelsByBrand(this.selectedBrandId).pipe(first()).subscribe({
      next: (models: CarModel[]) => {
        this.filterCarModels = models;
        this.applyFilters(true);
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  onFormBrandChange(brandValue?: number | Brand | null) {
    const selectedBrandId = this.extractBrandId(brandValue);
    const currentModelId = this.carForm.get('modelId')?.value as number | null;

    if (!selectedBrandId) {
      this.formCarModels = [];
      this.carForm.patchValue({ modelId: null });
      return;
    }

    this.brandService.getCarModelsByBrand(selectedBrandId).pipe(first()).subscribe({
      next: (models) => {
        this.formCarModels = models;
        const currentStillValid = !!currentModelId && models.some(m => m.id === currentModelId);
        if (!currentStillValid) {
          this.carForm.patchValue({ modelId: null });
        }
      },
      error: (error) => this.showError(error)
    });
  }

  onFormModelChange(modelId?: number) {
    if (!modelId) return;
    const model = this.carModels.find(m => m.id === modelId);
    if (!model) return;

    if (this.carForm.get('brandFilterId')?.value !== model.brandId) {
      this.carForm.patchValue({ brandFilterId: model.brandId }, { emitEvent: false });
      this.onFormBrandChange(model.brandId);
    }
  }

  isFeatureControlInvalid(controlName: string): boolean {
    const control = this.featureDetailForm?.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty || this.featureSubmitted);
  }

  isFeatureAssignInvalid(): boolean {
    return this.featureAssignSubmitted && !this.selectedFeatureId;
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedCars = this.service.changePage(this.filteredCars);
    this.loadVisibleCarActionCounts();
  }

  getCarActionCountLabel(carId: number, type: 'features' | 'colors' | 'details' | 'images'): string {
    const counts = this.carListActionCounts.get(carId);
    if (!counts) return '-';
    if (counts.loading) return '...';
    return String(counts[type] ?? 0);
  }

  private loadVisibleCarActionCounts() {
    this.pagedCars.forEach(car => this.ensureCarActionCounts(car.id));
  }

  private ensureCarActionCounts(carId: number) {
    const existing = this.carListActionCounts.get(carId);
    if (existing && !existing.loading) {
      return;
    }

    this.carListActionCounts.set(carId, {
      features: existing?.features ?? 0,
      colors: existing?.colors ?? 0,
      details: existing?.details ?? 0,
      images: existing?.images ?? 0,
      loading: true
    });

    forkJoin({
      features: this.carFeatureService.getCarFeaturesByCarId(carId),
      colors: this.carCarColorService.getByCarId(carId),
      details: this.carExtraDetailsService.getExtraDetailsByCarId(carId),
      images: this.carService.getCarImages(carId)
    }).pipe(first()).subscribe({
      next: ({ features, colors, details, images }) => {
        this.carListActionCounts.set(carId, {
          features: features.length,
          colors: colors.length,
          details: details.length,
          images: images.length,
          loading: false
        });
      },
      error: () => {
        this.carListActionCounts.set(carId, {
          features: 0,
          colors: 0,
          details: 0,
          images: 0,
          loading: false
        });
      }
    });
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedCar = undefined;
    this.carForm.reset();
    this.carForm.patchValue({
      nameEn: '',
      nameAr: '',
      brandFilterId: null,
      branchId: this.getResolvedBranchId(),
      year: new Date().getFullYear(),
      mileage: 0,
      vat: 15,
      conditionId: null,
      seatingCapacity: null,
      weelSizeInch: '',
      fuelTankCapacityLiter: null,
      trimLevel: null,
      vehicleClass: null,
      manufactureCountryId: null,
      plateNumberAr: '',
      plateNumberEn: '',
      transmisionType: null,
      drivetrain: null,
      cylenders: null,
      fuelType: null,
      enginNumber: '',
      isAvailable: true
    });
    this.setPlateParts('', '');
    this.submitted = false;
    this.activeTab = 1;
    this.showCreateSuccessTab = false;
    this.finishTabAction = null;
    this.carImages = [];
    this.pagedUploadedImages = [];
    this.pendingGalleryImages = [];
    this.pagedPendingGalleryImages = [];
    this.pendingGalleryImageIdSeq = 1;
    this.selectedPendingGalleryImageIds.clear();
    this.selectedImageType = null;
    this.selectedImageIsPrimary = true;
    this.carCarFeatures = [];
    this.pagedCarCarFeatures = [];
    this.pendingCarColors = [];
    this.pagedPendingCarColors = [];
    this.pendingExtraDetails = [];
    this.pagedPendingExtraDetails = [];
    this.selectedPendingExtraDetailIds.clear();
    this.pendingExtraDetailIdSeq = 1;
    this.availableFeatures = [];
    this.selectedFeatureId = undefined;
    this.selectedFeatureAssignmentAvailable = true;
    this.featureAssignSubmitted = false;
    this.featureSubmitted = false;
    this.featureTabSubmitted = false;
    this.featureDetailForm?.reset({ nameEn: '', nameAr: '', isAvailable: true });
    this.colorTabSubmitted = false;
    this.detailsTabSubmitted = false;
    this.imageTabSubmitted = false;
    this.formCarModels = [];
    this.invalidTabs.clear();
    this.validatedTabs.clear();
    this.loadCarFeatures();
    this.loadExtraDetailsCatalog();
    this.refreshPendingFeaturePagination(true);
    this.refreshPendingColorPagination(true);
    this.refreshPendingExtraDetailsPagination(true);
  }

  activateTestMode() {
    this.fillInfoTabTestMode();
    this.fillFeatureTabTestMode();
    this.fillColorTabTestMode();
    this.fillDetailsTabTestMode();
    this.fillImagesTabTestMode();
    this.showSuccess('Test mode filled all tabs with sample data.');
  }

  fillInfoTabTestMode() {
    if (!this.ensureCreateModeForTestMode()) return;

    if (!this.carTypes.length || !this.branches.length || !this.carModels.length) {
      this.showError('Info tab test data is not ready yet. Please wait for types, branches and models to load.');
      return;
    }

    const selectedType = this.carTypes[0];
    const selectedBranch = this.branches[0];
    const selectedModel = this.carModels[0];
    const selectedBrandId = selectedModel.brandId;
    const brandModels = this.carModels.filter(m => m.brandId === selectedBrandId);
    const selectedBrandModel = brandModels[0] ?? selectedModel;

    const defaultCondition = this.conditionOptions[0]?.value ?? 1;
    const defaultTrimLevel = this.trimLevelOptions[0]?.value ?? 1;
    const defaultVehicleClass = this.vehicleClassOptions[0]?.value ?? 1;
    const defaultManufactureCountry = this.manufactureCountryOptions[0]?.value ?? 1;
    const defaultTransmisionType = this.transmisionTypeOptions[0]?.value ?? 1;
    const defaultDrivetrain = this.drivetrainOptions[0]?.value ?? 1;
    const defaultFuelType = this.fuelTypeOptions[0]?.value ?? 1;

    this.formCarModels = brandModels;
    this.carForm.patchValue({
      nameEn: 'Test Car',
      nameAr: 'سيارة اختبار',
      typeId: selectedType.id,
      branchId: selectedBranch.id,
      brandFilterId: selectedBrandId,
      modelId: selectedBrandModel.id,
      year: new Date().getFullYear(),
      mileage: 1000,
      vat: 15,
      conditionId: defaultCondition,
      seatingCapacity: 5,
      weelSizeInch: '18',
      fuelTankCapacityLiter: 60,
      trimLevel: defaultTrimLevel,
      vehicleClass: defaultVehicleClass,
      manufactureCountryId: defaultManufactureCountry,
      plateNumberAr: 'ABC-1234',
      plateNumberEn: 'XYZ-5678',
      transmisionType: defaultTransmisionType,
      drivetrain: defaultDrivetrain,
      cylenders: 4,
      fuelType: defaultFuelType,
      enginNumber: 'EN-TEST-001',
      descriptionEn: 'Test mode car description (EN)',
      descriptionAr: 'وصف سيارة تجريبي',
      isAvailable: true
    });
    this.setPlateParts('ABC-1234', 'XYZ-5678');

    this.submitted = false;
    this.invalidTabs.delete(1);
    this.showSuccess('Info tab filled with test data.');
  }

  fillFeatureTabTestMode() {
    if (!this.ensureCreateModeForTestMode()) return;

    if (!this.carFeatures.length) {
      this.showError('Feature tab test data is not ready yet. Please wait for features to load.');
      return;
    }

    const selectedFeature = this.carFeatures[0];
    const alreadyExists = this.carCarFeatures.some(cf => cf.featureId === selectedFeature.id);
    if (!alreadyExists) {
      this.carCarFeatures = [
        ...this.carCarFeatures,
        {
          carId: 0,
          featureId: selectedFeature.id,
          isAvailable: true,
          createdBy: undefined,
          createdAt: undefined
        }
      ];
    }

    this.updateAvailableFeatures();
    this.refreshPendingFeaturePagination(true);
    this.featureTabSubmitted = false;
    this.invalidTabs.delete(2);
    this.showSuccess('Feature tab filled with test data.');
  }

  fillColorTabTestMode() {
    if (!this.ensureCreateModeForTestMode()) return;

    if (!this.colors.length) {
      this.showError('Color tab test data is not ready yet. Please wait for colors to load.');
      return;
    }
    if (!this.colorStatusOptions.length) {
      this.showError('Color statuses are not loaded yet. Please wait a moment and try again.');
      return;
    }

    const selectedColor = this.colors[0];
    const existing = this.pendingCarColors.find(c => c.colorId === selectedColor.id);
    if (existing) {
      existing.colorStatus = existing.colorStatus || this.getDefaultColorStatusId();
      existing.stockQuantity = existing.stockQuantity ?? 5;
      existing.pricingPerColor = existing.pricingPerColor ?? 0;
      existing.pricePefore = existing.pricePefore ?? 0;
      existing.vatAmount = this.getPendingCarColorVatAmount(existing);
      existing.discount = existing.discount ?? 0;
      existing.discountType = existing.discountType ?? 0;
      existing.totalPrice = this.getPendingCarColorTotalPrice(existing);
      existing.isAvailable = true;
    } else {
      this.pendingCarColors = [
        ...this.pendingCarColors,
        {
          colorId: selectedColor.id,
          colorStatus: this.getDefaultColorStatusId(),
          stockQuantity: 5,
          colorImageUrl: '',
          colorImageFile: undefined,
          pricingPerColor: 0,
          pricePefore: 0,
          vatAmount: 0,
          discount: 0,
          discountType: 0,
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          isAvailable: true
        }
      ];
    }

    this.refreshPendingColorPagination(true);
    this.colorTabSubmitted = false;
    this.invalidTabs.delete(3);
    this.showSuccess('Color tab filled with test data.');
  }

  fillDetailsTabTestMode() {
    if (!this.ensureCreateModeForTestMode()) return;

    const selectedExtraDetail = this.extraDetailsCatalog[0];
    const extraDetailType = selectedExtraDetail
      ? this.getExtraDetailTypeIdFromItem(selectedExtraDetail)
      : (this.extraDetailTypeOptions[0]?.id ?? 1);

    this.pendingExtraDetails = [
      ...this.pendingExtraDetails,
      {
        pendingId: this.pendingExtraDetailIdSeq++,
        sourceExtraDetailId: selectedExtraDetail?.id,
        nameAr: selectedExtraDetail?.nameAr?.trim() || 'تفاصيل تجريبية',
        nameEn: selectedExtraDetail?.nameEn?.trim() || 'Test Details',
        descriptionEn: selectedExtraDetail?.descriptionEn?.trim() || 'Generated by test mode.',
        descriptionAr: selectedExtraDetail?.descriptionAr?.trim() || 'تم الإنشاء بواسطة وضع الاختبار.',
        carExtraDetailsType: extraDetailType,
        isAvailable: selectedExtraDetail?.isAvailable ?? true
      }
    ];

    this.refreshPendingExtraDetailsPagination(true);
    this.detailsTabSubmitted = false;
    this.invalidTabs.delete(4);
    this.showSuccess('Details tab filled with test data.');
  }

  fillImagesTabTestMode() {
    if (!this.ensureCreateModeForTestMode()) return;

    const selectedImageType = this.imageTypeOptions[0]?.id ?? 1;
    if (!this.pendingGalleryImages.length) {
      const testImageFile = this.createTestModeImageFile();
      this.pendingGalleryImages = [
        {
          pendingId: this.pendingGalleryImageIdSeq++,
          file: testImageFile,
          previewUrl: URL.createObjectURL(testImageFile),
          imageType: selectedImageType,
          isPrimary: true
        }
      ];
    } else {
      this.pendingGalleryImages = this.pendingGalleryImages.map((img, index) => ({
        ...img,
        imageType: img.imageType ?? selectedImageType,
        isPrimary: index === 0
      }));
    }

    this.refreshPendingGalleryPagination(true);
    this.imageTabSubmitted = false;
    this.invalidTabs.delete(5);
    this.showSuccess('Images tab filled with test data.');
  }

  private ensureCreateModeForTestMode(): boolean {
    if (this.isEditMode) {
      this.showError('Test mode is available in create mode only.');
      return false;
    }
    return true;
  }

  openEditModal(car: Car) {
    if (!this.canEditCar) {
      this.showError('You do not have permission to edit cars.');
      return;
    }

    this.isEditMode = true;
    this.selectedCar = car;
    this.submitted = false;
    this.activeTab = 1;
    this.showCreateSuccessTab = false;
    this.finishTabAction = null;
    this.carImages = [];
    this.pagedUploadedImages = [];
    this.pendingGalleryImages = [];
    this.pagedPendingGalleryImages = [];
    this.pendingGalleryImageIdSeq = 1;
    this.selectedPendingGalleryImageIds.clear();
    this.selectedImageType = null;
    this.selectedImageIsPrimary = true;
    this.selectedFeatureId = undefined;
    this.selectedFeatureAssignmentAvailable = true;
    this.featureAssignSubmitted = false;
    this.featureSubmitted = false;
    this.featureTabSubmitted = false;
    this.colorTabSubmitted = false;
    this.detailsTabSubmitted = false;
    this.imageTabSubmitted = false;
    this.pendingExtraDetails = [];
    this.pagedPendingExtraDetails = [];
    this.selectedPendingExtraDetailIds.clear();
    this.pendingExtraDetailIdSeq = 1;
    this.extraDetailDraft = {
      nameAr: '',
      nameEn: '',
      descriptionEn: '',
      descriptionAr: '',
      carExtraDetailsType: null,
      isAvailable: true
    };
    this.invalidTabs.clear();
    this.validatedTabs.clear();
    
    const selectedModel = this.carModels.find(m => m.id === car.modelId);

    this.carForm.patchValue({
      nameEn: car.nameEn,
      nameAr: car.nameAr,
      brandFilterId: selectedModel?.brandId ?? null,
      modelId: car.modelId,
      typeId: car.typeId,
      branchId: car.branchId,
      year: car.year,
      mileage: car.mileage,
      vat: car.vat,
      conditionId: car.conditionId,
      seatingCapacity: car.seatingCapacity,
      weelSizeInch: car.weelSizeInch,
      fuelTankCapacityLiter: car.fuelTankCapacityLiter,
      trimLevel: car.trimLevel,
      vehicleClass: car.vehicleClass,
      manufactureCountryId: car.manufactureCountryId,
      plateNumberAr: car.plateNumberAr,
      plateNumberEn: car.plateNumberEn,
      transmisionType: car.transmisionType,
      drivetrain: car.drivetrain,
      cylenders: car.cylenders,
      fuelType: car.fuelType,
      enginNumber: car.enginNumber,
      descriptionEn: car.descriptionEn,
      descriptionAr: car.descriptionAr,
      isAvailable: car.isAvailable
    });
    this.setPlateParts(car.plateNumberAr, car.plateNumberEn);

    this.loadCarImages(car.id);
    this.loadCarCarFeatures(car.id);
    this.loadCarCarColors(car.id);
    this.loadCarExtraDetails(car.id);
    this.loadCarFeatures();
    this.loadExtraDetailsCatalog();
    if (selectedModel?.brandId) {
      this.onFormBrandChange(selectedModel.brandId);
    }
  }

  openCarTab(car: Car, tabId: number) {
    if (this.isListPage) {
      this.router.navigate(['/admin/cars/create'], {
        queryParams: {
          carId: car.id,
          tab: tabId
        }
      });
      return;
    }

    this.openEditModal(car);
    this.activeTab = tabId;
  }

  openCarPreviewModal(car: Car, tab: 'features' | 'colors' | 'details' | 'images') {
    this.previewCar = car;
    this.carPreviewTab = tab;
    this.showCarPreviewModal = true;
    this.isCarPreviewLoading = true;
    this.previewFeatures = [];
    this.pagedPreviewFeatures = [];
    this.previewColors = [];
    this.pagedPreviewColors = [];
    this.previewDetails = [];
    this.pagedPreviewDetails = [];
    this.previewImages = [];
    this.pagedPreviewImages = [];

    if (tab === 'features') {
      const catalog$ = this.carFeatures.length > 0 ? of(this.carFeatures) : this.carFeatureService.getCarFeatures();
      forkJoin({
        assigned: this.carFeatureService.getCarFeaturesByCarId(car.id),
        catalog: catalog$
      }).pipe(first()).subscribe({
        next: ({ assigned, catalog }) => {
          this.carFeatures = catalog;
          this.previewFeatures = assigned;
          this.refreshPreviewFeaturePagination(true);
          this.isCarPreviewLoading = false;
        },
        error: (error) => {
          this.isCarPreviewLoading = false;
          this.showError(error);
        }
      });
      return;
    }

    if (tab === 'colors') {
      this.carCarColorService.getByCarId(car.id).pipe(first()).subscribe({
        next: (items) => {
          this.previewColors = items;
          this.refreshPreviewColorPagination(true);
          this.isCarPreviewLoading = false;
        },
        error: (error) => {
          this.isCarPreviewLoading = false;
          this.showError(error);
        }
      });
      return;
    }

    if (tab === 'details') {
      this.carExtraDetailsService.getExtraDetailsByCarId(car.id).pipe(first()).subscribe({
        next: (items) => {
          this.previewDetails = items;
          this.refreshPreviewDetailsPagination(true);
          this.isCarPreviewLoading = false;
        },
        error: (error) => {
          this.isCarPreviewLoading = false;
          this.showError(error);
        }
      });
      return;
    }

    this.carService.getCarImages(car.id).pipe(first()).subscribe({
      next: (items) => {
        this.previewImages = items;
        this.refreshPreviewImagesPagination(true);
        this.isCarPreviewLoading = false;
      },
      error: (error) => {
        this.isCarPreviewLoading = false;
        this.showError(error);
      }
    });
  }

  openCarInfoModal(car: Car) {
    this.infoCar = car;
    this.showCarInfoModal = true;
  }

  closeCarInfoModal() {
    this.showCarInfoModal = false;
    this.infoCar = undefined;
  }

  closeCarPreviewModal() {
    this.showCarPreviewModal = false;
    this.isCarPreviewLoading = false;
    this.previewFeatures = [];
    this.pagedPreviewFeatures = [];
    this.previewColors = [];
    this.pagedPreviewColors = [];
    this.previewDetails = [];
    this.pagedPreviewDetails = [];
    this.previewImages = [];
    this.pagedPreviewImages = [];
  }

  refreshPreviewFeaturePagination(resetPage = false) {
    if (resetPage) {
      this.previewFeaturePagination.page = 1;
    }
    this.pagedPreviewFeatures = this.previewFeaturePagination.changePage(this.previewFeatures);
  }

  onPreviewFeaturePageChange(page: number) {
    this.previewFeaturePagination.page = page;
    this.pagedPreviewFeatures = this.previewFeaturePagination.changePage(this.previewFeatures);
  }

  refreshPreviewColorPagination(resetPage = false) {
    if (resetPage) {
      this.previewColorPagination.page = 1;
    }
    this.pagedPreviewColors = this.previewColorPagination.changePage(this.previewColors);
  }

  onPreviewColorPageChange(page: number) {
    this.previewColorPagination.page = page;
    this.pagedPreviewColors = this.previewColorPagination.changePage(this.previewColors);
  }

  refreshPreviewDetailsPagination(resetPage = false) {
    if (resetPage) {
      this.previewDetailsPagination.page = 1;
    }
    this.pagedPreviewDetails = this.previewDetailsPagination.changePage(this.previewDetails);
  }

  onPreviewDetailsPageChange(page: number) {
    this.previewDetailsPagination.page = page;
    this.pagedPreviewDetails = this.previewDetailsPagination.changePage(this.previewDetails);
  }

  refreshPreviewImagesPagination(resetPage = false) {
    if (resetPage) {
      this.previewImagesPagination.page = 1;
    }
    this.pagedPreviewImages = this.previewImagesPagination.changePage(this.previewImages);
  }

  onPreviewImagesPageChange(page: number) {
    this.previewImagesPagination.page = page;
    this.pagedPreviewImages = this.previewImagesPagination.changePage(this.previewImages);
  }


  saveCar() {
    if (this.isEditMode && !this.canEditCar) {
      this.showError('You do not have permission to edit cars.');
      return;
    }

    if (!this.isEditMode && !this.canCreateCar) {
      this.showError('You do not have permission to create cars.');
      return;
    }

    this.submitted = true;
    if (this.carForm.invalid) {
      this.markMainInfoControlsTouched();
      this.invalidTabs.add(1);
      this.activeTab = 1;
      return;
    }

    if (!this.validateImagesTab()) {
      this.invalidTabs.add(5);
      this.activeTab = 5;
      this.showError(this.getTabValidationErrorMessage(5));
      return;
    }

    this.isSubmitting = true;
    const payload: CreateCarRequest | UpdateCarRequest = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      modelId: this.form['modelId'].value,
      typeId: this.form['typeId'].value,
      branchId: this.getResolvedBranchId(),
      year: this.form['year'].value,
      mileage: this.form['mileage'].value,
      vat: this.form['vat'].value,
      conditionId: this.form['conditionId'].value,
      seatingCapacity: this.form['seatingCapacity'].value,
      weelSizeInch: this.form['weelSizeInch'].value,
      fuelTankCapacityLiter: this.form['fuelTankCapacityLiter'].value,
      trimLevel: this.form['trimLevel'].value,
      vehicleClass: this.form['vehicleClass'].value,
      plateNumberAr: this.form['plateNumberAr'].value,
      plateNumberEn: this.form['plateNumberEn'].value,
      transmisionType: this.form['transmisionType'].value,
      drivetrain: this.form['drivetrain'].value,
      cylenders: this.form['cylenders'].value,
      fuelType: this.form['fuelType'].value,
      manufactureCountryId: this.form['manufactureCountryId'].value,
      enginNumber: this.form['enginNumber'].value,
      descriptionEn: this.form['descriptionEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      isAvailable: this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedCar) {
      this.carService.updateCar(this.selectedCar.id, payload as UpdateCarRequest).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('CARS_PAGE.UPDATE_SUCCESS'));
          this.finishTabAction = 'updated';
          this.showCreateSuccessTab = true;
          this.selectedCar = {
            ...this.selectedCar!,
            ...(payload as UpdateCarRequest)
          };
          this.navigateToFinishTab();
          if (this.canViewCar) {
            this.loadCars();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      const createPayload: CreateCarWithDetailsRequest = {
        ...(payload as CreateCarRequest),
        features: this.carCarFeatures.map(cf => ({
          featureId: cf.featureId,
          isAvailable: cf.isAvailable
        })),
        carColors: this.pendingCarColors.map(c => ({
          colorId: c.colorId,
          colorStatus: c.colorStatus,
          stockQuantity: c.stockQuantity ?? null,
          colorImageUrl: c.colorImageFile ? '' : (c.colorImageUrl || ''),
          pricingPerColor: c.pricingPerColor ?? null,
          pricePefore: c.pricePefore ?? null,
          discount: c.discount ?? null,
          discountType: c.discountType ?? null,
          isAvailable: c.isAvailable
        })),
        carColorImageFiles: this.pendingCarColors
          .map(c => c.colorImageFile)
          .filter((f): f is File => !!f),
        carColorImagesMeta: this.pendingCarColors
          .filter(c => !!c.colorImageFile)
          .map(c => ({
            colorId: c.colorId,
            fileName: c.colorImageFile?.name
          })),
        extraDetails: this.pendingExtraDetails.map(d => ({
          nameAr: d.nameAr || '',
          nameEn: d.nameEn || '',
          descriptionEn: d.descriptionEn || '',
          descriptionAr: d.descriptionAr || '',
          carExtraDetailsType: d.carExtraDetailsType,
          isAvailable: d.isAvailable
        })),
        galleryImages: this.pendingGalleryImages.map(g => g.file),
        galleryImagesMeta: this.pendingGalleryImages.map(g => ({
          fileName: g.file.name,
          imageType: g.imageType ?? null,
          isPrimary: g.isPrimary
        }))
      };

      this.carService.createCarWithDetails(createPayload).pipe(first()).subscribe({
        next: (createdCar) => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('CARS_PAGE.CREATE_SUCCESS'));
          this.selectedCar = createdCar;
          this.isEditMode = true;
          this.finishTabAction = 'created';
          this.showCreateSuccessTab = true;
          this.navigateToFinishTab();
          this.loadCarCarFeatures(createdCar.id);
          this.loadCarImages(createdCar.id);
          if (this.canViewCar) {
            this.loadCars();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteCar(car: Car) {
    if (!this.canDeleteCar) {
      this.showError('You do not have permission to delete cars.');
      return;
    }

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('COMMON.DELETE_CONFIRM_RECORD'),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CLOSE'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carService.deleteCar(car.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('CARS_PAGE.DELETE_SUCCESS'));
            this.loadCars();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  copyCar(car: Car) {
    if (!this.canCreateCar) {
      this.showError('You do not have permission to create cars.');
      return;
    }

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('CARS_PAGE.COPY_CONFIRM_TEXT'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CARS_PAGE.COPY_CONFIRM_BUTTON'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#0ab39c',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.carService.copyCar(car.id).pipe(first()).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('CARS_PAGE.COPY_SUCCESS'));
          this.loadCars();
        },
        error: (error) => this.showError(error)
      });
    });
  }

  toggleCarAvailability(car: Car, isAvailable: boolean) {
    if (!this.canEditCar) {
      this.showError('You do not have permission to edit cars.');
      return;
    }

    if (car.isAvailable === isAvailable) {
      this.showError(
        this.translate.instant(
          isAvailable ? 'CARS_PAGE.ALREADY_ACTIVE_ERROR' : 'CARS_PAGE.ALREADY_INACTIVE_ERROR'
        )
      );
      return;
    }

    const statusLabel = this.translate.instant(isAvailable ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE');
    const confirmLabel = this.translate.instant(isAvailable ? 'CARS_PAGE.MARK_ACTIVE' : 'CARS_PAGE.MARK_INACTIVE');

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('CARS_PAGE.MARK_STATUS_CONFIRM_TEXT', { status: statusLabel }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CARS_PAGE.MARK_STATUS_CONFIRM_BUTTON', { action: confirmLabel }),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.carService.updateAvailability(car.id, isAvailable).pipe(first()).subscribe({
        next: () => {
          this.showSuccess(this.translate.instant('CARS_PAGE.MARK_STATUS_SUCCESS', { status: statusLabel }));
          this.loadCars();
        },
        error: (error) => this.showError(error)
      });
    });
  }

  // Image handling
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imageFileSubmitted = false;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  addPendingGalleryImage() {
    this.imageFileSubmitted = true;
    this.imageTypeSubmitted = true;
    const editingItem = this.editingPendingGalleryImageId !== null
      ? this.pendingGalleryImages.find(g => g.pendingId === this.editingPendingGalleryImageId)
      : undefined;

    if (!this.selectedImageFile && !editingItem) {
      this.showError('Please select an image first');
      return;
    }
    if (this.selectedImageFile && this.isSelectedImageFileTooLarge()) {
      this.showError('Image size must be less than or equal to 5 MB');
      return;
    }
    if (!this.selectedImageType) {
      this.showError('Image type is required');
      return;
    }

    const alreadyExists = !!this.selectedImageFile && this.pendingGalleryImages.some(g =>
      g.pendingId !== this.editingPendingGalleryImageId &&
      g.file.name === this.selectedImageFile?.name &&
      g.file.size === this.selectedImageFile?.size
    );
    if (alreadyExists) {
      this.showError('This image is already added to the list');
      return;
    }

    const sourceFile = this.selectedImageFile ?? editingItem!.file;
    const sourcePreviewUrl = this.imagePreviewUrl || editingItem?.previewUrl || URL.createObjectURL(sourceFile);
    const makePrimary = this.selectedImageIsPrimary || (this.pendingGalleryImages.length === 0);
    const nextImage = {
      pendingId: editingItem?.pendingId ?? this.pendingGalleryImageIdSeq++,
      file: sourceFile,
      previewUrl: sourcePreviewUrl,
      imageType: this.selectedImageType,
      isPrimary: makePrimary
    };

    if (nextImage.isPrimary) {
      this.pendingGalleryImages = this.pendingGalleryImages.map(g => ({ ...g, isPrimary: false }));
    }
    if (editingItem) {
      this.pendingGalleryImages = this.pendingGalleryImages.map(g => g.pendingId === editingItem.pendingId ? nextImage : g);
    } else {
      this.pendingGalleryImages = [...this.pendingGalleryImages, nextImage];
    }
    this.refreshPendingGalleryPagination(true);
    this.selectedImageFile = undefined;
    this.selectedImageType = null;
    this.selectedImageIsPrimary = true;
    this.imagePreviewUrl = undefined;
    this.imageFileSubmitted = false;
    this.imageTypeSubmitted = false;
    const wasEditing = this.editingPendingGalleryImageId !== null;
    this.editingPendingGalleryImageId = null;
    this.showSuccess(wasEditing ? 'Image updated in list.' : 'Image added to list. It will be saved with the car.');
  }

  editPendingGalleryImage(img: {
    pendingId: number;
    file: File;
    previewUrl: string;
    imageType?: number | null;
    isPrimary: boolean;
  }) {
    this.editingPendingGalleryImageId = img.pendingId;
    this.selectedImageFile = undefined;
    this.imagePreviewUrl = img.previewUrl;
    this.selectedImageType = img.imageType ?? null;
    this.selectedImageIsPrimary = !!img.isPrimary;
    this.imageFileSubmitted = false;
    this.imageTypeSubmitted = false;
  }

  cancelPendingGalleryImageEdit() {
    this.editingPendingGalleryImageId = null;
    this.selectedImageFile = undefined;
    this.selectedImageType = null;
    this.selectedImageIsPrimary = true;
    this.imagePreviewUrl = undefined;
    this.imageFileSubmitted = false;
    this.imageTypeSubmitted = false;
  }

  removePendingGalleryImage(pendingId: number) {
    const item = this.pendingGalleryImages.find(g => g.pendingId === pendingId);
    if (!item) return;

    const wasPrimary = item.isPrimary;
    this.selectedPendingGalleryImageIds.delete(pendingId);
    this.pendingGalleryImages = this.pendingGalleryImages.filter(g => g.pendingId !== pendingId);
    if (this.editingPendingGalleryImageId === pendingId) {
      this.cancelPendingGalleryImageEdit();
    }

    if (wasPrimary && this.pendingGalleryImages.length > 0) {
      this.pendingGalleryImages = this.pendingGalleryImages.map((g, i) => ({ ...g, isPrimary: i === 0 }));
    }
    this.refreshPendingGalleryPagination();

    this.showSuccess('Image removed from list');
  }

  setPendingGalleryPrimary(pendingId: number) {
    this.pendingGalleryImages = this.pendingGalleryImages.map(g => ({
      ...g,
      isPrimary: g.pendingId === pendingId
    }));
    this.refreshPendingGalleryPagination();
  }

  refreshPendingGalleryPagination(resetPage = false) {
    if (resetPage) {
      this.pendingGalleryPagination.page = 1;
    }
    this.pagedPendingGalleryImages = this.pendingGalleryPagination.changePage(this.pendingGalleryImages);
    this.syncImageTabValidationState();
  }

  onPendingGalleryPageChange(page: number) {
    this.pendingGalleryPagination.page = page;
    this.pagedPendingGalleryImages = this.pendingGalleryPagination.changePage(this.pendingGalleryImages);
  }

  refreshUploadedImagePagination(resetPage = false) {
    if (resetPage) {
      this.uploadedImagePagination.page = 1;
    }
    this.pagedUploadedImages = this.uploadedImagePagination.changePage(this.carImages);
  }

  onUploadedImagePageChange(page: number) {
    this.uploadedImagePagination.page = page;
    this.pagedUploadedImages = this.uploadedImagePagination.changePage(this.carImages);
  }

  togglePendingGalleryImageSelection(pendingId: number, checked: boolean) {
    if (checked) {
      this.selectedPendingGalleryImageIds.add(pendingId);
    } else {
      this.selectedPendingGalleryImageIds.delete(pendingId);
    }
  }

  toggleSelectAllPendingGalleryImages(checked: boolean) {
    if (checked) {
      this.pendingGalleryImages.forEach(img => this.selectedPendingGalleryImageIds.add(img.pendingId));
      return;
    }
    this.selectedPendingGalleryImageIds.clear();
  }

  isAllPendingGalleryImagesSelected(): boolean {
    return this.pendingGalleryImages.length > 0 && this.pendingGalleryImages.every(img => this.selectedPendingGalleryImageIds.has(img.pendingId));
  }

  deleteSelectedPendingGalleryImages() {
    if (!this.selectedPendingGalleryImageIds.size) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Remove ${this.selectedPendingGalleryImageIds.size} selected image(s) from the list?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      const deletedEditing = this.editingPendingGalleryImageId !== null && this.selectedPendingGalleryImageIds.has(this.editingPendingGalleryImageId);
      this.pendingGalleryImages = this.pendingGalleryImages.filter(img => !this.selectedPendingGalleryImageIds.has(img.pendingId));
      this.selectedPendingGalleryImageIds.clear();

      if (deletedEditing) {
        this.cancelPendingGalleryImageEdit();
      }

      if (this.pendingGalleryImages.length > 0 && !this.pendingGalleryImages.some(i => i.isPrimary)) {
        this.pendingGalleryImages = this.pendingGalleryImages.map((img, i) => ({ ...img, isPrimary: i === 0 }));
      }

      this.refreshPendingGalleryPagination(true);
      this.showSuccess('Selected images removed from list');
    });
  }

  getImageTypeName(imageType?: number | null): string {
    if (imageType === null || imageType === undefined) return 'Not set';
    return this.imageTypeOptions.find(t => t.id === imageType)?.name || `Type ${imageType}`;
  }

  isImageFileInputInvalid(): boolean {
    if (!this.imageFileSubmitted) return false;
    return !this.selectedImageFile || this.isSelectedImageFileTooLarge();
  }

  isImageTypeInputInvalid(): boolean {
    return this.imageTypeSubmitted && !this.selectedImageType;
  }

  getImageFileInputErrorMessage(): string {
    if (this.imageFileSubmitted && this.isSelectedImageFileTooLarge()) {
      return 'Image size must be less than or equal to 5 MB.';
    }
    return 'Image file is required.';
  }

  private isSelectedImageFileTooLarge(): boolean {
    return !!this.selectedImageFile && this.selectedImageFile.size > this.maxGalleryImageSizeBytes;
  }

  private createTestModeImageFile(): File {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z4nQAAAAASUVORK5CYII=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], 'test-mode-image.png', { type: 'image/png' });
  }

  openSelectedGalleryImagePreview() {
    if (this.selectedImageFile) {
      this.previewPendingCarColorImage(this.selectedImageFile);
      return;
    }
    if (!this.imagePreviewUrl) return;
    this.colorImagePreviewUrl = this.imagePreviewUrl;
    this.colorImagePreviewName = 'Selected image preview';
    this.showColorImagePreview = true;
  }

  previewPendingGalleryGridImage(file: File) {
    this.previewPendingCarColorImage(file);
  }

  previewUploadedGalleryGridImage(image: CarImage) {
    this.colorImagePreviewUrl = this.getEntityImageUrl(image.imageUrl);
    this.colorImagePreviewName = image.imageUrl?.split('/').pop() || 'Image preview';
    this.showColorImagePreview = true;
  }

  closeSelectedGalleryImagePreview() {
    this.showSelectedGalleryImagePreview = false;
  }

  uploadImage() {
    this.imageFileSubmitted = true;
    this.imageTypeSubmitted = true;
    if (!this.selectedImageFile || !this.selectedCar) return;
    if (this.isSelectedImageFileTooLarge()) {
      this.showError('Image size must be less than or equal to 5 MB');
      return;
    }
    if (!this.selectedImageType) {
      this.showError('Image type is required');
      return;
    }

    this.isUploadingImage = true;
    const isPrimary = this.selectedImageIsPrimary || this.carImages.length === 0;
    
    this.carService.uploadCarImage(this.selectedCar.id, this.selectedImageFile, isPrimary, this.selectedImageType ?? undefined).pipe(first()).subscribe({
      next: () => {
        this.isUploadingImage = false;
        this.selectedImageFile = undefined;
        this.selectedImageType = null;
        this.selectedImageIsPrimary = true;
        this.imagePreviewUrl = undefined;
        this.imageFileSubmitted = false;
        this.imageTypeSubmitted = false;
        this.showSuccess('Image uploaded successfully');
        this.loadCarImages(this.selectedCar!.id);
      },
      error: (error) => {
        this.isUploadingImage = false;
        this.showError(error);
      }
    });
  }

  deleteImage(image: CarImage) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Delete this image?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carService.deleteCarImage(image.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Image deleted successfully');
            this.loadCarImages(this.selectedCar!.id);
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  setPrimaryImage(image: CarImage) {
    this.carService.setPrimaryImage(image.id, true).pipe(first()).subscribe({
      next: () => {
        this.showSuccess('Primary image set successfully');
        this.loadCarImages(this.selectedCar!.id);
      },
      error: (error) => this.showError(error)
    });
  }

  // Helpers
  getCarTypeName(typeId: number): string {
    const type = this.carTypes.find(t => t.id === typeId);
    return type ? `${type.nameEn} (${type.nameAr})` : 'Unknown';
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? `${branch.branchNameEn} (${branch.branchNameAr})` : 'Unknown';
  }

  getCurrentUserBranchDisplayName(): string {
    const branchId = this.currentUserBranchId;
    if (!branchId) {
      return '-';
    }

    const current = this.branches.find(b => b.id === branchId);
    if (current) {
      return `${current.branchNameEn} (${current.branchNameAr})`;
    }

    const user = this.myAuthService.currentUserValue;
    const branchNameEn = user?.branchNameEn || '';
    const branchNameAr = user?.branchNameAr || '';
    if (branchNameEn || branchNameAr) {
      return `${branchNameEn} (${branchNameAr})`;
    }

    return `#${branchId}`;
  }

  getCarModelName(modelId: number): string {
    const model = this.carModels.find(m => m.id === modelId);
    return model ? `${model.nameEn} (${model.nameAr})` : 'Unknown';
  }

  getEntityImageUrl(imageUrl?: string): string {
    return this.resolveImageUrl(imageUrl, 'assets/images/car-placeholder.png');
  }

  getBrandName(brandId: number): string {
    const brand = this.brands.find(b => b.id === brandId);
    return brand ? `${brand.nameEn} (${brand.nameAr})` : 'Unknown';
  }

  getModelBrandId(modelId: number): number | undefined {
    return this.carModels.find(m => m.id === modelId)?.brandId;
  }

  private extractBrandId(brandValue?: number | Brand | null): number | undefined {
    if (brandValue === null || brandValue === undefined) return undefined;
    if (typeof brandValue === 'number') return brandValue;
    return typeof brandValue.id === 'number' ? brandValue.id : undefined;
  }

  brandSearchFn(term: string, item: Brand): boolean {
    const q = term.toLowerCase().trim();
    if (!q) return true;
    return (item.nameEn || '').toLowerCase().includes(q) || (item.nameAr || '').toLowerCase().includes(q);
  }

  modelSearchFn(term: string, item: CarModel): boolean {
    const q = term.toLowerCase().trim();
    if (!q) return true;
    return (item.nameEn || '').toLowerCase().includes(q) || (item.nameAr || '').toLowerCase().includes(q);
  }

  typeSearchFn(term: string, item: CarType): boolean {
    const q = term.toLowerCase().trim();
    if (!q) return true;
    return (item.nameEn || '').toLowerCase().includes(q) || (item.nameAr || '').toLowerCase().includes(q);
  }

  branchSearchFn(term: string, item: Branch): boolean {
    const q = term.toLowerCase().trim();
    if (!q) return true;
    return (item.branchNameEn || '').toLowerCase().includes(q) || (item.branchNameAr || '').toLowerCase().includes(q);
  }

  getPrimaryImageUrl(): string {
    const primary = this.carImages.find(img => img.isPrimary);
    return this.resolveImageUrl(primary?.imageUrl || this.carImages[0]?.imageUrl, 'assets/images/car-placeholder.png');
  }

  private resolveImageUrl(imageUrl?: string, fallback: string = 'assets/images/car-placeholder.png'): string {
    if (!imageUrl) return fallback;
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('assets/')
    ) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return `${GlobalComponent.API_URL}${imageUrl}`;
    }
    return `${GlobalComponent.API_URL}/${imageUrl}`;
  }

  private getResolvedBranchId(): number {
    if (this.canSelectBranch) {
      const selected = Number(this.form['branchId'].value);
      return Number.isFinite(selected) && selected > 0 ? selected : 0;
    }

    return this.currentUserBranchId || 0;
  }

  // Selection handling
  toggleCarSelection(carId: number, checked: boolean) {
    if (checked) {
      this.selectedCarIds.add(carId);
    } else {
      this.selectedCarIds.delete(carId);
    }
  }

  toggleSelectAllCars(checked: boolean) {
    if (checked) {
      this.pagedCars.forEach(car => this.selectedCarIds.add(car.id));
    } else {
      this.selectedCarIds.clear();
    }
  }

  isAllCarsSelected(): boolean {
    return this.pagedCars.length > 0 && this.pagedCars.every(car => this.selectedCarIds.has(car.id));
  }

  deleteSelectedCars() {
    if (!this.canDeleteCar) {
      this.showError('You do not have permission to delete cars.');
      return;
    }

    if (this.selectedCarIds.size === 0) {
      return;
    }

    const ids = Array.from(this.selectedCarIds);

    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${ids.length} selected car(s)?`,
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carService.bulkDeleteCars({ carIds: ids }).pipe(first()).subscribe({
          next: (response) => {
            this.selectedCarIds.clear();

            if (response.failedIds?.length) {
              this.showError(`Deleted ${response.deletedCount} car(s). Failed: ${response.failedIds.join(', ')}`);
            } else {
              this.showSuccess(`Successfully deleted ${response.deletedCount} car(s)`);
            }

            this.loadCars();
          },
          error: (error) => {
            this.showError(error);
          }
        });
      }
    });
  }

  private showSuccess(message: string) {
    this.toastService.show(message, {
      classname: 'bg-success text-white',
      delay: 3000
    });
  }

  private async connectRealtime() {
    try {
      await this.carRealtimeService.start(
        (payload) => this.handleRealtimeCarEvent(payload, 'created'),
        (payload) => this.handleRealtimeCarEvent(payload, 'updated'),
        (payload) => this.handleRealtimeCarEvent(payload, 'deleted')
      );
    } catch {
      this.toastService.show('Car realtime notifications unavailable right now.', {
        classname: 'bg-warning text-dark',
        delay: 3000,
        nativeToast: true
      });
    }
  }

  private handleRealtimeCarEvent(payload: any, action: 'created' | 'updated' | 'deleted') {
    const car = payload as Car;
    if (!car?.id) return;

    if (this.canViewCar) {
      this.loadCars();
    }

    this.latestRealtimeCar = car;
    this.latestRealtimeAction = action;
    this.toastService.show(this.carRealtimeToastTpl, {
      classname: this.getRealtimeToastClass(action),
      delay: 4500
    });
    this.playNotificationSound();
  }

  getRealtimeBrandName(): string {
    if (!this.latestRealtimeCar?.modelId) return '-';
    const brandId = this.getModelBrandId(this.latestRealtimeCar.modelId);
    if (!brandId) return '-';
    return this.getBrandName(brandId) || '-';
  }

  getRealtimeYear(): string {
    return this.latestRealtimeCar?.year ? String(this.latestRealtimeCar.year) : '-';
  }

  getRealtimeModelName(): string {
    if (!this.latestRealtimeCar?.modelId) return '-';
    return this.getCarModelName(this.latestRealtimeCar.modelId) || '-';
  }

  getRealtimeActionLabel(): string {
    if (this.latestRealtimeAction === 'created') return 'Car created';
    if (this.latestRealtimeAction === 'updated') return 'Car updated';
    return 'Car deleted';
  }

  getRealtimeIconClass(): string {
    if (this.latestRealtimeAction === 'created') return 'ri-add-circle-line text-success';
    if (this.latestRealtimeAction === 'updated') return 'ri-edit-circle-line text-primary';
    return 'ri-delete-bin-5-line text-danger';
  }

  private getRealtimeToastClass(action: 'created' | 'updated' | 'deleted'): string {
    if (action === 'created') return 'border-0 shadow-sm bg-success-subtle text-success-emphasis';
    if (action === 'updated') return 'border-0 shadow-sm bg-primary-subtle text-primary-emphasis';
    return 'border-0 shadow-sm bg-danger-subtle text-danger-emphasis';
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
      this.playFallbackBeep();
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
      const context = this.getAudioContext();
      if (!context) return;
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

  private async unlockSound() {
    const context = this.getAudioContext();
    if (context?.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Keep flow even if browser blocks resume once.
      }
    }

    // Prime media playback permission on browsers requiring a direct user gesture.
    try {
      const primer = new Audio(this.notificationSoundUrl);
      primer.volume = 0;
      await primer.play();
      primer.pause();
      primer.currentTime = 0;
    } catch {
      // Custom file can be missing; fallback beep remains available.
    }

    this.isSoundUnlocked = true;
    this.removeSoundUnlockListeners();
  }

  private getAudioContext(): AudioContext | null {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }

    this.audioContext = new AudioCtx();
    return this.audioContext;
  }

  // Tab Navigation with Validation
  onTabNavChange(event: NgbNavChangeEvent) {
    if (event.activeId === event.nextId) return;
    if (this.skipNextTabValidation && event.nextId === 6) {
      this.skipNextTabValidation = false;
      return;
    }

    const movingForward = Number(event.nextId) > Number(event.activeId);
    if (movingForward && !this.validateTab(event.activeId)) {
      event.preventDefault();
      this.invalidTabs.add(event.activeId);
      this.showError(this.getTabValidationErrorMessage(event.activeId));
      return;
    }

    if (movingForward) {
      this.invalidTabs.delete(event.activeId);
      this.validatedTabs.add(event.activeId);
    }

    if (event.nextId === 2) {
      this.reloadFeatureCatalog();
    }
    if (event.nextId === 4) {
      this.reloadExtraDetailsCatalog();
    }
  }

  goToTab(tabId: number) {
    const movingForward = Number(tabId) > Number(this.activeTab);
    if (movingForward && !this.validateTab(this.activeTab)) {
      this.invalidTabs.add(this.activeTab);
      this.showError(this.getTabValidationErrorMessage(this.activeTab));
      return;
    }

    if (movingForward) {
      this.invalidTabs.delete(this.activeTab);
      this.validatedTabs.add(this.activeTab);
    }

    if (tabId === 2) {
      this.reloadFeatureCatalog();
    }
    if (tabId === 4) {
      this.reloadExtraDetailsCatalog();
    }
    
    // Navigate to new tab
    this.activeTab = tabId;
  }

  private navigateToFinishTab() {
    this.skipNextTabValidation = true;
    this.activeTab = 6;
  }

  validateTab(tabId: number): boolean {
    switch (tabId) {
      case 1: // Main Info
        return this.validateMainInfoTab();
      case 2: // Car Features
        return this.validateFeatureTab();
      case 3: // Car Colors
        return this.validateCarColorsTab();
      case 4: // Extra Details
        return this.validateExtraDetailsTab();
      case 5: // Images
        return this.validateImagesTab();
      default:
        return true;
    }
  }

  validateMainInfoTab(): boolean {
    if (!this.carForm) return false;
    this.markMainInfoControlsTouched();
    return this.mainInfoFields.every((field) => this.carForm.get(field)?.valid);
  }

  validateFeatureTab(): boolean {
    this.featureTabSubmitted = true;
    return this.carCarFeatures.length > 0;
  }

  validateCarColorsTab(): boolean {
    this.colorTabSubmitted = true;
    if (!this.pendingCarColors.length) return false;
    return !this.hasInvalidPendingCarColorDetails();
  }

  validateExtraDetailsTab(): boolean {
    this.detailsTabSubmitted = true;
    return this.pendingExtraDetails.length > 0;
  }

  validateImagesTab(): boolean {
    this.imageTabSubmitted = true;
    return this.isEditMode ? this.carImages.length > 0 : this.pendingGalleryImages.length > 0;
  }

  isTabInvalid(tabId: number): boolean {
    return this.invalidTabs.has(tabId);
  }

  isTabValidated(tabId: number): boolean {
    return this.validatedTabs.has(tabId);
  }

  isTabNavigationDisabled(tabId: number): boolean {
    return false;
  }

  shouldShowFeatureSelectionError(): boolean {
    return this.carCarFeatures.length === 0 && (this.featureTabSubmitted || this.invalidTabs.has(2));
  }

  shouldShowColorSelectionError(): boolean {
    return this.pendingCarColors.length === 0 && (this.colorTabSubmitted || this.invalidTabs.has(3));
  }

  private hasInvalidPendingCarColorDetails(): boolean {
    return this.pendingCarColors.some(item =>
      !this.isPendingCarColorStatusValid(item) ||
      !this.isPendingCarColorStockValid(item) ||
      !this.isPendingCarColorPricingValid(item) ||
      !this.isPendingCarColorDiscountValid(item) ||
      !this.isPendingCarColorDiscountTypeValid(item) ||
      !this.isPendingCarColorImageValid(item)
    );
  }

  shouldShowExtraDetailsSelectionError(): boolean {
    return this.pendingExtraDetails.length === 0 && (this.detailsTabSubmitted || this.invalidTabs.has(4));
  }

  shouldShowImageSelectionError(): boolean {
    const hasImages = this.isEditMode ? this.carImages.length > 0 : this.pendingGalleryImages.length > 0;
    return !hasImages && (this.imageTabSubmitted || this.invalidTabs.has(5));
  }

  private syncFeatureTabValidationState() {
    if (this.carCarFeatures.length > 0) {
      this.invalidTabs.delete(2);
    }
  }

  private syncColorTabValidationState() {
    if (this.pendingCarColors.length > 0) {
      this.invalidTabs.delete(3);
    }
  }

  private syncDetailsTabValidationState() {
    if (this.pendingExtraDetails.length > 0) {
      this.invalidTabs.delete(4);
    }
  }

  private syncImageTabValidationState() {
    const hasImages = this.isEditMode ? this.carImages.length > 0 : this.pendingGalleryImages.length > 0;
    if (hasImages) {
      this.invalidTabs.delete(5);
    }
  }

  private getTabValidationErrorMessage(tabId: number): string {
    if (tabId === 2) {
      return this.translate.instant('CARS_PAGE.FEATURE_TAB_REQUIRED');
    }
    if (tabId === 3) {
      if (this.pendingCarColors.length === 0) {
        return this.translate.instant('CARS_PAGE.COLOR_TAB_REQUIRED');
      }
      return this.translate.instant('CARS_PAGE.COLOR_TAB_FIELDS_REQUIRED');
    }
    if (tabId === 4) {
      return this.translate.instant('CARS_PAGE.DETAILS_TAB_REQUIRED');
    }
    if (tabId === 5) {
      return this.translate.instant('CARS_PAGE.IMAGES_TAB_REQUIRED');
    }
    return this.translate.instant('CARS_PAGE.FILL_REQUIRED_BEFORE_PROCEED');
  }

  isControlInvalid(controlName: string): boolean {
    if (!this.carForm) return false;
    const control = this.carForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty || this.submitted);
  }

  getControlError(controlName: string): string {
    if (!this.carForm) return '';
    const control = this.carForm.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) {
      switch (controlName) {
        case 'modelId':
          return this.translate.instant('CARS_PAGE.ERROR_MODEL_REQUIRED');
        case 'nameEn':
          return this.translate.instant('CARS_PAGE.ERROR_NAME_EN_REQUIRED');
        case 'nameAr':
          return this.translate.instant('CARS_PAGE.ERROR_NAME_AR_REQUIRED');
        case 'brandFilterId':
          return this.translate.instant('CARS_PAGE.ERROR_BRAND_REQUIRED');
        case 'typeId':
          return this.translate.instant('CARS_PAGE.ERROR_TYPE_REQUIRED');
        case 'year':
          return this.translate.instant('CARS_PAGE.ERROR_YEAR_REQUIRED');
        case 'branchId':
          return this.translate.instant('CARS_PAGE.ERROR_BRANCH_REQUIRED');
        case 'mileage':
          return this.translate.instant('CARS_PAGE.ERROR_MILEAGE_REQUIRED');
        case 'vat':
          return this.translate.instant('CARS_PAGE.ERROR_VAT_REQUIRED');
        case 'descriptionEn':
          return this.translate.instant('CARS_PAGE.ERROR_DESCRIPTION_EN_REQUIRED');
        case 'descriptionAr':
          return this.translate.instant('CARS_PAGE.ERROR_DESCRIPTION_AR_REQUIRED');
        case 'conditionId':
          return this.translate.instant('CARS_PAGE.ERROR_CONDITION_REQUIRED');
        case 'seatingCapacity':
          return this.translate.instant('CARS_PAGE.ERROR_SEATING_CAPACITY_REQUIRED');
        case 'weelSizeInch':
          return this.translate.instant('CARS_PAGE.ERROR_WHEEL_SIZE_REQUIRED');
        case 'fuelTankCapacityLiter':
          return this.translate.instant('CARS_PAGE.ERROR_FUEL_TANK_CAPACITY_REQUIRED');
        case 'trimLevel':
          return this.translate.instant('CARS_PAGE.ERROR_TRIM_LEVEL_REQUIRED');
        case 'vehicleClass':
          return this.translate.instant('CARS_PAGE.ERROR_VEHICLE_CLASS_REQUIRED');
        case 'manufactureCountryId':
          return this.translate.instant('CARS_PAGE.ERROR_MANUFACTURE_COUNTRY_REQUIRED');
        case 'plateNumberAr':
          return this.translate.instant('CARS_PAGE.ERROR_PLATE_AR_REQUIRED');
        case 'plateNumberEn':
          return this.translate.instant('CARS_PAGE.ERROR_PLATE_EN_REQUIRED');
        case 'transmisionType':
          return this.translate.instant('CARS_PAGE.ERROR_TRANSMISSION_TYPE_REQUIRED');
        case 'drivetrain':
          return this.translate.instant('CARS_PAGE.ERROR_DRIVETRAIN_REQUIRED');
        case 'cylenders':
          return this.translate.instant('CARS_PAGE.ERROR_CYLENDERS_REQUIRED');
        case 'fuelType':
          return this.translate.instant('CARS_PAGE.ERROR_FUEL_TYPE_REQUIRED');
        case 'enginNumber':
          return this.translate.instant('CARS_PAGE.ERROR_ENGINE_NUMBER_REQUIRED');
      }
    }

    if (controlName === 'year') {
      if (control.errors['min']) return this.translate.instant('CARS_PAGE.ERROR_YEAR_MIN');
      if (control.errors['max']) return this.translate.instant('CARS_PAGE.ERROR_YEAR_MAX');
    }

    if (controlName === 'mileage' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_MILEAGE_MIN');
    }
    if (controlName === 'vat' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_VAT_MIN');
    }
    if (controlName === 'conditionId' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_CONDITION_MIN');
    }
    if (controlName === 'seatingCapacity' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_SEATING_CAPACITY_MIN');
    }
    if (controlName === 'fuelTankCapacityLiter' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_FUEL_TANK_CAPACITY_MIN');
    }
    if (controlName === 'trimLevel' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_TRIM_LEVEL_MIN');
    }
    if (controlName === 'vehicleClass' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_VEHICLE_CLASS_MIN');
    }
    if (controlName === 'manufactureCountryId' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_MANUFACTURE_COUNTRY_MIN');
    }
    if (controlName === 'transmisionType' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_TRANSMISSION_TYPE_MIN');
    }
    if (controlName === 'drivetrain' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_DRIVETRAIN_MIN');
    }
    if (controlName === 'cylenders' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_CYLENDERS_MIN');
    }
    if (controlName === 'fuelType' && control.errors['min']) {
      return this.translate.instant('CARS_PAGE.ERROR_FUEL_TYPE_MIN');
    }
    if (controlName === 'plateNumberAr' && control.errors['pattern']) {
      return this.translate.instant('CARS_PAGE.ERROR_PLATE_AR_PATTERN');
    }
    if (controlName === 'plateNumberEn' && control.errors['pattern']) {
      return this.translate.instant('CARS_PAGE.ERROR_PLATE_EN_PATTERN');
    }

    return this.translate.instant('CARS_PAGE.ERROR_INVALID_VALUE');
  }

  private markMainInfoControlsTouched() {
    if (!this.carForm) return;
    this.mainInfoFields.forEach((field) => this.carForm.get(field)?.markAsTouched());
    this.carForm.updateValueAndValidity({ emitEvent: false });
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }
}
