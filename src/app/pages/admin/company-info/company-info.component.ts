import { Component, OnInit } from '@angular/core';
import { CompanyInfoService } from '../services/company-info.service';
import { CompanyInfo, CreateCompanyInfoRequest, UpdateCompanyInfoRequest } from '../interfaces/company-info.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.component.html',
  styleUrls: ['./company-info.component.scss'],
  standalone: false
})
export class CompanyInfoComponent implements OnInit {
  companyInfos: CompanyInfo[] = [];
  filteredCompanyInfos: CompanyInfo[] = [];
  isEditMode: boolean = false;
  selectedCompanyInfoId: number | null = null;
  selectedFile: File | null = null;
  logoPreview: string | null = null;
  Math = Math;
  currentStep: number = 1;
  totalSteps: number = 4;
  submitted: boolean = false;
  previewImageUrl: string | null = null;

  companyInfoForm = {
    companyNameAr: '',
    companyNameEn: '',
    crNumber: '',
    mobileNo: '',
    telNo: '',
    email: '',
    aboutUsAr: '',
    aboutUsEn: '',
    ourMissionAr: '',
    ourMissionEn: '',
    ourGoalsAr: '',
    ourGoalsEn: ''
  };

  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(private companyInfoService: CompanyInfoService) {}

  ngOnInit(): void {
    this.loadCompanyInfos();
  }

  loadCompanyInfos(): void {
    this.companyInfoService.getCompanyInfos().subscribe({
      next: (data) => {
        this.companyInfos = data;
        this.filteredCompanyInfos = data;
      },
      error: (error) => console.error('Error loading company info:', error)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'Logo image size must be less than or equal to 5 MB', 'error');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.isEditMode) {
      this.updateCompanyInfo();
    } else {
      this.createCompanyInfo();
    }
  }

  nextStep(): void {
    this.submitted = true;
    if (!this.validateCurrentStep()) {
      return;
    }
    this.submitted = false;
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.companyInfoForm.companyNameEn && 
                 this.companyInfoForm.companyNameAr && 
                 this.companyInfoForm.crNumber && 
                 this.companyInfoForm.email && 
                 this.isValidEmail(this.companyInfoForm.email) &&
                 this.companyInfoForm.mobileNo && 
                 this.isValidMobile(this.companyInfoForm.mobileNo) &&
                 this.companyInfoForm.telNo &&
                 (this.logoPreview || this.selectedFile));
      case 2:
        return !!(this.companyInfoForm.aboutUsEn && this.companyInfoForm.aboutUsAr);
      case 3:
        return !!(this.companyInfoForm.ourMissionEn && this.companyInfoForm.ourMissionAr);
      case 4:
        return !!(this.companyInfoForm.ourGoalsEn && this.companyInfoForm.ourGoalsAr);
      default:
        return false;
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidMobile(mobile: string): boolean {
    const mobileRegex = /^05\d{8}$/;
    return mobileRegex.test(mobile);
  }

  isNumeric(value: string): boolean {
    return /^\d+$/.test(value);
  }

  previewImage(imageUrl: string): void {
    this.previewImageUrl = imageUrl;
  }

  closePreview(): void {
    this.previewImageUrl = null;
  }

  createCompanyInfo(): void {
    const request: CreateCompanyInfoRequest = {
      ...this.companyInfoForm,
      logoFile: this.selectedFile || undefined
    };

    this.companyInfoService.createCompanyInfo(request).subscribe({
      next: () => {
        Swal.fire('Success', 'Company info created successfully', 'success');
        this.resetForm();
        this.loadCompanyInfos();
      },
      error: (error) => {
        const errorMsg = error.error?.join(', ') || 'Error creating company info';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  updateCompanyInfo(): void {
    if (!this.selectedCompanyInfoId) return;

    const request: UpdateCompanyInfoRequest = {
      ...this.companyInfoForm,
      logoFile: this.selectedFile || undefined
    };

    this.companyInfoService.updateCompanyInfo(this.selectedCompanyInfoId, request).subscribe({
      next: () => {
        Swal.fire('Success', 'Company info updated successfully', 'success');
        this.resetForm();
        this.loadCompanyInfos();
      },
      error: (error) => {
        const errorMsg = error.error?.join(', ') || 'Error updating company info';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  editCompanyInfo(info: CompanyInfo): void {
    this.isEditMode = true;
    this.selectedCompanyInfoId = info.id;
    this.currentStep = 1;
    this.companyInfoForm = {
      companyNameAr: info.companyNameAr || '',
      companyNameEn: info.companyNameEn || '',
      crNumber: info.crNumber || '',
      mobileNo: info.mobileNo || '',
      telNo: info.telNo || '',
      email: info.email || '',
      aboutUsAr: info.aboutUsAr || '',
      aboutUsEn: info.aboutUsEn || '',
      ourMissionAr: info.ourMissionAr || '',
      ourMissionEn: info.ourMissionEn || '',
      ourGoalsAr: info.ourGoalsAr || '',
      ourGoalsEn: info.ourGoalsEn || ''
    };
    this.logoPreview = info.logoUrl || null;
    this.selectedFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCompanyInfo(id: number): void {
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
        this.companyInfoService.deleteCompanyInfo(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Company info has been deleted.', 'success');
            this.loadCompanyInfos();
          },
          error: (error) => console.error('Error deleting company info:', error)
        });
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedCompanyInfoId = null;
    this.currentStep = 1;
    this.submitted = false;
    this.companyInfoForm = {
      companyNameAr: '',
      companyNameEn: '',
      crNumber: '',
      mobileNo: '',
      telNo: '',
      email: '',
      aboutUsAr: '',
      aboutUsEn: '',
      ourMissionAr: '',
      ourMissionEn: '',
      ourGoalsAr: '',
      ourGoalsEn: ''
    };
    this.selectedFile = null;
    this.logoPreview = null;
  }

  get paginatedCompanyInfos(): CompanyInfo[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCompanyInfos.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCompanyInfos.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
