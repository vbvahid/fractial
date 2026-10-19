import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gcd,
  lcm,
  parseFractionPart,
  parseInteger,
  parseFraction,
  calculate,
  calculateMany,
  simplify,
  simplifyDecimalFriendly,
  gcdLcm,
  formatFraction,
  formatFractionDecimal,
  convertToDivisor,
  toDecimal,
} from '../js/fraction.js';

test('GCD / LCM', () => {
  assert.equal(gcd(12n, 18n), 6n);
  assert.equal(gcd(7n, 13n), 1n);
  assert.equal(gcd(0n, 5n), 5n);
  assert.equal(lcm(4n, 6n), 12n);
  assert.equal(lcm(0n, 5n), 0n);
  assert.equal(gcd(-12n, 18n), 6n);
});

test('تجزیه بخش کسری (پشتیبانی از اعشار ۲ رقم، مقیاس ۱۰۰)', () => {
  assert.equal(parseFractionPart('15'), 1500n);
  assert.equal(parseFractionPart('1.5'), 150n);
  assert.equal(parseFractionPart('0.05'), 5n);
  assert.equal(parseFractionPart('-2.25'), -225n);
  assert.equal(parseFractionPart(' 3 '), 300n);
  // ارقام فارسی
  assert.equal(parseFractionPart('۱۵'), 1500n);
  assert.equal(parseFractionPart('۱.۵'), 150n);
  assert.equal(parseFractionPart('-۲.۲۵'), -225n);
  // ارقام عربی
  assert.equal(parseFractionPart('١٥'), 1500n);
  assert.equal(parseFractionPart('١.٥'), 150n);
  assert.throws(() => parseFractionPart('1.234'), /۲ رقم/);
  assert.throws(() => parseFractionPart('abc'), /عدد معتبر/);
  assert.throws(() => parseFractionPart(''), /وارد کنید/);
});

test('تجزیه عدد صحیح (بدون مقیاس، برای GCD/LCM)', () => {
  assert.equal(parseInteger('15'), 15n);
  assert.equal(parseInteger('-4'), -4n);
  assert.equal(parseInteger(' 42 '), 42n);
  // ارقام فارسی
  assert.equal(parseInteger('۱۵'), 15n);
  assert.equal(parseInteger('-۴'), -4n);
  // ارقام عربی
  assert.equal(parseInteger('١٥'), 15n);
  assert.equal(parseInteger('٤'), 4n);
  assert.throws(() => parseInteger('1.5'), /عدد صحیح/);
  assert.throws(() => parseInteger('abc'), /عدد صحیح/);
  assert.throws(() => parseInteger(''), /وارد کنید/);
});

test('ساده‌سازی استاندارد', () => {
  assert.equal(formatFraction(simplify('2', '6')), '1/3');
  assert.equal(formatFraction(simplify('21', '42')), '1/2');
  assert.equal(formatFraction(simplify('2', '4')), '1/2');
  assert.equal(formatFraction(simplify('0', '5')), '0');
  assert.equal(formatFraction(simplify('-3', '-6')), '1/2');
  assert.equal(formatFraction(simplify('3', '-6')), '-1/2');
});

test('صورت اعشاری در ساده‌سازی', () => {
  // 1.5/3 = 150/300 = 1/2
  assert.equal(formatFraction(simplify('1.5', '3')), '1/2');
  // 0.5/2 = 50/200 = 1/4
  assert.equal(formatFraction(simplify('0.5', '2')), '1/4');
});

test('عملیات جمع و تفریق', () => {
  const a = parseFraction('1', '2');
  const b = parseFraction('1', '3');
  assert.equal(formatFraction(calculate(a, b, 'add').simplified), '5/6');
  assert.equal(formatFraction(calculate(a, b, 'sub').simplified), '1/6');
  assert.equal(formatFraction(calculate(a, b, 'add').raw), '5/6');

  const c = parseFraction('1', '4');
  const d = parseFraction('1', '4');
  assert.equal(formatFraction(calculate(c, d, 'sub').simplified), '0');
});

test('عملیات ضرب و تقسیم', () => {
  const a = parseFraction('2', '3');
  const b = parseFraction('3', '4');
  assert.equal(formatFraction(calculate(a, b, 'mul').simplified), '1/2');
  assert.equal(formatFraction(calculate(a, b, 'div').simplified), '8/9');
  // ضرب نتیجه ساده‌نشده متفاوت: (1/2)*(1/3) = 1/6
  const e = parseFraction('1', '2');
  const f = parseFraction('1', '3');
  const m = calculate(e, f, 'mul');
  assert.equal(formatFraction(m.raw), '1/6');
  assert.equal(formatFraction(m.simplified), '1/6');
});

test('GCD و LCM از ورودی صحیح', () => {
  const r = gcdLcm('12', '18');
  assert.equal(r.gcd, 6n);
  assert.equal(r.lcm, 36n);
  const r2 = gcdLcm('-4', '6');
  assert.equal(r2.gcd, 2n);
  assert.equal(r2.lcm, 12n);
  assert.throws(() => gcdLcm('0', '0'), /تعریف نشده/);
});

test('حالات خطا', () => {
  assert.throws(() => parseFraction('1', '0'), /صفر/);
  assert.throws(() => calculate(parseFraction('1', '2'), parseFraction('0', '5'), 'div'), /صفر/);
  assert.throws(() => calculate(parseFraction('1', '2'), parseFraction('1', '3'), 'xyz'), /نامعتبر/);
});

test('عملیات روی بیش از دو کسر (calculateMany) — جمع و تفریق چپ‌به‌راست', () => {
  const f = (n, d) => parseFraction(n, d);

  // 1/2 + 1/3 + 1/6 = 1
  const three = calculateMany([f('1', '2'), f('1', '3'), f('1', '6')], 'add');
  assert.equal(formatFraction(three.simplified), '1');
  assert.equal(three.count, 3);

  // 1/2 + 1/4 + 1/4 = 1
  const three2 = calculateMany([f('1', '2'), f('1', '4'), f('1', '4')], 'add');
  assert.equal(formatFraction(three2.simplified), '1');

  // 1 - 1/3 - 1/3 = 1/3
  const sub = calculateMany([f('1', '1'), f('1', '3'), f('1', '3')], 'sub');
  assert.equal(formatFraction(sub.simplified), '1/3');

  // نام‌ساده‌شدهٔ زنجیره‌ای: (1/2 + 1/3) = 5/6 سپس (5/6 + 1/6) = 36/36
  // (بدون تقسیم بر GCD، دقیقاً همان مسیر محاسبهٔ دستی چپ‌به‌راست)
  assert.equal(formatFraction(three.raw), '36/36');
});

test('عملیات روی بیش از دو کسر — ضرب و تقسیم چپ‌به‌راست', () => {
  const f = (n, d) => parseFraction(n, d);

  // (2/3) × (3/4) × (1/2) = 1/4
  const mul = calculateMany([f('2', '3'), f('3', '4'), f('1', '2')], 'mul');
  assert.equal(formatFraction(mul.simplified), '1/4');
  assert.equal(formatFraction(mul.raw), '6/24');

  // ((1/2) ÷ (1/4)) ÷ (1/3) = 2 ÷ (1/3) = 6
  const div = calculateMany([f('1', '2'), f('1', '4'), f('1', '3')], 'div');
  assert.equal(formatFraction(div.simplified), '6');
});

test('عملیات روی ۴ تا ۱۰ کسر', () => {
  const ones = (count) => Array.from({ length: count }, () => parseFraction('1', '2'));
  // ۴ کسر: (1/2)^4 = 1/16
  assert.equal(formatFraction(calculateMany(ones(4), 'mul').simplified), '1/16');
  // ۱۰ کسر (حداکثر مجاز): (1/2)^10 = 1/1024
  const ten = calculateMany(ones(10), 'mul');
  assert.equal(ten.count, 10);
  assert.equal(formatFraction(ten.simplified), '1/1024');
  // جمع ۱۰ تا 1/2 = 5
  assert.equal(formatFraction(calculateMany(ones(10), 'add').simplified), '5');
});

test('محدودیت تعداد کسرها در calculateMany', () => {
  const f = (n, d) => parseFraction(n, d);
  // کمتر از ۲ کسر مجاز نیست
  assert.throws(() => calculateMany([f('1', '2')], 'add'), /حداقل ۲ کسر/);
  assert.throws(() => calculateMany([], 'add'), /حداقل ۲ کسر/);
  // بیشتر از ۱۰ کسر مجاز نیست
  const eleven = Array.from({ length: 11 }, () => f('1', '2'));
  assert.throws(() => calculateMany(eleven, 'add'), /حداکثر ۱۰ کسر/);
  // ورودی نامعتبر
  assert.throws(() => calculateMany(null, 'add'), /حداقل ۲ کسر/);
});

test('خطای تقسیم بر کسر صفر در calculateMany', () => {
  const f = (n, d) => parseFraction(n, d);
  assert.throws(() => calculateMany([f('1', '2'), f('0', '5'), f('1', '3')], 'div'), /صفر/);
});

test('ساده‌سازی اعشاری‌دوست (مخرج صحیح، صورت تا ۲ رقم اعشار)', () => {
  // 1/32 = 0.25/8 (مخرج ۸، تصویر ۲ رقم)
  const r1 = simplifyDecimalFriendly('1', '32');
  assert.equal(formatFractionDecimal(r1), '0.25/8');
  
  // 2/6 = 1/3 (استاندارد، مخرج ۳)
  const r2 = simplifyDecimalFriendly('2', '6');
  assert.equal(formatFractionDecimal(r2), '1/3');
  
  // 21/42 = 0.5/1 (مخرج ۱، تصویر ۰.۵)
  const r3 = simplifyDecimalFriendly('21', '42');
  assert.equal(formatFractionDecimal(r3), '0.5');
  
  // 1.5/3 = 0.5/1
  const r4 = simplifyDecimalFriendly('1.5', '3');
  assert.equal(formatFractionDecimal(r4), '0.5');
  
  // 3/4 = 0.75/1
  const r5 = simplifyDecimalFriendly('3', '4');
  assert.equal(formatFractionDecimal(r5), '0.75');
  
  // 5/8 = 1.25/2 (مخرج ۲، تصویر ۱.۲۵ — دو رقم اعشار)
  const r6 = simplifyDecimalFriendly('5', '8');
  assert.equal(formatFractionDecimal(r6), '1.25/2');
  
  // 1/8 = 0.25/2 (مخرج ۲، تصویر ۰.۲۵ — دو رقم اعشار)
  const r7 = simplifyDecimalFriendly('1', '8');
  assert.equal(formatFractionDecimal(r7), '0.25/2');
  
  // 2/4 = 0.5/1
  const r8 = simplifyDecimalFriendly('2', '4');
  assert.equal(formatFractionDecimal(r8), '0.5');
  
  // منفی‌ها
  const r9 = simplifyDecimalFriendly('-1', '32');
  assert.equal(formatFractionDecimal(r9), '-0.25/8');
});

test('تبدیل کسر به مخرج مشخص (مقسم)', () => {
  // 1/2 با مقسم 6 = 3/6
  assert.equal(formatFractionDecimal(convertToDivisor('1', '2', '6')), '3/6');
  // 1/2 با مقسم 3 = 1.5/3
  assert.equal(formatFractionDecimal(convertToDivisor('1', '2', '3')), '1.5/3');
  // 1/32 با مقسم 8 = 0.25/8
  assert.equal(formatFractionDecimal(convertToDivisor('1', '32', '8')), '0.25/8');
  // مقدار کسر تغییر نمی‌کند: 2/3 با مقسم 6 = 4/6
  assert.equal(formatFractionDecimal(convertToDivisor('2', '3', '6')), '4/6');
  // کسر منفی
  assert.equal(formatFractionDecimal(convertToDivisor('-1', '2', '6')), '-3/6');
  // کسر صفر
  assert.equal(formatFractionDecimal(convertToDivisor('0', '5', '9')), '0/9');
  // ورودی فارسی و عربی
  assert.equal(formatFractionDecimal(convertToDivisor('۱', '۲', '۶')), '3/6');
  assert.equal(formatFractionDecimal(convertToDivisor('١', '٢', '٦')), '3/6');
  // کسر مقیاس‌دار: 1.5/3 = 1/2 → با مقسم 6 = 3/6
  assert.equal(formatFractionDecimal(convertToDivisor('1.5', '3', '6')), '3/6');
  // مقدار اعشاری خروجی با ورودی برابر است
  assert.equal(toDecimal(convertToDivisor('1', '2', '6').value), '0.5');
  assert.equal(toDecimal(convertToDivisor('1', '3', '9').value), '0.333333');
  // رگرسیون: مقدار کمتر از ۰٫۰۱ نباید در مقدار اعشاری صفر شود (باگ تقسیم صحیح)
  const tiny = convertToDivisor('1', '32', '8'); // = 0.25/8 = 0.03125
  assert.equal(formatFractionDecimal(tiny), '0.25/8');
  assert.equal(toDecimal(tiny.value), '0.03125');
  assert.equal(toDecimal(convertToDivisor('1', '8', '2').value), '0.125');
  // مقدار اعشاری مستقل از انتخاب مقسم ثابت می‌ماند
  assert.equal(
    toDecimal(convertToDivisor('1', '3', '9').value),
    toDecimal(convertToDivisor('1', '3', '30').value)
  );
});

test('تبدیل به مقسم بدون محدودیت ۲ رقم اعشار (هر مقسمی پذیرفته می‌شود)', () => {
  // قبلاً مقسم ۳ برای مخرج ۳ خطا می‌داد؛ حالا دقیق و ساده است: 1/3 با مقسم 3 → 1/3
  assert.equal(formatFractionDecimal(convertToDivisor('1', '3', '3')), '1/3');
  assert.equal(convertToDivisor('1', '3', '3').exact, true);
  // 10/3 با مقسم 9 = 30/9 (عدد صحیح، هر تعداد رقم)
  assert.equal(formatFractionDecimal(convertToDivisor('10', '3', '9')), '30/9');
  // صورت با اعشار: 1/6 با مقسم 9 = 1.5/9
  assert.equal(formatFractionDecimal(convertToDivisor('1', '6', '9')), '1.5/9');
  // مقسم بزرگ (چند هزار) هم دقیق است — دیگر پیام خطا ندارد
  assert.equal(formatFractionDecimal(convertToDivisor('1', '2', '1040')), '520/1040');
  assert.equal(formatFractionDecimal(convertToDivisor('1', '2', '1000000')), '500000/1000000');
  // مقسم غیرمضرب → گرد شده و exact=false (مثلاً 1/3 با مقسم 2 → 0.67/2 ≈ 0.333)
  const approx = convertToDivisor('1', '3', '2');
  assert.equal(approx.exact, false);
  assert.equal(formatFractionDecimal(approx), '0.67/2');
  assert.equal(toDecimal(approx.value), '0.335');
  // مقدار گرد شده به مقدار اصلی نزدیک است (خطا کمتر از یک واحد مقیاس)
  assert.equal(formatFractionDecimal(convertToDivisor('2', '3', '7')), '4.67/7');
});

test('خطاهای تبدیل به مقسم', () => {
  // مقسم صفر
  assert.throws(() => convertToDivisor('1', '2', '0'), /صفر/);
  // مقسم منفی
  assert.throws(() => convertToDivisor('1', '2', '-6'), /مثبت/);
  // مقسم اعشاری
  assert.throws(() => convertToDivisor('1', '2', '2.5'), /عدد صحیح/);
  // مخرج صفر
  assert.throws(() => convertToDivisor('1', '0', '6'), /صفر/);
  // مقسم خالی
  assert.throws(() => convertToDivisor('1', '2', ''), /وارد کنید/);
});