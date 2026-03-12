import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { CarType } from '../interfaces/car-type.interface';
import { CarTypeService } from '../services/car-type.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-car-types',
  templateUrl: './car-types.component.html',
  styleUrl: './car-types.component.scss',
  standalone: false
})
export class CarTypesComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  carTypeForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedCarType?: CarType;

  carTypes: CarType[] = [];
  filteredCarTypes: CarType[] = [];
  pagedCarTypes: CarType[] = [];
  searchTerm = '';
  searchTermAr = '';
  selectedCarTypeIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private carTypeService: CarTypeService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.CARTYPE'), active: true }
    ];

    this.carTypeForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      isAvailable: [true]
    });

    this.loadCarTypes();
  }

  get form() {
    return this.carTypeForm.controls;
  }

  loadCarTypes() {
    this.isLoading = true;
    this.carTypeService.getCarTypes().pipe(first()).subscribe({
      next: (carTypes) => {
        this.carTypes = carTypes;
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
    let data = [...this.carTypes];
    const termEn = this.searchTerm.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn || termAr) {
      data = data.filter(type =>
        (termEn && (type.nameEn || '').toLowerCase().includes(termEn)) ||
        (termAr && (type.nameAr || '').toLowerCase().includes(termAr))
      );
    }

    this.filteredCarTypes = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedCarTypes = this.service.changePage(this.filteredCarTypes);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedCarTypes = this.service.changePage(this.filteredCarTypes);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedCarType = undefined;
    this.carTypeForm.reset();
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(carType: CarType) {
    this.isEditMode = true;
    this.selectedCarType = carType;
    this.submitted = false;
    this.carTypeForm.patchValue({
      nameEn: carType.nameEn,
      nameAr: carType.nameAr,
      isAvailable: carType.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedCarType = undefined;
    this.carTypeForm.reset();
    this.submitted = false;
  }

  saveCarType() {
    this.submitted = true;
    if (this.carTypeForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      isAvailable: this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedCarType) {
      this.carTypeService.updateCarType(this.selectedCarType.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('CAR_TYPE_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadCarTypes();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.carTypeService.createCarType(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('CAR_TYPE_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadCarTypes();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteCarType(carType: CarType) {
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
        this.carTypeService.deleteCarType(carType.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('CAR_TYPE_PAGE.DELETE_SUCCESS'));
            this.loadCarTypes();
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

  toggleCarTypeSelection(carTypeId: number, checked: boolean) {
    if (checked) {
      this.selectedCarTypeIds.add(carTypeId);
    } else {
      this.selectedCarTypeIds.delete(carTypeId);
    }
  }

  toggleSelectAllCarTypes(checked: boolean) {
    if (checked) {
      this.pagedCarTypes.forEach(carType => this.selectedCarTypeIds.add(carType.id));
    } else {
      this.selectedCarTypeIds.clear();
    }
  }

  isAllCarTypesSelected(): boolean {
    return this.pagedCarTypes.length > 0 && this.pagedCarTypes.every(carType => this.selectedCarTypeIds.has(carType.id));
  }

  bulkDeleteCarTypes() {
    if (this.selectedCarTypeIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('CAR_TYPE_PAGE.BULK_DELETE_TEXT', { count: this.selectedCarTypeIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = Array.from(this.selectedCarTypeIds);
        let completed = 0;
        let hasError = false;
        
        ids.forEach(id => {
          this.carTypeService.deleteCarType(id).pipe(first()).subscribe({
            next: () => {
              completed++;
              if (completed === ids.length) {
                this.selectedCarTypeIds.clear();
                this.showSuccess(this.translate.instant('CAR_TYPE_PAGE.BULK_DELETE_SUCCESS', { count: completed }));
                this.loadCarTypes();
              }
            },
            error: (error) => {
              if (!hasError) {
                hasError = true;
                this.showError(error);
              }
              completed++;
            }
          });
        });
      }
    });
  }
}
