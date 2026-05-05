import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { CompanyInfoService } from './pages/admin/services/company-info.service';

describe('AppComponent', () => {
  const titleServiceMock = {
    setTitle: jasmine.createSpy('setTitle')
  };
  const translateServiceMock = {
    currentLang: 'en',
    onLangChange: of({ lang: 'en' })
  };
  const companyInfoServiceMock = {
    watchCompanyInfos: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: Title, useValue: titleServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: CompanyInfoService, useValue: companyInfoServiceMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have default title value`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('velzon');
  });
});
