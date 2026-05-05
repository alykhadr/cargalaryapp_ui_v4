import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import { GlobalComponent } from 'src/app/global-component';
import { Branch } from '../interfaces/branch.interface';
import { Brand } from '../interfaces/brand.interface';
import { CarCarColor } from '../interfaces/car-car-color.interface';
import { CarExtraDetails } from '../interfaces/car-extra-details.interface';
import { CarCarFeature, CarFeature } from '../interfaces/car-feature.interface';
import { Car } from '../interfaces/car.interface';
import { CarModel } from '../interfaces/car-model.interface';
import { CarType } from '../interfaces/car-type.interface';
import { Color } from '../interfaces/color.interface';
import { CompanyInfo } from '../interfaces/company-info.interface';
import { LookupDetail } from '../interfaces/lookup.interface';
import { Request } from '../interfaces/request.interface';
import { BranchService } from '../services/branch.service';
import { BrandService } from '../services/brand.service';
import { CarCarColorService } from '../services/car-car-color.service';
import { CarExtraDetailsService } from '../services/car-extra-details.service';
import { CarFeatureService } from '../services/car-feature.service';
import { CarModelService } from '../services/car-model.service';
import { CarService } from '../services/car.service';
import { CarTypeService } from '../services/car-type.service';
import { ColorService } from '../services/color.service';
import { CompanyInfoService } from '../services/company-info.service';
import { LookupService } from '../services/lookup.service';
import { RequestService } from '../services/request.service';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-request-print-report-page',
  templateUrl: './request-print-report-page.component.html',
  styleUrl: './request-print-report-page.component.scss',
  standalone: false
})
export class RequestPrintReportPageComponent implements OnInit {
  breadCrumbItems!: Array<{}>;

  isLoading = true;
  errorMessage = '';

  request: Request | null = null;
  car: Car | null = null;
  companyInfo: CompanyInfo | null = null;

  carInfoColors: CarCarColor[] = [];
  carInfoFeatures: CarCarFeature[] = [];
  carInfoExtraDetails: CarExtraDetails[] = [];

  carFeaturesCatalog: CarFeature[] = [];
  colorsCatalog: Color[] = [];
  branchesCatalog: Branch[] = [];
  modelsCatalog: CarModel[] = [];
  typesCatalog: CarType[] = [];
  brandsCatalog: Brand[] = [];

  paymentMethodLookups: LookupDetail[] = [];
  vehicleOwnerTypeLookups: LookupDetail[] = [];
  regionLookups: LookupDetail[] = [];
  cityLookups: LookupDetail[] = [];
  requestStatusLookups: LookupDetail[] = [];

  conditionLookups: LookupDetail[] = [];
  trimLevelLookups: LookupDetail[] = [];
  vehicleClassLookups: LookupDetail[] = [];
  transmisionTypeLookups: LookupDetail[] = [];
  drivetrainLookups: LookupDetail[] = [];
  fuelTypeLookups: LookupDetail[] = [];
  manufactureCountryLookups: LookupDetail[] = [];
  extraDetailTypeLookups: LookupDetail[] = [];

  generatedAt = new Date();
  private autoPrintHandled = false;
  private previousDocumentTitle = '';
  private hasTemporaryPrintTitle = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private requestService: RequestService,
    private carService: CarService,
    private branchService: BranchService,
    private carModelService: CarModelService,
    private carTypeService: CarTypeService,
    private brandService: BrandService,
    private carCarColorService: CarCarColorService,
    private carFeatureService: CarFeatureService,
    private carExtraDetailsService: CarExtraDetailsService,
    private colorService: ColorService,
    private companyInfoService: CompanyInfoService,
    private lookupService: LookupService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.REQUEST.TEXT') },
      { label: this.translate.instant('REQUEST_PAGE.LIST.PRINT_REPORT'), active: true }
    ];

    const requestId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(requestId) || requestId <= 0) {
      this.isLoading = false;
      this.errorMessage = this.translate.instant('REQUEST_PAGE.LIST.NO_REPORT_DATA');
      return;
    }

    this.loadReportData(requestId);
  }

  loadReportData(requestId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.requestService.getById(requestId).pipe(first()).subscribe({
      next: (request) => {
        this.request = request;
        this.loadDetailsWithRequest(request);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(error, this.translate.instant('REQUEST_PAGE.LIST.NO_REPORT_DATA'));
      }
    });
  }

  private loadDetailsWithRequest(request: Request): void {
    forkJoin({
      car: this.carService.getCarById(request.carId),
      colors: this.carCarColorService.getByCarId(request.carId),
      features: this.carFeatureService.getCarFeaturesByCarId(request.carId),
      extraDetails: this.carExtraDetailsService.getExtraDetailsByCarId(request.carId),
      featureCatalog: this.carFeatureService.getCarFeatures(),
      colorCatalog: this.colorService.getColors(),
      branchCatalog: this.branchService.getBranches(),
      modelCatalog: this.carModelService.getModels(),
      typeCatalog: this.carTypeService.getCarTypes(),
      brandCatalog: this.brandService.getBrands(),
      companyInfos: this.companyInfoService.getCompanyInfos().pipe(
        catchError(() => of([]))
      ),
      paymentMethods: this.lookupService.getByMasterCode('PAYMENT_METHOD'),
      ownerTypes: this.lookupService.getByMasterCode('VEHICLE_OWNER_TYPE'),
      regions: this.lookupService.getByMasterCode('REGION'),
      cities: this.lookupService.getByMasterCode('CITY'),
      statuses: this.lookupService.getByMasterCode('REQUEST_STATUS'),
      legacyStatuses: this.lookupService.getByMasterCode('QUOTATION_STATUS').pipe(
        catchError(() => of([]))
      ),
      conditions: this.lookupService.getByMasterCode('CAR_CONDITION'),
      trimLevels: this.lookupService.getByMasterCode('CAR_TRIM_LEVEL'),
      vehicleClasses: this.lookupService.getByMasterCode('CAR_VEHICLE_CLASS'),
      transmisionTypes: this.lookupService.getByMasterCode('CAR_TRANSMISION_TYPE'),
      drivetrains: this.lookupService.getByMasterCode('CAR_DRIVETRAIN'),
      fuelTypes: this.lookupService.getByMasterCode('CAR_FUEL_TYPE'),
      countries: this.lookupService.getByMasterCode('COUNTRY'),
      extraDetailTypes: this.lookupService.getByMasterCode('EXTRA_TYPE')
    }).pipe(first()).subscribe({
      next: ({
        car,
        colors,
        features,
        extraDetails,
        featureCatalog,
        colorCatalog,
        branchCatalog,
        modelCatalog,
        typeCatalog,
        brandCatalog,
        companyInfos,
        paymentMethods,
        ownerTypes,
        regions,
        cities,
        statuses,
        legacyStatuses,
        conditions,
        trimLevels,
        vehicleClasses,
        transmisionTypes,
        drivetrains,
        fuelTypes,
        countries,
        extraDetailTypes
      }) => {
        this.car = car;
        this.carInfoColors = colors || [];
        this.carInfoFeatures = features || [];
        this.carInfoExtraDetails = extraDetails || [];

        this.carFeaturesCatalog = featureCatalog || [];
        this.colorsCatalog = colorCatalog || [];
        this.branchesCatalog = branchCatalog || [];
        this.modelsCatalog = modelCatalog || [];
        this.typesCatalog = typeCatalog || [];
        this.brandsCatalog = brandCatalog || [];

        const companyList = companyInfos || [];
        this.companyInfo = companyList.find(x => x.isAvailable) || companyList[0] || null;

        this.paymentMethodLookups = paymentMethods || [];
        this.vehicleOwnerTypeLookups = ownerTypes || [];
        this.regionLookups = regions || [];
        this.cityLookups = cities || [];

        const preferredStatuses = statuses || [];
        const fallbackStatuses = legacyStatuses || [];
        this.requestStatusLookups = [...preferredStatuses, ...fallbackStatuses]
          .filter(item => item?.id)
          .filter((item, index, array) => array.findIndex(x => x.id === item.id) === index);

        this.conditionLookups = conditions || [];
        this.trimLevelLookups = trimLevels || [];
        this.vehicleClassLookups = vehicleClasses || [];
        this.transmisionTypeLookups = transmisionTypes || [];
        this.drivetrainLookups = drivetrains || [];
        this.fuelTypeLookups = fuelTypes || [];
        this.manufactureCountryLookups = countries || [];
        this.extraDetailTypeLookups = extraDetailTypes || [];

        this.generatedAt = new Date();
        this.isLoading = false;

        if (this.shouldAutoPrint()) {
          this.removeAutoPrintQueryParam();
          this.autoPrintHandled = true;
          setTimeout(() => this.printReport(), 250);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = getErrorMessage(error, this.translate.instant('REQUEST_PAGE.LIST.NO_REPORT_DATA'));
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/admin/request/list']);
  }

  printReport(): void {
    this.applyPrintDocumentTitle();
    const onAfterPrint = () => this.restoreDocumentTitle();
    window.addEventListener('afterprint', onAfterPrint, { once: true });
    window.print();
    setTimeout(() => this.restoreDocumentTitle(), 2000);
  }

  getLocalizedText(nameAr?: string | null, nameEn?: string | null, fallback = '-'): string {
    const preferArabic = this.isArabicLanguage();
    const preferred = preferArabic ? nameAr : nameEn;
    const alternate = preferArabic ? nameEn : nameAr;
    return preferred || alternate || fallback;
  }

  getLookupLabel(items: LookupDetail[], id?: number | null): string {
    if (!id) return '-';
    const found = items.find(x => x.id === id || x.detailCode === String(id));
    if (!found) return String(id);
    return this.getLookupDisplayName(found, String(id));
  }

  getLookupDisplayName(item?: LookupDetail | null, fallback = '-'): string {
    if (!item) return fallback;

    const preferArabic = this.isArabicLanguage();
    const preferredName = preferArabic ? item.nameAr : item.nameEn;
    const alternateName = preferArabic ? item.nameEn : item.nameAr;

    return preferredName || alternateName || item.displayName || fallback;
  }

  getBranchLabel(branchId: number): string {
    const branch = this.branchesCatalog.find(x => x.id === branchId);
    if (!branch) return `#${branchId}`;
    return this.getLocalizedText(branch.branchNameAr, branch.branchNameEn, `#${branchId}`);
  }

  getTypeLabel(typeId: number): string {
    const type = this.typesCatalog.find(x => x.id === typeId);
    if (!type) return `#${typeId}`;
    return this.getLocalizedText(type.nameAr, type.nameEn, `#${typeId}`);
  }

  getModelLabel(modelId: number): string {
    const model = this.modelsCatalog.find(x => x.id === modelId);
    if (!model) return `#${modelId}`;
    return this.getLocalizedText(model.nameAr, model.nameEn, `#${modelId}`);
  }

  getBrandLabelByModel(modelId: number): string {
    const model = this.modelsCatalog.find(x => x.id === modelId);
    if (!model) return '-';

    const brand = this.brandsCatalog.find(x => x.id === model.brandId);
    if (!brand) return `#${model.brandId}`;

    return this.getLocalizedText(brand.nameAr, brand.nameEn, `#${model.brandId}`);
  }

  getBrandByModel(modelId: number): Brand | undefined {
    const model = this.modelsCatalog.find((x) => x.id === modelId);
    if (!model) return undefined;
    return this.brandsCatalog.find((x) => x.id === model.brandId);
  }

  getFeatureName(featureId: number): string {
    const feature = this.carFeaturesCatalog.find(x => x.id === featureId);
    if (!feature) return `#${featureId}`;
    return this.getLocalizedText(feature.nameAr, feature.nameEn, `#${featureId}`);
  }

  getColorLabel(item: CarCarColor): string {
    if (item.colorNameAr || item.colorNameEn) {
      return this.getLocalizedText(item.colorNameAr || undefined, item.colorNameEn || undefined, `#${item.colorId}`);
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
    if (!color) return `#${item.colorId}`;

    return this.getLocalizedText(color.colorNameAr, color.colorNameEn, `#${item.colorId}`);
  }

  getColorLabelById(colorId?: number | null): string {
    if (!colorId) return '-';
    const color = this.colorsCatalog.find(x => x.id === colorId);
    if (!color) return `#${colorId}`;
    return this.getLocalizedText(color.colorNameAr, color.colorNameEn, `#${colorId}`);
  }

  getColorCode(item: CarCarColor): string {
    if (item.colorCode && item.colorCode.trim()) {
      return item.colorCode;
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
    return color?.colorCode || '#d4d4d4';
  }

  getColorCodeById(colorId?: number | null): string {
    if (!colorId) return '#d4d4d4';
    const color = this.colorsCatalog.find(x => x.id === colorId);
    return color?.colorCode || '#d4d4d4';
  }

  getCarColorStatusLabel(item: CarCarColor): string {
    if (item.colorStatusNameAr || item.colorStatusNameEn) {
      return this.getLocalizedText(item.colorStatusNameAr || undefined, item.colorStatusNameEn || undefined, '-');
    }

    if (item.colorStatusDetailCode) {
      return item.colorStatusDetailCode;
    }

    return item.colorStatus ? `#${item.colorStatus}` : '-';
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

  isSelectedRequestColor(colorId: number): boolean {
    return this.request?.colorId === colorId;
  }

  getCompanyLogoUrl(): string {
    return this.getImageUrl(this.companyInfo?.logoUrl || undefined, 'assets/images/logo-sm.png');
  }

  getImageUrl(imageUrl?: string | null, fallback = 'assets/images/car-placeholder.png'): string {
    if (!imageUrl) {
      return fallback;
    }

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

  private shouldAutoPrint(): boolean {
    if (this.autoPrintHandled) {
      return false;
    }

    const raw = (this.route.snapshot.queryParamMap.get('autoPrint') || '').toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  }

  private removeAutoPrintQueryParam(): void {
    const currentUrl = new URL(window.location.href);
    if (!currentUrl.searchParams.has('autoPrint')) {
      return;
    }

    currentUrl.searchParams.delete('autoPrint');
    const query = currentUrl.searchParams.toString();
    const nextUrl = `${currentUrl.pathname}${query ? `?${query}` : ''}${currentUrl.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }

  private applyPrintDocumentTitle(): void {
    if (!this.hasTemporaryPrintTitle) {
      this.previousDocumentTitle = document.title;
      this.hasTemporaryPrintTitle = true;
    }

    const reportTitle = this.translate.instant('REQUEST_PAGE.LIST.PRINT_REPORT_TITLE');
    const carName = this.getLocalizedText(this.car?.nameAr, this.car?.nameEn, '').trim();
    document.title = carName ? `${reportTitle} - ${carName}` : reportTitle;
  }

  private restoreDocumentTitle(): void {
    if (!this.hasTemporaryPrintTitle) {
      return;
    }

    document.title = this.previousDocumentTitle;
    this.hasTemporaryPrintTitle = false;
  }

  private isArabicLanguage(): boolean {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || '').toLowerCase();
    return lang.startsWith('ar');
  }
}
