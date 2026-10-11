(function (root) {
  var ERAS = [
    { name: "明治", start: "1868-01-25", end: "1912-07-29" },
    { name: "大正", start: "1912-07-30", end: "1926-12-24" },
    { name: "昭和", start: "1926-12-25", end: "1989-01-07" },
    { name: "平成", start: "1989-01-08", end: "2019-04-30" },
    { name: "令和", start: "2019-05-01", end: "9999-12-31" }
  ];

  function parseIso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return iso;
  }

  function eraOf(iso) {
    if (!parseIso(iso)) return { error: "日付が正しくありません。" };
    if (iso < ERAS[0].start) return { error: "1868年1月25日より前は変換できません。" };
    for (var i = 0; i < ERAS.length; i++) {
      if (iso >= ERAS[i].start && iso <= ERAS[i].end) {
        return { era: ERAS[i].name, year: +iso.slice(0, 4) - +ERAS[i].start.slice(0, 4) + 1, iso: iso };
      }
    }
    return { error: "対応する元号がありません。" };
  }

  function formatWareki(result) {
    if (result.error) return result.error;
    var parts = result.iso.split("-");
    var label = result.year === 1 ? "元" : String(result.year);
    return result.era + label + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }

  function weekday(iso) {
    var parts = iso.split("-");
    return "日月火水木金土"[new Date(+parts[0], +parts[1] - 1, +parts[2]).getDay()];
  }

  function toGregorian(eraName, year, month, day) {
    var era = ERAS.filter(function (item) { return item.name === eraName; })[0];
    if (!era) return { error: "元号を選んでください。" };
    if (!Number.isInteger(year) || year < 1) return { error: "年は1以上の整数です。" };
    var gy = +era.start.slice(0, 4) + year - 1;
    var iso = gy + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    if (!parseIso(iso)) return { error: "その月日は存在しません。" };
    if (iso < era.start || iso > era.end) return { error: eraName + "にその日付はありません。" };
    return { iso: iso, label: formatWareki(eraOf(iso)) + "（" + weekday(iso) + "）" };
  }

  function age(birth, on) {
    if (!parseIso(birth) || !parseIso(on)) return { error: "日付が正しくありません。" };
    if (on < birth) return { error: "基準日が生年月日より前です。" };
    var years = +on.slice(0, 4) - +birth.slice(0, 4);
    if (on.slice(5) < birth.slice(5)) years--;
    return { years: years };
  }

  root.SugudouguCalendar = {
    eraOf: eraOf,
    formatWareki: formatWareki,
    weekday: weekday,
    toGregorian: toGregorian,
    age: age
  };

  if (typeof document === "undefined") return;
  var birth = document.getElementById("birth");
  var asof = document.getElementById("asof");
  var out = document.getElementById("cal-out");
  var greg = document.getElementById("greg-out");
  if (!birth || !asof || !out) return;

  function todayIso() {
    var d = new Date();
    var local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function paint() {
    if (!birth.value) {
      out.textContent = "生年月日を入れると、和暦と満年齢を表示します。";
      return;
    }
    var wareki = eraOf(birth.value);
    var years = age(birth.value, asof.value || todayIso());
    if (wareki.error) out.textContent = wareki.error;
    else if (years.error) out.textContent = formatWareki(wareki) + "（" + weekday(birth.value) + "）。" + years.error;
    else out.textContent = formatWareki(wareki) + "（" + weekday(birth.value) + "）。基準日時点の満年齢は" + years.years + "歳です。";
  }

  if (!asof.value) asof.value = todayIso();
  birth.addEventListener("input", paint);
  asof.addEventListener("input", paint);
  document.getElementById("to-gregorian").addEventListener("click", function () {
    var result = toGregorian(
      document.getElementById("era").value,
      Number(document.getElementById("era-year").value),
      Number(document.getElementById("era-month").value),
      Number(document.getElementById("era-day").value)
    );
    greg.textContent = result.error || (result.iso + " " + result.label);
  });
  paint();
})(typeof window !== "undefined" ? window : globalThis);
