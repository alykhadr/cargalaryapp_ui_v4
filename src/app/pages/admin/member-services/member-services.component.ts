import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { MemberService } from '../interfaces/member-service.interface';
import { MemberServiceService } from '../services/member-service.service';
import { getErrorMessage } from '../shared/error-message.util';
import { GlobalComponent } from 'src/app/global-component';

@Component({
  selector: 'app-member-services',
  templateUrl: './member-services.component.html',
  styleUrl: './member-services.component.scss',
  standalone: false
})
export class MemberServicesComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  serviceForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedService?: MemberService;
  selectedFile?: File;
  imagePreview?: string;
  apiUrl = GlobalComponent.API_URL;
  isImagePreviewOpen = false;
  previewImageUrl?: string;

  services: MemberService[] = [];
  filteredServices: MemberService[] = [];
  pagedServices: MemberService[] = [];
  searchTerm = '';
  selectedServiceIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private memberServiceService: MemberServiceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Member Services', active: true }
    ];

    this.serviceForm = this.formBuilder.group({
      nameAr: ['', [Validators.required, Validators.maxLength(200)]],
      nameEn: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionAr: ['', [Validators.maxLength(500)]],
      descriptionEn: ['', [Validators.maxLength(500)]],
      isAvailable: [true]
    });

    this.loadServices();
  }

  get form() {
    return this.serviceForm.controls;
  }

  loadServices() {
    this.isLoading = true;
    this.memberServiceService.getAll().pipe(first()).subscribe({
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
      this.service.page = 1;
    }
    this.pagedServices = this.service.changePage(this.filteredServices);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedServices = this.service.changePage(this.filteredServices);
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
    this.serviceForm.reset({ isAvailable: true });
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
    this.isModalOpen = true;
  }

  openEditModal(memberService: MemberService) {
    this.isEditMode = true;
    this.selectedService = memberService;
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = memberService.imageUrl ? this.apiUrl + memberService.imageUrl : undefined;
    this.serviceForm.patchValue({
      nameAr: memberService.nameAr,
      nameEn: memberService.nameEn,
      descriptionAr: memberService.descriptionAr,
      descriptionEn: memberService.descriptionEn,
      isAvailable: memberService.isAvailable
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
      this.showError({ message: 'Image is required' });
      return;
    }

    this.isSubmitting = true;
    const payload: any = {
      nameAr: this.form['nameAr'].value,
      nameEn: this.form['nameEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      isAvailable: this.form['isAvailable'].value,
      imageFile: this.selectedFile
    };

    if (this.isEditMode && this.selectedService) {
      this.memberServiceService.update(this.selectedService.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Member Service updated successfully');
          this.closeModal();
          this.loadServices();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.memberServiceService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Member Service created successfully');
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

  deleteService(memberService: MemberService) {
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
        this.memberServiceService.delete(memberService.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Member Service deleted successfully');
            this.loadServices();
          },
          error: (error) => this.showError(error)
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
      title: 'Are you sure?',
      text: `Delete ${this.selectedServiceIds.size} selected service(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const serviceIds = Array.from(this.selectedServiceIds);
        this.memberServiceService.bulkDelete(serviceIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedServiceIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: `Deleted ${response.deletedCount} services. Failed to delete ${response.failedIds.length} services.` });
            } else {
              this.showSuccess(`Successfully deleted ${response.deletedCount} service(s)`);
            }
            this.loadServices();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  openImagePreview(memberService: MemberService) {
    this.previewImageUrl = memberService.imageUrl ? this.apiUrl + memberService.imageUrl : undefined;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview() {
    this.isImagePreviewOpen = false;
    this.previewImageUrl = undefined;
  }
}
