# The Hive

> An intelligent, multi-device digital wellness and productivity monitoring platform powered by AI-driven semantic categorization.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Extension Overview](#extension-overview)
- [Contributing](#contributing)
- [License](#license)
- [Contact & Support](#contact--support)

---

## About

**The Hive** is a full-stack digital wellness platform designed to give users deep, actionable insights into their browsing and application habits. Rather than simple time-tracking, The Hive uses transformer-based AI embeddings to intelligently categorize every website and application — no manual tagging required.

Data is synchronized in real-time across multiple devices (Android mobile app + Chrome browser extension), aggregated into daily activity reports, and fed into a Bayesian rating system that tracks engagement quality over time. The platform rewards consistent, productive digital habits through a tier progression system, streaks, and ranked leaderboards.

**What problem does it solve?** Most screen time tools show you raw numbers. The Hive gives you *context* — whether that hour on your computer was spent in Computer Science, Design, Business, or general browsing — and turns that into meaningful trends and ratings.

---

## Features

- **AI-Powered Categorization** — Uses `@xenova/transformers` to generate 384-dimensional semantic embeddings for automatic site/app classification via PostgreSQL's vector extension and HNSW similarity search.
- **Multi-Device Sync** — Unified tracking across Android (mobile app) and Chrome (browser extension), all reporting to a single central server.
- **Real-Time Event Streaming** — WebSocket support for live activity updates and push notifications.
- **Idle State Detection** — Distinguishes truly active usage from idle/locked screen time, ensuring accurate data.
- **Bayesian Rating System** — Glicko-style `mu`/`sigma` scoring reflects the quality and consistency of a user's digital activity.
- **Tier & Streak System** — Users progress through tiers (BRONZE and above) and maintain streaks for sustained engagement.
- **Historical Analytics** — Daily activity aggregation by category for trend analysis and personal insights.
- **Secure Authentication** — JWT-based auth with bcrypt password hashing.
- **Privacy-First** — Tracks domain names and app identifiers only; never page content or personal data.

---

## Project Architecture

The Hive is a three-tier monorepo:

```
┌─────────────────────┐     ┌─────────────────────┐
│   Chrome Extension  │     │   Android Mobile App │
│   (MV3 / JS)        │     │   (Kotlin / Gradle)  │
└────────┬────────────┘     └──────────┬───────────┘
         │   REST API + JWT             │
         └──────────────┬──────────────┘
                        ▼
          ┌─────────────────────────┐
          │     Central Server      │
          │  Node.js / Express 5    │
          │  + WebSocket (ws)       │
          └──────────┬──────────────┘
                     │
          ┌──────────▼──────────────┐
          │  PostgreSQL Database    │
          │  + pgvector extension   │
          │  + uuid-ossp extension  │
          └─────────────────────────┘
```

- **Chrome Extension** captures real-time tab activity and ships events to the server.
- **Android App** tracks mobile app usage and syncs reports.
- **Central Server** handles authentication, event ingestion, AI categorization, rating computation, and analytics.
- **PostgreSQL** persists all data, with the `vector` extension enabling semantic similarity search.

---

## Tech Stack

### Central Server
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 14+ |
| Framework | Express.js 5.2.1 |
| Database | PostgreSQL 12+ (uuid-ossp, vector extensions) |
| Authentication | JWT (`jsonwebtoken` 9.0.3) |
| Password Hashing | `bcrypt` 6.0.0 |
| AI / ML | `@xenova/transformers` 2.17.2 |
| Real-time | WebSocket (`ws` 8.8.19) |
| Task Scheduling | `node-cron` 4.2.1 |
| DB Client | `pg` 8.19.0 |
| Dev Server | `nodemon` 3.1.14 |

### Mobile Application
| Component | Technology |
|-----------|-----------|
| Language | Kotlin |
| Build System | Gradle (Kotlin DSL) |
| Framework | Android with AndroidX |
| JVM | -Xmx2048m, UTF-8 encoding |

### Chrome Extension
| Component | Technology |
|-----------|-----------|
| Manifest | Version 3 |
| Language | Vanilla JavaScript |
| Chrome APIs | Tabs, Storage, Idle, Runtime, Windows |

---

## Project Structure

```
The-Hive/
├── Central Server/
│   ├── src/
│   │   └── index.js          # Application entry point
│   ├── schema.sql             # PostgreSQL schema definitions
│   ├── package.json
│   └── package-lock.json
│
├── Mobile Application/
│   ├── app/                   # Main application source
│   ├── gradle/                # Gradle wrapper
│   ├── build.gradle.kts       # Root build configuration
│   ├── settings.gradle.kts    # Module settings
│   ├── gradle.properties      # JVM args & version config
│   ├── gradlew                # Unix build script
│   └── gradlew.bat            # Windows build script
│
├── extensions/
│   └── chrome/
│       ├── manifest.json      # Extension config (MV3)
│       ├── background.js      # Service worker — tab tracking
│       ├── popup.html         # Extension UI
│       └── popup.js           # Auth & dashboard logic
│
└── .gitignore
```

---

## Database Schema

The Central Server uses PostgreSQL with 7 core tables:

### `users`
Stores core user identity, credentials, and rating state.
```
user_id (UUID PK) | name | email (UNIQUE) | password_hash
persona_role | mu | sigma | display_rating | tier | streak | created_at
```

### `devices`
Links devices to users for multi-device tracking.
```
device_id (VARCHAR PK) | user_id (FK → users) | device_type | linked_at
```

### `extension_events`
Raw audit log of every tab activation and deactivation from the Chrome extension.
```
id | user_id (FK) | device_id | site | state (active/closed) | timestamp | created_at
```

### `usage_reports`
Daily aggregated app/site usage per device, stored as JSONB.
```
id | user_id (FK) | device_id | date | apps (JSONB) | created_at
UNIQUE(user_id, device_id, date)
```

### `daily_activity`
Per-category daily usage totals, used for analytics and ratings.
```
PK(user_id, date, category) | total_minutes
```

### `app_embeddings`
AI-generated 384-dimensional vector embeddings for semantic categorization, with an HNSW index for fast similarity search.
```
app_or_site (VARCHAR 255 PK) | category | embedding (vector 384) | source (seed/user) | created_at
```

### `uncategorized_queue`
Holds newly encountered apps/sites pending AI categorization.
```
app_or_site (PK) | source | created_at
```

---

## Installation & Setup

### Prerequisites

- Node.js 14+
- PostgreSQL 12+ with `uuid-ossp` and `vector` extensions
- Android Studio (for mobile app)
- Google Chrome (for extension development)

---

### 1. Central Server

```bash
# Clone the repository
git clone https://github.com/divyansh-1009/The-Hive.git
cd "The-Hive/Central Server"

# Install dependencies
npm install

# Set up the database (see Configuration below first)
psql -U your_user -d your_database -f schema.sql

# Start in development mode
npm run dev

# Or start in production
npm start
```

---

### 2. Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `extensions/chrome/` directory
5. The extension icon will appear in your toolbar

To point the extension at a local server during development, edit the `SERVER_URL` constant in both `background.js` and `popup.js`:
```javascript
const SERVER_URL = "http://localhost:3000";
```

---

### 3. Android Mobile Application

```bash
cd "The-Hive/Mobile Application"
```

1. Open the `Mobile Application/` directory in **Android Studio**
2. Let Gradle sync dependencies automatically
3. Configure the server URL in the app's network configuration to point to your server
4. Build and run on an emulator or physical device

---

## Configuration

### Central Server — Environment Variables

Create a `.env` file in the `Central Server/` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/thehive
# or individual fields:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thehive
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Server
PORT=3000
NODE_ENV=development
```

### PostgreSQL Extensions

Ensure these extensions are enabled in your database before running `schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## API Overview

All endpoints (except auth) require a `Bearer` JWT token in the `Authorization` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT token |
| `POST` | `/api/activity/chrome` | Ingest a tab tracking event from the Chrome extension |
| `GET` | `/api/activity/daily` | Retrieve daily activity summary for the authenticated user |
| `GET` | `/api/user/profile` | Get the current user's profile, rating, and tier |

### Example: Chrome Extension Event Payload

```json
POST /api/activity/chrome
Authorization: Bearer <token>

{
  "deviceId": "uuid-v4-string",
  "site": "github.com",
  "state": "active",
  "idleState": "ACTIVE",
  "timestamp": 1709123456789
}
```

### Example: Register Payload

```json
POST /api/auth/register

{
  "name": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "personaRole": "CS",
  "deviceId": "uuid-v4-string",
  "deviceType": "chrome"
}
```

---

## Extension Overview

### How It Works

The Chrome Extension (Manifest V3) runs a **persistent service worker** (`background.js`) that monitors all tab activity and streams events to the Central Server.

**Device Identity** — On first install, a UUID is generated via `crypto.randomUUID()` and stored in `chrome.storage.local`. This persists across sessions and identifies the device uniquely.

**Tab Tracking** — The service worker listens to four Chrome events:
- `tabs.onActivated` — user switches tabs
- `tabs.onUpdated` — tab URL changes (navigation)
- `tabs.onRemoved` — tab is closed
- `windows.onFocusChanged` — browser window loses or regains focus

Each transition fires either an `active` or `closed` event to the server, allowing the backend to compute time-on-site precisely.

**Idle Detection** — Every 30 seconds, the extension queries `chrome.idle.queryState()` with a 5-minute threshold. The current idle state (`ACTIVE`, `IDLE`, or `LOCKED`) is included in every event payload so the server can filter out truly inactive time.

**Authentication** — The popup (`popup.html` / `popup.js`) handles login and signup. On successful authentication, the JWT token is stored in `chrome.storage.local` and automatically attached as a `Bearer` token on every outgoing request from the service worker.

**Only HTTP/HTTPS URLs are tracked** — internal Chrome pages (`chrome://`), extension pages, and other non-web URLs are ignored automatically.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit with a clear message:
   ```bash
   git commit -m "feat: add username duplicate check on registration"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch

### Guidelines

- Follow existing code style and naming conventions
- Test your changes before submitting a PR
- Keep PRs focused — one feature or fix per PR
- Update documentation if you change behavior

---

## License

This project uses the **ISC License** as specified in `package.json`. A `LICENSE` file will be added to the repository shortly.

---

## Contact & Support

- **Repository**: [github.com/divyansh-1009/The-Hive](https://github.com/divyansh-1009/The-Hive)
- **Issues**: Open a GitHub Issue for bug reports or feature requests
- **Live Server**: [https://the-hive-uqio.onrender.com](https://the-hive-uqio.onrender.com)

---

<p align="center">Built with ❤️ by the The Hive team</p>
