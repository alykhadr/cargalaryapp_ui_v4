export function getErrorMessage(error: any, fallback = 'Something went wrong'): string {
  if (typeof error === 'string') {
    return error;
  }

  const apiErrors = error?.error?.errors;
  if (Array.isArray(apiErrors) && apiErrors.length > 0) {
    return apiErrors.join(', ');
  }

  return error?.error?.message || error?.error?.error || error?.message || fallback;
}
