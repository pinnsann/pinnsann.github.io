(function (root) {
  function fit(width, height, maxEdge) {
    var edge = Math.max(width, height);
    var scale = edge > maxEdge ? maxEdge / edge : 1;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  async function compressImage(file, options) {
    var bitmap = await createImageBitmap(file);
    var size = fit(bitmap.width, bitmap.height, options.maxEdge);
    var canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    var blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, options.type, options.quality);
    });
    if (!blob) throw new Error("この形式では書き出せませんでした。JPEGにしてみてください。");
    return { blob: blob, width: size.width, height: size.height };
  }

  root.SugudouguImage = { fit: fit, compressImage: compressImage };
  if (typeof document === "undefined") return;

  var form = document.getElementById("image-form");
  var meta = document.getElementById("image-meta");
  var frame = document.getElementById("image-preview");
  var link = document.getElementById("image-download");
  var currentUrl = "";
  if (!form || !meta) return;

  function ext(type) {
    if (type === "image/webp") return "webp";
    if (type === "image/png") return "png";
    return "jpg";
  }

  async function run(file) {
    meta.textContent = "処理しています。";
    link.hidden = true;
    var type = form.elements.type.value;
    var result = await compressImage(file, {
      maxEdge: Number(form.elements.maxEdge.value),
      quality: Number(form.elements.quality.value),
      type: type
    });
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(result.blob);
    frame.replaceChildren();
    var img = document.createElement("img");
    img.alt = "圧縮後のプレビュー";
    img.src = currentUrl;
    frame.appendChild(img);
    var before = file.size;
    var after = result.blob.size;
    meta.dataset.width = String(result.width);
    meta.dataset.height = String(result.height);
    meta.dataset.after = String(after);
    meta.textContent = result.width + "×" + result.height + " / " + before + "バイト → " + after + "バイト";
    link.href = currentUrl;
    link.download = "resized." + ext(type);
    link.hidden = false;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var file = form.elements.file.files[0];
    if (!file) {
      meta.textContent = "画像ファイルを選んでください。";
      return;
    }
    try { await run(file); } catch (err) { meta.textContent = err.message || "この画像は読み込めませんでした。"; }
  });

  document.getElementById("sample-image").addEventListener("click", async function () {
    var canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1600;
    var ctx = canvas.getContext("2d");
    var gradient = ctx.createLinearGradient(0, 0, 2400, 1600);
    gradient.addColorStop(0, "#21584c");
    gradient.addColorStop(1, "#c2412d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2400, 1600);
    ctx.fillStyle = "#fffaf2";
    ctx.font = "120px sans-serif";
    ctx.fillText("すぐ道具", 120, 860);
    var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
    try {
      await run(new File([blob], "sample.png", { type: "image/png" }));
    } catch (err) {
      meta.textContent = err.message || "試し画像を処理できませんでした。";
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
