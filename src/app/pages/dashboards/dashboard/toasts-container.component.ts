import { Component, TemplateRef, HostBinding } from '@angular/core';

import { ToastService } from './toast-service';
import { LanguageService } from 'src/app/core/services/language.service';


@Component({
    selector: 'app-toasts',
    template: `
   @for(toast of toastService.toasts;track $index){
     <ngb-toast
       [attr.dir]="isRtl ? 'rtl' : 'ltr'"
       [class]="toast.classname"
       [autohide]="true"
       [delay]="toast.delay || 5000"
       (hidden)="toastService.remove(toast)"
       >
       @if (isTemplate(toast)) {
         <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
       } @else {
         {{ toast.textOrTpl }}
       }
   
     </ngb-toast>
   }
   `,
    host: { 'style': 'z-index: 1200' },
    standalone: false
})
export class ToastsContainer {
  constructor(
    public toastService: ToastService,
    private languageService: LanguageService
  ) { }

  @HostBinding('class')
  get hostClass(): string {
    return this.isRtl
      ? 'toast-container position-fixed top-0 start-0 p-3'
      : 'toast-container position-fixed top-0 end-0 p-3';
  }

  get isRtl(): boolean {
    return this.languageService.getCurrentLanguage() === 'ar';
  }

  isTemplate(toast: { textOrTpl: any; }) { return toast.textOrTpl instanceof TemplateRef; }
}
