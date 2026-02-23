import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';


// Component pages

import { SharedModule } from '../../shared/shared.module';

import { UserComponent } from './users/user.component';
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
import { NgbAccordionModule, NgbDropdownModule, NgbNavModule, NgbPaginationModule, NgbRatingModule, NgbTooltipModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { defineElement } from '@lordicon/element';
import lottie from 'lottie-web';


const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  url: 'https://httpbin.org/post',
  maxFilesize: 50,
  acceptedFiles: 'image/*'
};

@NgModule({
  declarations: [
    UserComponent,
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
    MemberServicesComponent
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
