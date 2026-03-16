import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { getErrorMessage } from '../shared/error-message.util';
import { GlobalComponent } from 'src/app/global-component';
import { TranslateService } from '@ngx-translate/core';
import { PackageItem } from '../interfaces/package.interface';
import { PackageService } from '../services/package.service';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss',
  standalone: false
})
export class PackagesComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  packageForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedPackage?: PackageItem;
  selectedFile?: File;
  imagePreview?: string;
  apiUrl = GlobalComponent.API_URL;
  isImagePreviewOpen = false;
  previewImageUrl?: string;

  packages: PackageItem[] = [];
  filteredPackages: PackageItem[] = [];
  pagedPackages: PackageItem[] = [];
  searchTerm = '';
  status: '' | 'active' | 'blocked' = '';
  selectedPackageIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private packageService: PackageService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.OFFERS_MENU.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.PACKAGES'), active: true }
    ];

    this.packageForm = this.formBuilder.group({
      nameAr: ['', [Validators.required, Validators.maxLength(200)]],
      nameEn: ['', [Validators.required, Validators.maxLength(200)]],
      isAvailable: [true]
    });

    this.loadPackages();
  }

  get form() {
    return this.packageForm.controls;
  }

  loadPackages() {
    this.isLoading = true;
    this.packageService.getAll().pipe(first()).subscribe({
      next: (packages) => {
        this.packages = packages;
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
    this.status = '';
    this.applyFilters(true);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.packages];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(p =>
        (p.nameAr || '').toLowerCase().includes(term) ||
        (p.nameEn || '').toLowerCase().includes(term)
      );
    }

    if (this.status) {
      const statusBool = this.status === 'active';
      data = data.filter(p => p.isAvailable === statusBool);
    }

    this.filteredPackages = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedPackages = this.service.changePage(this.filteredPackages);
  }

  onStatusChange() {
    this.applyFilters(true);
  }

  get totalPackages(): number {
    return this.packages.length;
  }

  get activePackages(): number {
    return this.packages.filter(p => p.isAvailable).length;
  }

  get inactivePackages(): number {
    return this.packages.filter(p => !p.isAvailable).length;
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedPackages = this.service.changePage(this.filteredPackages);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedPackage = undefined;
    this.packageForm.reset({ isAvailable: true });
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
    this.isModalOpen = true;
  }

  openEditModal(pkg: PackageItem) {
    this.isEditMode = true;
    this.selectedPackage = pkg;
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = pkg.imageUrl ? this.apiUrl + pkg.imageUrl : undefined;
    this.packageForm.patchValue({
      nameAr: pkg.nameAr,
      nameEn: pkg.nameEn,
      isAvailable: pkg.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedPackage = undefined;
    this.packageForm.reset();
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
  }

  savePackage() {
    this.submitted = true;
    if (this.packageForm.invalid) return;
    if (!this.isEditMode && !this.selectedFile) {
      this.showError(this.translate.instant('PACKAGES_PAGE.IMAGE_REQUIRED'));
      return;
    }

    this.isSubmitting = true;
    const payload: any = {
      nameAr: this.form['nameAr'].value,
      nameEn: this.form['nameEn'].value,
      isAvailable: this.form['isAvailable'].value,
      imageFile: this.selectedFile
    };

    if (this.isEditMode && this.selectedPackage) {
      this.packageService.update(this.selectedPackage.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('PACKAGES_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadPackages();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.packageService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('PACKAGES_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadPackages();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deletePackage(pkg: PackageItem) {
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
        this.packageService.delete(pkg.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('PACKAGES_PAGE.DELETE_SUCCESS'));
            this.loadPackages();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  togglePackageSelection(packageId: number, checked: boolean) {
    if (checked) {
      this.selectedPackageIds.add(packageId);
    } else {
      this.selectedPackageIds.delete(packageId);
    }
  }

  toggleSelectAllPackages(checked: boolean) {
    if (checked) {
      this.pagedPackages.forEach(p => this.selectedPackageIds.add(p.id));
    } else {
      this.selectedPackageIds.clear();
    }
  }

  isAllPackagesSelected(): boolean {
    return this.pagedPackages.length > 0 && this.pagedPackages.every(p => this.selectedPackageIds.has(p.id));
  }

  bulkDeletePackages() {
    if (this.selectedPackageIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('PACKAGES_PAGE.BULK_DELETE_TEXT', { count: this.selectedPackageIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const packageIds = Array.from(this.selectedPackageIds);
        this.packageService.bulkDelete(packageIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedPackageIds.clear();
            if (response.failedIds.length > 0) {
              this.showError(this.translate.instant('PACKAGES_PAGE.BULK_DELETE_PARTIAL', {
                deleted: response.deletedCount,
                failed: response.failedIds.length
              }));
            } else {
              this.showSuccess(this.translate.instant('PACKAGES_PAGE.BULK_DELETE_SUCCESS', {
                count: response.deletedCount
              }));
            }
            this.loadPackages();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  openImagePreview(pkg: PackageItem) {
    this.previewImageUrl = pkg.imageUrl ? this.apiUrl + pkg.imageUrl : undefined;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview() {
    this.isImagePreviewOpen = false;
    this.previewImageUrl = undefined;
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
}
