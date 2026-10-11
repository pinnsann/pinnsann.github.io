# すぐ道具

ブラウザの中だけで動く道具のサイトです。このフォルダだけを公開します。

## ローカルで開く

このフォルダで次を実行し、`http://127.0.0.1:4173/` を開きます。

```powershell
python -m http.server 4173
```

## GitHub Pages と pinnsann.com

このフォルダの `CNAME` は `pinnsann.com` です。公開リポジトリのルートに置いてください。

1. このフォルダだけを、新しい公開リポジトリのルートにする
2. Settings、Pages、Deploy from a branch で、ブランチは `main`、フォルダは `/ (root)` にする
3. Custom domain が `pinnsann.com` になっていることを確認する。なっていなければ、その文字列を入れて保存する
4. そのあとで Cloudflare の DNS を足す。先に DNS だけ向けると、別の人のサイトに取られることがある

Cloudflare では、プロキシはオフ（DNS only、灰色の雲）にします。オレンジの雲のままだと、HTTPSの証明書が発行されません。

`pinnsann.com` の A レコードを4つ。

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

AAAA レコードを4つ。

- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

`www` は CNAME で、GitHubのユーザー名を使った `ユーザー名.github.io` に向けます。

証明書の横にチェックが出たら、Pages の Enforce HTTPS をオンにします。`www.pinnsann.com` は `pinnsann.com` へ飛びます。
