# Lumen — A Premium Editorial Blog Platform

A full-stack community blog platform built with TanStack Start, React 19, Tailwind CSS v4, and Supabase. Writers can publish articles, readers can like and save them, and everyone gets a beautiful reading experience with dark mode support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR) + TanStack Router |
| UI | React 19, Tailwind CSS v4, Radix UI |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Fonts | Playfair Display, DM Serif Display, Inter |
| Icons | Lucide React |
| Build | Vite 8 |
| Language | TypeScript |

---

## Features

- **Authentication** — Sign up with full name, username, mobile, email and password. Sign in with email or username. Forgot password via email.
- **Profile page** — Edit personal info, view your articles, manage saved articles, write new articles.
- **Article publishing** — Rich write form with cover image upload (Supabase Storage), category selection, publish/draft toggle.
- **Article detail page** — Full content rendering, view count tracking (once per visit), like toggle, save/bookmark toggle, share button.
- **Article listing** — Live feed from Supabase with skeleton loading states and empty state.
- **Search** — Real-time search across title, excerpt, category and author on the home page.
- **Dark / Light mode** — Persisted to localStorage, synced across all components, respects OS preference on first visit.
- **Responsive** — Mobile-first layout with a glassmorphism design system.

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # Root layout — header, footer, theme provider
│   ├── index.tsx           # Home page — hero, search, categories, article grid
│   ├── articles.tsx        # Articles layout route (renders <Outlet/>)
│   ├── articles.index.tsx  # /articles listing — loads from Supabase
│   ├── articles.$slug.tsx  # /articles/:slug — article detail page
│   ├── auth.tsx            # Sign in / Sign up page
│   ├── profile.tsx         # User profile — tabs: Profile, My Articles, Saved, Write
│   ├── about.tsx
│   ├── categories.tsx
│   └── contact.tsx
├── components/
│   ├── site/
│   │   ├── header.tsx          # Fixed nav bar with auth state
│   │   ├── footer.tsx          # Footer with links
│   │   └── animated-background.tsx
│   └── ui/                     # Radix UI + shadcn components
├── hooks/
│   ├── use-auth.tsx            # Session + profile state, signOut, refreshProfile
│   ├── use-theme.tsx           # Dark/light toggle with localStorage persistence
│   └── use-article-actions.tsx # View count, like, save logic per article
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase browser client
│       ├── client.server.ts    # Supabase server client (service role)
│       ├── types.ts            # Database type definitions
│       ├── auth-middleware.ts  # Server-side auth middleware
│       └── auth-attacher.ts   # Client-side auth header attacher
├── lib/
│   ├── mock-data.ts            # Categories, stats (articles array is empty — all from DB)
│   └── utils.ts
└── styles.css                  # Tailwind v4 theme + custom utilities
```

---

## Database Schema

Run `supabase/seed.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard/project/hwiznocgqgfpkznieint/sql/new) to create all tables.

### Tables

#### `profiles`
Stores user profile data. Auto-populated on signup via DB trigger.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | FK → `auth.users.id` |
| `full_name` | text | Display name |
| `username` | text (unique) | Login username |
| `mobile` | text | Phone number |
| `email` | text | Email address |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto-bumped on update |

#### `user_articles`
Articles written by users.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users.id` |
| `title` | text | Article title |
| `excerpt` | text | Short summary |
| `content` | text | Full article body |
| `category` | text | e.g. Wellness, Technology |
| `cover_url` | text | Supabase Storage URL |
| `slug` | text (unique) | URL-safe identifier |
| `published` | boolean | Draft vs published |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto-bumped on update |

#### `article_views`
Tracks view count per article slug (anonymous + authenticated).

| Column | Type | Description |
|---|---|---|
| `slug` | text (PK) | Article slug |
| `view_count` | bigint | Incremented via `increment_view()` RPC |

#### `article_likes`
One row per user per article. Toggle insert/delete.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users.id` |
| `slug` | text | Article slug |
| `created_at` | timestamptz | Auto |

#### `saved_articles`
User's bookmarked articles. Toggle insert/delete.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users.id` |
| `slug` | text | Article slug |
| `saved_at` | timestamptz | Auto |

### Storage

| Bucket | Access | Purpose |
|---|---|---|
| `article-covers` | Public | Cover images for user articles |

---

## Environment Variables

Create a `.env` file in the project root:

```env
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
bun install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key into `.env`
3. Open the [SQL Editor](https://supabase.com/dashboard/project/_/sql/new)
4. Paste and run the contents of `supabase/seed.sql`

### 3. Run the dev server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

---

## Key Design Decisions

- **No relational joins in Supabase queries** — `user_articles` references `auth.users` directly, not `public.profiles`. All profile data is fetched in a separate query using `.in("id", userIds)` to avoid PostgREST join failures.
- **View counting** — `increment_view()` is a `security definer` RPC that atomically upserts the view count. It only fires once per page mount using a `useRef` guard, preventing double-counts in React Strict Mode.
- **Auth loading** — `useAuth` sets `loading=false` immediately after `getSession()` resolves (not waiting for `fetchProfile`), so no page is ever blocked by a slow profile query.
- **TanStack Router file-based routing** — `articles.tsx` is a layout route that renders `<Outlet/>`. The listing lives in `articles.index.tsx` and the detail page in `articles.$slug.tsx`.
- **Theme persistence** — Dark/light preference is stored in `localStorage` as `lumen-theme` and initialized on first load from OS `prefers-color-scheme`.

---

## License

MIT
