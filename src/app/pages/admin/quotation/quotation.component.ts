import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Car } from '../interfaces/car.interface';
import { LookupDetail } from '../interfaces/lookup.interface';
import { Quotation } from '../interfaces/quotation.interface';
import { CarService } from '../services/car.service';
import { LookupService } from '../services/lookup.service';
import { QuotationService } from '../services/quotation.service';
import { getErrorMessage } from '../shared/error-message.util';
import { QuotationRealtimeService } from '../services/quotation-realtime.service';

@Component({
  selector: 'app-quotation',
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.scss',
  standalone: false
})
export class QuotationComponent implements OnInit, OnDestroy {
  @Input() mode: 'create' | 'list' = 'list';
  @ViewChild('realtimeToastTpl') realtimeToastTpl!: TemplateRef<any>;

  breadCrumbItems!: Array<{}>;
  quotationForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  isSubmitting = false;
  searchTerm = '';
  filteredQuotations: Quotation[] = [];
  quotations: Quotation[] = [];
  pagedQuotations: Quotation[] = [];
  cars: Car[] = [];
  paymentMethodLookups: LookupDetail[] = [];
  vehicleOwnerTypeLookups: LookupDetail[] = [];
  regionLookups: LookupDetail[] = [];
  cityLookups: LookupDetail[] = [];
  latestRealtimeQuotation: Quotation | null = null;
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
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Quotation', active: true }
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
      cities: this.lookupService.getByMasterCode('CITY').pipe(first())
    }).subscribe({
      next: ({ cars, paymentMethods, ownerTypes, regions, cities }) => {
        this.cars = cars.filter(c => c.isAvailable);
        this.paymentMethodLookups = paymentMethods;
        this.vehicleOwnerTypeLookups = ownerTypes;
        this.regionLookups = regions;
        this.cityLookups = cities;
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
    this.applyFilters(true);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedQuotations = this.service.changePage(this.filteredQuotations);
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
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }

  private async connectRealtime() {
    try {
      await this.quotationRealtimeService.start((payload) => {
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
      });
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
