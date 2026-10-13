# 乗り物のことば

Yacht, Fune, Funicular. A static word book of English names for vehicles and vessels, for brainstorming product names. It is plain HTML, CSS, and JavaScript in the repository root, so GitHub Pages can serve it from `main` with no build.

## Use

Open the site and browse the cards. Each one has the word, a broad pronunciation, a short English meaning, a Japanese meaning (日本語の意味), the category, and the origin when it is known.

- The search box matches the English word, the Japanese gloss, the pronunciation, and the origin.
- Category chips: 舟・船, 鉄道, 空, 陸, 宇宙. お気に入り shows only starred words.
- **ひとつ引く** draws one word at random from the cards currently on screen.
- The star stores a favorite in this browser only (`localStorage`).
- **検索** opens a Google search for the word. **画像** opens Google Images. **ブランド** searches `word brand`, a rough check for names already in use. It is not a trademark clearance.

Keyboard: `/` moves to search, `r` draws a word.

## Data

Edit `data.json`. It is an array of objects:

| Field | Required | Meaning |
| --- | --- | --- |
| `word` | yes | Headword |
| `ipa` | yes | Broad pronunciation. Japanese words use a Japanese transcription |
| `meaning` | yes | Short English gloss |
| `ja` | yes | 日本語の意味 |
| `category` | yes | `boat`, `rail`, `air`, `land`, or `space` |
| `origin` | yes | Source language, and a short etymology when it is known |
| `note` | no | A naming caution, such as a live trademark |

Origins follow the usual dictionary account. Where the source is disputed or unknown, the entry says so. Spellings and Japanese names are the common ones; a few katakana forms vary by dictionary.

## Preview locally

`data.json` is loaded with `fetch`, which browsers often block from a `file://` page. Use a local server:

```bash
python3 -m http.server 8765
```

Then open `http://localhost:8765`.

## GitHub Pages

In the repository settings, set Pages to branch `main` and folder `/` (root). The published site is:

https://kurogedelic.github.io/vehicle-explorer/

`.nojekyll` is included so Pages serves the files as they are.

Fonts are requested from Google Fonts. If that request fails, the page falls back to system fonts, including Japanese ones.
