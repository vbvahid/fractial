/**
 * اتصال رابط کاربری به ماژول ریاضی
 */
import {
  parseFraction,
  calculate,
  calculateMany,
  simplify,
  simplifyDecimalFriendly,
  gcdLcm,
  formatFraction,
  formatFractionDecimal,
  toDecimal,
  formatInt,
  convertToDivisor,
} from './fraction.js?v=20261019';

console.log('[fractial] app.js loaded, readyState:', document.readyState);

// --- ابزارهای DOM: از querySelector استفاده می‌کنیم ---
const $ = (id) => document.querySelector('#' + id);

function showResult(el, show = true) { if (el) el.hidden = !show; }
function setError(el, msg) { if (!el) return; if (msg) { el.textContent = msg; el.hidden = false; } else { el.hidden = true; el.textContent = ''; } }
function clearErrors(...els) { els.forEach(e => setError(e, '')); }

/**
 * پاک کردن تمام فیلدهای ورودی و نتیجه/خطا در یک بخش
 */
function createClearHandler(inputs, resultEl, errorEl) {
  return () => {
    inputs.forEach(input => {
      if (input) input.value = '';
    });
    if (resultEl) showResult(resultEl, false);
    if (errorEl) setError(errorEl, '');
    // فوکوس روی اولین فیلد برای UX بهتر
    if (inputs[0]) inputs[0].focus();
  };
}

function init() {
  console.log('[fractial] init() called, readyState:', document.readyState);

  // ============================================================
  // بخش ۱: عملیات روی ۲ تا ۱۰ کسر (پویا)
  // ============================================================
  const arithList = $('arith-list');
  const arithError = $('arith-error');
  const arithResult = $('arith-result');
  const arithRaw = $('arith-raw');
  const arithSimp = $('arith-simp');
  const arithDec = $('arith-dec');
  const arithClear = $('arith-clear');
  const arithAdd = $('arith-add');
  const arithRemove = $('arith-remove');
  const arithCount = $('arith-count');

  const MIN_FRACTIONS = 2;
  const MAX_FRACTIONS = 10;

  // نام ترتیبی کسرها به فارسی
  const ORDINALS = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم', 'نهم', 'دهم'];

  // فهرست کسرها؛ دو کسر اول همان فیلدهای موجود در HTML هستند (جلوگیری از رگرسیون)
  const fractions = [
    { num: $('a-num'), den: $('a-den') },
    { num: $('b-num'), den: $('b-den') },
  ];

  console.log('[fractial] Arithmetic Elements:', {
    arithList: !!arithList, arithAdd: !!arithAdd, arithRemove: !!arithRemove,
    arithCount: !!arithCount, arithError: !!arithError, arithResult: !!arithResult,
  });

  /** ورودی‌های کسر جدید (سوم به بعد) را می‌سازد و به فهرست اضافه می‌کند */
  function addFractionRow(index) {
    const group = document.createElement('div');
    group.className = 'fraction-group arith-extra';

    const label = document.createElement('label');
    label.textContent = `کسر ${ORDINALS[index]}`;

    const row = document.createElement('div');
    row.className = 'fraction-row';

    const num = document.createElement('input');
    num.type = 'text';
    num.id = `arith-num-${index + 1}`;
    num.placeholder = 'صورت';
    num.autocomplete = 'off';

    const bar = document.createElement('span');
    bar.className = 'frac-bar';
    bar.textContent = '/';

    const den = document.createElement('input');
    den.type = 'text';
    den.id = `arith-den-${index + 1}`;
    den.placeholder = 'مخرج';
    den.autocomplete = 'off';

    row.appendChild(num);
    row.appendChild(bar);
    row.appendChild(den);
    group.appendChild(label);
    group.appendChild(row);
    arithList.appendChild(group);

    const pair = { num, den, group };
    // Enter روی هر فیلد = جمع
    [num, den].forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleArithmetic('add');
      });
    });
    return pair;
  }

  /** به‌روزرسانی وضعیت دکمه‌ها، شمارنده و برچسب‌ها پس از هر تغییر تعداد */
  function refreshCountUI() {
    const n = fractions.length;
    if (arithCount) {
      arithCount.textContent = `${n.toLocaleString('fa-IR')} کسر از ${MAX_FRACTIONS.toLocaleString('fa-IR')}`;
    }
    if (arithAdd) arithAdd.disabled = n >= MAX_FRACTIONS;
    if (arithRemove) arithRemove.disabled = n <= MIN_FRACTIONS;
    if (arithList) arithList.classList.toggle('many', n > 2);
    // برچسب کسرها به‌روز شود (در صورت حذف و افزودن مجدد)
    fractions.forEach((f, i) => {
      const label = f.group?.querySelector('label');
      if (label) label.textContent = `کسر ${ORDINALS[i]}`;
    });
  }

  function increaseFraction() {
    if (fractions.length >= MAX_FRACTIONS) return;
    const index = fractions.length;
    fractions.push(addFractionRow(index));
    refreshCountUI();
    fractions[index].num.focus();
  }

  function decreaseFraction() {
    if (fractions.length <= MIN_FRACTIONS) return;
    const removed = fractions.pop();
    if (removed.group) removed.group.remove();
    refreshCountUI();
    // پاک کردن نتیجه/خطای قبلی چون ورودی تغییر کرده
    showResult(arithResult, false);
    setError(arithError, '');
  }

  function handleArithmetic(op) {
    console.log('[fractial] handleArithmetic:', op, 'count:', fractions.length);
    clearErrors(arithError);
    try {
      // فقط فیلدهای پرشده محاسبه می‌شوند (اگر کسر اضافه‌شده خالی رها شده باشد نادیده گرفته می‌شود)
      const parsed = [];
      fractions.forEach(f => {
        const emptyNum = String(f.num?.value ?? '').trim() === '';
        const emptyDen = String(f.den?.value ?? '').trim() === '';
        if (emptyNum && emptyDen) return; // کسر کاملاً خالی نادیده گرفته می‌شود
        parsed.push(parseFraction(f.num.value, f.den.value));
      });

      if (parsed.length < MIN_FRACTIONS) {
        throw Object.assign(new Error('برای محاسبه حداقل ۲ کسر لازم است'), { validation: true });
      }

      const res = parsed.length === 2
        ? calculate(parsed[0], parsed[1], op)
        : calculateMany(parsed, op);

      if (arithRaw) arithRaw.textContent = formatFraction(res.raw);
      if (arithSimp) arithSimp.textContent = formatFraction(res.simplified);
      if (arithDec) arithDec.textContent = toDecimal(res.simplified);
      showResult(arithResult, true);
      console.log('[fractial] Result shown:', formatFraction(res.simplified), `(${parsed.length} کسر)`);
    } catch (e) {
      console.error('[fractial] Error:', e);
      showResult(arithResult, false);
      setError(arithError, e.validation ? e.message : 'خطای غیرمنتظره: ' + e.message);
    }
  }

  const opButtons = document.querySelectorAll('#section-arithmetic .ops .btn[data-op]');
  console.log('[fractial] Operation buttons found:', opButtons.length);
  opButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[fractial] Button clicked:', btn.dataset.op);
      handleArithmetic(btn.dataset.op);
    });
  });

  // دکمه‌های افزودن/کاهش تعداد کسر
  if (arithAdd) arithAdd.addEventListener('click', increaseFraction);
  if (arithRemove) arithRemove.addEventListener('click', decreaseFraction);

  // دکمه پاک کردن — فقط مقادیر را خالی می‌کند و تعداد کسرها را حفظ می‌کند
  if (arithClear) {
    arithClear.addEventListener('click', () => {
      fractions.forEach(f => {
        if (f.num) f.num.value = '';
        if (f.den) f.den.value = '';
      });
      showResult(arithResult, false);
      setError(arithError, '');
      if (fractions[0].num) fractions[0].num.focus();
    });
  }

  [fractions[0].num, fractions[0].den, fractions[1].num, fractions[1].den].forEach(el => {
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleArithmetic('add'); });
  });

  refreshCountUI();

  // ============================================================
  // بخش ۲: GCD / LCM
  // ============================================================
  const gcdA = $('gcd-a'), gcdB = $('gcd-b');
  const gcdBtn = $('gcd-btn');
  const gcdClear = $('gcd-clear');
  const gcdError = $('gcd-error');
  const gcdResult = $('gcd-result');
  const gcdOut = $('gcd-out');
  const lcmOut = $('lcm-out');

  console.log('[fractial] GCD Elements:', { gcdA: !!gcdA, gcdB: !!gcdB, gcdBtn: !!gcdBtn, gcdClear: !!gcdClear });

  if (gcdBtn) {
    gcdBtn.addEventListener('click', () => {
      console.log('[fractial] GCD button clicked');
      clearErrors(gcdError);
      try {
        const res = gcdLcm(gcdA.value, gcdB.value);
        if (gcdOut) gcdOut.textContent = formatInt(res.gcd);
        if (lcmOut) lcmOut.textContent = formatInt(res.lcm);
        showResult(gcdResult, true);
      } catch (e) {
        console.error('[fractial] GCD Error:', e);
        showResult(gcdResult, false);
        setError(gcdError, e.validation ? e.message : 'خطای غیرمنتظره: ' + e.message);
      }
    });
  }

  // دکمه پاک کردن برای بخش GCD/LCM
  if (gcdClear) {
    gcdClear.addEventListener('click', createClearHandler([gcdA, gcdB], gcdResult, gcdError));
  }

  [gcdA, gcdB].forEach(el => {
    if (el) el.addEventListener('keydown', e => e.key === 'Enter' && gcdBtn?.click());
  });

  // ============================================================
  // بخش ۳: ساده‌سازی کسر
  // ============================================================
  const sNum = $('s-num'), sDen = $('s-den');
  const simpBtn = $('simp-btn');
  const simpClear = $('simp-clear');
  const simpError = $('simp-error');
  const simpResult = $('simp-result');
  const simpOut = $('simp-out');
  const simpDec = $('simp-dec');

  console.log('[fractial] Simplify Elements:', { sNum: !!sNum, sDen: !!sDen, simpBtn: !!simpBtn, simpClear: !!simpClear });

  if (simpBtn) {
    simpBtn.addEventListener('click', () => {
      console.log('[fractial] Simplify button clicked');
      clearErrors(simpError);
      try {
        const res = simplifyDecimalFriendly(sNum.value, sDen.value);
        if (simpOut) simpOut.textContent = formatFractionDecimal(res);
        if (simpDec) simpDec.textContent = toDecimal(res);
        showResult(simpResult, true);
      } catch (e) {
        console.error('[fractial] Simplify Error:', e);
        showResult(simpResult, false);
        setError(simpError, e.validation ? e.message : 'خطای غیرمنتظره: ' + e.message);
      }
    });
  }

  // دکمه پاک کردن برای بخش ساده‌سازی
  if (simpClear) {
    simpClear.addEventListener('click', createClearHandler([sNum, sDen], simpResult, simpError));
  }

  [sNum, sDen].forEach(el => {
    if (el) el.addEventListener('keydown', e => e.key === 'Enter' && simpBtn?.click());
  });

  // ============================================================
  // بخش ۴: تبدیل کسر به مخرج مشخص (مقسم)
  // ============================================================
  const dvNum = $('dv-num'), dvDen = $('dv-den'), dvDivisor = $('dv-divisor');
  const dvBtn = $('dv-btn');
  const dvClear = $('dv-clear');
  const dvError = $('dv-error');
  const dvResult = $('dv-result');
  const dvOut = $('dv-out');
  const dvDec = $('dv-dec');

  console.log('[fractial] Divisor Elements:', { dvNum: !!dvNum, dvDen: !!dvDen, dvDivisor: !!dvDivisor, dvBtn: !!dvBtn, dvClear: !!dvClear });

  if (dvBtn) {
    dvBtn.addEventListener('click', () => {
      console.log('[fractial] Divisor button clicked');
      clearErrors(dvError);
      try {
        const res = convertToDivisor(dvNum.value, dvDen.value, dvDivisor.value);
        // «≈» یعنی مقسم مضرب مخرج ساده‌شده نبود و مقدار گرد شده است.
        const prefix = res.exact ? '' : '≈ ';
        if (dvOut) dvOut.textContent = prefix + formatFractionDecimal(res);
        if (dvDec) dvDec.textContent = prefix + toDecimal(res.value);
        showResult(dvResult, true);
      } catch (e) {
        console.error('[fractial] Divisor Error:', e);
        showResult(dvResult, false);
        setError(dvError, e.validation ? e.message : 'خطای غیرمنتظره: ' + e.message);
      }
    });
  }

  // دکمه پاک کردن برای بخش تبدیل مقسم
  if (dvClear) {
    dvClear.addEventListener('click', createClearHandler([dvNum, dvDen, dvDivisor], dvResult, dvError));
  }

  [dvNum, dvDen, dvDivisor].forEach(el => {
    if (el) el.addEventListener('keydown', e => e.key === 'Enter' && dvBtn?.click());
  });

  console.log('[fractial] init() completed');
}

/**
 * Register Service Worker for PWA offline support
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Detect base path for GitHub Pages (/fractial/) or root (/)
      const basePath = '/fractial';
      const registration = await navigator.serviceWorker.register(basePath + '/sw.js', {
        scope: basePath + '/'
      });
      console.log('[fractial] SW registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, prompt user to refresh
              if (confirm('نسخه جدیدی از برنامه موجود است. برای به‌روزرسانی صفحه را باز کنید؟')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('[fractial] SW registration failed:', error);
    }
  }
}

/**
 * Handle PWA install prompt
 */
function setupInstallPrompt() {
  let deferredPrompt = null;
  const installBtn = document.createElement('button');
  installBtn.type = 'button';
  installBtn.className = 'btn install-btn';
  installBtn.textContent = 'نصب برنامه';
  installBtn.style.display = 'none';
  installBtn.setAttribute('aria-label', 'نصب فریکشن به عنوان برنامه');

  // Add to header
  const header = document.querySelector('header');
  if (header) {
    header.appendChild(installBtn);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-flex';
    console.log('[fractial] Install prompt available');
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[fractial] Install outcome:', outcome);
    deferredPrompt = null;
  });

  // Hide button if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    installBtn.style.display = 'none';
  }

  // Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('[fractial] App installed');
    installBtn.style.display = 'none';
    deferredPrompt = null;
  });
}

// همیشه برای DOMContentLoaded صبر کن
console.log('[fractial] Waiting for DOMContentLoaded');
document.addEventListener('DOMContentLoaded', () => {
  init();
  registerServiceWorker();
  setupInstallPrompt();
});