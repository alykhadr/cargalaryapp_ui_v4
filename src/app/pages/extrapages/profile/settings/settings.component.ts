import { Component, OnInit } from '@angular/core';

import { TokenStorageService } from '../../../../core/services/token-storage.service';
import { LanguageService } from 'src/app/core/services/language.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: false
})

/**
 * Profile Settings Component
 */
export class SettingsComponent implements OnInit {

  userData:any;

  constructor(
    private TokenStorageService : TokenStorageService,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.userData =  this.TokenStorageService.getUser();    
  }

  get displayFullName(): string {
    const user = this.userData || {};
    const isArabic = this.languageService.getCurrentLanguage() === 'ar';
    const fullAr = (user.fullNameAr || user.fullnameAr || user.full_name_ar || user.nameAr || '').toString().trim();
    const fullEn = (user.fullNameEn || user.fullnameEn || user.full_name_en || user.nameEn || '').toString().trim();
    return isArabic ? (fullAr || fullEn || user.username || user.userName || '') : (fullEn || fullAr || user.username || user.userName || '');
  }

  /**
  * Multiple Default Select2
  */
   selectValue = ['Illustrator', 'Photoshop', 'CSS', 'HTML', 'Javascript', 'Python', 'PHP'];

}
