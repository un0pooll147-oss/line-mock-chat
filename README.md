# 擬似スマホ画面メーカー

映画・ドラマ撮影用の擬似スマホ画面を作成・演出できるWebアプリです。

## Vercelへのデプロイ手順

### 方法1：GitHub経由（推奨）

1. [GitHub](https://github.com) にアカウント登録・ログイン
2. 新しいリポジトリを作成（例：`mock-phone-screen-maker`）
3. このフォルダの中身をすべてアップロード（またはgit pushでプッシュ）
4. [Vercel](https://vercel.com) にGitHubアカウントでログイン
5. 「Add New Project」→ 作成したリポジトリを選択
6. そのまま「Deploy」ボタンを押すだけ！

### 方法2：Vercel CLIで直接デプロイ

```bash
npm install -g vercel
cd mock-phone-screen-maker
npm install
vercel
```

## ローカルで動かす場合

```bash
npm install
npm run dev
```

→ http://localhost:3000 で確認できます。

## 技術スタック

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- html2canvas
- lucide-react
