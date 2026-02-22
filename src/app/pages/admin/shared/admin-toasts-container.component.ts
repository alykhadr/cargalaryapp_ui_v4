import { Component, TemplateRef } from '@angular/core';
import { ToastService } from '../../icons/toast-service';

@Component({
  selector: 'app-admin-toasts',
  standalone: false,
  template: `
    @for (toast of toastService.toasts; track $index) {
      <ngb-toast
        [class]="toast.classname"
        [autohide]="true"
        [delay]="toast.delay || 5000"
        (hidden)="toastService.remove(toast)">
        @if (isTemplate(toast)) {
          <ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
        } @else {
          {{ toast.textOrTpl }}
        }
      </ngb-toast>
    }
  `,
  host: { class: 'toast-container position-fixed top-0 end-0 p-3', style: 'z-index: 1200' }
})
export class AdminToastsContainerComponent {
  constructor(public toastService: ToastService) {}

  isTemplate(toast: { textOrTpl: any }) {
    return toast.textOrTpl instanceof TemplateRef;
  }
}
