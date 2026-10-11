(function (root) {
  function randomInt(max) {
    if (max <= 1) return 0;
    var limit = Math.floor(0x100000000 / max) * max;
    var buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % max;
    }
  }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randomInt(i + 1);
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function generatePassword(options) {
    var ambiguous = !!options.ambiguous;
    var sets = [];
    if (options.lower) sets.push(ambiguous ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz");
    if (options.upper) sets.push(ambiguous ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if (options.digit) sets.push(ambiguous ? "23456789" : "0123456789");
    if (options.symbol) sets.push("!@#$%^&*_-+=?");
    if (!sets.length) return { error: "文字種を1つ以上選んでください。" };
    var length = Number(options.length);
    if (!Number.isInteger(length) || length < sets.length || length > 128) {
      return { error: "長さは、選んだ文字種の数以上、128以下にしてください。" };
    }
    var pool = sets.join("");
    var chars = sets.map(function (set) { return set[randomInt(set.length)]; });
    while (chars.length < length) chars.push(pool[randomInt(pool.length)]);
    return { value: shuffle(chars).join("") };
  }

  root.SugudouguPassword = { generatePassword: generatePassword };
  if (typeof document === "undefined") return;

  var form = document.getElementById("password-form");
  var list = document.getElementById("password-output");
  var error = document.getElementById("password-error");
  var status = document.getElementById("copy-status");
  if (!form || !list) return;

  function checked(name) { return form.elements[name].checked; }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {
      var area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      return ok;
    }
  }

  function addItem(value) {
    var li = document.createElement("li");
    var span = document.createElement("span");
    span.textContent = value;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-small";
    btn.textContent = "コピー";
    btn.addEventListener("click", async function () {
      var ok = await copyText(value);
      status.textContent = ok ? "コピーしました。" : "コピーできなかったので、文字を選択してコピーしてください。";
    });
    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    error.textContent = "";
    status.textContent = "";
    list.replaceChildren();
    var count = Number(form.elements.count.value);
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      error.textContent = "個数は1から10です。";
      return;
    }
    for (var i = 0; i < count; i++) {
      var result = generatePassword({
        length: Number(form.elements.length.value),
        lower: checked("lower"),
        upper: checked("upper"),
        digit: checked("digit"),
        symbol: checked("symbol"),
        ambiguous: checked("ambiguous")
      });
      if (result.error) {
        error.textContent = result.error;
        list.replaceChildren();
        return;
      }
      addItem(result.value);
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
