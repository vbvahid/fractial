/**
 * ماژول ریاضی محاسبات کسری — بدون وابستگی به DOM
 * همه محاسبات با BigInt برای جلوگیری از خطای دقت اعداد بزرگ
 */

/** ساخت خطای اعتبارسنجی با پیام فارسی */
function err(message) {
  const e = new Error(message);
  e.validation = true;
  return e;
}

/** تبدیل ارقام فارسی و عربی به ارقام انگلیسی (ASCII) */
function normalizeDigits(s) {
  return s
    .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 0x30))
    .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/[،]/g, ',')
    .replace(/[٫]/g, '.');
}

/** بزرگ‌ترین مقسوم مشترک (اقلیدسی) — ورودی باید BigInt غیرمنفی باشد */
export function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** کوچک‌ترین مضرب مشترک */
export function lcm(a, b) {
  const ga = a < 0n ? -a : a;
  const gb = b < 0n ? -b : b;
  if (ga === 0n || gb === 0n) return 0n;
  return (ga / gcd(ga, gb)) * gb;
}

/**
 * تجزیه بخش کسری (صورت یا مخرج) — اعشار تا ۲ رقم با مقیاس ۱۰۰
 * خروجی: عدد صحیح BigInt که ۱۰۰ برابر مقدار واقعی است
 * مثال: "1.5" → 150n (نمایندهٔ 1.50)
 */
export function parseFractionPart(raw) {
  const s = normalizeDigits(String(raw ?? '').trim().replace(/[٬,\s]/g, ''));
  if (s === '') throw err('لطفاً مقدار را وارد کنید');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) throw err(`«${s}» یک عدد معتبر نیست`);

  const neg = s.startsWith('-');
  const unsigned = s.replace(/^[+-]/, '');
  const [intPart, fracPart = ''] = unsigned.split('.');

  if (fracPart.length > 2) {
    throw err('مقدار تنها می‌تواند تا ۲ رقم اعشار داشته باشد');
  }

  const padded = fracPart.padEnd(2, '0');
  const value = BigInt(intPart + padded);
  return neg ? -value : value;
}

/**
 * تجزیه عدد صحیح ساده (برای GCD/LCM) — اعشار پذیرفته نمی‌شود
 */
export function parseInteger(raw) {
  const s = normalizeDigits(String(raw ?? '').trim().replace(/[٬,\s]/g, ''));
  if (s === '') throw err('لطفاً مقدار را وارد کنید');
  if (!/^[+-]?\d+$/.test(s)) throw err(`«${s}» یک عدد صحیح معتبر نیست`);
  return BigInt(s);
}

/**
 * تجزیه ورودی صورت/مخرج کسر.
 * خروجی: { num, den } هر دو BigInt با gcd برابر ۱ و مخرج مثبت.
 */
export function parseFraction(numRaw, denRaw) {
  if (String(denRaw ?? '').trim().replace(/[٬,\s]/g, '') === '0') {
    throw err('مخرج کسر نمی‌تواند صفر باشد');
  }
  let num = parseFractionPart(numRaw);
  let den = parseFractionPart(denRaw);
  if (den === 0n) throw err('مخرج کسر نمی‌تواند صفر باشد');
  return normalize(num, den);
}

/** نرمال‌سازی: علامت در صورت، تقسیم بر GCD */
export function normalize(num, den) {
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  if (g > 1n) {
    num /= g;
    den /= g;
  } else if (g === 0n) {
    // حالت num=0, den=0 — که در parseFraction رد می‌شود
    throw err('کسر نامعتبر است');
  }
  return { num, den };
}

/** کسر نام‌ساده‌شده (برای نمایش مسیر محاسبات) */
function raw(num, den) {
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  return { num, den };
}

/**
 * انجام عملیات روی دو کسر
 * @param {"add"|"sub"|"mul"|"div"} op
 */
export function calculate(a, b, op) {
  const { num: n1, den: d1 } = a;
  const { num: n2, den: d2 } = b;

  let rn, rd;
  switch (op) {
    case 'add':
      rn = n1 * d2 + n2 * d1;
      rd = d1 * d2;
      break;
    case 'sub':
      rn = n1 * d2 - n2 * d1;
      rd = d1 * d2;
      break;
    case 'mul':
      rn = n1 * n2;
      rd = d1 * d2;
      break;
    case 'div':
      if (n2 === 0n) throw err('تقسیم بر کسر صفر امکان‌پذیر نیست');
      rn = n1 * d2;
      rd = d1 * n2;
      break;
    default:
      throw err('عملیات نامعتبر است');
  }

  if (rd === 0n) throw err('نتیجه مخرج صفر دارد');
  return { raw: raw(rn, rd), simplified: normalize(rn, rd) };
}

/**
 * ساده‌سازی کسر (استاندارد: تقسیم بر GCD) — خروجی صورت و مخرج صحیح
 */
export function simplify(numRaw, denRaw) {
  return parseFraction(numRaw, denRaw);
}

/**
 * ساده‌سازی کسر با پشتیبانی از اعشار در صورت (تا ۲ رقم) — مخرج همیشه عدد صحیح
 * پیدا می‌کند بزرگترین مقسوم k که:
 * - مخرج / k عدد صحیح باشد
 * - (صورت × 100) / k عدد صحیح باشد (تا ۲ رقم اعشار)
 * خروجی: { num, den } با num مقیاس ۱۰۰ (مثال: 0.25 → 25n) و den صحیح
 */
export function simplifyDecimalFriendly(numRaw, denRaw) {
  // parseFractionPart مقیاس ۱۰۰ برمی‌گرداند
  const numScaled = parseFractionPart(numRaw); // مثل 1 → 100n، 1.5 → 150n
  const denScaled = parseFractionPart(denRaw); // مخرج هم مقیاس ۱۰۰ می‌شود (مثال: 32 → 3200n)
  
  if (denScaled === 0n) throw err('مخرج کسر نمی‌تواند صفر باشد');
  
  // مخرج واقعی = denScaled / 100
  const denReal = denScaled / 100n;
  if (denScaled % 100n !== 0n) {
    throw err('مخرج باید عدد صحیح باشد');
  }
  
  // بزرگترین مقسوم مشترک بین مخرج واقعی و صورت‌مقیاس
  // این بزرگترین k است که هر دو را تقسیم کند
  const k = gcd(denReal, numScaled);
  
  if (k <= 1n) {
    // قابل ساده‌سازی نیست، برگردان مقیاس ۱۰۰
    return { num: numScaled, den: denReal };
  }
  
  // ساده‌سازی شده
  const newNumScaled = numScaled / k; // همچنان مقیاس ۱۰۰
  const newDenReal = denReal / k;     // عدد صحیح
  
  return { num: newNumScaled, den: newDenReal };
}

/**
 * تبدیل کسر به کسر هم‌ارز با مخرج مشخص (مقسم)
 * مثال: 1/2 با مقسم 6 → 3/6 و 1/32 با مقسم 8 → 0.25/8 و 1/3 با مقسم 3 → 1/3
 *
 * هیچ محدودیتی در تعداد ارقام اعشار صورت خروجی وجود ندارد؛ اگر مقسم مضرب مخرج
 * (پس از ساده‌سازی) باشد، تبدیل دقیق است و صورت به‌صورت کامل نمایش داده می‌شود.
 * در غیر این صورت (مثلاً 1/3 با مقسم 2) نزدیک‌ترین مقدار با گرد کردن محاسبه
 * و با «≈» نمایش داده می‌شود — یعنی هر مقسمی پذیرفته می‌شود.
 *
 * @param {string} numRaw صورت کسر (تا ۲ رقم اعشار)
 * @param {string} denRaw مخرج کسر (تا ۲ رقم اعشار)
 * @param {string} divisorRaw مقسم (عدد صحیح مثبت) — همان مخرج جدید
 * @returns {{ num: bigint, den: bigint, value: { num: bigint, den: bigint },
 *            exact: boolean, original: { num: bigint, den: bigint } }}
 *   «num» با مقیاس ۱۰۰ است (برای formatFractionDecimal) و «den» همان مقسم واردشده.
 *   «value» کسر دقیقِ هم‌ارز است (برای toDecimal) با مخرج مقسم × ۱۰۰ — مثال: 1/2 با مقسم 6 →
 *   { num: 300n, den: 6n, value: { num: 300n, den: 600n } } که «3/6» نمایش داده می‌شود.
 *   «exact» مشخص می‌کند تبدیل بدون گرد کردن انجام شده یا نه.
 */
export function convertToDivisor(numRaw, denRaw, divisorRaw) {
  const original = parseFraction(numRaw, denRaw);
  const divisor = parseInteger(divisorRaw);
  if (divisor === 0n) throw err('مقسم نمی‌تواند صفر باشد');
  if (divisor < 0n) throw err('مقسم باید عددی مثبت باشد');

  // صورت/مخرج پایه با مقیاس ۱۰۰ برای پشتیبانی از ۲ رقم اعشار
  const baseNumScaled = original.num * 100n;   // مقیاس ۱۰۰
  const baseDen = original.den;                // صحیح

  // صورت جدید با مقیاس ۱۰۰ = (مقدار کسر × مقسم) × ۱۰۰
  const scaledNum = baseNumScaled * divisor;

  if (scaledNum % baseDen === 0n) {
    // تبدیل دقیق — هر تعداد رقم اعشار؛ صورت کامل نمایش داده می‌شود
    const newNum = scaledNum / baseDen;        // با مقیاس ۱۰۰
    // کسر دقیقِ هم‌ارز (برای toDecimal): مقدار = (newNum / 100) ÷ divisor = newNum / (divisor × 100)
    // نکته: این‌جا نباید newNum را بر ۱۰۰ تقسیم صحیح کرد، چون برای مقادیر کمتر از ۰٫۰۱
    // نتیجه‌اش صفر می‌شود (مثال: 0.25/8 → newNum=25 → 25n/100n = 0n).
    const value = { num: newNum, den: divisor * 100n };
    return { num: newNum, den: divisor, value, exact: true, original };
  }

  // تبدیل دقیق ممکن نیست (مقسم مضرب مخرج ساده‌شده نیست) → نزدیک‌ترین مقدار با گرد کردن.
  // مقدار هر واحد مقسم برابر 1/divisor است؛ صورت را با نزدیک‌ترین مضرب 0.01 حساب می‌کنیم
  // تا هم‌خوان با مقیاس ۱۰۰ نمایش داده شود:  newNum ≈ (num/den) × divisor × 100
  const target = baseNumScaled * divisor;                 // = مقدار × مقسم × ۱۰۰
  const q = target / baseDen;
  const r = target % baseDen;
  const newNum = (r * 2n >= baseDen) ? q + 1n : q;         // گرد کردن نیم‌به‌بالا، مقیاس ۱۰۰

  // مقدار اعشاری = (newNum / 100) ÷ divisor = newNum / (divisor × 100)
  const value = { num: newNum, den: divisor * 100n };
  return { num: newNum, den: divisor, value, exact: false, original };
}

/**
 * انجام عملیات روی ۲ تا ۱۰ کسر (چپ به راست)
 *
 * fold چپ‌به‌راست: ((f1 op f2) op f3) ... — همان نتیجه‌ای که محاسبهٔ دستی
 * زنجیره‌ای می‌دهد. برای بخش «نام‌ساده‌شده» هم همان زنجیره روی کسرهای نام‌ساده‌شده
 * تکرار می‌شود تا نمایش مسیر محاسبات برای هر تعداد کسر معنی‌دار بماند.
 *
 * @param {Array<{num: bigint, den: bigint}>} fractions حداقل ۲ و حداکثر ۱۰ کسر
 * @param {"add"|"sub"|"mul"|"div"} op
 * @returns {{ raw: { num: bigint, den: bigint }, simplified: { num: bigint, den: bigint }, count: number }}
 */
export function calculateMany(fractions, op) {
  if (!Array.isArray(fractions) || fractions.length < 2) {
    throw err('برای محاسبه حداقل ۲ کسر لازم است');
  }
  if (fractions.length > 10) {
    throw err('حداکثر ۱۰ کسر می‌توانید وارد کنید');
  }

  let acc = fractions[0];
  let rawAcc = { num: fractions[0].num, den: fractions[0].den };

  for (let i = 1; i < fractions.length; i++) {
    const next = fractions[i];
    const step = calculate(acc, next, op);
    acc = step.simplified;
    // همان عملیات روی کسر نام‌ساده‌شده (بدون نرمال‌سازی) برای نمایش مسیر
    const rawStep = combineRaw(rawAcc, { num: next.num, den: next.den }, op);
    rawAcc = rawStep;
  }

  return { raw: rawAcc, simplified: acc, count: fractions.length };
}

/**
 * ترکیب خام دو کسر بدون نرمال‌سازی — فقط برای نمایش «نام‌ساده‌شده»
 * (منطق آن عیناً همان calculate است، بدون تقسیم بر GCD)
 */
function combineRaw(a, b, op) {
  const { num: n1, den: d1 } = a;
  const { num: n2, den: d2 } = b;

  let rn, rd;
  switch (op) {
    case 'add':
      rn = n1 * d2 + n2 * d1;
      rd = d1 * d2;
      break;
    case 'sub':
      rn = n1 * d2 - n2 * d1;
      rd = d1 * d2;
      break;
    case 'mul':
      rn = n1 * n2;
      rd = d1 * d2;
      break;
    case 'div':
      if (n2 === 0n) throw err('تقسیم بر کسر صفر امکان‌پذیر نیست');
      rn = n1 * d2;
      rd = d1 * n2;
      break;
    default:
      throw err('عملیات نامعتبر است');
  }

  if (rd === 0n) throw err('نتیجه مخرج صفر دارد');
  return raw(rn, rd);
}

/** محاسبه GCD و LCM دو عدد صحیح */
export function gcdLcm(aRaw, bRaw) {
  const a = parseInteger(aRaw);
  const b = parseInteger(bRaw);
  if (a === 0n && b === 0n) throw err('GCD و LCM برای دو صفر تعریف نشده‌اند');
  return { gcd: gcd(a, b), lcm: lcm(a, b) };
}

/** نمایش کسر به صورت رشته: «1/3» یا «5» اگر مخرج ۱ باشد */
export function formatFraction(f) {
  return f.den === 1n ? f.num.toString() : `${f.num}/${f.den}`;
}

/** نمایش عدد BigInt با جداکننده هزارگان */
export function formatInt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** تبدیل کسر به عدد اعشاری (برای نمایش راهنما، حداکثر ۶ رقم) */
export function toDecimal(f) {
  if (f.den === 1n) return f.num.toString();
  const neg = f.num < 0n;
  let n = neg ? -f.num : f.num;
  const scale = 10n ** 6n;
  const scaled = (n * scale) / f.den;
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(6, '0').replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? '.' + frac : ''}`;
}

/**
 * فرمت نمایش برای کسر اعشاری‌دوست: "0.25/8" یا "1.5/3" یا "5" (اگر مخرج ۱)
 */
export function formatFractionDecimal(f) {
  if (f.den === 1n) {
    // فقط صورت نمایش داده شود
    const whole = f.num / 100n;
    const frac = (f.num % 100n).toString().padStart(2, '0').replace(/0+$/, '');
    return frac ? `${whole}.${frac}` : whole.toString();
  }
  // صورت را به اعشار تبدیل
  const neg = f.num < 0n;
  const absNum = neg ? -f.num : f.num;
  const whole = absNum / 100n;
  const frac = (absNum % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  const numStr = frac ? `${whole}.${frac}` : whole.toString();
  return `${neg ? '-' : ''}${numStr}/${f.den}`;
}