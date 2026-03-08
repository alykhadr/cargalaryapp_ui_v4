import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Car } from '../interfaces/car.interface';
import { LookupDetail } from '../interfaces/lookup.interface';
import { Quotation, QuotationHistory } from '../interfaces/quotation.interface';
import { CarService } from '../services/car.service';
import { LookupService } from '../services/lookup.service';
import { QuotationService } from '../services/quotation.service';
import { QuotationRealtimeService } from '../services/quotation-realtime.service';
import { ErrorMessageService } from '../shared/error-message.service';

@Component({
  selector: 'app-quotation',
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss',
  standalone: false
})
export class QuotationComponent implements OnInit, OnDestroy {
  @Input() mode: 'create' | 'list' | 'track' = 'list';
  @ViewChild('realtimeToastTpl') realtimeToastTpl!: TemplateRef<any>;
  @ViewChild('statusRealtimeToastTpl') statusRealtimeToastTpl!: TemplateRef<any>;

  breadCrumbItems!: Array<{}>;
  quotationForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  isSubmitting = false;
  searchTerm = '';
  selectedStatusFilter: number | null = null;
  createdFromDate = '';
  createdToDate = '';
  idSortDirection: 'asc' | 'desc' = 'desc';
  trackQuotationId: number | null = null;
  isTracking = false;
  trackedQuotation: Quotation | null = null;
  trackedTimeline: QuotationHistory[] = [];
  filteredQuotations: Quotation[] = [];
  quotations: Quotation[] = [];
  pagedQuotations: Quotation[] = [];
  cars: Car[] = [];
  paymentMethodLookups: LookupDetail[] = [];
  vehicleOwnerTypeLookups: LookupDetail[] = [];
  regionLookups: LookupDetail[] = [];
  cityLookups: LookupDetail[] = [];
  quotationStatusLookups: LookupDetail[] = [];
  latestRealtimeQuotation: Quotation | null = null;
  latestRealtimeStatusQuotation: Quotation | null = null;
  statusUpdatingByQuotationId = new Set<number>();
  showMoreInfoModal = false;
  selectedQuotationForMore: Quotation | null = null;
  private readonly notificationSoundUrl = 'assets/sounds/quotation-notification.mp3';
  private isSoundUnlocked = false;
  private soundHintShown = false;
  private readonly unlockSoundHandler = () => this.unlockSound();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private quotationService: QuotationService,
    private quotationRealtimeService: QuotationRealtimeService,
    private carService: CarService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private errorMessageService: ErrorMessageService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: this.mode === 'track' ? 'Track Quotation' : 'Quotation', active: true }
    ];

    this.quotationForm = this.formBuilder.group({
      userId: [''],
      vehicleOwnerType: [null, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      mobileNo: ['', [Validators.required, Validators.maxLength(20)]],
      carId: [null, Validators.required],
      paymentMethod: [null, Validators.required],
      regionId: [null, Validators.required],
      cityId: [null, Validators.required],
      notes: ['', [Validators.maxLength(1000)]]
    });

    this.loadFormDependencies();

    if (this.mode === 'list') {
      this.setupSoundUnlock();
      this.loadQuotations();
      this.connectRealtime();
    }
  }

  async ngOnDestroy(): Promise<void> {
    if (this.mode === 'list') {
      this.removeSoundUnlockListeners();
      await this.quotationRealtimeService.stop();
    }
  }

  get form() {
    return this.quotationForm.controls;
  }

  loadFormDependencies() {
    forkJoin({
      cars: this.carService.getCars().pipe(first()),
      paymentMethods: this.lookupService.getByMasterCode('PAYMENT_METHOD').pipe(first()),
      ownerTypes: this.lookupService.getByMasterCode('VEHICLE_OWNER_TYPE').pipe(first()),
      regions: this.lookupService.getByMasterCode('REGION').pipe(first()),
      cities: this.lookupService.getByMasterCode('CITY').pipe(first()),
      statuses: this.lookupService.getByMasterCode('QUOTATION_STATUS').pipe(first())
    }).subscribe({
      next: ({ cars, paymentMethods, ownerTypes, regions, cities, statuses }) => {
        this.cars = cars.filter(c => c.isAvailable);
        this.paymentMethodLookups = paymentMethods;
        this.vehicleOwnerTypeLookups = ownerTypes;
        this.regionLookups = regions;
        this.cityLookups = cities;
        this.quotationStatusLookups = statuses;
      },
      error: (error) => this.showError(error)
    });
  }

  loadQuotations() {
    this.isLoading = true;
    this.quotationService.getAll().pipe(first()).subscribe({
      next: (quotations) => {
        this.quotations = quotations;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedStatusFilter = null;
    this.createdFromDate = '';
    this.createdToDate = '';
    this.applyFilters(true);
  }

  onStatusFilterChange(value: any) {
    this.selectedStatusFilter = value !== null && value !== '' ? Number(value) : null;
    this.applyFilters(true);
  }

  onDateFilterChange() {
    this.applyFilters(true);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedQuotations = this.service.changePage(this.filteredQuotations);
  }

  toggleIdSort() {
    this.idSortDirection = this.idSortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(true);
  }

  createQuotation() {
    this.submitted = true;
    if (this.quotationForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      userId: this.form['userId'].value || undefined,
      vehicleOwnerType: Number(this.form['vehicleOwnerType'].value),
      name: this.form['name'].value,
      email: this.form['email'].value,
      mobileNo: this.form['mobileNo'].value,
      carId: Number(this.form['carId'].value),
      paymentMethod: Number(this.form['paymentMethod'].value),
      regionId: Number(this.form['regionId'].value),
      cityId: Number(this.form['cityId'].value),
      notes: this.form['notes'].value || undefined
    };

    this.quotationService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess('Quotation created successfully');
        this.quotationForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showError(error);
      }
    });
  }

  getCarName(carId: number): string {
    const car = this.cars.find(c => c.id === carId);
    return car?.nameEn || car?.nameAr || `#${carId}`;
  }

  getLookupLabel(items: LookupDetail[], id: number): string {
    const found = items.find(x => x.id === id || x.detailCode === String(id));
    if (!found) return String(id);
    return found.nameAr && found.nameEn ? `${found.nameAr} - ${found.nameEn}` : (found.displayName || found.nameEn || found.nameAr || String(id));
  }

  getQuotationStatusLabel(statusId?: number): string {
    if (!statusId) return '-';
    return this.getLookupLabel(this.quotationStatusLookups, statusId);
  }

  getQuotationStatusBadgeClass(statusId?: number): string {
    const statusCode = this.getQuotationStatusCode(statusId);
    switch (statusCode) {
      case '1':
        return 'badge bg-primary-subtle text-primary';
      case '2':
        return 'badge bg-warning-subtle text-warning';
      case '3':
        return 'badge bg-info-subtle text-info';
      case '4':
        return 'badge bg-success-subtle text-success';
      case '5':
        return 'badge bg-danger-subtle text-danger';
      default:
        return 'badge bg-secondary-subtle text-secondary';
    }
  }

  getQuotationStatusIcon(statusId?: number): string {
    const statusCode = this.getQuotationStatusCode(statusId);
    switch (statusCode) {
      case '1':
        return 'ri-add-circle-line';
      case '2':
        return 'ri-time-line';
      case '3':
        return 'ri-phone-line';
      case '4':
        return 'ri-checkbox-circle-line';
      case '5':
        return 'ri-close-circle-line';
      default:
        return 'ri-information-line';
    }
  }

  getTimelineStatusTime(statusDate?: string): string {
    if (!statusDate) return '-';
    const parsed = new Date(statusDate);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
  }

  isStatusUpdating(quotationId: number): boolean {
    return this.statusUpdatingByQuotationId.has(quotationId);
  }

  updateQuotationStatus(item: Quotation, statusId: number) {
    if (!statusId || this.isStatusUpdating(item.id)) return;

    this.statusUpdatingByQuotationId.add(item.id);
    this.quotationService.updateStatus(item.id, { currentStatus: statusId }).pipe(first()).subscribe({
      next: (updated) => {
        const idx = this.quotations.findIndex(q => q.id === item.id);
        if (idx >= 0) {
          this.quotations[idx] = { ...this.quotations[idx], ...updated };
        }
        this.applyFilters(false);
        this.showStatusUpdateSuccess();
        this.statusUpdatingByQuotationId.delete(item.id);
      },
      error: (error) => {
        this.statusUpdatingByQuotationId.delete(item.id);
        this.showStatusUpdateError(error);
      }
    });
  }

  trackByQuotationId() {
    if (!this.trackQuotationId || this.trackQuotationId <= 0) {
      this.showError('Please enter a valid quotation id');
      return;
    }

    this.isTracking = true;
    this.trackedQuotation = null;
    this.trackedTimeline = [];

    forkJoin({
      quotation: this.quotationService.getById(this.trackQuotationId).pipe(first()),
      timeline: this.quotationService.getHistory(this.trackQuotationId).pipe(first())
    }).subscribe({
      next: ({ quotation, timeline }) => {
        this.trackedQuotation = quotation;
        this.trackedTimeline = timeline || [];
        this.isTracking = false;
      },
      error: (error) => {
        this.isTracking = false;
        this.showError(error);
      }
    });
  }

  openMoreInfoModal(item: Quotation) {
    this.selectedQuotationForMore = item;
    this.showMoreInfoModal = true;
  }

  closeMoreInfoModal() {
    this.showMoreInfoModal = false;
    this.selectedQuotationForMore = null;
  }

  private getQuotationStatusCode(statusId?: number): string {
    if (!statusId) return '';
    const statusLookup = this.quotationStatusLookups.find(x => x.id === statusId || x.detailCode === String(statusId));
    if (!statusLookup) return String(statusId);
    return statusLookup.detailCode || String(statusLookup.id);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.quotations];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(q =>
        (q.name || '').toLowerCase().includes(term) ||
        (q.email || '').toLowerCase().includes(term) ||
        (q.mobileNo || '').toLowerCase().includes(term) ||
        String(q.id).includes(term)
      );
    }

    if (this.selectedStatusFilter) {
      data = data.filter(q => q.currentStatus === this.selectedStatusFilter);
    }

    if (this.createdFromDate) {
      const from = new Date(this.createdFromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter(q => {
        const created = new Date(q.createdAt);
        return !isNaN(created.getTime()) && created >= from;
      });
    }

    if (this.createdToDate) {
      const to = new Date(this.createdToDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(q => {
        const created = new Date(q.createdAt);
        return !isNaN(created.getTime()) && created <= to;
      });
    }

    data.sort((a, b) => this.idSortDirection === 'asc' ? a.id - b.id : b.id - a.id);

    this.filteredQuotations = data;
    if (resetPage) this.service.page = 1;
    this.pagedQuotations = this.service.changePage(this.filteredQuotations);
  }

  private showSuccess(message: string) {
    this.toastService.show(message, {
      classname: 'bg-success text-white',
      delay: 3000
    });
  }

  private showError(error: any) {
    const message = this.errorMessageService.getMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }

  private showStatusUpdateSuccess() {
    void Swal.fire({
      icon: 'success',
      title: 'Status Updated',
      text: 'Quotation status updated successfully',
      confirmButtonText: 'OK'
    });
  }

  private showStatusUpdateError(error: any) {
    const raw = this.errorMessageService.getMessage(error);
    const match = raw.match(/^(\d+)\s*-\s*(.+)$/);
    const message = match ? match[2] : raw;
    const codeLine = match ? `<div style="margin-top:8px;font-size:12px;color:#6c757d;">Code: ${match[1]}</div>` : '';
    void Swal.fire({
      icon: 'error',
      title: 'Status Update Failed',
      html: `<div>${message}</div>${codeLine}`,
      confirmButtonText: 'OK'
    });
  }

  private async connectRealtime() {
    try {
      await this.quotationRealtimeService.start(
        (payload) => {
          const quotation = payload as Quotation;
          if (!quotation?.id) return;
          if (this.quotations.some(q => q.id === quotation.id)) return;

          this.quotations = [quotation, ...this.quotations];
          this.applyFilters(true);
          this.latestRealtimeQuotation = quotation;
          this.toastService.show(this.realtimeToastTpl, {
            classname: 'border-0 shadow-sm quotation-realtime-toast',
            delay: 4000
          });
          this.playNotificationSound();
        },
        (payload) => {
          const updated = payload as Quotation;
          if (!updated?.id) return;

          const idx = this.quotations.findIndex(x => x.id === updated.id);
          if (idx < 0) return;

          this.quotations[idx] = { ...this.quotations[idx], ...updated };
          this.applyFilters(false);
          this.latestRealtimeStatusQuotation = updated;
          this.toastService.show(this.statusRealtimeToastTpl, {
            classname: 'border-0 shadow-sm quotation-realtime-toast',
            delay: 4000
          });
          this.playNotificationSound();
        }
      );
    } catch {
      this.toastService.show('Realtime notifications unavailable right now.', {
        classname: 'bg-warning text-dark',
        delay: 3000
      });
    }
  }

  private playNotificationSound() {
    if (!this.isSoundUnlocked) {
      if (!this.soundHintShown) {
        this.soundHintShown = true;
        this.toastService.show('Click anywhere once to enable notification sound.', {
          classname: 'bg-warning text-dark',
          delay: 3500
        });
      }
      return;
    }

    try {
      const audio = new Audio(this.notificationSoundUrl);
      audio.volume = 0.65;
      void audio.play().catch(() => this.playFallbackBeep());
    } catch {
      this.playFallbackBeep();
    }
  }

  private playFallbackBeep() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(830, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.22);
    } catch {
      // Keep UI flow even if browser blocks autoplay audio.
    }
  }

  private setupSoundUnlock() {
    window.addEventListener('pointerdown', this.unlockSoundHandler, { passive: true });
    window.addEventListener('keydown', this.unlockSoundHandler, { passive: true });
    window.addEventListener('touchstart', this.unlockSoundHandler, { passive: true });
  }

  private removeSoundUnlockListeners() {
    window.removeEventListener('pointerdown', this.unlockSoundHandler);
    window.removeEventListener('keydown', this.unlockSoundHandler);
    window.removeEventListener('touchstart', this.unlockSoundHandler);
  }

  private unlockSound() {
    this.isSoundUnlocked = true;
    this.removeSoundUnlockListeners();
  }
}
