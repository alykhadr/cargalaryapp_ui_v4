import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';


// Component pages

import { SharedModule } from '../../shared/shared.module';

import { EmployeeComponent } from './employees/employee.component';
import { AdminRoutingModule } from './admin-routing.module';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { AdminToastsContainerComponent } from './shared/admin-toasts-container.component';
import { BranchesComponent } from './branches/branches.component';
import { BrandsComponent } from './brands/brands.component';
import { ColorsComponent } from './colors/colors.component';
import { GalleryImagesComponent } from './gallery-images/gallery-images.component';
import { CompanyInfoComponent } from './company-info/company-info.component';
import { ContactSalesComponent } from './contact-sales/contact-sales.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { FaqComponent } from './faq/faq.component';
import { MemberServicesComponent } from './member-services/member-services.component';
import { OffersComponent } from './offers/offers.component';
import { ServicesComponent } from './services/services.component';
import { ModelsComponent } from './models/models.component';
import { CarExtraDetailsComponent } from './car-extra-details/car-extra-details.component';
import { CarTypesComponent } from './car-types/car-types.component';
import { CarsComponent } from './cars/cars.component';
import { CarsCreatePageComponent } from './cars-create-page/cars-create-page.component';
import { CarsListPageComponent } from './cars-list-page/cars-list-page.component';
import { EmployeeListPageComponent } from './employee-list-page/employee-list-page.component';
import { CarByIdPipe } from './pipes/car-by-id.pipe';
import { DepartmentsComponent } from './departments/departments.component';
import { RequestComponent } from './request/request.component';
import { RequestListPageComponent } from './request-list-page/request-list-page.component';
import { RequestCreatePageComponent } from './request-create-page/request-create-page.component';
import { RequestTrackPageComponent } from './request-track-page/request-track-page.component';
import { UsersComponent } from './users/users.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { CountUpModule } from 'ngx-countup';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgSelectModule } from '@ng-select/ng-select';
import { FlatpickrModule } from 'angularx-flatpickr';
import { DROPZONE_CONFIG, DropzoneModule,DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgxSliderModule } from 'ngx-slider-v2';
import { NgbAccordionModule, NgbCollapseModule, NgbDropdownModule, NgbNavModule, NgbPaginationModule, NgbRatingModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { defineElement } from '@lordicon/element';
import lottie from 'lottie-web';
import { LeafletModule } from '@bluehalo/ngx-leaflet';


const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  url: 'https://httpbin.org/post',
  maxFilesize: 50,
  acceptedFiles: 'image/*'
};

@NgModule({
  declarations: [
    EmployeeComponent,
    RolesComponent,
    PermissionsComponent,
    AdminToastsContainerComponent,
    BranchesComponent,
    BrandsComponent,
    ColorsComponent,
    GalleryImagesComponent,
    CompanyInfoComponent,
    ContactSalesComponent,
    ContactUsComponent,
    FaqComponent,
    MemberServicesComponent,
    OffersComponent,
    ServicesComponent,
    ModelsComponent,
    CarExtraDetailsComponent,
    CarTypesComponent,
    CarsComponent,
    CarsCreatePageComponent,
    CarsListPageComponent,
    EmployeeListPageComponent,
    DepartmentsComponent,
    RequestComponent,
    RequestListPageComponent,
    RequestCreatePageComponent,
    RequestTrackPageComponent,
    UsersComponent,
    CarByIdPipe
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbAccordionModule,
    NgbCollapseModule,
    NgbRatingModule,
    NgbTooltipModule,
    NgbToastModule,
    NgxSliderModule,
    SimplebarAngularModule,
    SlickCarouselModule,
    CKEditorModule,
    DropzoneModule,
    FlatpickrModule.forRoot(),
    NgSelectModule,
    NgApexchartsModule,
    CountUpModule,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    LeafletModule,
    AdminRoutingModule
  ],
  providers: [
    provideNgxMask(),
    DatePipe,
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG
    }
  ],
  
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminModule { 

  constructor() {
    defineElement(lottie.loadAnimation);
  }
}
