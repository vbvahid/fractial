import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gcd,
  lcm,
  parseFractionPart,
  parseInteger,
  parseFraction,
  calculate,
  simplify,
  simplifyDecimalFriendly,
  gcdLcm,
  formatFraction,
  formatFractionDecimal,
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
  assert.throws(() => parseFractionPart('1.234'), /۲ رقم/);
  assert.throws(() => parseFractionPart('abc'), /عدد معتبر/);
  assert.throws(() => parseFractionPart(''), /وارد کنید/);
});

test('تجزیه عدد صحیح (بدون مقیاس، برای GCD/LCM)', () => {
  assert.equal(parseInteger('15'), 15n);
  assert.equal(parseInteger('-4'), -4n);
  assert.equal(parseInteger(' 42 '), 42n);
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