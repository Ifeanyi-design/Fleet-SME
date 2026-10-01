# Deploying the Fleet Management System

**Target:** [Render](https://render.com) — named in the PRD's implementation technology stack  
(§4.1, "Render / Supabase Community Tier: Zero-cost deployment target").

Two services plus a database:

| Component       | Render type          | What it runs                     |
| --------------- | -------------------- | -------------------------------- |
| `fleet-sme-api` | Web Service (Python) | Flask API behind **gunicorn**    |
| `fleet-sme-web` | Static Site          | the built React SPA (`fms/dist`) |
| `fleet-sme-db`  | PostgreSQL           | managed database                 |

---

## Before you start

1. A GitHub account with the repository pushed (Step 1).
2. A Render account (free, sign in with GitHub).
3. That's it — the free tier covers this.

**Important:** the API must **not** use SQLite on Render. Render's filesystem is ephemeral, so  
`fms.db` is wiped on every deploy and your data disappears. The blueprint provisions PostgreSQL  
and wires it in automatically.

---

## Step 1 — Push to GitHub

The repository is already initialised locally on `main`. From the project root  
(`C:\Users\IFEANYI\Documents\SME`):

```bash
git remote add origin https://github.com/Ifeanyi-design/Fleet-SME.git
git branch -M main
git push -u origin main
```

`git remote add` will fail with *"remote origin already exists"* if it is already set — that is  
fine, skip it. When prompted, sign in to GitHub in the browser window that opens (Git Credential  
Manager handles the token).

Verify:

```bash
git remote -v
git log --oneline -1
```

---

## Step 2 — Deploy on Render

1. Go to **<https://dashboard.render.com>** and sign in with GitHub.
2. Click **New** (top right) → **Blueprint**.
3. Pick the **Fleet-SME** repository. Render reads `render.yaml` from the repo root and shows the  
   three resources it will create.
4. Click **Apply** / **Create Resources**.
5. Wait for the first build (~3–6 minutes). The API build installs Python packages; the static  
   site build runs `npm install && npm run build`.

When it finishes you will have two URLs, something like:

```
https://fleet-sme-api.onrender.com      ← API
https://fleet-sme-web.onrender.com      ← the app
```

*(Render may append a suffix if the name is taken — use whatever it gives you.)*

---

## Step 3 — Connect the two services

Render cannot know the hostnames until the services exist, so two values must be filled in  
manually. This is the step people miss — without it you get CORS errors and the app cannot log in.

**A. Tell the API which frontend may call it**

`fleet-sme-api` → **Environment** → add / edit:

```
CORS_ORIGINS = https://fleet-sme-web.onrender.com
```

Save — Render redeploys automatically.

**B. Tell the frontend where the API is**

`fleet-sme-web` → **Environment** → add / edit:

```
VITE_API_URL = https://fleet-sme-api.onrender.com/api
```

Save and let it rebuild. **`VITE_API_URL` is baked in at build time**, so changing it requires a  
rebuild — that is why it is an environment variable on the *static site*, not a runtime setting.

> The trailing `/api` matters. The frontend calls paths like `/auth/login` on top of this base.

---

## Step 4 — Verify

```bash
# API is alive
curl https://fleet-sme-api.onrender.com/api/health
# → {"status":"ok"}

# It is talking to PostgreSQL and seeded
curl https://fleet-sme-api.onrender.com/api/track/examples
# → ["FMS-XXXXXX", ...]

# Login works
curl -X POST https://fleet-sme-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@fleetsme.com","password":"Fleet@2026"}'
# → {"token":"eyJ...","user":{...}}
```

Then open `https://fleet-sme-web.onrender.com` and sign in with one of the accounts below.

---

## Accounts

Provisioned automatically on first boot. **Two administrators and one login per rider.**

### Administrators — full access to every screen

| Name          | Email                   | Password     |
| ------------- | ----------------------- | ------------ |
| Ifeanyi Agada | c                       | `Fleet@2026` |
| Ngozi Okonkwo | `dispatch@fleetsme.com` | `Fleet@2026` |

### Drivers — mobile app only, scoped to their own waybills

| Name           | Email                         | Password     |
| -------------- | ----------------------------- | ------------ |
| Musa Ibrahim   | `musa.ibrahim@fleetsme.com`   | `Rider@2026` |
| Chinedu Okafor | `chinedu.okafor@fleetsme.com` | `Rider@2026` |
| Ayo Bakare     | `ayo.bakare@fleetsme.com`     | `Rider@2026` |
| Emeka Nwosu    | `emeka.nwosu@fleetsme.com`    | `Rider@2026` |
| Yusuf Bello    | `yusuf.bello@fleetsme.com`    | `Rider@2026` |
| Tunde Adeyemi  | `tunde.adeyemi@fleetsme.com`  | `Rider@2026` |
| Sani Garba     | `sani.garba@fleetsme.com`     | `Rider@2026` |

> **A driver signing in sees only their own deliveries** — the API scopes the query by the  
> authenticated rider, and the `driverId` parameter is ignored rather than trusted.

### Changing the passwords

The defaults are seeded for a working demo. Override them **before** the first deploy by adding  
these environment variables to `fleet-sme-api` in Render:

```
SEED_ADMIN_PASSWORD  = <your admin password>
SEED_DRIVER_PASSWORD = <your driver password>
```

They are read at seed time only, so set them before the database is first populated. If the  
database already exists, either change the variables and reset the database, or update the hashes  
directly.

> **Security note:** the default passwords are in this repository, which is public. That is  
> acceptable for a coursework demonstration, but never leave them in place for anything real.

---

## Environment variables

### `fleet-sme-api`

| Variable               | Value                                | Notes                                        |
| ---------------------- | ------------------------------------ | -------------------------------------------- |
| `DATABASE_URL`         | *(from the blueprint)*               | Injected from the managed database           |
| `JWT_SECRET_KEY`       | *(auto-generated)*                   | Render generates a strong value              |
| `CORS_ORIGINS`         | `https://fleet-sme-web.onrender.com` | **Set manually in Step 3**                   |
| `AUTO_SEED`            | `true`                               | Seeds the baseline on first boot; idempotent |
| `SEED_ADMIN_PASSWORD`  | `Fleet@2026` *(default)*             | Override before the first deploy             |
| `SEED_DRIVER_PASSWORD` | `Rider@2026` *(default)*             | Override before the first deploy             |
| `PYTHON_VERSION`       | `3.11.9`                             | Pinned by the blueprint                      |
| `JWT_HOURS`            | `12` *(optional)*                    | Token lifetime                               |

### `fleet-sme-web`

| Variable        | Value                                    | Notes                                |
| --------------- | ---------------------------------------- | ------------------------------------ |
| `VITE_USE_MOCK` | `false`                                  | Use the real API, not the mock layer |
| `VITE_API_URL`  | `https://fleet-sme-api.onrender.com/api` | **Set manually in Step 3**           |

---

## Free tier — what to expect

- **Services sleep after ~15 minutes idle.** The next request takes 30–60 seconds to wake. If you  
  are demonstrating this to an examiner, **open the app a minute beforehand** so it is warm.
- **Free PostgreSQL expires after 90 days** unless upgraded. Export anything you need before then.
- **512 MB RAM.** The blueprint runs gunicorn with 2 workers × 10 threads, which comfortably fits.
- **No custom domain** on the free tier (you get the `.onrender.com` hostname).

---

## Troubleshooting

| Symptom                                           | Cause                                                        | Fix                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Login rejects the credentials in this guide**   | **The database was seeded before these accounts existed. The original seeder only ran against an empty database** | **Redeploy — account provisioning now runs on every boot. No data is lost**    |
| Login fails, console shows a **CORS** error       | `CORS_ORIGINS` on the API does not match the frontend URL    | Set it exactly, including `https://`, no trailing slash                        |
| App loads but every request **404s**              | `VITE_API_URL` missing or lacks `/api`                       | Set it and let the static site rebuild                                         |
| Refreshing `/vehicles` shows Render's 404 page    | SPA rewrite missing                                          | Already in `render.yaml`; confirm the static site has the rewrite route        |
| `Can't load plugin: sqlalchemy.dialects:postgres` | Render hands out `postgres://`, which SQLAlchemy 2.x rejects | Already handled — `config.py` rewrites it to `postgresql+psycopg2://`          |
| Data resets after every deploy                    | Still on SQLite                                              | Confirm `DATABASE_URL` is set on the API service                               |
| Build fails on `psycopg2`                         | Missing build tools                                          | The blueprint uses `psycopg2-binary`, which ships wheels — check the build log |
| First request hangs ~40s                          | Free tier spin-down                                          | Expected; see above                                                            |

### Already deployed and login is failing?

If you deployed before the accounts were finalised, the database still holds the original
development logins, and no amount of redeploying used to fix it — the seeder only ran once.

That is fixed. The API now reconciles accounts on **every** start:

```
[accounts] retired superseded account admin@fms.local
[accounts] retired superseded account driver@fms.local
[accounts] provisioned admin manager@fleetsme.com
[accounts] provisioned admin dispatch@fleetsme.com
[accounts] provisioned driver musa.ibrahim@fleetsme.com
...
```

It creates whatever is missing, never touches existing accounts (passwords are not reset), and
retires the old development logins whose passwords are published in this repository. **Your data is
untouched.**

To watch it happen: Render dashboard → **fleet-sme-api** → **Logs**, then
**Manual Deploy → Deploy latest commit**. The account lines appear at the top of the boot log.

---

## Alternative — run locally against PostgreSQL

To rehearse production behaviour on your own machine:

```bash
cd fms/backend
# point at any PostgreSQL instance
export DATABASE_URL="postgresql://fms:fms@localhost:5432/fms"
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python app.py
```

Everything else is identical — `config.py` normalises the URL and the seeding is the same.

---

## Running it locally (for contrast)

```bash
# terminal 1 — API
cd fms/backend
.venv/Scripts/python app.py            # → http://127.0.0.1:5000

# terminal 2 — frontend
cd fms
npm run dev                            # → http://localhost:5173
```

Locally, `fms/.env.local` sets `VITE_API_URL=/api`, and Vite proxies `/api` to port 5000. That  
proxy **only exists during development** — which is exactly why production needs an absolute URL.
