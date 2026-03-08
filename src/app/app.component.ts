import { Component } from '@angular/core';
import { patchSwalDeleteI18n } from './core/utils/swal-delete-i18n';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'velzon';

  constructor() {
    patchSwalDeleteI18n();
  }
}
