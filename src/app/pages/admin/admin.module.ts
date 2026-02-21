import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';


// Component pages

import { SharedModule } from '../../shared/shared.module';

import { UserComponent } from './users/user.component';
import { AdminRoutingModule } from './admin-routing.module';
import { RolesComponent } from './roles/roles.component';
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
    RolesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbAccordionModule,
    NgbRatingModule,
    NgbTooltipModule,
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
