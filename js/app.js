const STORAGE_KEY = "vocabApp.wordBooks";

const sampleWordBooks = [
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

let wordBooks = loadWordBooks();
let activeWordBookId = null;

function loadWordBooks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return JSON.parse(JSON.stringify(sampleWordBooks));
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : JSON.parse(JSON.stringify(sampleWordBooks));
  } catch {
    return JSON.parse(JSON.stringify(sampleWordBooks));
  }
}

function saveWordBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wordBooks));
}

function getWordBook(id) {
  return wordBooks.find((b) => b.id === id);
}

function renderWordBookList() {
  const list = document.getElementById("wordbook-list");
  list.innerHTML = "";

  if (wordBooks.length === 0) {
    list.innerHTML = '<li class="empty-hint">単語帳がまだありません。「＋ 単語帳を追加」から作成してください。</li>';
    return;
  }

  wordBooks.forEach((book) => {
    const numbers = book.entries.map((e) => e.number);
    const min = numbers.length ? Math.min(...numbers) : 0;
    const max = numbers.length ? Math.max(...numbers) : 0;

    const li = document.createElement("li");
    li.className = "wordbook-item";
    li.innerHTML = `
      <div class="wordbook-item-info">
        <div class="name">${escapeHtml(book.name)}</div>
        <div class="meta">単語数: ${book.entries.length} ／ 番号範囲: ${min}〜${max}</div>
      </div>
      <div class="wordbook-item-actions">
        <button class="btn-primary btn-make-test" style="width:auto;margin:0;" data-id="${book.id}">小テスト作成</button>
        <button class="btn-secondary btn-edit" data-id="${book.id}">編集</button>
        <button class="btn-danger btn-delete" data-id="${book.id}">削除</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function parseEntriesText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      const [numberStr, word, meaning] = parts.map((p) => (p || "").trim());
      return {
        number: parseInt(numberStr, 10),
        word: word || "",
        meaning: meaning || "",
      };
    })
    .filter((e) => !Number.isNaN(e.number) && e.word);
}

function entriesToText(entries) {
  return entries.map((e) => `${e.number},${e.word},${e.meaning}`).join("\n");
}

/* --- Word book modal --- */

const wordbookModal = document.getElementById("wordbook-modal");
let editingWordBookId = null;

function openWordBookModal(bookId) {
  editingWordBookId = bookId || null;
  const book = bookId ? getWordBook(bookId) : null;

  document.getElementById("wordbook-modal-title").textContent = book ? "単語帳を編集" : "単語帳を追加";
  document.getElementById("wordbook-name").value = book ? book.name : "";
  document.getElementById("wordbook-entries").value = book ? entriesToText(book.entries) : "";

  wordbookModal.classList.remove("hidden");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
}

document.getElementById("btn-add-wordbook").addEventListener("click", () => openWordBookModal(null));

document.getElementById("btn-save-wordbook").addEventListener("click", () => {
  const name = document.getElementById("wordbook-name").value.trim();
  const entriesText = document.getElementById("wordbook-entries").value;
  const entries = parseEntriesText(entriesText);

  if (!name) {
    alert("単語帳の名前を入力してください。");
    return;
  }
  if (entries.length === 0) {
    alert("単語データを1件以上入力してください。（例：1,apple,りんご）");
    return;
  }

  if (editingWordBookId) {
    const book = getWordBook(editingWordBookId);
    book.name = name;
    book.entries = entries;
  } else {
    wordBooks.push({
      id: "book-" + Date.now(),
      name,
      entries,
    });
  }

  saveWordBooks();
  renderWordBookList();
  closeModal("wordbook-modal");
});

/* --- Test creation modal --- */

const testModal = document.getElementById("test-modal");

function openTestModal(bookId) {
  activeWordBookId = bookId;
  const book = getWordBook(bookId);
  if (!book) return;

  const numbers = book.entries.map((e) => e.number);
  document.getElementById("range-start").value = Math.min(...numbers);
  document.getElementById("range-end").value = Math.max(...numbers);
  document.getElementById("question-count").value = Math.min(20, book.entries.length);
  document.getElementById("direction").value = "word-meaning";
  document.getElementById("order").value = "shuffle";

  testModal.classList.remove("hidden");
}

document.getElementById("btn-generate").addEventListener("click", () => {
  const book = getWordBook(activeWordBookId);
  if (!book) return;

  const start = parseInt(document.getElementById("range-start").value, 10);
  const end = parseInt(document.getElementById("range-end").value, 10);
  const count = parseInt(document.getElementById("question-count").value, 10);
  const direction = document.getElementById("direction").value;
  const order = document.getElementById("order").value;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    alert("開始番号・終了番号を正しく指定してください。");
    return;
  }
  if (Number.isNaN(count) || count < 1) {
    alert("問題数を正しく指定してください。");
    return;
  }

  const inRange = book.entries.filter((e) => e.number >= start && e.number <= end);
  if (inRange.length === 0) {
    alert("指定した範囲に単語がありません。");
    return;
  }

  let selected = shuffle([...inRange]).slice(0, Math.min(count, inRange.length));
  if (order === "sequential") {
    selected.sort((a, b) => a.number - b.number);
  }

  renderTestSheet(book, selected, direction);
  closeModal("test-modal");
});

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderTestSheet(book, entries, direction) {
  const preview = document.getElementById("test-preview");

  const half = Math.ceil(entries.length / 2);
  const leftCol = entries.slice(0, half);
  const rightCol = entries.slice(half);

  const directionLabel = direction === "word-meaning" ? "英語→日本語" : "日本語→英語";

  const rowHtml = (e) => {
    const shown = direction === "word-meaning" ? e.word : e.meaning;
    return `
      <div class="test-row">
        <span class="num">${e.number}</span>
        <span class="word">${escapeHtml(shown)}</span>
        <span class="blank"></span>
      </div>
    `;
  };

  preview.innerHTML = `
    <div class="test-toolbar">
      <button id="btn-back" class="btn-secondary">一覧に戻る</button>
      <button id="btn-print" class="btn-primary" style="width:auto;margin:0;">印刷する</button>
    </div>
    <div class="test-sheet-header">
      <div>
        <h2>${escapeHtml(book.name)} 小テスト</h2>
        <div class="meta">出題方向：${directionLabel}／問題数：${entries.length}問</div>
      </div>
      <div class="name-field">氏名：＿＿＿＿＿＿＿＿＿＿＿＿＿</div>
    </div>
    <div class="test-grid">
      <div class="test-column">${leftCol.map(rowHtml).join("")}</div>
      <div class="test-column">${rightCol.map(rowHtml).join("")}</div>
    </div>
  `;

  preview.classList.remove("hidden");
  preview.scrollIntoView({ behavior: "smooth" });

  document.getElementById("btn-print").addEventListener("click", () => window.print());
  document.getElementById("btn-back").addEventListener("click", () => {
    preview.classList.add("hidden");
    preview.innerHTML = "";
  });
}

/* --- List event delegation --- */

document.getElementById("wordbook-list").addEventListener("click", (ev) => {
  const target = ev.target;
  const id = target.getAttribute("data-id");
  if (!id) return;

  if (target.classList.contains("btn-make-test")) {
    openTestModal(id);
  } else if (target.classList.contains("btn-edit")) {
    openWordBookModal(id);
  } else if (target.classList.contains("btn-delete")) {
    if (confirm("この単語帳を削除しますか？")) {
      wordBooks = wordBooks.filter((b) => b.id !== id);
      saveWordBooks();
      renderWordBookList();
    }
  }
});

document.querySelectorAll(".modal-close").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close")));
});

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.classList.add("hidden");
  });
});

renderWordBookList();
