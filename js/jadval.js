/* ============================================================
   EPIC MODE — jadval.js
   تقویم هجری شمسی — پرت وفادار از jalaali-js (lyall/jalaali 1.2.0)
   + لایهٔ API پروژه (نام ماه‌ها، روز هفته، ISO شمسی)
   ============================================================ */
window.EPIC = window.EPIC || {};
(() => {
  // ---- هستهٔ الگوریتم (Jalaali years starting the 33-year rule) ----
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  const div = (a, b) => ~~(a / b);
  const mod = (a, b) => a - ~~(a / b) * b;

  function jalCal(jy) {
    const bl = breaks.length, gy = jy + 621;
    let leapJ = -14, jp = breaks[0], jm, jump = 0, leap, leapG, march, n;
    if (jy < jp || jy >= breaks[bl - 1]) throw new Error('Invalid Jalaali year ' + jy);
    for (let i = 1; i < bl; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }

  function isLeapJalaaliYear(jy) { return jalCal(jy).leap === 0; }
  function jalaaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalaaliYear(jy) ? 30 : 29;
  }

  function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }
  function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f, jd, jm;
    if (k >= 0) {
      if (k <= 185) { return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }; }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  }

  function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
      + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }
  function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  }

  // ---- لایهٔ پروژه ----
  const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const WEEK = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const WEEK_MIN = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  function toJalali(date) {
    const j = d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()));
    const w = (date.getDay() + 1) % 7;               // شنبه = ۰
    return {
      jy: j.jy, jm: j.jm, jd: j.jd,
      leap: isLeapJalaaliYear(j.jy),
      wk: w, wkName: WEEK[w], wkMin: WEEK_MIN[w],
      monthName: MONTHS[j.jm - 1],
      monthLen: jalaaliMonthLength(j.jy, j.jm),
    };
  }
  function fromJalali(jy, jm, jd) {
    const g = d2g(j2d(jy, jm, jd));
    return new Date(g.gy, g.gm - 1, g.gd);
  }
  function isoJalali(date) {
    const j = toJalali(date);
    return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  }
  function todayIso(now = new Date()) { return isoJalali(now); }
  function addDaysIso(iso, n) {
    const [jy, jm, jd] = iso.split('/').map(Number);
    const d = fromJalali(jy, jm, jd);
    d.setDate(d.getDate() + n);
    return isoJalali(d);
  }
  function daysBetween(isoA, isoB) {
    const p = s => s.split('/').map(Number);
    const a = p(isoA), b = p(isoB);
    return j2d(b[0], b[1], b[2]) - j2d(a[0], a[1], a[2]);
  }
  function weekdayOfIso(iso) {           // شنبه = ۰
    const [jy, jm, jd] = iso.split('/').map(Number);
    return (fromJalali(jy, jm, jd).getDay() + 1) % 7;
  }

  window.EPIC.jad = {
    toJalali, fromJalali, isoJalali, todayIso, addDaysIso, daysBetween, weekdayOfIso,
    jMonthName: m => MONTHS[m - 1], jWeek: WEEK, jWeekMin: WEEK_MIN,
    jMonthLen: jalaaliMonthLength, isLeapJ: isLeapJalaaliYear,
  };
})();
