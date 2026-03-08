import { Injectable } from '@angular/core';
import { getErrorMessage } from './error-message.util';

@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  constructor() {}

  getMessage(error: any, fallback = 'Something went wrong'): string {
    return getErrorMessage(error, fallback);
  }
}
