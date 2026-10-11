(function (root) {
  function analyze(text) {
    var raw = String(text == null ? "" : text);
    var codePoints = Array.from(raw).length;
    var noBreaks = Array.from(raw.replace(/\r\n|\n|\r/g, "")).length;
    var noSpace = Array.from(raw.replace(/\s/g, "")).length;
    var lines = raw === "" ? 0 : raw.split(/\r\n|\n|\r/).length;
    return {
      codePoints: codePoints,
      noBreaks: noBreaks,
      noSpace: noSpace,
      lines: lines,
      sheets: noBreaks === 0 ? 0 : Math.ceil(noBreaks / 400),
      remainder: noBreaks === 0 ? 0 : noBreaks % 400,
      xOver: Math.max(0, codePoints - 280),
      xLeft: Math.max(0, 280 - codePoints),
      igLeft: Math.max(0, 2200 - codePoints)
    };
  }

  root.SugudouguCounter = { analyze: analyze };
  if (typeof document === "undefined") return;

  var input = document.getElementById("source");
  if (!input) return;
  var nodes = {
    chars: document.getElementById("count-chars"),
    nobreak: document.getElementById("count-nobreak"),
    space: document.getElementById("count-space"),
    lines: document.getElementById("count-lines"),
    sheets: document.getElementById("count-sheets"),
    x: document.getElementById("count-x"),
    ig: document.getElementById("count-ig")
  };

  function paint() {
    var info = analyze(input.value);
    nodes.chars.textContent = String(info.codePoints);
    nodes.nobreak.textContent = String(info.noBreaks);
    nodes.space.textContent = String(info.noSpace);
    nodes.lines.textContent = String(info.lines);
    nodes.sheets.textContent = info.sheets + "枚";
    nodes.sheets.dataset.sheets = String(info.sheets);
    nodes.sheets.dataset.remainder = String(info.remainder);
    nodes.x.textContent = info.xOver ? info.xOver + "字オーバー" : "あと" + info.xLeft;
    nodes.ig.textContent = "あと" + info.igLeft;
  }

  input.addEventListener("input", paint);
  document.getElementById("fill-counter").addEventListener("click", function () {
    input.value = "あいうえお";
    paint();
  });
  paint();
})(typeof window !== "undefined" ? window : globalThis);
