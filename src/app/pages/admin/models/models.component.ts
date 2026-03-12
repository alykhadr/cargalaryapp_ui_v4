import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { CarModel } from '../interfaces/car-model.interface';
import { Brand } from '../interfaces/brand.interface';
import { Car } from '../interfaces/car.interface';
import { CarType } from '../interfaces/car-type.interface';
import { CarModelService } from '../services/car-model.service';
import { BrandService } from '../services/brand.service';
import { CarService } from '../services/car.service';
import { CarTypeService } from '../services/car-type.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-models',
  templateUrl: './models.component.html',
  styleUrl: './models.component.scss',
  standalone: false
})
export class ModelsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  modelForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedModel?: CarModel;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  models: CarModel[] = [];
  filteredModels: CarModel[] = [];
  pagedModels: CarModel[] = [];
  brands: Brand[] = [];
  carTypes: CarType[] = [];
  searchTerm = '';
  searchTermAr = '';
  previewImageUrl: string | null = null;
  selectedModelIds = new Set<number>();

  // Cars modal properties
  isCarsModalOpen = false;
  isCarsLoading = false;
  selectedModelForCars?: CarModel;
  cars: Car[] = [];
  pagedCars: Car[] = [];
  carsPaginationService = new PaginationService();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private modelService: CarModelService,
    private brandService: BrandService,
    private carService: CarService,
    private carTypeService: CarTypeService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.MODEL'), active: true }
    ];

    this.modelForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      brandId: [null, [Validators.required]]
    });

    this.loadModels();
    this.loadBrands();
    this.loadCarTypes();
  }

  get form() {
    return this.modelForm.controls;
  }

  loadModels() {
    this.isLoading = true;
    this.modelService.getModels().pipe(first()).subscribe({
      next: (models) => {
        this.models = models;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.showError(error);
        this.isLoading = false;
      }
    });
  }

  loadBrands() {
    this.brandService.getBrands().pipe(first()).subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => this.showError(error)
    });
  }

  loadCarTypes() {
    this.carTypeService.getCarTypes().pipe(first()).subscribe({
      next: (types) => {
        this.carTypes = types;
      },
      error: (error) => this.showError(error)
    });
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchTermAr = '';
    this.applyFilters(true);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.models];
    const termEn = this.searchTerm.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn || termAr) {
      data = data.filter(model =>
        (termEn && (model.nameEn || '').toLowerCase().includes(termEn)) ||
        (termAr && (model.nameAr || '').toLowerCase().includes(termAr))
      );
    }

    this.filteredModels = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedModels = this.service.changePage(this.filteredModels);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedModels = this.service.changePage(this.filteredModels);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedModel = undefined;
    this.modelForm.reset();
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
    this.isModalOpen = true;
  }

  openEditModal(model: CarModel) {
    this.isEditMode = true;
    this.selectedModel = model;
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
    this.modelForm.patchValue({
      nameEn: model.nameEn,
      nameAr: model.nameAr,
      brandId: model.brandId
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedModel = undefined;
    this.modelForm.reset();
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showError({ message: this.translate.instant('MODEL_PAGE.IMAGE_ONLY_ERROR') });
      event.target.value = '';
      this.selectedImage = null;
      this.imagePreview = null;
      return;
    }

    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result as string;
    };
    reader.onerror = () => {
      this.showError({ message: this.translate.instant('MODEL_PAGE.IMAGE_READ_ERROR') });
      this.selectedImage = null;
      this.imagePreview = null;
    };
    reader.readAsDataURL(file);
  }

  saveModel() {
    this.submitted = true;
    if (this.modelForm.invalid) return;
    if (!this.isEditMode && !this.selectedImage) return;

    this.isSubmitting = true;
    const payload = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      brandId: this.form['brandId'].value,
      imageFile: this.selectedImage || undefined
    };

    if (this.isEditMode && this.selectedModel) {
      this.modelService.updateModel(this.selectedModel.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('MODEL_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadModels();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.modelService.createModel(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('MODEL_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadModels();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteModel(model: CarModel) {
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
        this.modelService.deleteModel(model.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('MODEL_PAGE.DELETE_SUCCESS'));
            this.loadModels();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  getImageUrl(url?: string): string {
    if (!url) return 'https://via.placeholder.com/100x100?text=No+Image';
    if (url.startsWith('http')) return url;
    return url;
  }

  getModalImageUrl(): string {
    if (this.imagePreview) return this.imagePreview;
    if (this.isEditMode && this.selectedModel?.imageUrl) {
      return this.getImageUrl(this.selectedModel.imageUrl);
    }
    return 'https://ui-avatars.com/api/?name=Model&size=150&background=405189&color=fff&rounded=true';
  }

  getBrandName(brandId: number): string {
    const brand = this.brands.find(b => b.id === brandId);
    return brand ? brand.nameEn : this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  getBrandNameEn(brandId: number): string {
    const brand = this.brands.find(b => b.id === brandId);
    return brand?.nameEn?.trim() || this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  getBrandNameAr(brandId: number): string {
    const brand = this.brands.find(b => b.id === brandId);
    return brand?.nameAr?.trim() || this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  getCarTypeName(typeId: number): string {
    const type = this.carTypes.find(t => t.id === typeId);
    if (!type) {
      return this.translate.instant('COMMON.NOT_AVAILABLE');
    }

    const isArabic = this.translate.currentLang?.toLowerCase().startsWith('ar');
    return isArabic ? type.nameAr : type.nameEn;
  }

  private showSuccess(message: string) {
    void Swal.fire({
      title: message,
      icon: 'success',
      confirmButtonText: this.translate.instant('COMMON.OK'),
      confirmButtonColor: '#299cdb'
    });
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }

  previewImage(imageUrl: string) {
    this.previewImageUrl = imageUrl;
  }

  closePreview() {
    this.previewImageUrl = null;
  }

  toggleModelSelection(modelId: number, checked: boolean) {
    if (checked) {
      this.selectedModelIds.add(modelId);
    } else {
      this.selectedModelIds.delete(modelId);
    }
  }

  toggleSelectAllModels(checked: boolean) {
    if (checked) {
      this.pagedModels.forEach(model => this.selectedModelIds.add(model.id));
    } else {
      this.selectedModelIds.clear();
    }
  }

  isAllModelsSelected(): boolean {
    return this.pagedModels.length > 0 && this.pagedModels.every(model => this.selectedModelIds.has(model.id));
  }

  bulkDeleteModels() {
    if (this.selectedModelIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('MODEL_PAGE.BULK_DELETE_TEXT', { count: this.selectedModelIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const modelIds = Array.from(this.selectedModelIds);
        this.modelService.bulkDeleteModels(modelIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedModelIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: this.translate.instant('MODEL_PAGE.BULK_DELETE_PARTIAL', { deleted: response.deletedCount, failed: response.failedIds.length }) });
            } else {
              this.showSuccess(this.translate.instant('MODEL_PAGE.BULK_DELETE_SUCCESS', { count: response.deletedCount }));
            }
            this.loadModels();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  // Cars modal methods
  openCarsModal(model: CarModel) {
    this.selectedModelForCars = model;
    this.isCarsModalOpen = true;
    this.carsPaginationService.page = 1;
    this.loadCars();
  }

  closeCarsModal() {
    this.isCarsModalOpen = false;
    this.selectedModelForCars = undefined;
    this.cars = [];
    this.pagedCars = [];
  }

  loadCars() {
    if (!this.selectedModelForCars) return;
    
    this.isCarsLoading = true;
    this.carService.getCarsByModel(this.selectedModelForCars.id).pipe(first()).subscribe({
      next: (cars) => {
        this.cars = cars;
        this.pagedCars = this.carsPaginationService.changePage(this.cars);
        this.isCarsLoading = false;
      },
      error: (error) => {
        this.showError(error);
        this.isCarsLoading = false;
      }
    });
  }

  onCarsPageChange(page: number) {
    this.carsPaginationService.page = page;
    this.pagedCars = this.carsPaginationService.changePage(this.cars);
  }
}
