import { writable } from "svelte/store";
import type { OrgDocument } from "$lib/types/OrgDocument";

// よりリッチなダミーデータ
const dummyDocument: OrgDocument = {
  title: "Org-X サンプルドキュメント",
  content: `* Org-Xの紹介
Org-Xは、org-modeファイルをNotion風に表示するシンプルなビューアです。

** 主な機能
- org-modeファイルの読み込みと表示
- TODOアイテムの管理
- タグやカテゴリによるフィルタリング
- ノート階層の表示

* TODO タスク管理の例
これはタスク管理の例です。

** TODO 買い物リスト
- [ ] 牛乳
- [ ] パン
- [X] 卵
- [ ] りんご

** DONE プロジェクト準備
CLOSED: [2025-03-15]

* コードブロックの例
#+BEGIN_SRC javascript
function hello() {
  console.log("Hello, Org-X!");
}
#+END_SRC

* 表の例
| 名前 | 役割 | 担当 |
|------|------|------|
| 田中 | フロントエンド | UI設計 |
| 鈴木 | バックエンド | API実装 |
| 佐藤 | デザイン | UI/UX |

#+FILETAGS: :sample:test:org-mode:
#+CATEGORY: Documentation
`,
};

// ストア
export const currentDocument = writable<OrgDocument>(dummyDocument);
