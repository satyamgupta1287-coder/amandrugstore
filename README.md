# AMAN MEDICAL AGENCY — Stock & Composition Finder

## Files
- `index.html` — the website (fetches `data.json` on load)
- `data.json` — all 7786 merged product rows

**Both files must sit in the same folder, at the repo root**, and both must be pushed to GitHub. `index.html` alone will NOT work — it loads `data.json` separately.

## Deploy on Vercel
1. Push this whole folder to a GitHub repo (root of the repo, not inside a subfolder — unless you set Vercel's Root Directory to that subfolder).
2. On vercel.com → **Add New → Project** → import the repo.
3. Framework Preset: **Other** (do not pick Next.js/React/etc).
4. Build Command: leave empty. Output Directory: leave default (`.`).
5. Deploy.

## If products still don't show after deploying
Open the deployed URL → press **F12** → **Console** tab. The page now shows a clear red error box on screen if `data.json` fails to load, and logs the real reason in the console — most likely one of:
- `data.json` wasn't pushed to GitHub (check the repo on github.com — is the file actually there, and roughly ~1 MB in size?)
- `data.json` is in a different folder than `index.html`
- 404 in console → wrong path/deploy root

Test locally first (this always works, since it removes hosting from the equation):
```
cd this-folder
python3 -m http.server 8000
```
then open `http://localhost:8000` in a browser.
