import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { MyAuthService } from 'src/app/core/services/my-auth.service';
import { getErrorMessage } from 'src/app/pages/admin/shared/error-message.util';

@Component({
    selector: 'app-basic',
    templateUrl: './basic.component.html',
    styleUrls: ['./basic.component.scss'],
    standalone: false
})

/**
 * Pass-Reset Basic Component
 */
export class BasicComponent implements OnInit {

  // Login Form
  passresetForm!: UntypedFormGroup;
  requestSubmitted = false;
  resetSubmitted = false;
  requestLoading = false;
  resetLoading = false;
  isResetStep = false;
  fieldTextType = false;
  confirmFieldTextType = false;
  successMessage = '';
  errorMessage = '';

  // set the current year
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private myAuthService: MyAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
     this.passresetForm = this.formBuilder.group({
      userNameOrEmail: ['', [Validators.required]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    this.route.queryParamMap.pipe(first()).subscribe(params => {
      const token = params.get('token')?.trim() || '';
      const user = params.get('user')?.trim() || params.get('email')?.trim() || '';

      if (user) {
        this.f['userNameOrEmail'].setValue(user);
      }

      if (token) {
        this.f['token'].setValue(token);
        this.isResetStep = true;
      }
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.passresetForm.controls; }

  onRequestReset() {
    this.requestSubmitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    const identifier = this.f['userNameOrEmail'].value?.trim();
    if (!identifier) {
      return;
    }

    this.requestLoading = true;

    this.myAuthService
      .forgotPassword(identifier)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.requestLoading = false;
          this.isResetStep = true;
          this.successMessage = response?.message || 'If the account exists, a reset link was sent to the email.';
        },
        error: (error) => {
          this.requestLoading = false;
          this.errorMessage = getErrorMessage(error, 'Failed to request password reset.');
        }
      });
  }

  onResetPassword() {
    this.resetSubmitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    const identifier = this.f['userNameOrEmail'].value?.trim();
    const token = this.f['token'].value?.trim();
    const newPassword = this.f['newPassword'].value ?? '';
    const confirmPassword = this.f['confirmPassword'].value ?? '';

    if (!identifier || !token || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Confirm password must match new password.';
      return;
    }

    this.resetLoading = true;

    this.myAuthService
      .resetPassword(identifier, token, newPassword)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.resetLoading = false;
          this.successMessage = response?.message || 'Password reset successfully.';
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.resetLoading = false;
          this.errorMessage = getErrorMessage(error, 'Failed to reset password.');
        }
      });
  }

  togglePasswordField() {
    this.fieldTextType = !this.fieldTextType;
  }

  toggleConfirmPasswordField() {
    this.confirmFieldTextType = !this.confirmFieldTextType;
  }

}
