const CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "boat", label: "舟・船" },
  { id: "rail", label: "鉄道" },
  { id: "air", label: "空" },
  { id: "land", label: "陸" },
  { id: "space", label: "宇宙" },
];

const FAV_KEY = "vehicle-explorer-favorites";

const state = {
  entries: [],
  category: "all",
  query: "",
  favoritesOnly: false,
  favorites: new Set(),
  drawn: "",
};

const $ = (id) => document.getElementById(id);

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function slug(word) {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function norm(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function catLabel(id) {
  return CATEGORIES.find((cat) => cat.id === id)?.label || id;
}

function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...state.favorites]));
  } catch {
    /* private mode or a full store — the star still toggles for this view */
  }
}

function googleUrl(query, images) {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);
  if (images) url.searchParams.set("tbm", "isch");
  return url.toString();
}

function searchable(entry) {
  return norm([
    entry.word,
    entry.ipa,
    entry.meaning,
    entry.ja,
    entry.origin,
    entry.note || "",
    entry.category,
    catLabel(entry.category),
  ].join(" "));
}

function pool() {
  const q = norm(state.query.trim());
  return state.entries.filter((entry) => {
    if (state.category !== "all" && entry.category !== state.category) return false;
    if (state.favoritesOnly && !state.favorites.has(entry.word)) return false;
    if (q && !entry._search.includes(q)) return false;
    return true;
  });
}

function cardHtml(entry, featured) {
  const fav = state.favorites.has(entry.word);
  const links = [
    ["検索", googleUrl(entry.word, false), `Google で「${entry.word}」を検索`],
    ["画像", googleUrl(entry.word, true), `Google 画像で「${entry.word}」を検索`],
    ["ブランド", googleUrl(`${entry.word} brand`, false), `「${entry.word} brand」を検索`],
  ].map(([label, href, title]) => (
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(title)}">${label}</a>`
  )).join("");

  const note = entry.note
    ? `<p class="note"><strong>注意</strong> ${esc(entry.note)}</p>`
    : "";

  return `
    <article class="card${featured ? " featured" : ""}${state.drawn === entry.word && !featured ? " is-drawn" : ""}" data-cat="${esc(entry.category)}" id="${featured ? "drawn-card" : `card-${slug(entry.word)}`}">
      <div class="card-top">
        <span class="cat">${esc(catLabel(entry.category))}</span>
        <button class="star" type="button" data-fav="${esc(entry.word)}" aria-pressed="${fav ? "true" : "false"}" aria-label="${esc(entry.word)} をお気に入り${fav ? "から外す" : "に入れる"}">${fav ? "★" : "☆"}</button>
      </div>
      <h3 class="word" lang="en">${esc(entry.word)}</h3>
      <p class="ipa" lang="en">${esc(entry.ipa)}</p>
      <p class="meaning" lang="en">${esc(entry.meaning)}</p>
      <p class="ja">${esc(entry.ja)}</p>
      <p class="origin"><strong>由来</strong> ${esc(entry.origin)}</p>
      ${note}
      <div class="actions">${links}</div>
    </article>`;
}

function renderChips() {
  const counts = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, 0]));
  counts.all = state.entries.length;
  for (const entry of state.entries) counts[entry.category] = (counts[entry.category] || 0) + 1;

  $("chips").innerHTML = CATEGORIES.map((cat) => `
    <button class="chip" type="button" data-cat="${cat.id}" aria-pressed="${state.category === cat.id ? "true" : "false"}">${esc(cat.label)} ${counts[cat.id] || 0}</button>
  `).join("") + `
    <button class="fav-toggle" type="button" id="fav-filter" aria-pressed="${state.favoritesOnly ? "true" : "false"}">お気に入り ${state.favorites.size}</button>`;
}

function render() {
  const favButton = $("fav-filter");
  if (favButton) {
    favButton.textContent = `お気に入り ${state.favorites.size}`;
    favButton.setAttribute("aria-pressed", state.favoritesOnly ? "true" : "false");
  }

  const items = pool();
  const total = state.entries.length;
  $("count").textContent = state.query || state.category !== "all" || state.favoritesOnly
    ? `${items.length} 語を表示（全 ${total}）`
    : `${total} 語`;

  $("random").disabled = items.length === 0;
  $("random").textContent = state.query || state.category !== "all" || state.favoritesOnly
    ? "この中から引く"
    : "ひとつ引く";

  const drawn = state.entries.find((entry) => entry.word === state.drawn);
  $("draw").innerHTML = drawn
    ? `<p class="draw-label">いま引いたことば</p>${cardHtml(drawn, true)}`
    : "";

  if (!items.length) {
    $("list").innerHTML = `<p class="empty">${state.favoritesOnly && !state.query
      ? "お気に入りはまだありません。カードの星を押すと、このブラウザに残ります。"
      : "見つかりません。ことばを短くするか、分類を「すべて」に戻してみてください。"}</p>`;
    return;
  }

  const searching = norm(state.query.trim()).length > 0;
  if (searching) {
    $("list").innerHTML = `<section class="group"><h2>検索結果 <span>${items.length}</span></h2><div class="grid">${items.map((entry) => cardHtml(entry, false)).join("")}</div></section>`;
    return;
  }

  const order = CATEGORIES.filter((cat) => cat.id !== "all");
  $("list").innerHTML = order.map((cat) => {
    const group = items.filter((entry) => entry.category === cat.id);
    if (!group.length) return "";
    return `<section class="group"><h2>${esc(cat.label)} <span>${group.length}</span></h2><div class="grid">${group.map((entry) => cardHtml(entry, false)).join("")}</div></section>`;
  }).join("");
}

function pickRandom() {
  const items = pool();
  if (!items.length) return;
  let next = items[Math.floor(Math.random() * items.length)];
  if (items.length > 1) {
    const guard = 8;
    let tries = 0;
    while (next.word === state.drawn && tries < guard) {
      next = items[Math.floor(Math.random() * items.length)];
      tries += 1;
    }
  }
  state.drawn = next.word;
  document.title = `${next.word} — 乗り物のことば`;
  render();
  const banner = $("drawn-card");
  if (banner) {
    banner.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  }
}

function bind() {
  $("search-form").addEventListener("submit", (event) => event.preventDefault());

  $("q").addEventListener("input", (event) => {
    state.query = event.target.value;
    $("clear").hidden = !state.query;
    render();
  });

  $("clear").addEventListener("click", () => {
    state.query = "";
    $("q").value = "";
    $("clear").hidden = true;
    $("q").focus();
    render();
  });

  $("chips").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-cat]");
    if (chip) {
      state.category = chip.dataset.cat;
      for (const button of $("chips").querySelectorAll(".chip")) {
        button.setAttribute("aria-pressed", button === chip ? "true" : "false");
      }
      render();
      return;
    }
    if (event.target.closest("#fav-filter")) {
      state.favoritesOnly = !state.favoritesOnly;
      $("fav-filter").setAttribute("aria-pressed", state.favoritesOnly ? "true" : "false");
      render();
    }
  });

  document.body.addEventListener("click", (event) => {
    const star = event.target.closest("[data-fav]");
    if (!star) return;
    const word = star.dataset.fav;
    if (state.favorites.has(word)) state.favorites.delete(word);
    else state.favorites.add(word);
    saveFavorites();
    const toggle = $("fav-filter");
    if (toggle) toggle.textContent = `お気に入り ${state.favorites.size}`;
    render();
  });

  $("random").addEventListener("click", pickRandom);

  document.addEventListener("keydown", (event) => {
    const typing = event.target.closest("input, textarea");
    if (event.key === "/" && !typing) {
      event.preventDefault();
      $("q").focus();
    }
    if ((event.key === "r" || event.key === "R") && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
      pickRandom();
    }
  });
}

async function main() {
  state.favorites = loadFavorites();
  bind();
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error("empty");
    state.entries = data
      .filter((entry) => entry && entry.word && entry.category)
      .sort((a, b) => a.word.localeCompare(b.word, "en", { sensitivity: "base" }));
    for (const entry of state.entries) entry._search = searchable(entry);
    renderChips();
    render();
  } catch {
    $("count").textContent = "読み込めませんでした";
    $("load-error").hidden = false;
    $("random").disabled = true;
  }
}

main();
