# DocMeg — AI時代の新たなファクトチェック

論文の管理・意味検索（RAG）・AI マーカー・関連グラフ・**引用ファクトチェック**をひとつにした文献管理アプリ。
現在は **フロントエンドのみ**。追加した文献・PDF・本文はブラウザ内（IndexedDB）に保存されます。Supabase / Python RAG API への接続は `src/lib/api.ts` の中身を差し替えるだけで行える構成です。

```bash
npm install
npm run dev
```

## 技術スタック

| 層 | 採用 | 理由 |
|---|---|---|
| フロント | Vite + React 18 + TypeScript | Bolt.new の標準テンプレートと同じ構成でそのまま動く |
| スタイル | Tailwind CSS v3 + shadcn/ui（Radix UI） | `components.json` 同梱で `npx shadcn add` が使える |
| ルーティング | React Router v6 | |
| アイコン | lucide-react | shadcn/ui 標準 |
| PDF 表示 | react-pdf（pdf.js） | テキストレイヤーに `<mark>` を差し込み蛍光ペン表示 |
| 保存（暫定） | IndexedDB（idb-keyval） | Supabase 接続までの間、ブラウザ内に文献・PDF・本文を保存 |
| BaaS | Supabase（Auth / Postgres + pgvector / Storage） | スキーマは `supabase/schema.sql` |
| 埋め込み（現在） | **Transformers.js + multilingual-e5-small**（`Xenova/multilingual-e5-small`、int8、ブラウザ内・Web Worker） | サーバー不要で軽量。設定で BAAI/bge-m3（高精度・重い）に切替可 |
| RAG（予定） | Python（FastAPI）+ BAAI/bge-m3 | サーバー側で高精度なベクトルを計算 |

## サイトマップ

```
/                      ランディング
/login, /signup        認証
/app                   ダッシュボード
├─ /library            文献ライブラリ（PDF アップロード・タグ絞り込み）
│  └─ /library/:id     文献ビューア（PDF / テキスト切替。PDF 上に AI 重要文・検索一致・手動の蛍光ペン）
├─ /search             意味検索（RAG、日英横断）
├─ /factcheck          引用ファクトチェック（支持 / 一部支持 / 矛盾 / 文献なし）
├─ /graph              関連グラフ（引用関係・内容の類似）
└─ /settings           設定
```

## ディレクトリ

```
src/
  components/ui/       shadcn/ui コンポーネント
  components/layout/   サイドバー（PC）/ ドロワー（スマホ）
  pages/               各画面
  lib/api.ts           データアクセス層（← Supabase 接続時はここだけ変更）
  lib/store.ts         ブラウザ内ストア（IndexedDB）
  lib/embed.ts         埋め込みモデル（embed.worker.ts で計算）
  lib/doi.ts           DOI / arXiv ID からの書誌情報取得
  lib/pdf.ts           PDF テキストと引用文の照合 → ハイライト範囲
  lib/types.ts         型（schema.sql と対応）
  lib/supabase.ts      クライアント（.env 未設定ならブラウザ内保存で動作）
supabase/schema.sql    テーブル・RLS・match_chunks()
```
