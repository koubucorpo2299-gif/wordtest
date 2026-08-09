// 共有単語帳（js/data.js）はアプリに組み込まれているため、
// URLを開いた全PCで自動的に同じ内容が表示されます。
// ブラウザ内で行った追加・編集は、この端末だけに保存されます（上書き／追加分として記録）。
const OLD_STORAGE_KEY = "vocabApp.wordBooks";
const OVERRIDES_KEY = "vocabApp.localOverrides";
const DELETED_IDS_KEY = "vocabApp.deletedSharedIds";

let wordBooks = loadWordBooks();
let activeWordBookId = null;

function loadJSON(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function migrateOldStorageIfNeeded() {
  if (localStorage.getItem(OVERRIDES_KEY) !== null) return;
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return;

  try {
    const oldBooks = JSON.parse(oldRaw);
    if (!Array.isArray(oldBooks)) return;

    const overrides = {};
    oldBooks.forEach((b) => {
      overrides[b.id] = b;
    });
    const deletedIds = sharedWordBooks
      .filter((s) => !oldBooks.some((b) => b.id === s.id))
      .map((s) => s.id);

    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
  } catch {
    // ignore malformed legacy data
  }
}

function loadWordBooks() {
  migrateOldStorageIfNeeded();

  const overrides = loadJSON(OVERRIDES_KEY, {});
  const deletedIds = loadJSON(DELETED_IDS_KEY, []);

  const shared = sharedWordBooks
    .filter((b) => !deletedIds.includes(b.id))
    .map((b) => overrides[b.id] || b);

  const localOnly = Object.keys(overrides)
    .filter((id) => !sharedWordBooks.some((b) => b.id === id))
    .map((id) => overrides[id]);

  return [...shared, ...localOnly];
}

function saveWordBooks() {
  const overrides = {};
  wordBooks.forEach((b) => {
    const sharedMatch = sharedWordBooks.find((s) => s.id === b.id);
    if (!sharedMatch || JSON.stringify(sharedMatch) !== JSON.stringify(b)) {
      overrides[b.id] = b;
    }
  });

  const deletedIds = sharedWordBooks
    .filter((s) => !wordBooks.some((b) => b.id === s.id))
    .map((s) => s.id);

  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
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
        <button class="btn-secondary btn-edit" data-id="${book.id}">編集</button>
        <button class="btn-danger btn-delete" data-id="${book.id}">削除</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function renderWordBookSelect() {
  const select = document.getElementById("wordbook-select");
  const previousValue = select.value;

  select.innerHTML = '<option value="">-- 単語帳を選択してください --</option>';
  wordBooks.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.name;
    select.appendChild(option);
  });

  if (wordBooks.some((b) => b.id === previousValue)) {
    select.value = previousValue;
  } else {
    select.value = "";
    document.getElementById("test-builder-fields").classList.add("hidden");
    activeWordBookId = null;
  }
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

/* --- CSV import --- */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function csvRowsToEntries(rows) {
  return rows
    .map((row) => {
      const [numberStr, word, meaning] = row.map((c) => (c || "").trim());
      return {
        number: parseInt(numberStr, 10),
        word: word || "",
        meaning: meaning || "",
      };
    })
    .filter((e) => !Number.isNaN(e.number) && e.word);
}

function decodeFileAsText(file) {
  return file.arrayBuffer().then((buffer) => {
    const utf8Text = new TextDecoder("utf-8").decode(buffer);
    const hasReplacementChars = (utf8Text.match(/�/g) || []).length > 2;
    if (!hasReplacementChars) return utf8Text;
    try {
      return new TextDecoder("shift-jis").decode(buffer);
    } catch {
      return utf8Text;
    }
  });
}

document.getElementById("wordbook-csv").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;

  try {
    const text = await decodeFileAsText(file);
    const rows = parseCSV(text);
    const entries = csvRowsToEntries(rows);

    if (entries.length === 0) {
      alert("CSVから単語データを読み取れませんでした。「番号,英語,日本語」の順になっているか確認してください。");
      return;
    }

    const textarea = document.getElementById("wordbook-entries");
    if (textarea.value.trim() && !confirm("入力欄の内容をCSVの内容で置き換えますか？")) {
      return;
    }
    textarea.value = entriesToText(entries);

    if (!document.getElementById("wordbook-name").value.trim()) {
      document.getElementById("wordbook-name").value = file.name.replace(/\.csv$/i, "");
    }
  } catch (err) {
    alert("CSVファイルの読み込みに失敗しました。");
  } finally {
    ev.target.value = "";
  }
});

/* --- Word book modal --- */

const wordbookModal = document.getElementById("wordbook-modal");
let editingWordBookId = null;

function openWordBookModal(bookId) {
  editingWordBookId = bookId || null;
  const book = bookId ? getWordBook(bookId) : null;

  document.getElementById("wordbook-modal-title").textContent = book ? "単語帳を編集" : "単語帳を追加";
  document.getElementById("wordbook-name").value = book ? book.name : "";
  document.getElementById("wordbook-entries").value = book ? entriesToText(book.entries) : "";
  document.getElementById("wordbook-csv").value = "";

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
  renderWordBookSelect();
  closeModal("wordbook-modal");
});

/* --- Test creation (inline, driven by top word book selector) --- */

const TEST_SETTINGS_KEY = "vocabApp.lastTestSettings";

function loadLastTestSettings() {
  try {
    return JSON.parse(localStorage.getItem(TEST_SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLastTestSettings(bookId, settings) {
  const all = loadLastTestSettings();
  all[bookId] = settings;
  localStorage.setItem(TEST_SETTINGS_KEY, JSON.stringify(all));
}

function onWordBookSelected(bookId) {
  activeWordBookId = bookId || null;
  const fields = document.getElementById("test-builder-fields");

  const book = bookId ? getWordBook(bookId) : null;
  if (!book) {
    fields.classList.add("hidden");
    return;
  }

  const numbers = book.entries.map((e) => e.number);
  const last = loadLastTestSettings()[bookId];

  document.getElementById("range-start").value = last ? last.start : Math.min(...numbers);
  document.getElementById("range-end").value = last ? last.end : Math.max(...numbers);
  document.getElementById("question-count").value = last ? last.count : Math.min(20, book.entries.length);
  document.getElementById("direction").value = last ? last.direction : "word-meaning";
  document.getElementById("order").value = last ? last.order : "shuffle";

  fields.classList.remove("hidden");
}

document.getElementById("wordbook-select").addEventListener("change", (ev) => {
  onWordBookSelected(ev.target.value);
});

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

  saveLastTestSettings(activeWordBookId, { start, end, count, direction, order });
  renderTestSheet(book, selected, direction, start, end);
});

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSheetHtml(book, entries, direction, title, showAnswer, rangeStart, rangeEnd) {
  const half = Math.ceil(entries.length / 2);
  const leftCol = entries.slice(0, half);
  const rightCol = entries.slice(half);

  const directionLabel = direction === "word-meaning" ? "英語→日本語" : "日本語→英語";

  const rowHtml = (e) => {
    const shown = direction === "word-meaning" ? e.word : e.meaning;
    const answer = direction === "word-meaning" ? e.meaning : e.word;
    return `
      <div class="test-row">
        <span class="num">${e.number}</span>
        <span class="word">${escapeHtml(shown)}</span>
        <span class="blank">${showAnswer ? escapeHtml(answer) : ""}</span>
      </div>
    `;
  };

  return `
    <div class="test-sheet-header">
      <div>
        <h2>${escapeHtml(book.name)} ${title}<span class="range">範囲：${rangeStart}〜${rangeEnd}</span></h2>
        <div class="meta">出題方向：${directionLabel}／問題数：${entries.length}問</div>
      </div>
      <div class="name-field">氏名：＿＿＿＿＿＿＿＿＿＿＿＿＿</div>
    </div>
    <div class="test-grid">
      <div class="test-column">${leftCol.map(rowHtml).join("")}</div>
      <div class="test-column">${rightCol.map(rowHtml).join("")}</div>
    </div>
  `;
}

function renderTestSheet(book, entries, direction, rangeStart, rangeEnd) {
  const preview = document.getElementById("test-preview");

  preview.innerHTML = `
    <div class="test-toolbar">
      <button id="btn-back" class="btn-secondary">一覧に戻る</button>
      <button id="btn-print" class="btn-primary" style="width:auto;margin:0;">印刷する（問題＋解答）</button>
    </div>
    <div class="sheet-page">
      ${buildSheetHtml(book, entries, direction, "小テスト", false, rangeStart, rangeEnd)}
    </div>
    <div class="sheet-page answer-sheet">
      ${buildSheetHtml(book, entries, direction, "解答", true, rangeStart, rangeEnd)}
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

  if (target.classList.contains("btn-edit")) {
    openWordBookModal(id);
  } else if (target.classList.contains("btn-delete")) {
    if (confirm("この単語帳を削除しますか？")) {
      wordBooks = wordBooks.filter((b) => b.id !== id);
      saveWordBooks();
      renderWordBookList();
      renderWordBookSelect();
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
renderWordBookSelect();
