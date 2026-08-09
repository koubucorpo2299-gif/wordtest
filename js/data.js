/*
 * 共有単語帳データ（アプリに組み込まれた単語帳）
 * ここに書かれた内容は、URLを開いた全員に共通で表示されます。
 * 単語帳を追加・更新したいときは、内容をClaudeに伝えてください。
 * このファイルを書き換えて公開することで、全PCに自動で反映されます。
 */
const sharedWordBooks = [
  {
    id: "sample-english",
    name: "サンプル英単語帳（デモ用）",
    entries: [
      { number: 1, word: "apple", meaning: "りんご" },
      { number: 2, word: "book", meaning: "本" },
      { number: 3, word: "cat", meaning: "猫" },
      { number: 4, word: "dog", meaning: "犬" },
      { number: 5, word: "egg", meaning: "卵" },
      { number: 6, word: "fish", meaning: "魚" },
      { number: 7, word: "green", meaning: "緑" },
      { number: 8, word: "house", meaning: "家" },
      { number: 9, word: "ink", meaning: "インク" },
      { number: 10, word: "jump", meaning: "跳ぶ" },
      { number: 11, word: "kind", meaning: "親切な" },
      { number: 12, word: "lion", meaning: "ライオン" },
      { number: 13, word: "moon", meaning: "月" },
      { number: 14, word: "night", meaning: "夜" },
      { number: 15, word: "open", meaning: "開ける" },
    ],
  },
  {
    id: "sample-kobun",
    name: "サンプル古語単語帳（デモ用）",
    entries: [
      { number: 1, word: "あいなし", meaning: "つまらない・気にくわない" },
      { number: 2, word: "いと", meaning: "とても" },
      { number: 3, word: "うつつ", meaning: "現実" },
      { number: 4, word: "おとなし", meaning: "大人びている" },
      { number: 5, word: "かなし", meaning: "いとしい" },
      { number: 6, word: "きこゆ", meaning: "申し上げる" },
      { number: 7, word: "こころざし", meaning: "気持ち・愛情" },
      { number: 8, word: "しるし", meaning: "効果・証拠" },
      { number: 9, word: "つとめて", meaning: "早朝" },
      { number: 10, word: "ののしる", meaning: "大声で騒ぐ" },
    ],
  },
];
