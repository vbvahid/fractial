/**
 * اتصال رابط کاربری به ماژول ریاضی
 */
import {
  parseFraction,
  calculate,
  simplify,
  simplifyDecimalFriendly,
  gcdLcm,
  formatFraction,
  formatFractionDecimal,
  toDecimal,
  formatInt,
} from './fraction.js?v=20261005';

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
  // بخش ۱: عملیات روی دو کسر
  // ============================================================
  const aNum = $('a-num'), aDen = $('a-den');
  const bNum = $('b-num'), bDen = $('b-den');
  const arithError = $('arith-error');
  const arithResult = $('arith-result');
  const arithRaw = $('arith-raw');
  const arithSimp = $('arith-simp');
  const arithDec = $('arith-dec');
  const arithClear = $('arith-clear');

  console.log('[fractial] Elements found:', { aNum: !!aNum, aDen: !!aDen, bNum: !!bNum, bDen: !!bDen, arithError: !!arithError, arithResult: !!arithResult, arithRaw: !!arithRaw, arithSimp: !!arithSimp, arithDec: !!arithDec, arithClear: !!arithClear });

  function getFractionA() { return parseFraction(aNum.value, aDen.value); }
  function getFractionB() { return parseFraction(bNum.value, bDen.value); }

  function handleArithmetic(op) {
    console.log('[fractial] handleArithmetic:', op);
    clearErrors(arithError);
    try {
      const a = getFractionA();
      const b = getFractionB();
      const res = calculate(a, b, op);
      if (arithRaw) arithRaw.textContent = formatFraction(res.raw);
      if (arithSimp) arithSimp.textContent = formatFraction(res.simplified);
      if (arithDec) arithDec.textContent = toDecimal(res.simplified);
      showResult(arithResult, true);
      console.log('[fractial] Result shown:', formatFraction(res.simplified));
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

  // دکمه پاک کردن برای بخش محاسبه
  if (arithClear) {
    arithClear.addEventListener('click', createClearHandler([aNum, aDen, bNum, bDen], arithResult, arithError));
  }

  [aNum, aDen, bNum, bDen].forEach(el => {
    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleArithmetic('add'); });
  });

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