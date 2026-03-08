import { Component, OnInit } from '@angular/core';
import { GalleryImageService } from '../services/gallery-image.service';
import { CarService } from '../services/car.service';
import { GalleryImage, CreateGalleryImageRequest, UpdateGalleryImageRequest, Car } from '../interfaces/gallery-image.interface';
import Swal from 'sweetalert2';
import { LookupService } from '../services/lookup.service';
import { LookupDetail } from '../interfaces/lookup.interface';
import { CarModelService } from '../services/car-model.service';
import { CarModel } from '../interfaces/car-model.interface';
import { BrandService } from '../services/brand.service';
import { Brand } from '../interfaces/brand.interface';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-gallery-images',
  templateUrl: './gallery-images.component.html',
  styleUrls: ['./gallery-images.component.scss'],
  standalone:false
})
export class GalleryImagesComponent implements OnInit {
  galleryImages: GalleryImage[] = [];
  filteredGalleryImages: GalleryImage[] = [];
  cars: Car[] = [];
  carModels: CarModel[] = [];
  brands: Brand[] = [];
  searchCarId: string = '';
  searchCarName: string = '';
  isEditMode: boolean = false;
  selectedGalleryImageId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  Math = Math;

  imageTypes: Array<{ value: number; label: string }> = [];
  imageTypeLookups: LookupDetail[] = [];

  galleryImageForm = {
    carId: null as number | null,
    imageType: null as number | null,
    isPrimary: false
  };

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private galleryImageService: GalleryImageService,
    private carService: CarService,
    private lookupService: LookupService,
    private carModelService: CarModelService,
    private brandService: BrandService
  ) {}

  ngOnInit(): void {
    this.loadImageTypes();
    this.loadModels();
    this.loadBrands();
    this.loadGalleryImages();
    this.loadCars();
  }

  loadImageTypes(): void {
    this.lookupService.getByMasterCode('IMAGE_TYPE').subscribe({
      next: (data) => {
        this.imageTypeLookups = data;
        this.imageTypes = data
          .map(item => {
            const parsed = Number(item.detailCode);
            return Number.isFinite(parsed)
              ? { value: parsed, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((x): x is { value: number; label: string } => x !== null)
          .sort((a, b) => a.value - b.value);
      },
      error: (error) => console.error('Error loading image type lookup:', error)
    });
  }

  loadCars(): void {
    this.carService.getCars().subscribe({
      next: (data) => {
        this.cars = data;
      },
      error: (error) => console.error('Error loading cars:', error)
    });
  }

  loadModels(): void {
    this.carModelService.getModels().subscribe({
      next: (data) => {
        this.carModels = data;
      },
      error: (error) => console.error('Error loading models:', error)
    });
  }

  loadBrands(): void {
    this.brandService.getBrands().subscribe({
      next: (data) => {
        this.brands = data;
      },
      error: (error) => console.error('Error loading brands:', error)
    });
  }

  loadGalleryImages(): void {
    this.galleryImageService.getGalleryImages().subscribe({
      next: (data) => {
        this.galleryImages = data;
        this.applyFilters();
      },
      error: (error) => console.error('Error loading gallery images:', error)
    });
  }

  applyFilters(): void {
    this.filteredGalleryImages = this.galleryImages.filter(image => {
      const matchesCarId = !this.searchCarId || image.carId.toString().includes(this.searchCarId);
      const car = this.cars.find(c => c.id === image.carId);
      const carName = car ? `${car.modelNameEn || ''} ${car.modelNameAr || ''}`.toLowerCase() : '';
      const matchesCarName = !this.searchCarName || carName.includes(this.searchCarName.toLowerCase());
      return matchesCarId && matchesCarName;
    });
    this.currentPage = 1;
  }

  onFileSelected(event: any): void {
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

  onSubmit(): void {
    if (this.isEditMode) {
      this.updateGalleryImage();
    } else {
      this.createGalleryImage();
    }
  }

  createGalleryImage(): void {
    if (!this.galleryImageForm.carId || !this.selectedFile || !this.galleryImageForm.imageType) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const request: CreateGalleryImageRequest = {
      carId: this.galleryImageForm.carId,
      imageFile: this.selectedFile,
      imageType: this.galleryImageForm.imageType,
      isPrimary: this.galleryImageForm.isPrimary
    };

    this.galleryImageService.createGalleryImage(request).subscribe({
      next: () => {
        Swal.fire('Success', 'Gallery image created successfully', 'success');
        this.resetForm();
        this.loadGalleryImages();
      },
      error: (error) => {
        const errorMsg = getErrorMessage(error, 'Error creating gallery image');
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  updateGalleryImage(): void {
    if (!this.selectedGalleryImageId || !this.galleryImageForm.carId || !this.galleryImageForm.imageType) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const request: UpdateGalleryImageRequest = {
      carId: this.galleryImageForm.carId,
      imageFile: this.selectedFile || undefined,
      imageType: this.galleryImageForm.imageType,
      isPrimary: this.galleryImageForm.isPrimary
    };

    this.galleryImageService.updateGalleryImage(this.selectedGalleryImageId, request).subscribe({
      next: () => {
        Swal.fire('Success', 'Gallery image updated successfully', 'success');
        this.resetForm();
        this.loadGalleryImages();
      },
      error: (error) => {
        const errorMsg = getErrorMessage(error, 'Error updating gallery image');
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  editGalleryImage(image: GalleryImage): void {
    this.isEditMode = true;
    this.selectedGalleryImageId = image.id;
    this.galleryImageForm = {
      carId: image.carId,
      imageType: image.imageType || null,
      isPrimary: image.isPrimary
    };
    this.imagePreview = image.imageUrl;
    this.selectedFile = null;
  }

  deleteGalleryImage(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.galleryImageService.deleteGalleryImage(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Gallery image has been deleted.', 'success');
            this.loadGalleryImages();
          },
          error: (error) => console.error('Error deleting gallery image:', error)
        });
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedGalleryImageId = null;
    this.galleryImageForm = {
      carId: null,
      imageType: null,
      isPrimary: false
    };
    this.selectedFile = null;
    this.imagePreview = null;
  }

  getCarDisplay(carId: number): string {
    const car = this.cars.find(c => c.id === carId);
    if (!car) return `Car #${carId}`;
    const nameEn = car.nameEn || '-';
    const nameAr = car.nameAr || '-';
    const brand = this.getBrandNameByModelId(car.modelId);
    const model = this.getModelName(car.modelId);
    return `#${car.id} - ${nameEn} / ${nameAr} - ${brand} - ${model} - ${car.year}`;
  }

  getModelName(modelId: number): string {
    const model = this.carModels.find(m => m.id === modelId);
    if (!model) return '-';
    return `${model.nameEn || '-'} / ${model.nameAr || '-'}`;
  }

  getBrandNameByModelId(modelId: number): string {
    const model = this.carModels.find(m => m.id === modelId);
    if (!model) return '-';
    const brand = this.brands.find(b => b.id === model.brandId);
    if (!brand) return '-';
    return `${brand.nameEn || '-'} / ${brand.nameAr || '-'}`;
  }

  getImageTypeLabel(type?: number): string {
    const imageType = this.imageTypes.find(t => t.value === type);
    return imageType ? imageType.label : '-';
  }

  get paginatedGalleryImages(): GalleryImage[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredGalleryImages.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredGalleryImages.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
