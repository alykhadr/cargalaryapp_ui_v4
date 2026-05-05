import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { first, catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
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
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-cars-print-report-page',
  templateUrl: './cars-print-report-page.component.html',
  styleUrl: './cars-print-report-page.component.scss',
  standalone: false
})
export class CarsPrintReportPageComponent implements OnInit {
  breadCrumbItems!: Array<{}>;

  isLoading = true;
  errorMessage = '';
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
    private lookupService: LookupService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('CARS_PAGE.PRINT_REPORT'), active: true }
    ];

    const carId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(carId) || carId <= 0) {
      this.isLoading = false;
      this.errorMessage = this.translate.instant('CARS_PAGE.NO_REPORT_DATA');
      return;
    }

    this.loadReportData(carId);
  }

  loadReportData(carId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      car: this.carService.getCarById(carId),
      colors: this.carCarColorService.getByCarId(carId),
      features: this.carFeatureService.getCarFeaturesByCarId(carId),
      extraDetails: this.carExtraDetailsService.getExtraDetailsByCarId(carId),
      featureCatalog: this.carFeatureService.getCarFeatures(),
      colorCatalog: this.colorService.getColors(),
      branchCatalog: this.branchService.getBranches(),
      modelCatalog: this.carModelService.getModels(),
      typeCatalog: this.carTypeService.getCarTypes(),
      brandCatalog: this.brandService.getBrands(),
      companyInfos: this.companyInfoService.getCompanyInfos().pipe(
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
        this.errorMessage = getErrorMessage(error, this.translate.instant('CARS_PAGE.NO_REPORT_DATA'));
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/admin/cars/list']);
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

  getBranchLabel(branchId: number): string {
    const branch = this.branchesCatalog.find(x => x.id === branchId);
    if (!branch) {
      return `#${branchId}`;
    }

    return this.getLocalizedText(branch.branchNameAr, branch.branchNameEn, `#${branchId}`);
  }

  getTypeLabel(typeId: number): string {
    const type = this.typesCatalog.find(x => x.id === typeId);
    if (!type) {
      return `#${typeId}`;
    }

    return this.getLocalizedText(type.nameAr, type.nameEn, `#${typeId}`);
  }

  getModelLabel(modelId: number): string {
    const model = this.modelsCatalog.find(x => x.id === modelId);
    if (!model) {
      return `#${modelId}`;
    }

    return this.getLocalizedText(model.nameAr, model.nameEn, `#${modelId}`);
  }

  getBrandLabelByModel(modelId: number): string {
    const model = this.modelsCatalog.find((x) => x.id === modelId);
    if (!model) {
      return '-';
    }

    const brand = this.brandsCatalog.find(x => x.id === model.brandId);
    if (!brand) {
      return `#${model.brandId}`;
    }

    return this.getLocalizedText(brand.nameAr, brand.nameEn, `#${model.brandId}`);
  }

  getBrandByModel(modelId: number): Brand | undefined {
    const model = this.modelsCatalog.find((x) => x.id === modelId);
    if (!model) return undefined;
    return this.brandsCatalog.find((x) => x.id === model.brandId);
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

    return this.getLocalizedText(feature.nameAr, feature.nameEn, `#${featureId}`);
  }

  getColorLabel(item: CarCarColor): string {
    if (item.colorNameAr || item.colorNameEn) {
      return this.getLocalizedText(item.colorNameAr || undefined, item.colorNameEn || undefined, `#${item.colorId}`);
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
    if (!color) {
      return `#${item.colorId}`;
    }

    return this.getLocalizedText(color.colorNameAr, color.colorNameEn, `#${item.colorId}`);
  }

  getColorCode(item: CarCarColor): string {
    if (item.colorCode && item.colorCode.trim()) {
      return item.colorCode;
    }

    const color = this.colorsCatalog.find(x => x.id === item.colorId);
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

    const reportTitle = this.translate.instant('CARS_PAGE.PRINT_REPORT_TITLE');
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
