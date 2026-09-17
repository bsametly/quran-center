/* بيانات المصحف — أسماء السور وعدد آياتها وبدايات صفحاتها (مصحف المدينة) */

export interface Surah {
  n: number;
  name: string;
  ayahs: number;
  page: number; // صفحة البداية
}

export const TOTAL_PAGES = 604;
export const TOTAL_AJZA = 30;

export const SURAHS: Surah[] = [
  { n: 1, name: 'الفاتحة', ayahs: 7, page: 1 },
  { n: 2, name: 'البقرة', ayahs: 286, page: 2 },
  { n: 3, name: 'آل عمران', ayahs: 200, page: 50 },
  { n: 4, name: 'النساء', ayahs: 176, page: 77 },
  { n: 5, name: 'المائدة', ayahs: 120, page: 106 },
  { n: 6, name: 'الأنعام', ayahs: 165, page: 128 },
  { n: 7, name: 'الأعراف', ayahs: 206, page: 151 },
  { n: 8, name: 'الأنفال', ayahs: 75, page: 177 },
  { n: 9, name: 'التوبة', ayahs: 129, page: 187 },
  { n: 10, name: 'يونس', ayahs: 109, page: 208 },
  { n: 11, name: 'هود', ayahs: 123, page: 221 },
  { n: 12, name: 'يوسف', ayahs: 111, page: 235 },
  { n: 13, name: 'الرعد', ayahs: 43, page: 249 },
  { n: 14, name: 'إبراهيم', ayahs: 52, page: 255 },
  { n: 15, name: 'الحجر', ayahs: 99, page: 262 },
  { n: 16, name: 'النحل', ayahs: 128, page: 267 },
  { n: 17, name: 'الإسراء', ayahs: 111, page: 282 },
  { n: 18, name: 'الكهف', ayahs: 110, page: 293 },
  { n: 19, name: 'مريم', ayahs: 98, page: 305 },
  { n: 20, name: 'طه', ayahs: 135, page: 312 },
  { n: 21, name: 'الأنبياء', ayahs: 112, page: 322 },
  { n: 22, name: 'الحج', ayahs: 78, page: 332 },
  { n: 23, name: 'المؤمنون', ayahs: 118, page: 342 },
  { n: 24, name: 'النور', ayahs: 64, page: 350 },
  { n: 25, name: 'الفرقان', ayahs: 77, page: 359 },
  { n: 26, name: 'الشعراء', ayahs: 227, page: 367 },
  { n: 27, name: 'النمل', ayahs: 93, page: 377 },
  { n: 28, name: 'القصص', ayahs: 88, page: 385 },
  { n: 29, name: 'العنكبوت', ayahs: 69, page: 396 },
  { n: 30, name: 'الروم', ayahs: 60, page: 404 },
  { n: 31, name: 'لقمان', ayahs: 34, page: 411 },
  { n: 32, name: 'السجدة', ayahs: 30, page: 415 },
  { n: 33, name: 'الأحزاب', ayahs: 73, page: 418 },
  { n: 34, name: 'سبأ', ayahs: 54, page: 428 },
  { n: 35, name: 'فاطر', ayahs: 45, page: 434 },
  { n: 36, name: 'يس', ayahs: 83, page: 440 },
  { n: 37, name: 'الصافات', ayahs: 182, page: 446 },
  { n: 38, name: 'ص', ayahs: 88, page: 453 },
  { n: 39, name: 'الزمر', ayahs: 75, page: 458 },
  { n: 40, name: 'غافر', ayahs: 85, page: 467 },
  { n: 41, name: 'فصلت', ayahs: 54, page: 477 },
  { n: 42, name: 'الشورى', ayahs: 53, page: 483 },
  { n: 43, name: 'الزخرف', ayahs: 89, page: 489 },
  { n: 44, name: 'الدخان', ayahs: 59, page: 496 },
  { n: 45, name: 'الجاثية', ayahs: 37, page: 499 },
  { n: 46, name: 'الأحقاف', ayahs: 35, page: 502 },
  { n: 47, name: 'محمد', ayahs: 38, page: 507 },
  { n: 48, name: 'الفتح', ayahs: 29, page: 511 },
  { n: 49, name: 'الحجرات', ayahs: 18, page: 515 },
  { n: 50, name: 'ق', ayahs: 45, page: 518 },
  { n: 51, name: 'الذاريات', ayahs: 60, page: 520 },
  { n: 52, name: 'الطور', ayahs: 49, page: 523 },
  { n: 53, name: 'النجم', ayahs: 62, page: 526 },
  { n: 54, name: 'القمر', ayahs: 55, page: 528 },
  { n: 55, name: 'الرحمن', ayahs: 78, page: 531 },
  { n: 56, name: 'الواقعة', ayahs: 96, page: 534 },
  { n: 57, name: 'الحديد', ayahs: 29, page: 537 },
  { n: 58, name: 'المجادلة', ayahs: 22, page: 542 },
  { n: 59, name: 'الحشر', ayahs: 24, page: 545 },
  { n: 60, name: 'الممتحنة', ayahs: 13, page: 549 },
  { n: 61, name: 'الصف', ayahs: 14, page: 551 },
  { n: 62, name: 'الجمعة', ayahs: 11, page: 553 },
  { n: 63, name: 'المنافقون', ayahs: 11, page: 554 },
  { n: 64, name: 'التغابن', ayahs: 18, page: 556 },
  { n: 65, name: 'الطلاق', ayahs: 12, page: 558 },
  { n: 66, name: 'التحريم', ayahs: 12, page: 560 },
  { n: 67, name: 'الملك', ayahs: 30, page: 562 },
  { n: 68, name: 'القلم', ayahs: 52, page: 564 },
  { n: 69, name: 'الحاقة', ayahs: 52, page: 566 },
  { n: 70, name: 'المعارج', ayahs: 44, page: 568 },
  { n: 71, name: 'نوح', ayahs: 28, page: 570 },
  { n: 72, name: 'الجن', ayahs: 28, page: 572 },
  { n: 73, name: 'المزمل', ayahs: 20, page: 574 },
  { n: 74, name: 'المدثر', ayahs: 56, page: 575 },
  { n: 75, name: 'القيامة', ayahs: 40, page: 577 },
  { n: 76, name: 'الإنسان', ayahs: 31, page: 578 },
  { n: 77, name: 'المرسلات', ayahs: 50, page: 580 },
  { n: 78, name: 'النبأ', ayahs: 40, page: 582 },
  { n: 79, name: 'النازعات', ayahs: 46, page: 583 },
  { n: 80, name: 'عبس', ayahs: 42, page: 585 },
  { n: 81, name: 'التكوير', ayahs: 29, page: 586 },
  { n: 82, name: 'الانفطار', ayahs: 19, page: 587 },
  { n: 83, name: 'المطففين', ayahs: 36, page: 587 },
  { n: 84, name: 'الانشقاق', ayahs: 25, page: 589 },
  { n: 85, name: 'البروج', ayahs: 22, page: 590 },
  { n: 86, name: 'الطارق', ayahs: 17, page: 591 },
  { n: 87, name: 'الأعلى', ayahs: 19, page: 591 },
  { n: 88, name: 'الغاشية', ayahs: 26, page: 592 },
  { n: 89, name: 'الفجر', ayahs: 30, page: 593 },
  { n: 90, name: 'البلد', ayahs: 20, page: 594 },
  { n: 91, name: 'الشمس', ayahs: 15, page: 594 },
  { n: 92, name: 'الليل', ayahs: 21, page: 595 },
  { n: 93, name: 'الضحى', ayahs: 11, page: 596 },
  { n: 94, name: 'الشرح', ayahs: 8, page: 596 },
  { n: 95, name: 'التين', ayahs: 8, page: 597 },
  { n: 96, name: 'العلق', ayahs: 19, page: 597 },
  { n: 97, name: 'القدر', ayahs: 5, page: 598 },
  { n: 98, name: 'البينة', ayahs: 8, page: 598 },
  { n: 99, name: 'الزلزلة', ayahs: 8, page: 599 },
  { n: 100, name: 'العاديات', ayahs: 11, page: 599 },
  { n: 101, name: 'القارعة', ayahs: 11, page: 600 },
  { n: 102, name: 'التكاثر', ayahs: 8, page: 600 },
  { n: 103, name: 'العصر', ayahs: 3, page: 601 },
  { n: 104, name: 'الهمزة', ayahs: 9, page: 601 },
  { n: 105, name: 'الفيل', ayahs: 5, page: 601 },
  { n: 106, name: 'قريش', ayahs: 4, page: 602 },
  { n: 107, name: 'الماعون', ayahs: 7, page: 602 },
  { n: 108, name: 'الكوثر', ayahs: 3, page: 602 },
  { n: 109, name: 'الكافرون', ayahs: 6, page: 603 },
  { n: 110, name: 'النصر', ayahs: 3, page: 603 },
  { n: 111, name: 'المسد', ayahs: 5, page: 603 },
  { n: 112, name: 'الإخلاص', ayahs: 4, page: 604 },
  { n: 113, name: 'الفلق', ayahs: 5, page: 604 },
  { n: 114, name: 'الناس', ayahs: 6, page: 604 },
];

/** بدايات صفحات الأجزاء الثلاثين */
export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export const JUZ_NAMES = [
  'آلم', 'سيقول', 'تلك الرسل', 'لن تنالوا', 'والمحصنات', 'لا يحب الله', 'وإذا سمعوا', 'ولو أننا',
  'قال الملأ', 'واعلموا', 'يعتذرون', 'وما من دابة', 'وما أبرئ', 'ربما', 'سبحان الذي', 'قال ألم',
  'اقترب للناس', 'قد أفلح', 'وقال الذين', 'أمّن خلق', 'اتل ما أوحي', 'ومن يقنت', 'وما لي',
  'فمن أظلم', 'إليه يرد', 'حم', 'قال فما خطبكم', 'قد سمع الله', 'تبارك الذي', 'عمّ',
];

export function surahByNumber(n: number): Surah {
  return SURAHS[n - 1];
}

export function juzOfPage(page: number): number {
  let juz = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (JUZ_START_PAGES[i] <= page) juz = i + 1;
    else break;
  }
  return juz;
}

/** تقدير نطاق الصفحات لآيات من سورة معينة (استيفاء خطي داخل نطاق السورة) */
export function pagesForRange(surahNumber: number, ayahFrom: number, ayahTo: number): { from: number; to: number } {
  const s = surahByNumber(surahNumber);
  const nextPage = surahNumber < 114 ? SURAHS[surahNumber].page : TOTAL_PAGES + 1;
  const span = nextPage - s.page;
  const from = s.page + Math.floor(((Math.min(ayahFrom, s.ayahs) - 1) / s.ayahs) * span);
  const to = s.page + Math.floor((Math.min(ayahTo, s.ayahs) / s.ayahs) * span);
  return { from: Math.max(1, from), to: Math.min(TOTAL_PAGES, Math.max(from, to)) };
}

export function ayahsForExtendedRange(surahFrom: number, ayahFrom: number, surahTo: number, ayahTo: number): number {
  if (surahFrom === surahTo) {
    return Math.abs(ayahTo - ayahFrom) + 1;
  }
  let total = 0;
  total += surahByNumber(surahFrom).ayahs - ayahFrom + 1;
  for (let s = surahFrom + 1; s < surahTo; s++) {
    total += surahByNumber(s).ayahs;
  }
  total += Math.min(ayahTo, surahByNumber(surahTo).ayahs);
  return total;
}

export function pagesForExtendedRange(surahFrom: number, ayahFrom: number, surahTo: number, ayahTo: number): { from: number; to: number } {
  if (surahFrom === surahTo) {
    return pagesForRange(surahFrom, ayahFrom, ayahTo);
  }
  const startPages = pagesForRange(surahFrom, ayahFrom, surahByNumber(surahFrom).ayahs);
  const endPages = pagesForRange(surahTo, 1, ayahTo);
  return { from: startPages.from, to: endPages.to };
}

export function surahsInRange(surahFrom: number, surahTo: number): Surah[] {
  const result: Surah[] = [];
  for (let s = surahFrom; s <= surahTo; s++) {
    result.push(surahByNumber(s));
  }
  return result;
}

/** عدد الصفحات الفريدة من قائمة نطاقات */
export function countUniquePages(ranges: { from: number; to: number }[]): number {
  const set = new Set<number>();
  for (const r of ranges) {
    for (let p = Math.min(r.from, r.to); p <= Math.max(r.from, r.to); p++) set.add(p);
  }
  return set.size;
}

/** الأجزاء التي لمسها الطالب من نطاقات الصفحات */
export function ajzaFromRanges(ranges: { from: number; to: number }[]): number[] {
  const set = new Set<number>();
  for (const r of ranges) {
    for (let p = Math.min(r.from, r.to); p <= Math.max(r.from, r.to); p++) set.add(juzOfPage(p));
  }
  return Array.from(set).sort((a, b) => a - b);
}

/** مسار الحفظ المعتمد: جزء عم (تنازلياً) ← تبارك ← قد سمع ← البقرة وما بعدها */
export function memorizationTrack(): number[] {
  const track: number[] = [];
  for (let s = 114; s >= 78; s--) track.push(s); // جزء عم
  for (let s = 67; s <= 77; s++) track.push(s); // جزء تبارك
  for (let s = 58; s <= 66; s++) track.push(s); // جزء قد سمع
  for (let s = 2; s <= 29; s++) track.push(s); // من البقرة
  return track;
}

export const LEVELS = [
  'الفاتحة',
  'جزء عم',
  'جزء تبارك',
  'جزء المجادلة',
];
