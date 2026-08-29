# Editing the website

You never need to open code, install anything, or use a terminal to change the
site. Everything you can edit lives in two files, and saving either one
publishes the change automatically.

| File | What is in it |
|---|---|
| `staging-src/content.json` | Every word and every link on the page |
| `staging-src/site.config.json` | Page title, share image, analytics |

---

## One-time setup (about five minutes, do this first)

### 1. Add the password as a repository secret

The staging page is encrypted, so the robot that rebuilds it needs the
password. Give it to GitHub once and it is stored encrypted, hidden from the
logs, and never appears in the repository.

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `HELLOBOE_STAGING_PASSWORD`
4. Value: the `/staging` password
5. **Add secret**

Until you do this, edits will not publish. The build fails loudly with a clear
message rather than quietly shipping a page nobody can open.

### 2. Connect Pages CMS (optional, but this is the nice part)

[Pages CMS](https://pagescms.org) gives you a proper visual editor: labelled
boxes, grouped by section, with help text. It edits this repository directly.

1. Go to **app.pagescms.org** and sign in with GitHub
2. Grant it access to **this repository only** (not all repositories)
3. Open the project. You will see **Website content** and **Metadata and
   analytics**

The `.pages.yml` file in this repository is what tells it how to lay the fields
out. It is already configured.

> **Worth knowing before you connect it:** Pages CMS is a third party, and
> giving it write access to this repository technically also gives it a path to
> the Actions secret above. That secret is a marketing wall password that takes
> thirty seconds to rotate, so the exposure is small and proportionate. If you
> would rather not grant that access at all, skip this step and use option B
> below. Nothing else changes.

---

## Making a change

### Option A — Pages CMS (recommended)

1. Open **app.pagescms.org**
2. Edit the fields
3. **Save**

That is the whole process. The site rebuilds and updates within a few minutes.

### Option B — GitHub directly

1. Open `staging-src/content.json` in this repository
2. Click the pencil icon
3. Edit the text between the quote marks, leaving the quote marks and commas in
   place
4. **Commit changes**

Same result. Slightly more careful typing.

### Option C — ask Claude

"Change the hero headline to X" works too. Claude edits the file and commits it.

---

## What happens after you save

```
you save content.json
        ↓
GitHub Action wakes up  (Actions tab, ~2 minutes)
        ↓
checks your copy against the house rules
        ↓
rebuilds the site and re-encrypts it with the password
        ↓
commits the new staging/index.html
        ↓
live at helloboe.com/staging
```

If something is wrong, the **Actions** tab shows a red X and tells you exactly
which line to fix. The live site is left untouched until the build passes, so a
mistake can never take the site down.

---

## The bits that need explaining

### Headlines split into three

Headlines with a coloured italic word are stored in three parts:

```json
"heading": { "before": "Which ", "highlight": "one", "after": " is your child?" }
```

renders as **Which _one_ is your child?**

Leave a part empty (`""`) if you do not need it. The colours are part of the
design and deliberately are not editable here.

To force a line break inside a headline, press Enter inside the field (or type
`\n` if you are editing raw JSON). That is how "One size / fits none." keeps its
break.

### `@links.something`

Some links read `"@links.press"` instead of a URL. That means "use whatever is
in the Links block". It keeps a URL in one place even though it appears in both
the nav and the footer. Change it once in Links and both update.

### Empty links are safe

Leave a URL empty and that link still appears on the page, greyed out and
unclickable. Nothing on the site ever leads to a dead end, and you can fill the
URL in later without anyone touching the layout.

This is how **Press**, **About**, and both **store badges** currently render.
Paste in a real URL and they light up on the next build.

### Dr. Shiner's copy is not editable prose

Anything about Dr. Rebecca Shiner must be one of the three contractually
approved texts, word for word — see `docs/SHINER-APPROVED-COPY.md`. If a
sentence about her reads awkwardly, the fix is choosing a different approved
text, never rewording.

### House rules, checked on every build

The build **fails** on:

- **em-dashes** (`—`) anywhere in the copy. Use a comma, a colon, or a full
  stop. En-dashes in ranges like `4-36` are fine.
- difficult child · easy child · hack · optimize · maximize · mama · mommy ·
  supermom · journey · "trust the process" · "you've got this!"

The build **warns but continues** on: fix · correct · train · normal. These are
fine about a situation ("it isn't a problem to fix") and wrong about a child
("fix her behavior"), so a human makes the call rather than the robot.

---

## Launching the site publicly

Two separate switches, on purpose.

**Turn on search visibility** — set `"launched": true` in
`site.config.json`. This adds the canonical URL, allows indexing, and emits
structured data. It does **not** remove the password.

**Remove the wall** — run `npm run build:staging -- --public`, which writes the
site to `index.html` at the root with no gate. It refuses to run unless
`launched` is already `true`, so the wall cannot come down by accident.

Also worth doing at launch, already noted in `TODO.md`: link Privacy and Terms
from the public footer (done here already) and confirm `/delete-account` is
easy to find, which Google Play requires.

---

## Building it yourself (only if you want to)

```bash
cd staging-src && npm install && cd ..
HELLOBOE_STAGING_PASSWORD='the password' npm run build:staging
```

Add `--dry-run` to build and verify without writing anything.

To preview the site with no password while writing copy:

```bash
cd staging-src && npm run dev
```

---

## Changing the password

1. Rebuild with the new one:
   `HELLOBOE_STAGING_PASSWORD='new one' npm run build:staging`, commit
2. Update the `HELLOBOE_STAGING_PASSWORD` secret in GitHub

Do both. If the secret and the committed page disagree, the next content edit
re-encrypts the site with the secret's password and the old one stops working.

---

## Where things live

```
staging-src/
  content.json        every word and link          ← you edit this
  site.config.json    metadata and analytics       ← and this
  src/
    HelloBoePage.tsx  layout, colour, motion       ← no copy in here, by design
    entry-server.tsx  pre-renders the public page at build time
    index.css         fonts and animations
    imports/          images
  index.html          page shell
scripts/
  build-staging.mjs   builds and encrypts
staging/
  index.html          the encrypted page           ← generated, never hand-edit
  site-assets/        fonts, logos, share image
.pages.yml            how Pages CMS lays out the fields
```
