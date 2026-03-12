import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Service } from '../interfaces/service.interface';
import { ServiceService } from './service.service';
import { getErrorMessage } from '../shared/error-message.util';
import { GlobalComponent } from 'src/app/global-component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  standalone: false
})
export class ServicesComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  serviceForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedService?: Service;
  selectedFile?: File;
  imagePreview?: string;
  apiUrl = GlobalComponent.API_URL;
  isImagePreviewOpen = false;
  previewImageUrl?: string;
  public Editor = ClassicEditor;

  services: Service[] = [];
  filteredServices: Service[] = [];
  pagedServices: Service[] = [];
  searchTerm = '';
  selectedServiceIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public paginationService: PaginationService,
    private serviceService: ServiceService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.SERVICE'), active: true }
    ];

    this.serviceForm = this.formBuilder.group({
      nameAr: ['', [Validators.required, Validators.maxLength(200)]],
      nameEn: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionAr: ['', [Validators.required]],
      descriptionEn: ['', [Validators.required]],
      discount: [0, [Validators.required, Validators.min(0)]],
      isPercentage: [true],
      isAvailable: [true]
    });

    this.loadServices();
  }

  get form() {
    return this.serviceForm.controls;
  }

  loadServices() {
    this.isLoading = true;
    this.serviceService.getAll().pipe(first()).subscribe({
      next: (services) => {
        this.services = services;
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
    this.applyFilters(true);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.services];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(s =>
        (s.nameAr || '').toLowerCase().includes(term) ||
        (s.nameEn || '').toLowerCase().includes(term)
      );
    }

    this.filteredServices = data;
    if (resetPage) {
      this.paginationService.page = 1;
    }
    this.pagedServices = this.paginationService.changePage(this.filteredServices);
  }

  onPageChange(page: number) {
    this.paginationService.page = page;
    this.pagedServices = this.paginationService.changePage(this.filteredServices);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedService = undefined;
    this.serviceForm.reset({ isAvailable: true, isPercentage: true, discount: 0 });
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
    this.isModalOpen = true;
  }

  openEditModal(service: Service) {
    this.isEditMode = true;
    this.selectedService = service;
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = service.serviceImageUrl ? this.apiUrl + service.serviceImageUrl : undefined;
    this.serviceForm.patchValue({
      nameAr: service.nameAr,
      nameEn: service.nameEn,
      descriptionAr: service.descriptionAr,
      descriptionEn: service.descriptionEn,
      discount: service.discount,
      isPercentage: service.isPercentage,
      isAvailable: service.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedService = undefined;
    this.serviceForm.reset();
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
  }

  saveService() {
    this.submitted = true;
    if (this.serviceForm.invalid) return;
    if (!this.isEditMode && !this.selectedFile) {
      this.showError(this.translate.instant('SERVICES_PAGE.IMAGE_REQUIRED'));
      return;
    }

    this.isSubmitting = true;
    const payload: any = {
      nameAr: this.form['nameAr'].value,
      nameEn: this.form['nameEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      discount: this.form['discount'].value,
      isPercentage: this.form['isPercentage'].value,
      isAvailable: this.form['isAvailable'].value,
      imageFile: this.selectedFile
    };

    if (this.isEditMode && this.selectedService) {
      this.serviceService.update(this.selectedService.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('SERVICES_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadServices();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.serviceService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('SERVICES_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadServices();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteService(service: Service) {
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
        this.serviceService.delete(service.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('SERVICES_PAGE.DELETE_SUCCESS'));
            this.loadServices();
          },
          error: (error) => this.showError(error)
        });
      }
    });
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

  toggleServiceSelection(serviceId: number, checked: boolean) {
    if (checked) {
      this.selectedServiceIds.add(serviceId);
    } else {
      this.selectedServiceIds.delete(serviceId);
    }
  }

  toggleSelectAllServices(checked: boolean) {
    if (checked) {
      this.pagedServices.forEach(s => this.selectedServiceIds.add(s.id));
    } else {
      this.selectedServiceIds.clear();
    }
  }

  isAllServicesSelected(): boolean {
    return this.pagedServices.length > 0 && this.pagedServices.every(s => this.selectedServiceIds.has(s.id));
  }

  bulkDeleteServices() {
    if (this.selectedServiceIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('SERVICES_PAGE.BULK_DELETE_TEXT', { count: this.selectedServiceIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const serviceIds = Array.from(this.selectedServiceIds);
        this.serviceService.bulkDelete(serviceIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedServiceIds.clear();
            if (response.failedIds.length > 0) {
              this.showError(this.translate.instant('SERVICES_PAGE.BULK_DELETE_PARTIAL', {
                deleted: response.deletedCount,
                failed: response.failedIds.length
              }));
            } else {
              this.showSuccess(this.translate.instant('SERVICES_PAGE.BULK_DELETE_SUCCESS', {
                count: response.deletedCount
              }));
            }
            this.loadServices();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  openImagePreview(service: Service) {
    this.previewImageUrl = service.serviceImageUrl ? this.apiUrl + service.serviceImageUrl : undefined;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview() {
    this.isImagePreviewOpen = false;
    this.previewImageUrl = undefined;
  }

  getDiscountDisplay(service: Service): string {
    return service.isPercentage ? `${service.discount}%` : `$${service.discount}`;
  }
}
