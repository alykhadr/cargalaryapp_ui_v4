import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { CarExtraDetails } from '../interfaces/car-extra-details.interface';
import { Car } from '../interfaces/car.interface';
import { CarExtraDetailsService } from '../services/car-extra-details.service';
import { CarService } from '../services/car.service';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-car-extra-details',
  templateUrl: './car-extra-details.component.html',
  styleUrl: './car-extra-details.component.scss',
  standalone: false
})
export class CarExtraDetailsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  extraDetailsForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedExtraDetail?: CarExtraDetails;

  extraDetails: CarExtraDetails[] = [];
  filteredExtraDetails: CarExtraDetails[] = [];
  pagedExtraDetails: CarExtraDetails[] = [];
  searchTerm = '';
  searchTermAr = '';
  selectedExtraDetailIds = new Set<number>();
  cars: Car[] = [];
  carsMap: Map<number, Car> = new Map();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private extraDetailsService: CarExtraDetailsService,
    private carService: CarService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Extra Car Info', active: true }
    ];

    this.extraDetailsForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(200)]],
      nameAr: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionEn: ['', [Validators.maxLength(500)]],
      descriptionAr: ['', [Validators.maxLength(500)]],
      carId: [null, [Validators.required]],
      isAvailable: [true]
    });

    this.loadExtraDetails();
    this.loadCars();
  }

  get form() {
    return this.extraDetailsForm.controls;
  }

  loadExtraDetails() {
    this.isLoading = true;
    this.extraDetailsService.getExtraDetails().pipe(first()).subscribe({
      next: (extraDetails) => {
        this.extraDetails = extraDetails;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.showError(error);
        this.isLoading = false;
      }
    });
  }

  loadCars() {
    this.carService.getCars().pipe(first()).subscribe({
      next: (cars) => {
        this.cars = cars;
        this.carsMap = new Map(cars.map(car => [car.id, car]));
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  getCarById(carId: number): Car | undefined {
    return this.carsMap.get(carId);
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
    let data = [...this.extraDetails];
    const termEn = this.searchTerm.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn || termAr) {
      data = data.filter(detail =>
        (termEn && (detail.nameEn || '').toLowerCase().includes(termEn)) ||
        (termAr && (detail.nameAr || '').toLowerCase().includes(termAr))
      );
    }

    this.filteredExtraDetails = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedExtraDetails = this.service.changePage(this.filteredExtraDetails);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedExtraDetails = this.service.changePage(this.filteredExtraDetails);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedExtraDetail = undefined;
    this.extraDetailsForm.reset();
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(extraDetail: CarExtraDetails) {
    this.isEditMode = true;
    this.selectedExtraDetail = extraDetail;
    this.submitted = false;
    this.extraDetailsForm.patchValue({
      nameEn: extraDetail.nameEn,
      nameAr: extraDetail.nameAr,
      descriptionEn: extraDetail.descriptionEn,
      descriptionAr: extraDetail.descriptionAr,
      carId: extraDetail.carId,
      isAvailable: extraDetail.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedExtraDetail = undefined;
    this.extraDetailsForm.reset();
    this.submitted = false;
  }

  saveExtraDetail() {
    this.submitted = true;
    if (this.extraDetailsForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      carId: this.form['carId'].value,
      isAvailable: this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedExtraDetail) {
      this.extraDetailsService.updateExtraDetail(this.selectedExtraDetail.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Extra detail updated successfully');
          this.closeModal();
          this.loadExtraDetails();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.extraDetailsService.createExtraDetail(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Extra detail created successfully');
          this.closeModal();
          this.loadExtraDetails();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteExtraDetail(extraDetail: CarExtraDetails) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to remove this extra detail?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It!',
      cancelButtonText: 'Close',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.extraDetailsService.deleteExtraDetail(extraDetail.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Extra detail deleted successfully');
            this.loadExtraDetails();
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

  toggleExtraDetailSelection(extraDetailId: number, checked: boolean) {
    if (checked) {
      this.selectedExtraDetailIds.add(extraDetailId);
    } else {
      this.selectedExtraDetailIds.delete(extraDetailId);
    }
  }

  toggleSelectAllExtraDetails(checked: boolean) {
    if (checked) {
      this.pagedExtraDetails.forEach(extraDetail => this.selectedExtraDetailIds.add(extraDetail.id));
    } else {
      this.selectedExtraDetailIds.clear();
    }
  }

  isAllExtraDetailsSelected(): boolean {
    return this.pagedExtraDetails.length > 0 && this.pagedExtraDetails.every(extraDetail => this.selectedExtraDetailIds.has(extraDetail.id));
  }

  bulkDeleteExtraDetails() {
    if (this.selectedExtraDetailIds.size === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${this.selectedExtraDetailIds.size} selected extra detail(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = Array.from(this.selectedExtraDetailIds);
        this.extraDetailsService.bulkDeleteExtraDetails(ids).pipe(first()).subscribe({
          next: () => {
            this.selectedExtraDetailIds.clear();
            this.showSuccess(`Successfully deleted extra detail(s)`);
            this.loadExtraDetails();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }
}
