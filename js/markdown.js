(function (root) {
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function inline(raw) {
    var html = "";
    var i = 0;
    while (i < raw.length) {
      if (raw.startsWith("**", i)) {
        var boldEnd = raw.indexOf("**", i + 2);
        if (boldEnd !== -1) {
          html += "<strong>" + inline(raw.slice(i + 2, boldEnd)) + "</strong>";
          i = boldEnd + 2;
          continue;
        }
      }
      if (raw[i] === "*" && raw[i + 1] !== "*") {
        var emEnd = raw.indexOf("*", i + 1);
        if (emEnd !== -1) {
          html += "<em>" + inline(raw.slice(i + 1, emEnd)) + "</em>";
          i = emEnd + 1;
          continue;
        }
      }
      if (raw[i] === "`") {
        var codeEnd = raw.indexOf("`", i + 1);
        if (codeEnd !== -1) {
          html += "<code>" + escapeHtml(raw.slice(i + 1, codeEnd)) + "</code>";
          i = codeEnd + 1;
          continue;
        }
      }
      if (raw[i] === "[") {
        var match = /^\[([^\]]+)\]\((https?:\/\/[^\s"'<>)]+)\)/.exec(raw.slice(i));
        if (match) {
          html += '<a href="' + escapeHtml(match[2]) + '" rel="noopener noreferrer" target="_blank">' + inline(match[1]) + "</a>";
          i += match[0].length;
          continue;
        }
      }
      html += escapeHtml(raw[i]);
      i += 1;
    }
    return html;
  }

  function isBlock(line) {
    return line.startsWith("```") || /^(#{1,3})\s+/.test(line) || /^> /.test(line) || /^[-*] /.test(line) || /^\d+\. /.test(line) || /^(-{3,}|\*{3,})$/.test(line.trim());
  }

  function render(src) {
    var lines = String(src == null ? "" : src).replace(/\r\n/g, "\n").split("\n");
    var html = "";
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (line.startsWith("```")) {
        var buf = [];
        i += 1;
        while (i < lines.length && !lines[i].startsWith("```")) {
          buf.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        html += "<pre><code>" + escapeHtml(buf.join("\n")) + "</code></pre>";
        continue;
      }
      if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
        html += "<hr>";
        i += 1;
        continue;
      }
      var heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        var level = heading[1].length;
        html += "<h" + level + ">" + inline(heading[2]) + "</h" + level + ">";
        i += 1;
        continue;
      }
      if (line.startsWith("> ")) {
        var quotes = [];
        while (i < lines.length && lines[i].startsWith("> ")) {
          quotes.push(inline(lines[i].slice(2)));
          i += 1;
        }
        html += "<blockquote><p>" + quotes.join("<br>") + "</p></blockquote>";
        continue;
      }
      if (/^[-*] /.test(line)) {
        var items = [];
        while (i < lines.length && /^[-*] /.test(lines[i])) {
          items.push("<li>" + inline(lines[i].slice(2)) + "</li>");
          i += 1;
        }
        html += "<ul>" + items.join("") + "</ul>";
        continue;
      }
      if (/^\d+\. /.test(line)) {
        var ordered = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          ordered.push("<li>" + inline(lines[i].replace(/^\d+\. /, "")) + "</li>");
          i += 1;
        }
        html += "<ol>" + ordered.join("") + "</ol>";
        continue;
      }
      if (line.trim() === "") {
        i += 1;
        continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() !== "" && !isBlock(lines[i])) {
        para.push(inline(lines[i]));
        i += 1;
      }
      html += "<p>" + para.join("<br>") + "</p>";
    }
    return html;
  }

  root.SugudouguMarkdown = { render: render };
  if (typeof document === "undefined") return;
  var input = document.getElementById("md-input");
  var preview = document.getElementById("md-preview");
  if (!input || !preview) return;

  function paint() {
    preview.innerHTML = render(input.value);
  }

  input.addEventListener("input", paint);
  document.getElementById("fill-md").addEventListener("click", function () {
    input.value = "# 見出し\n\n本文と **太字** です。\n\n- 項目\n\n<script>alert(1)</script>";
    paint();
  });
  document.getElementById("copy-md").addEventListener("click", async function () {
    var status = document.getElementById("md-status");
    try {
      await navigator.clipboard.writeText(preview.innerHTML);
      status.textContent = "プレビューのHTMLをコピーしました。";
    } catch (err) {
      status.textContent = "コピーできなかったので、プレビューを選択してコピーしてください。";
    }
  });
  paint();
})(typeof window !== "undefined" ? window : globalThis);
