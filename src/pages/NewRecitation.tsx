import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookMarked, Check, ChevronRight, Minus, PenLine, Plus, Search, Sparkles } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar, Badge, Button, Card, EmptyState, Field, PageHeader, Select, Textarea } from '../components/ui';
import { MISTAKE_LABELS, RECITATION_LABELS, studentRecitations, visibleStudents } from '../lib/utils';
import { pagesForRange, pagesForExtendedRange, ayahsForExtendedRange, juzOfPage, JUZ_NAMES, surahByNumber, SURAHS } from '../data/quran';
import type { MistakeType, RecitationType } from '../types';
import { cn } from '../utils/cn';

const TYPES: RecitationType[] = ['hifz', 'wird', 'exam'];
const MISTAKE_TYPES = Object.keys(MISTAKE_LABELS) as MistakeType[];
const QUICK_GRADES = [95, 90, 85, 80, 75, 70, 60, 50];

export default function NewRecitation() {
  const { db, user, addRecitation, toast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const myStudents = visibleStudents(user, db).filter((s) => s.status === 'active');
  const preStudent = params.get('student');

  const [studentId, setStudentId] = useState<string>(preStudent && myStudents.some((s) => s.id === preStudent) ? preStudent : '');
  const [search, setSearch] = useState('');
  
  const [type, setType] = useState<RecitationType>('hifz');
  const [isExtended, setIsExtended] = useState(false);
  
  const [surah, setSurah] = useState<number>(114);
  const [surahTo, setSurahTo] = useState<number>(114);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(5);
  
  const [grade, setGrade] = useState(85);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [mistakeTypes, setMistakeTypes] = useState<MistakeType[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const student = myStudents.find((s) => s.id === studentId);
  const surahInfo = surahByNumber(surah);
  const surahToInfo = surahByNumber(surahTo);

  /* اقتراح ذكي: المتابعة من آخر موضع حفظ للطالب */
  const suggestion = useMemo(() => {
    if (!studentId) return null;
    const lastHifz = studentRecitations(db, studentId).find((r) => r.type === 'hifz');
    if (!lastHifz) return null;
    const s = surahByNumber(lastHifz.surah_number);
    if (lastHifz.ayah_to < s.ayahs) {
      return { surah: s.n, from: lastHifz.ayah_to + 1, to: Math.min(s.ayahs, lastHifz.ayah_to + 8), text: `المتابعة من سورة ${s.name} — الآية ${lastHifz.ayah_to + 1}` };
    }
    return null;
  }, [db, studentId]);

  const filteredStudents = useMemo(() => {
    const q = search.trim();
    if (!q) return myStudents;
    return myStudents.filter((s) => s.full_name.includes(q) || String(s.student_number).includes(q));
  }, [myStudents, search]);

  const pages = isExtended 
    ? pagesForExtendedRange(surah, from, surahTo, to) 
    : pagesForRange(surah, Math.min(from, to), Math.max(from, to));
  const juz = juzOfPage(pages.to);
  const ayahsCount = isExtended 
    ? ayahsForExtendedRange(surah, from, surahTo, to) 
    : (Math.abs(to - from) + 1);

  const toggleMistake = (t: MistakeType) =>
    setMistakeTypes((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!studentId) e.student = 'اختر الطالب أولاً';
    if (from < 1 || from > surahInfo.ayahs) e.from = `بين 1 و ${surahInfo.ayahs}`;
    
    if (isExtended) {
      if (surahTo < surah) e.surahTo = 'النهاية قبل البداية';
      if (surahTo === surah && to < from) e.to = 'النهاية قبل البداية';
      if (to < 1 || to > surahToInfo.ayahs) e.to = `بين 1 و ${surahToInfo.ayahs}`;
    } else {
      if (to < from) e.to = 'النهاية قبل البداية';
      if (to > surahInfo.ayahs) e.to = `سورة ${surahInfo.name} فيها ${surahInfo.ayahs} آية فقط`;
    }

    if (grade < 0 || grade > 100) e.grade = 'الدرجة بين 0 و 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) { toast('راجع الحقول المطلوبة', { tone: 'error' }); return; }
    if (!user?.linked_id && user?.role !== 'admin') { toast('حسابك غير مرتبط بمحفظ', { tone: 'error' }); return; }
    setSaving(true);
    try {
      const rec = addRecitation({
        student_id: studentId,
        teacher_id: user?.role === 'teacher' ? user.linked_id! : student?.teacher_id ?? 't1',
        type,
        surah_number: surah,
        surah_to: isExtended ? surahTo : null,
        ayah_from: isExtended ? from : Math.min(from, to),
        ayah_to: isExtended ? to : Math.max(from, to),
        grade,
        mistakes_count: mistakesCount,
        mistake_types: mistakeTypes,
        notes: notes.trim(),
      });
      toast('تم حفظ التسميع بنجاح', {
        body: isExtended
          ? `من سورة ${surahInfo.name} ${from} إلى سورة ${surahToInfo.name} ${to} · ${grade}%`
          : `سورة ${surahInfo.name} ${rec.ayah_from}–${rec.ayah_to} · ${grade}%`,
      });
      /* إعادة التهيئة للتسميع التالي بسرعة */
      setStudentId('');
      setNotes('');
      setMistakesCount(0);
      setMistakeTypes([]);
      navigate(`/students/${rec.student_id}`);
    } finally {
      setSaving(false);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setIsExtended(false);
    setSurah(suggestion.surah);
    setFrom(suggestion.from);
    setTo(suggestion.to);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="تسجيل تسميع" subtitle="خطوات قليلة وسريعة — كل عملية تُحفظ في سجل الطالب تلقائياً" />

      {/* الخطوة 1: اختيار الطالب */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-primary-700 text-white text-[12px] font-bold flex items-center justify-center">1</span>
          <h2 className="font-bold text-sand-900">اختيار الطالب</h2>
        </div>
        {student ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-primary-500 bg-primary-50/60 p-3">
            <Avatar name={student.full_name} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sand-900 text-[14.5px]">{student.full_name}</div>
              <div className="text-[11.5px] text-sand-500">{student.current_level} · {db.halaqat.find((h) => h.id === student.halaqa_id)?.name}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStudentId('')}>تغيير</Button>
          </div>
        ) : (
          <>
            <div className="relative mb-2.5">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم..."
                className="w-full h-11 rounded-xl border border-sand-300 pr-10 pl-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              />
            </div>
            {errors.student && <div className="text-[12px] font-semibold text-red-600 mb-2">{errors.student}</div>}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-sand-100 divide-y divide-sand-50">
              {filteredStudents.length === 0 && <EmptyState title="لا يوجد طلاب مطابقون" />}
              {filteredStudents.map((s) => (
                <button key={s.id} onClick={() => setStudentId(s.id)} className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-primary-50/60 text-right transition-colors">
                  <Avatar name={s.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-sand-900 truncate">{s.full_name}</div>
                    <div className="text-[11px] text-sand-400">{s.current_level}</div>
                  </div>
                  <ChevronRight size={16} className="text-sand-300 -scale-x-100" />
                </button>
              ))}
            </div>
          </>
        )}
        {suggestion && student && type === 'hifz' && (
          <button onClick={applySuggestion} className="mt-3 w-full flex items-center gap-2 rounded-xl bg-gold-50 border border-gold-200 px-3.5 py-2.5 text-[12.5px] font-semibold text-gold-800 hover:bg-gold-100 transition-colors">
            <Sparkles size={15} /> اقتراح تلقائي: {suggestion.text} — اضغط للتعبئة
          </button>
        )}
      </Card>

      {/* الخطوة 2: النوع والموضع */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-primary-700 text-white text-[12px] font-bold flex items-center justify-center">2</span>
          <h2 className="font-bold text-sand-900">نوع التسميع والموضع</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-[13px] font-bold border transition-all',
                type === t ? 'bg-primary-700 text-white border-primary-700 shadow-sm' : 'bg-white text-sand-500 border-sand-200 hover:border-primary-300'
              )}
            >
              {RECITATION_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4 bg-sand-100 p-1.5 rounded-xl max-w-sm">
          <button onClick={() => setIsExtended(false)} className={cn("flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition-all", !isExtended ? "bg-white shadow-sm text-primary-700" : "text-sand-500 hover:text-sand-700")}>سورة واحدة</button>
          <button onClick={() => setIsExtended(true)} className={cn("flex-1 rounded-lg py-1.5 text-[12.5px] font-bold transition-all", isExtended ? "bg-white shadow-sm text-primary-700" : "text-sand-500 hover:text-sand-700")}>عبر عدة سور</button>
        </div>

        {!isExtended ? (
          <div className="grid sm:grid-cols-2 gap-3.5">
            <Field label="السورة" required>
              <Select value={surah} onChange={(e) => { const n = Number(e.target.value); setSurah(n); setFrom(1); setTo(Math.min(8, surahByNumber(n).ayahs)); }}>
                {SURAHS.map((s) => (
                  <option key={s.n} value={s.n}>{s.n}. سورة {s.name} ({s.ayahs} آية)</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="من الآية" required hint={errors.from}>
                <input type="number" min={1} max={surahInfo.ayahs} value={from} onChange={(e) => setFrom(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-sand-300 px-3 text-sm text-center font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
              </Field>
              <Field label="إلى الآية" required hint={errors.to}>
                <input type="number" min={1} max={surahInfo.ayahs} value={to} onChange={(e) => setTo(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-sand-300 px-3 text-sm text-center font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
              </Field>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 bg-sand-50/50 p-4 rounded-xl border border-sand-200">
            <div className="space-y-3.5">
              <div className="text-[12.5px] font-bold text-sand-800">البداية</div>
              <Field label="من سورة" required hint={errors.surah}>
                <Select value={surah} onChange={(e) => { const n = Number(e.target.value); setSurah(n); setFrom(1); }}>
                  {SURAHS.map((s) => (
                    <option key={s.n} value={s.n}>{s.n}. سورة {s.name} ({s.ayahs} آية)</option>
                  ))}
                </Select>
              </Field>
              <Field label="من الآية" required hint={errors.from}>
                <input type="number" min={1} max={surahInfo.ayahs} value={from} onChange={(e) => setFrom(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-sand-300 px-3 text-sm text-center font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
              </Field>
            </div>
            <div className="space-y-3.5">
              <div className="text-[12.5px] font-bold text-sand-800">النهاية</div>
              <Field label="إلى سورة" required hint={errors.surahTo}>
                <Select value={surahTo} onChange={(e) => { const n = Number(e.target.value); setSurahTo(n); setTo(Math.min(8, surahByNumber(n).ayahs)); }}>
                  {SURAHS.map((s) => (
                    <option key={s.n} value={s.n}>{s.n}. سورة {s.name} ({s.ayahs} آية)</option>
                  ))}
                </Select>
              </Field>
              <Field label="إلى الآية" required hint={errors.to}>
                <input type="number" min={1} max={surahToInfo.ayahs} value={to} onChange={(e) => setTo(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-sand-300 px-3 text-sm text-center font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10" />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-xl bg-sand-50 px-3.5 py-2.5 text-[12px] text-sand-600">
          <BookMarked size={15} className="text-primary-600" />
          <span>الصفحات: <b>{pages.from}{pages.to !== pages.from ? `–${pages.to}` : ''}</b></span>
          <span className="text-sand-300">|</span>
          <span>الجزء: <b>{juz} ({JUZ_NAMES[juz - 1]})</b></span>
          <span className="text-sand-300">|</span>
          <span>عدد الآيات: <b>{ayahsCount}</b></span>
          
          {isExtended && surahTo > surah && (
            <>
              <span className="text-sand-300">|</span>
              <span className="font-bold text-primary-700">تغطية {surahTo - surah + 1} سور</span>
            </>
          )}
        </div>
      </Card>

      {/* الخطوة 3: التقييم */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-primary-700 text-white text-[12px] font-bold flex items-center justify-center">3</span>
          <h2 className="font-bold text-sand-900">التقييم والأخطاء</h2>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-sand-700">الدرجة {errors.grade && <span className="text-red-500 text-[11px]">({errors.grade})</span>}</span>
            <span className={cn('text-2xl font-bold', grade >= 80 ? 'text-primary-700' : grade >= 65 ? 'text-amber-600' : 'text-red-500')}>{grade}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={grade} onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full accent-primary-600 h-2 cursor-pointer"
          />
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {QUICK_GRADES.map((g) => (
              <button key={g} onClick={() => setGrade(g)} className={cn('rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors', grade === g ? 'bg-primary-700 text-white border-primary-700' : 'bg-sand-50 text-sand-500 border-sand-200 hover:border-primary-300')}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-sand-200 px-3.5 py-2.5 mb-3">
          <span className="text-[13px] font-semibold text-sand-700">عدد الأخطاء</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setMistakesCount(Math.max(0, mistakesCount - 1))} className="w-8 h-8 rounded-lg bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-sand-600"><Minus size={15} /></button>
            <span className="w-8 text-center text-lg font-bold text-sand-900">{mistakesCount}</span>
            <button onClick={() => setMistakesCount(Math.min(30, mistakesCount + 1))} className="w-8 h-8 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center text-primary-700"><Plus size={15} /></button>
          </div>
        </div>

        {mistakesCount > 0 && (
          <div className="mb-1">
            <div className="text-[12.5px] font-semibold text-sand-600 mb-2">أنواع الأخطاء (اختياري — لتحليل نقاط الضعف)</div>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleMistake(t)}
                  className={cn('rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold border transition-all flex items-center gap-1',
                    mistakeTypes.includes(t) ? 'bg-red-500 text-white border-red-500' : 'bg-white text-sand-500 border-sand-200 hover:border-red-300')}
                >
                  {mistakeTypes.includes(t) && <Check size={12} />}
                  {MISTAKE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        <Field label="ملاحظات" className="mt-4">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: الحفظ جيد ويحتاج مراجعة الآيات 15–20" />
        </Field>
      </Card>

      <div className="sticky bottom-20 lg:bottom-4 z-20">
        <Button size="xl" className="w-full h-14 text-base rounded-2xl shadow-xl shadow-primary-800/25" onClick={save} loading={saving}>
          <PenLine size={19} /> حفظ التسميع وإشعار ولي الأمر
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-sand-400">
        <Badge tone="neutral">يُحفظ السجل في تاريخ الطالب ولا يُحذف</Badge>
      </div>
    </div>
  );
}
