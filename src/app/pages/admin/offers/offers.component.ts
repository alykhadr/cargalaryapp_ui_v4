import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Offer } from '../interfaces/offer.interface';
import { OfferService } from '../services/offer.service';
import { getErrorMessage } from '../shared/error-message.util';
import { GlobalComponent } from 'src/app/global-component';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss',
  standalone: false
})
export class OffersComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  offerForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedOffer?: Offer;
  selectedFile?: File;
  imagePreview?: string;
  apiUrl = GlobalComponent.API_URL;
  isImagePreviewOpen = false;
  previewImageUrl?: string;

  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  pagedOffers: Offer[] = [];
  searchTerm = '';
  selectedOfferIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private offerService: OfferService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Offers', active: true }
    ];

    this.offerForm = this.formBuilder.group({
      offerNameAr: ['', [Validators.required, Validators.maxLength(200)]],
      offerNameEn: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionAr: ['', [Validators.maxLength(500)]],
      descriptionEn: ['', [Validators.maxLength(500)]],
      expiredAt: ['', [Validators.required]],
      isAvailable: [true]
    });

    this.loadOffers();
  }

  get form() {
    return this.offerForm.controls;
  }

  loadOffers() {
    this.isLoading = true;
    this.offerService.getAll().pipe(first()).subscribe({
      next: (offers) => {
        this.offers = offers;
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
    let data = [...this.offers];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(o =>
        (o.offerNameAr || '').toLowerCase().includes(term) ||
        (o.offerNameEn || '').toLowerCase().includes(term)
      );
    }

    this.filteredOffers = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedOffers = this.service.changePage(this.filteredOffers);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedOffers = this.service.changePage(this.filteredOffers);
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
    this.selectedOffer = undefined;
    this.offerForm.reset({ isAvailable: true });
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
    this.isModalOpen = true;
  }

  openEditModal(offer: Offer) {
    this.isEditMode = true;
    this.selectedOffer = offer;
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = offer.offerImageUrl ? this.apiUrl + offer.offerImageUrl : undefined;
    this.offerForm.patchValue({
      offerNameAr: offer.offerNameAr,
      offerNameEn: offer.offerNameEn,
      descriptionAr: offer.descriptionAr,
      descriptionEn: offer.descriptionEn,
      expiredAt: offer.expiredAt ? new Date(offer.expiredAt) : null,
      isAvailable: offer.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedOffer = undefined;
    this.offerForm.reset();
    this.submitted = false;
    this.selectedFile = undefined;
    this.imagePreview = undefined;
  }

  saveOffer() {
    this.submitted = true;
    if (this.offerForm.invalid) return;
    if (!this.isEditMode && !this.selectedFile) {
      this.showError({ message: 'Image is required' });
      return;
    }

    this.isSubmitting = true;
    const expiredAtValue = this.form['expiredAt'].value;
    const payload: any = {
      offerNameAr: this.form['offerNameAr'].value,
      offerNameEn: this.form['offerNameEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      expiredAt: expiredAtValue instanceof Date ? expiredAtValue : new Date(expiredAtValue),
      isAvailable: this.form['isAvailable'].value,
      imageFile: this.selectedFile
    };

    if (this.isEditMode && this.selectedOffer) {
      this.offerService.update(this.selectedOffer.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Offer updated successfully');
          this.closeModal();
          this.loadOffers();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.offerService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Offer created successfully');
          this.closeModal();
          this.loadOffers();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteOffer(offer: Offer) {
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
        this.offerService.delete(offer.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Offer deleted successfully');
            this.loadOffers();
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

  toggleOfferSelection(offerId: number, checked: boolean) {
    if (checked) {
      this.selectedOfferIds.add(offerId);
    } else {
      this.selectedOfferIds.delete(offerId);
    }
  }

  toggleSelectAllOffers(checked: boolean) {
    if (checked) {
      this.pagedOffers.forEach(o => this.selectedOfferIds.add(o.id));
    } else {
      this.selectedOfferIds.clear();
    }
  }

  isAllOffersSelected(): boolean {
    return this.pagedOffers.length > 0 && this.pagedOffers.every(o => this.selectedOfferIds.has(o.id));
  }

  bulkDeleteOffers() {
    if (this.selectedOfferIds.size === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${this.selectedOfferIds.size} selected offer(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const offerIds = Array.from(this.selectedOfferIds);
        this.offerService.bulkDelete(offerIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedOfferIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: `Deleted ${response.deletedCount} offers. Failed to delete ${response.failedIds.length} offers.` });
            } else {
              this.showSuccess(`Successfully deleted ${response.deletedCount} offer(s)`);
            }
            this.loadOffers();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  openImagePreview(offer: Offer) {
    this.previewImageUrl = offer.offerImageUrl ? this.apiUrl + offer.offerImageUrl : undefined;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview() {
    this.isImagePreviewOpen = false;
    this.previewImageUrl = undefined;
  }

  isExpired(expiredAt: Date): boolean {
    return new Date(expiredAt) < new Date();
  }
}
