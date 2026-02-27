import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { CarModel } from '../interfaces/car-model.interface';
import { Brand } from '../interfaces/brand.interface';
import { Car } from '../interfaces/car.interface';
import { CarModelService } from '../services/car-model.service';
import { BrandService } from '../services/brand.service';
import { CarService } from '../services/car.service';
import { getErrorMessage } from '../shared/error-message.util';

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
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Car Models', active: true }
    ];

    this.modelForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      brandId: [null, [Validators.required]]
    });

    this.loadModels();
    this.loadBrands();
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
      this.showError({ message: 'Please select only image files' });
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
      this.showError({ message: 'Failed to read image file' });
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
          this.showSuccess('Model updated successfully');
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
          this.showSuccess('Model created successfully');
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
      title: 'Are you sure?',
      text: 'Are you sure you want to remove this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It!',
      cancelButtonText: 'Close',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.modelService.deleteModel(model.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Model deleted successfully');
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
    return brand ? brand.nameEn : 'N/A';
  }

  private showSuccess(message: string) {
    this.toastService.show(message, {
      classname: 'bg-success text-white',
      delay: 3000
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
      title: 'Are you sure?',
      text: `Delete ${this.selectedModelIds.size} selected model(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const modelIds = Array.from(this.selectedModelIds);
        this.modelService.bulkDeleteModels(modelIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedModelIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: `Deleted ${response.deletedCount} models. Failed to delete ${response.failedIds.length} models.` });
            } else {
              this.showSuccess(`Successfully deleted ${response.deletedCount} model(s)`);
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
