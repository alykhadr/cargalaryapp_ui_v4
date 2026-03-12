import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Brand } from '../interfaces/brand.interface';
import { BrandService } from '../services/brand.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.scss',
  standalone: false
})
export class BrandsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  brandForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedBrand?: Brand;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  pagedBrands: Brand[] = [];
  searchTerm = '';
  searchTermAr = '';
  previewImageUrl: string | null = null;
  selectedBrandIds = new Set<number>();

  brandModels: any[] = [];
  pagedBrandModels: any[] = [];
  loadingModels = false;
  modelsPage = 1;
  modelsPageSize = 5;
  Math = Math;

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private brandService: BrandService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.BRAND'), active: true }
    ];

    this.brandForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]]
    });

    this.loadBrands();
  }

  get form() {
    return this.brandForm.controls;
  }

  loadBrands() {
    this.isLoading = true;
    this.brandService.getBrands().pipe(first()).subscribe({
      next: (brands) => {
        this.brands = brands;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.showError(error);
        this.isLoading = false;
      }
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
    let data = [...this.brands];
    const termEn = this.searchTerm.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn || termAr) {
      data = data.filter(brand =>
        (termEn && (brand.nameEn || '').toLowerCase().includes(termEn)) ||
        (termAr && (brand.nameAr || '').toLowerCase().includes(termAr))
      );
    }

    this.filteredBrands = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedBrands = this.service.changePage(this.filteredBrands);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedBrands = this.service.changePage(this.filteredBrands);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedBrand = undefined;
    this.brandForm.reset();
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
    this.isModalOpen = true;
  }

  openEditModal(brand: Brand) {
    this.isEditMode = true;
    this.selectedBrand = brand;
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
    this.brandForm.patchValue({
      nameEn: brand.nameEn,
      nameAr: brand.nameAr
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedBrand = undefined;
    this.brandForm.reset();
    this.submitted = false;
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showError({ message: this.translate.instant('BRAND_PAGE.IMAGE_ONLY_ERROR') });
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
      this.showError({ message: this.translate.instant('BRAND_PAGE.IMAGE_READ_ERROR') });
      this.selectedImage = null;
      this.imagePreview = null;
    };
    reader.readAsDataURL(file);
  }

  saveBrand() {
    this.submitted = true;
    if (this.brandForm.invalid) return;
    if (!this.isEditMode && !this.selectedImage) return;

    this.isSubmitting = true;
    const payload = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      imageFile: this.selectedImage || undefined
    };

    if (this.isEditMode && this.selectedBrand) {
      this.brandService.updateBrand(this.selectedBrand.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('BRAND_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadBrands();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.brandService.createBrand(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('BRAND_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadBrands();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteBrand(brand: Brand) {
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
        this.brandService.deleteBrand(brand.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('BRAND_PAGE.DELETE_SUCCESS'));
            this.loadBrands();
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
    if (this.isEditMode && this.selectedBrand?.imageUrl) {
      return this.getImageUrl(this.selectedBrand.imageUrl);
    }
    return 'https://ui-avatars.com/api/?name=Brand&size=150&background=405189&color=fff&rounded=true';
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

  toggleBrandSelection(brandId: number, checked: boolean) {
    if (checked) {
      this.selectedBrandIds.add(brandId);
    } else {
      this.selectedBrandIds.delete(brandId);
    }
  }

  toggleSelectAllBrands(checked: boolean) {
    if (checked) {
      this.pagedBrands.forEach(brand => this.selectedBrandIds.add(brand.id));
    } else {
      this.selectedBrandIds.clear();
    }
  }

  isAllBrandsSelected(): boolean {
    return this.pagedBrands.length > 0 && this.pagedBrands.every(brand => this.selectedBrandIds.has(brand.id));
  }

  bulkDeleteBrands() {
    if (this.selectedBrandIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('BRAND_PAGE.BULK_DELETE_TEXT', { count: this.selectedBrandIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const brandIds = Array.from(this.selectedBrandIds);
        this.brandService.bulkDeleteBrands(brandIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedBrandIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: this.translate.instant('BRAND_PAGE.BULK_DELETE_PARTIAL', { deleted: response.deletedCount, failed: response.failedIds.length }) });
            } else {
              this.showSuccess(this.translate.instant('BRAND_PAGE.BULK_DELETE_SUCCESS', { count: response.deletedCount }));
            }
            this.loadBrands();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  viewBrandModels(brandId: number, modal: any) {
    this.loadingModels = true;
    this.brandModels = [];
    this.pagedBrandModels = [];
    this.modelsPage = 1;
    this.modalService.open(modal, { size: 'lg', centered: true });
    
    this.brandService.getCarModelsByBrand(brandId).pipe(first()).subscribe({
      next: (models) => {
        this.brandModels = models;
        this.updateModelsPagination();
        this.loadingModels = false;
      },
      error: (error) => {
        this.loadingModels = false;
        this.showError(error);
      }
    });
  }

  updateModelsPagination() {
    const startIndex = (this.modelsPage - 1) * this.modelsPageSize;
    const endIndex = startIndex + this.modelsPageSize;
    this.pagedBrandModels = this.brandModels.slice(startIndex, endIndex);
  }

  onModelsPageChange(page: number) {
    this.modelsPage = page;
    this.updateModelsPagination();
  }
}
