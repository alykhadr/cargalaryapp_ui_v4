import { Injectable, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: any[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    const classname = String(options?.classname || '').toLowerCase();
    const forceNativeForError = classname.includes('danger') || classname.includes('error');

    if (options?.nativeToast || forceNativeForError) {
      this.toasts.push({ textOrTpl, ...options });
      return;
    }

    if (typeof textOrTpl !== 'string') {
      // Keep template-based notifications working (realtime cards).
      this.toasts.push({ textOrTpl, ...options });
      return;
    }

    const message = String(textOrTpl ?? '').trim();
    const icon = this.resolveIcon(options?.classname);
    const timer = typeof options?.delay === 'number' ? options.delay : undefined;
    const { messageText, code } = this.splitCodeFromMessage(message);

    if (icon === 'error' && code) {
      void Swal.fire({
        icon,
        title: this.resolveTitle(icon),
        html: `<div>${this.escapeHtml(messageText)}</div><div style="margin-top:8px;font-size:12px;color:#6c757d;">Code: ${this.escapeHtml(code)}</div>`,
        confirmButtonText: 'OK'
      });
      return;
    }

    void Swal.fire({
      icon,
      title: this.resolveTitle(icon),
      text: message,
      confirmButtonText: timer ? undefined : 'OK',
      timer,
      timerProgressBar: Boolean(timer),
      showConfirmButton: !timer
    });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  private resolveIcon(classname?: string): 'success' | 'error' | 'warning' | 'info' {
    const value = (classname || '').toLowerCase();
    if (value.includes('danger') || value.includes('error')) return 'error';
    if (value.includes('warning')) return 'warning';
    if (value.includes('success')) return 'success';
    return 'info';
  }

  private resolveTitle(icon: 'success' | 'error' | 'warning' | 'info'): string {
    switch (icon) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  }

  private splitCodeFromMessage(message: string): { messageText: string; code: string | null } {
    const match = message.match(/^(\d+)\s*-\s*(.+)$/);
    if (!match) {
      return { messageText: message, code: null };
    }

    return {
      code: match[1],
      messageText: match[2]
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
