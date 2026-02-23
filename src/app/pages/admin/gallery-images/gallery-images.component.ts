import { Component, OnInit } from '@angular/core';
import { GalleryImageService } from '../services/gallery-image.service';
import { CarService } from '../services/car.service';
import { GalleryImage, CreateGalleryImageRequest, UpdateGalleryImageRequest, Car } from '../interfaces/gallery-image.interface';
import Swal from 'sweetalert2';

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
  searchCarId: string = '';
  searchCarName: string = '';
  isEditMode: boolean = false;
  selectedGalleryImageId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  Math = Math;

  imageTypes = [
    { value: 1, label: 'Interior' },
    { value: 2, label: 'Exterior' },
    { value: 3, label: 'Engine' },
    { value: 4, label: 'Other' }
  ];

  galleryImageForm = {
    carId: null as number | null,
    imageType: null as number | null,
    isPrimary: false
  };

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private galleryImageService: GalleryImageService,
    private carService: CarService
  ) {}

  ngOnInit(): void {
    this.loadGalleryImages();
    this.loadCars();
  }

  loadCars(): void {
    this.carService.getCars().subscribe({
      next: (data) => {
        this.cars = data;
      },
      error: (error) => console.error('Error loading cars:', error)
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
    if (!this.galleryImageForm.carId || !this.selectedFile) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const request: CreateGalleryImageRequest = {
      carId: this.galleryImageForm.carId,
      imageFile: this.selectedFile,
      imageType: this.galleryImageForm.imageType || undefined,
      isPrimary: this.galleryImageForm.isPrimary
    };

    this.galleryImageService.createGalleryImage(request).subscribe({
      next: () => {
        Swal.fire('Success', 'Gallery image created successfully', 'success');
        this.resetForm();
        this.loadGalleryImages();
      },
      error: (error) => {
        const errorMsg = error.error?.join(', ') || 'Error creating gallery image';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  updateGalleryImage(): void {
    if (!this.selectedGalleryImageId || !this.galleryImageForm.carId) {
      return;
    }

    const request: UpdateGalleryImageRequest = {
      carId: this.galleryImageForm.carId,
      imageFile: this.selectedFile || undefined,
      imageType: this.galleryImageForm.imageType || undefined,
      isPrimary: this.galleryImageForm.isPrimary
    };

    this.galleryImageService.updateGalleryImage(this.selectedGalleryImageId, request).subscribe({
      next: () => {
        Swal.fire('Success', 'Gallery image updated successfully', 'success');
        this.resetForm();
        this.loadGalleryImages();
      },
      error: (error) => {
        const errorMsg = error.error?.join(', ') || 'Error updating gallery image';
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
    return car ? `#${car.id} - ${car.modelNameEn || car.modelNameAr || 'Unknown'} (${car.year})` : `Car #${carId}`;
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
