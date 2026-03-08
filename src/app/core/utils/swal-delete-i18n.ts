import Swal from 'sweetalert2';

const PATCH_FLAG = '__deleteI18nPatched';

const AR_TRANSLATIONS: Record<string, string> = {
  'Are you sure?': 'هل أنت متأكد؟',
  'Are you sure ?': 'هل أنت متأكد؟',
  'Are you sure you want to remove this record?': 'هل أنت متأكد أنك تريد حذف هذا السجل؟',
  'Are you sure you want to remove this record ?': 'هل أنت متأكد أنك تريد حذف هذا السجل؟',
  'Yes, Delete It!': 'نعم، احذف!',
  'Yes, Delete!': 'نعم، احذف!',
  'Yes, Delete': 'نعم، احذف!',
  'Close': 'إغلاق',
  'Cancel': 'إلغاء',
  'Deleted!': 'تم الحذف!',
  'Please select at least one checkbox': 'يرجى تحديد عنصر واحد على الأقل'
};

function getCurrentLang(): 'ar' | 'en' {
  const htmlLang = (document?.documentElement?.getAttribute('lang') || '').toLowerCase();
  const cookieLang = (document?.cookie || '')
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('lang='))
    ?.split('=')[1]
    ?.toLowerCase();

  const lang = htmlLang || cookieLang || 'ar';
  return lang.startsWith('ar') ? 'ar' : 'en';
}

function translateDeleteText(text: unknown): unknown {
  if (typeof text !== 'string') return text;
  if (getCurrentLang() !== 'ar') return text;

  if (AR_TRANSLATIONS[text]) return AR_TRANSLATIONS[text];

  // Example: Delete 3 selected brand(s)?
  const bulkDeleteMatch = text.match(/^Delete\s+(\d+)\s+selected\s+(.+)\?$/i);
  if (bulkDeleteMatch) {
    return `حذف ${bulkDeleteMatch[1]} من العناصر المحددة؟`;
  }

  return text;
}

export function patchSwalDeleteI18n(): void {
  const swalAny = Swal as unknown as Record<string, unknown>;
  if (swalAny[PATCH_FLAG]) return;

  const originalFire = Swal.fire.bind(Swal);

  (Swal as unknown as { fire: (...args: any[]) => Promise<any> }).fire = (...args: any[]) => {
    // Swal.fire(options)
    if (args.length > 0 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      const next = { ...args[0] };
      next.title = translateDeleteText(next.title);
      next.text = translateDeleteText(next.text);
      next.confirmButtonText = translateDeleteText(next.confirmButtonText);
      next.cancelButtonText = translateDeleteText(next.cancelButtonText);
      args[0] = next;
      return originalFire(...args);
    }

    // Swal.fire(title, text, icon)
    if (args.length > 0) args[0] = translateDeleteText(args[0]);
    if (args.length > 1) args[1] = translateDeleteText(args[1]);
    return originalFire(...args);
  };

  swalAny[PATCH_FLAG] = true;
}

