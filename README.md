# Time Capsule — on Netlify (with Firebase)

This version runs on Netlify: a static frontend plus a serverless
function that talks to Firestore. The message is still withheld by the
server (the function) until the reveal date.

## What changed vs. the Express version, and why
Netlify can't run a always-on server like Express. It runs:
- **static files** (your `public/` folder), and
- **serverless functions** (small bits of code that wake up per request).

So the two Express routes became one function in
`netlify/functions/capsules.js`. The frontend didn't change at all — the
`netlify.toml` redirects make `/api/capsules` still work.

## The part you don't have to do yourself
You do **not** need to run `npm install` on your computer. When Netlify
builds your site, it reads `package.json`, runs `npm install` in the
cloud for you, and bundles `firebase-admin` into the function.

---

## Deploy it (mostly clicking, no terminal required)

### 1. Get your Firebase key ready
You already generated a service-account key in the Firebase step. Open
that JSON file and copy its **entire contents onto one line** (paste it
into a JSON minifier if needed). You'll paste it into Netlify in step 4.

### 2. Put this project on GitHub
Easiest without a terminal: install **GitHub Desktop** (a normal app),
create a new repository, drag this project folder into it, and click
**Publish**. That puts your code on GitHub.

### 3. Connect the repo to Netlify
- Log in at https://app.netlify.com
- **Add new site → Import an existing project → GitHub**
- Pick your repository.
- Netlify reads `netlify.toml` automatically, so leave the build
  settings as they are. Click **Deploy**.

### 4. Add your secret key
- In your new site: **Site configuration → Environment variables → Add a variable**
- Key: `FIREBASE_SERVICE_ACCOUNT`
- Value: the one-line JSON from step 1
- Save, then **Deploys → Trigger deploy → Deploy site** so it picks up the key.

That's it — you'll get a live URL like `your-site.netlify.app`.

---

## Testing locally later (optional, needs the terminal)
If you ever want to run it on your own machine first, install the Netlify
CLI and run `netlify dev`. Not required for deploying.
