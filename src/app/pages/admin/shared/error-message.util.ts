export function getErrorMessage(error: any, fallback?: string): string {
  if (typeof error === 'string') {
    return error;
  }

  const response = error?.error;
  const errorCode = extractErrorCode(response);
  const isArabic = getCurrentLanguage().startsWith('ar');

  if (response?.messageAr || response?.messageEn) {
    const localized = isArabic ? response?.messageAr : response?.messageEn;
    if (localized) {
      return withCode(localized, errorCode);
    }
  }

  const apiErrors = error?.error?.errors;
  if (Array.isArray(apiErrors) && apiErrors.length > 0) {
    return withCode(apiErrors.join(', '), errorCode);
  }

  return withCode(
    response?.message || response?.error || error?.message || fallback || getDefaultFallbackMessage(),
    errorCode
  );
}

function getCurrentLanguage(): string {
  const cookieMatch = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
  const cookieLang = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
  const htmlLang = (document.documentElement?.lang || '').toLowerCase();
  return (cookieLang || htmlLang || 'en').toLowerCase();
}

function extractErrorCode(response: any): string | null {
  if (!response) return null;
  if (response?.errorCode) return String(response.errorCode);
  if (typeof response?.message === 'string' && /^\d+$/.test(response.message.trim())) {
    return response.message.trim();
  }
  return null;
}

function withCode(message: string, code: string | null): string {
  if (!code) return message;
  return `${code} - ${message}`;
}

function getDefaultFallbackMessage(): string {
  return getCurrentLanguage().startsWith('ar') ? 'حدث خطأ ما' : 'Something went wrong';
}
