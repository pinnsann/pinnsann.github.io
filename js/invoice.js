(function (root) {
  function yen(n) {
    return new Intl.NumberFormat("ja-JP").format(n) + "円";
  }

  function formatJpDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    return Number(m[1]) + "年" + Number(m[2]) + "月" + Number(m[3]) + "日";
  }

  function calc(lines) {
    var groups = { "10": 0, "8": 0, "0": 0 };
    var normalized = lines.map(function (line) {
      var qty = Number(line.qty);
      var price = Number(line.price);
      var rate = groups.hasOwnProperty(String(line.tax)) ? String(line.tax) : "10";
      var amount = Number.isFinite(qty) && Number.isFinite(price) ? Math.round(qty * price) : 0;
      groups[rate] += amount;
      return { date: line.date || "", desc: line.desc || "", qty: qty, price: price, rate: rate, amount: amount };
    });
    var taxes = {
      "10": Math.floor(groups["10"] * 10 / 100),
      "8": Math.floor(groups["8"] * 8 / 100),
      "0": 0
    };
    var total = groups["10"] + groups["8"] + groups["0"] + taxes["10"] + taxes["8"];
    return { lines: normalized, groups: groups, taxes: taxes, total: total };
  }

  root.SugudouguInvoice = { calc: calc, yen: yen, formatJpDate: formatJpDate };

  if (typeof document === "undefined") return;

  var KEY = "sugudougu.invoice.v1";
  var form = document.getElementById("invoice-form");
  var lineBox = document.getElementById("lines");
  if (!form || !lineBox) return;

  var totalEl = document.getElementById("invoice-total");
  var sheetBody = document.getElementById("sheet-body");
  var regWarn = document.getElementById("reg-warn");
  var clearBtn = document.getElementById("clear-invoice");
  var armed = false;

  function todayIso() {
    var d = new Date();
    var local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function field(name) {
    return form.elements[name];
  }

  function addLine(data) {
    var row = document.createElement("div");
    row.className = "line";
    var date = document.createElement("input");
    date.type = "date";
    date.name = "lineDate";
    date.value = data && data.date ? data.date : "";
    var desc = document.createElement("input");
    desc.name = "desc";
    desc.placeholder = "内容";
    desc.value = data && data.desc ? data.desc : "";
    var qty = document.createElement("input");
    qty.name = "qty";
    qty.type = "number";
    qty.min = "0";
    qty.step = "0.01";
    qty.value = data && data.qty != null ? data.qty : "1";
    var price = document.createElement("input");
    price.name = "price";
    price.type = "number";
    price.step = "1";
    price.value = data && data.price != null ? data.price : "0";
    var tax = document.createElement("select");
    tax.name = "tax";
    [["10", "10%"], ["8", "8%軽減"], ["0", "非課税"]].forEach(function (pair) {
      var opt = document.createElement("option");
      opt.value = pair[0];
      opt.textContent = pair[1];
      if (data && String(data.tax) === pair[0]) opt.selected = true;
      tax.appendChild(opt);
    });
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-small";
    remove.textContent = "削除";
    remove.addEventListener("click", function () {
      if (lineBox.children.length === 1) return;
      row.remove();
      render();
    });
    [date, desc, qty, price, tax].forEach(function (el) { row.appendChild(el); });
    row.appendChild(remove);
    lineBox.appendChild(row);
  }

  function readLines() {
    return Array.prototype.map.call(lineBox.children, function (row) {
      return {
        date: row.querySelector('[name="lineDate"]').value,
        desc: row.querySelector('[name="desc"]').value,
        qty: row.querySelector('[name="qty"]').value,
        price: row.querySelector('[name="price"]').value,
        tax: row.querySelector('[name="tax"]').value
      };
    });
  }

  function readState() {
    return {
      issuer: field("issuer").value,
      reg: field("reg").value.trim(),
      address: field("address").value,
      tel: field("tel").value,
      bank: field("bank").value,
      client: field("client").value,
      date: field("date").value,
      due: field("due").value,
      number: field("number").value,
      notes: field("notes").value,
      lines: readLines()
    };
  }

  function cell(tag, text, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    return el;
  }

  function render() {
    var state = readState();
    var result = calc(state.lines);
    if (totalEl) {
      totalEl.dataset.total = String(result.total);
      totalEl.textContent = "合計 " + yen(result.total);
    }
    if (regWarn) {
      var ok = state.reg === "" || /^T\d{13}$/.test(state.reg);
      regWarn.textContent = ok ? "" : "登録番号は、Tのあとに数字13桁です。空欄でも印刷できます。";
    }
    if (!sheetBody) return;
    sheetBody.replaceChildren();
    var head = document.createElement("div");
    head.appendChild(cell("h2", "請求書"));
    var meta = document.createElement("p");
    meta.textContent = "請求番号 " + (state.number || "（未入力）") + "　発行日 " + (formatJpDate(state.date) || "（未入力）");
    head.appendChild(meta);
    if (state.due) head.appendChild(cell("p", "お支払期限 " + formatJpDate(state.due)));
    sheetBody.appendChild(head);

    var to = document.createElement("p");
    to.appendChild(cell("strong", (state.client || "（宛先未入力）") + " 御中"));
    sheetBody.appendChild(to);

    var from = document.createElement("p");
    from.appendChild(cell("span", state.issuer || "（発行者未入力）"));
    from.appendChild(document.createElement("br"));
    from.appendChild(cell("span", "登録番号 " + (state.reg || "（未入力）")));
    if (state.address) {
      from.appendChild(document.createElement("br"));
      from.appendChild(cell("span", state.address));
    }
    if (state.tel) {
      from.appendChild(document.createElement("br"));
      from.appendChild(cell("span", state.tel));
    }
    sheetBody.appendChild(from);

    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    ["日付", "内容", "数量", "単価", "金額", "税率"].forEach(function (label, index) {
      hr.appendChild(cell("th", label, index > 1 ? "right" : ""));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    result.lines.forEach(function (line) {
      if (!line.desc && !line.amount) return;
      var tr = document.createElement("tr");
      tr.appendChild(cell("td", formatJpDate(line.date || state.date)));
      tr.appendChild(cell("td", line.desc || "（内容未入力）"));
      tr.appendChild(cell("td", String(line.qty), "right"));
      tr.appendChild(cell("td", yen(Math.round(line.price || 0)), "right"));
      tr.appendChild(cell("td", yen(line.amount), "right"));
      tr.appendChild(cell("td", line.rate === "0" ? "非課税" : line.rate + "%", "right"));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    sheetBody.appendChild(table);

    var totals = document.createElement("table");
    totals.className = "totals";
    [["10%対象", result.groups["10"]], ["消費税10%", result.taxes["10"]], ["8%対象", result.groups["8"]], ["消費税8%", result.taxes["8"]], ["非課税", result.groups["0"]], ["合計", result.total]].forEach(function (pair) {
      var tr = document.createElement("tr");
      tr.appendChild(cell("th", pair[0]));
      tr.appendChild(cell("td", yen(pair[1]), "right"));
      totals.appendChild(tr);
    });
    sheetBody.appendChild(totals);
    sheetBody.appendChild(cell("p", "消費税は、税率ごとの税抜合計に対して1円未満を切り捨てています。"));
    if (state.bank) sheetBody.appendChild(cell("p", "振込先 " + state.bank));
    if (state.notes) sheetBody.appendChild(cell("p", state.notes));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* プライベートモードでは保存しない */ }
  }

  function applyState(state) {
    ["issuer", "reg", "address", "tel", "bank", "client", "date", "due", "number", "notes"].forEach(function (name) {
      if (state[name] != null) field(name).value = state[name];
    });
    lineBox.replaceChildren();
    (state.lines && state.lines.length ? state.lines : [{}]).forEach(addLine);
    render();
  }

  document.getElementById("add-line").addEventListener("click", function () {
    addLine();
    render();
  });
  document.getElementById("fill-sample").addEventListener("click", function () {
    applyState({
      issuer: "山田太郎",
      reg: "T1234567890123",
      address: "東京都千代田区1-1",
      tel: "03-0000-0000",
      bank: "サンプル銀行 本店 普通 1234567 ヤマダタロウ",
      client: "株式会社サンプル",
      date: field("date").value || todayIso(),
      due: "",
      number: "INV-001",
      notes: "お振込手数料はご負担ください。",
      lines: [
        { desc: "作業一式", qty: "1", price: "10000", tax: "10" },
        { desc: "書籍", qty: "1", price: "2000", tax: "8" }
      ]
    });
  });
  document.getElementById("print-invoice").addEventListener("click", function () {
    render();
    window.print();
  });
  clearBtn.addEventListener("click", function () {
    if (!armed) {
      armed = true;
      clearBtn.textContent = "もう一度押すと消えます";
      setTimeout(function () {
        armed = false;
        clearBtn.textContent = "入力を消す";
      }, 3000);
      return;
    }
    try { localStorage.removeItem(KEY); } catch (err) { /* 保存できない環境では無視 */ }
    form.reset();
    field("date").value = todayIso();
    lineBox.replaceChildren();
    addLine();
    armed = false;
    clearBtn.textContent = "入力を消す";
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    render();
  });

  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) { saved = null; }
  if (saved && saved.issuer != null) applyState(saved);
  else {
    field("date").value = todayIso();
    addLine();
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
