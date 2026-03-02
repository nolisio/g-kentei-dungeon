# G Kentei Dungeon

G検定の基礎問題をRPG風に解く、Next.js ベースの学習アプリです。

## Structure

- `app/layout.js`: ルートレイアウトとメタデータ
- `app/page.js`: トップページ
- `app/components/dungeon-quiz.js`: クイズ進行とUI本体
- `app/data/questions.js`: 問題データ
- `app/globals.css`: 全体スタイル

## Run

```bash
cd g-kentei-dungeon
npm install
npm run lint
npm run dev
```

ブラウザで `http://localhost:3000` を開くと確認できます。

## CI/CD

- Pull Request では `.github/workflows/ci.yml` が走り、`npm ci` と `npm run build` を検証します。
- Pull Request では ESLint も実行され、コード品質をチェックします。
- `main` への push では `.github/workflows/deploy-pages.yml` が走り、GitHub Pages 向けに静的書き出ししてデプロイします。
- GitHub 側の `Settings > Pages` は `Build and deployment` を `GitHub Actions` にしてください。

## Next

- 問題数を増やし、分野別のダンジョンに分ける
- 正答率や履歴を `localStorage` や DB に保存する
- ログイン機能やランキング機能を追加する
