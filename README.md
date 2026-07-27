# Natours

A tour-booking REST API built with Node.js, Express, and MongoDB — with an
AI travel assistant on top: semantic tour search and a RAG-powered chatbot
that only recommends tours that actually exist in the catalog.

## Features

**Core API**
- JWT authentication (signup, login, password reset via email, change
  password while logged in)
- Role-based access control (`user`, `guide`, `lead-guide`, `admin`)
- Tours: full CRUD, filtering/sorting/pagination/field-limiting, aggregation
  stats, a "top 5 cheap" alias route, geospatial fields (`startLocation`,
  `locations`), and populated tour guides
- Reviews: one per user per tour, with automatic tour rating recalculation
- Bookings: reserve a tour, view/cancel your own bookings, admin management
  (no payment gateway integration — that would need a separate Stripe key)
- Security: Helmet, rate limiting, NoSQL injection sanitization, HTTP
  parameter pollution protection, CORS

**AI travel assistant (RAG)**
- Semantic tour search — embeds your query and ranks tours by meaning, not
  keyword matching
- A chatbot that retrieves relevant tours and answers grounded only in that
  context (it won't invent tours, prices, or details)
- Embeddings run locally (no API key, no per-query cost); only the chat
  replies call out to Claude
- A small browser demo at `/assistant.html`

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JSON Web Tokens + bcrypt |
| Embeddings | `@xenova/transformers` (local, `Xenova/all-MiniLM-L6-v2`) |
| Chat LLM | Anthropic Claude (`@anthropic-ai/sdk`) |
| Security | helmet, express-rate-limit, express-mongo-sanitize, hpp, cors |

## Project structure

```
controllers/   route handlers (tour, user, auth, review, booking, ai, error)
models/        Mongoose schemas (tour, user, review, booking)
routes/        Express routers, mounted in app.js
utils/         shared helpers (AppError, catchAsync, apiFeatures,
               handlerFactory, embeddings, claude)
public/        static frontend (tour pages + the AI assistant demo)
dev-data/      seed data (JSON) and the import/delete script
```

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB database (Atlas or local)
- An [Anthropic API key](https://console.anthropic.com) if you want the
  chat endpoint to actually respond (semantic search works without one)

### Install

```bash
npm install
```

### Configure

Copy the example below into `config.env` in the project root (already
gitignored — never commit real secrets):

```env
NODE_ENV=development
PORT=3000

DATABASE=mongodb+srv://<user>:<PASSWORD>@<cluster>.mongodb.net/?appName=Cluster0
DATABASE_PASSWORD=<your-db-password>
DATABASE_LOCAL=mongodb://localhost:27017/natours

JWT_SECRET=<a-long-random-string>
JWT_EXPIRES_IN=90d

EMAIL_USERNAME=<mailtrap-or-smtp-username>
EMAIL_PASSWORD=<mailtrap-or-smtp-password>
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=25

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-5
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE` / `DATABASE_PASSWORD` | yes | `<PASSWORD>` in the connection string is substituted at runtime |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | yes | signs and expires auth tokens |
| `EMAIL_*` | yes | used for password-reset emails (e.g. a free [Mailtrap](https://mailtrap.io) sandbox inbox for development) |
| `ANTHROPIC_API_KEY` | only for chat | leave blank and everything else still works; `/api/v1/ai/chat` returns a clean 503 until it's set |
| `ANTHROPIC_MODEL` | no | defaults to `claude-opus-5` |

### Seed the database

```bash
node dev-data/data/import-dev-data.js --import   # load sample tours/users/reviews
node dev-data/data/import-dev-data.js --delete   # wipe those collections
```

All seed users share the password `test1234` (e.g. `admin@natours.io` /
`test1234` for an admin account).

### Run

```bash
npm start          # nodemon, development
npm run start:prod # NODE_ENV=production
```

The API listens on `http://localhost:3000` (or your configured `PORT`); the
demo frontend is served from the same origin at `/overview.html` and
`/assistant.html`.

## API reference

Base path: `/api/v1`. Routes marked 🔒 require `Authorization: Bearer
<token>`; 🔑 also require an admin/lead-guide role.

### Auth (`/users`)

| Method | Path | Description |
|---|---|---|
| POST | `/signup` | create an account |
| POST | `/login` | get a JWT |
| POST | `/forgotPassword` | email a password-reset token |
| PATCH | `/resetPassword/:token` | set a new password from that token |
| PATCH 🔒 | `/updateMyPassword` | change password while logged in |
| GET 🔒 | `/me` | current user's profile |
| PATCH 🔒 | `/updateMe` | update name/email/photo |
| DELETE 🔒 | `/deleteMe` | deactivate your own account |
| GET/POST 🔑 | `/` | list users / (blocked — use `/signup`) |
| GET/PATCH/DELETE 🔑 | `/:id` | admin user management |

### Tours (`/tours`)

| Method | Path | Description |
|---|---|---|
| GET | `/` | list tours (filter/sort/paginate/select via query params) |
| GET | `/top-5-cheap` | top 5 highest-rated, cheapest tours |
| GET | `/tour-stats` | aggregated stats by difficulty |
| GET | `/:id` | single tour, with reviews |
| POST 🔑 | `/` | create a tour |
| PATCH/DELETE 🔑 | `/:id` | update/delete a tour |

### Reviews (`/tours/:tourId/reviews` or `/reviews`)

| Method | Path | Description |
|---|---|---|
| GET 🔒 | `/` | list reviews (optionally scoped to a tour) |
| POST 🔒 | `/` | create a review (`user` role, one per tour) |
| GET 🔒 | `/:id` | single review |
| PATCH/DELETE 🔒 | `/:id` | edit/delete your own review (or admin) |

### Bookings (`/bookings`)

| Method | Path | Description |
|---|---|---|
| POST 🔒 | `/` | reserve a tour (price is taken from the tour, not the client) |
| GET 🔒 | `/my-bookings` | your bookings |
| PATCH 🔒 | `/:id/cancel` | cancel your own booking |
| GET 🔑 | `/` | all bookings |
| GET/PATCH/DELETE 🔑 | `/:id` | admin booking management |

### AI assistant (`/ai`)

Rate-limited separately (20 requests / 15 min) since chat calls cost money.

| Method | Path | Description |
|---|---|---|
| GET | `/search?q=...&limit=` | semantic tour search, ranked by embedding similarity, no LLM call |
| POST | `/chat` | body `{ message, history? }` → `{ reply, sources }`, grounded in matched tours |

## How the AI assistant works

1. Every tour gets a 384-dimension embedding (from its name, summary,
   description, and difficulty) computed automatically whenever it's
   created or that text changes — see the `pre('save')` hook in
   `models/tourModel.js`.
2. `/api/v1/ai/search` embeds the query and ranks all tours by cosine
   similarity in memory. The catalog is small enough that this is simpler
   and more reliable than standing up a vector database index.
3. `/api/v1/ai/chat` does the same retrieval step, then sends the top
   matches as context to Claude with a system prompt that restricts it to
   recommending only what's in that context.

Embeddings are generated locally via `@xenova/transformers` — no API key,
no per-query cost, and the model is cached on disk after the first run.
Only the chat endpoint calls the Anthropic API.

## Notes

- Bookings have no payment integration (would require a separate Stripe
  API key) — creating a booking just records a `pending` reservation.
- `NODE_ENV=development` returns full error stacks; set it to `production`
  for sanitized error responses.
