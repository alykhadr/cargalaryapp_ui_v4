import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Branch } from '../interfaces/branch.interface';
import { Brand } from '../interfaces/brand.interface';
import { CarExtraDetails } from '../interfaces/car-extra-details.interface';
import { CarModel } from '../interfaces/car-model.interface';
import { Car } from '../interfaces/car.interface';
import { BranchService } from '../services/branch.service';
import { BrandService } from '../services/brand.service';
import { CarExtraDetailsService } from '../services/car-extra-details.service';
import { CarModelService } from '../services/car-model.service';
import { CarService } from '../services/car.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

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
  branches: Branch[] = [];
  brands: Brand[] = [];
  carModels: CarModel[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private extraDetailsService: CarExtraDetailsService,
    private carService: CarService,
    private branchService: BranchService,
    private brandService: BrandService,
    private carModelService: CarModelService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.CAREXTRADETAILS'), active: true }
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
    this.loadBranches();
    this.loadBrands();
    this.loadModels();
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

  loadBranches() {
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadBrands() {
    this.brandService.getBrands().pipe(first()).subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  loadModels() {
    this.carModelService.getModels().pipe(first()).subscribe({
      next: (models) => {
        this.carModels = models;
      },
      error: (error) => {
        this.showError(error);
      }
    });
  }

  getCarById(carId: number): Car | undefined {
    return this.carsMap.get(carId);
  }

  getBranchName(branchId?: number): string {
    if (!branchId) return '-';
    const branch = this.branches.find(item => item.id === branchId);
    if (!branch) return '-';
    return `${branch.branchNameAr} / ${branch.branchNameEn}`;
  }

  getModelName(modelId: number): string {
    const model = this.carModels.find(item => item.id === modelId);
    if (!model) return '-';
    return `${model.nameAr} / ${model.nameEn}`;
  }

  getBrandNameByModelId(modelId: number): string {
    const model = this.carModels.find(item => item.id === modelId);
    if (!model) return '-';
    const brand = this.brands.find(item => item.id === model.brandId);
    if (!brand) return '-';
    return `${brand.nameAr} / ${brand.nameEn}`;
  }

  getCarDropdownLabel(car: Car): string {
    return `${car.nameAr || '-'} - ${car.nameEn || '-'} - ${this.getBranchName(car.branchId)} - ${this.getBrandNameByModelId(car.modelId)} - ${this.getModelName(car.modelId)} - ${car.year}`;
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
          this.showSuccess(this.translate.instant('CAR_EXTRA_DETAILS_PAGE.UPDATE_SUCCESS'));
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
          this.showSuccess(this.translate.instant('CAR_EXTRA_DETAILS_PAGE.CREATE_SUCCESS'));
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
        this.extraDetailsService.deleteExtraDetail(extraDetail.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('CAR_EXTRA_DETAILS_PAGE.DELETE_SUCCESS'));
            this.loadExtraDetails();
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
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('CAR_EXTRA_DETAILS_PAGE.BULK_DELETE_TEXT', { count: this.selectedExtraDetailIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const ids = Array.from(this.selectedExtraDetailIds);
        this.extraDetailsService.bulkDeleteExtraDetails(ids).pipe(first()).subscribe({
          next: () => {
            this.selectedExtraDetailIds.clear();
            this.showSuccess(this.translate.instant('CAR_EXTRA_DETAILS_PAGE.BULK_DELETE_SUCCESS'));
            this.loadExtraDetails();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }
}
