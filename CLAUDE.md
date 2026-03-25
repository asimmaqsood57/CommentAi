# CommentAI — Project Blueprint
> Built by EA Technologies | AI-powered social media comment assistant

---

## Project Overview

CommentAI is a mobile-first AI comment assistant. Users paste a social media post, select a platform and tone, and receive AI-generated comment suggestions. A floating bubble overlay lets users trigger this from any app.

---

## Repository Structure

```
CommentAi/
├── backend/         # Next.js (TypeScript) — REST API, Prisma, PostgreSQL
├── frontend/        # Flutter — Android-first mobile app
└── CLAUDE.md        # This file
```

---

## BACKEND (`/backend`)

**Stack:** NestJS · TypeScript · Prisma ORM · PostgreSQL · Firebase Admin SDK · OpenAI SDK

### Directory Layout

```
backend/
├── prisma/
│   └── schema.prisma                    # All DB models
├── src/
│   ├── app.module.ts                    # Root module
│   ├── main.ts                          # Entry point
│   ├── common/
│   │   ├── guards/
│   │   │   └── firebase-auth.guard.ts   # Firebase token guard (reusable)
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── firebase/
│   │   └── firebase.service.ts          # Firebase Admin SDK initializer
│   ├── prisma/
│   │   └── prisma.service.ts            # Prisma client service
│   ├── openai/
│   │   └── openai.service.ts            # OpenAI client + prompt builder
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts          # POST /users/sync · GET /users/me
│   │   └── users.service.ts
│   ├── generate/
│   │   ├── generate.module.ts
│   │   ├── generate.controller.ts       # POST /generate-comments
│   │   └── generate.service.ts
│   ├── drafts/
│   │   ├── drafts.module.ts
│   │   ├── drafts.controller.ts         # POST/GET /drafts · DELETE /drafts/:id
│   │   └── drafts.service.ts
│   ├── voice-samples/
│   │   ├── voice-samples.module.ts
│   │   ├── voice-samples.controller.ts  # POST/GET · DELETE /:id
│   │   └── voice-samples.service.ts
│   └── webhooks/
│       ├── webhooks.module.ts
│       ├── webhooks.controller.ts       # POST /webhooks/revenuecat
│       └── webhooks.service.ts
├── .env                                 # Environment variables (never commit)
├── package.json
└── tsconfig.json
```

### Prisma Models

| Model | Key Fields |
|---|---|
| `User` | id, firebaseUid (unique), email, name, plan (enum), generationsToday, lastResetAt, createdAt |
| `GenerationHistory` | id, userId, platform (enum), tone (enum), inputText, suggestions (String[]), selectedIndex (Int?), createdAt |
| `SavedDraft` | id, userId, title, content, platform, createdAt |
| `VoiceSample` | id, userId, content, createdAt |
| `TeamMembership` | id, teamOwnerId, memberId, createdAt |

### Enums

- `Plan`: FREE · PRO · CREATOR · TEAM
- `Platform`: LINKEDIN · INSTAGRAM · TWITTER · YOUTUBE · FACEBOOK · REDDIT
- `Tone`: PROFESSIONAL · WITTY · SUPPORTIVE · CURIOUS · CONTRARIAN

### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/generate-comments` | Generate AI comments (core feature) |
| POST | `/api/users/sync` | Upsert user after Firebase login |
| GET | `/api/users/me` | Get current user + plan info |
| POST | `/api/drafts` | Save a draft |
| GET | `/api/drafts` | List user's drafts |
| DELETE | `/api/drafts/:id` | Delete a draft |
| POST | `/api/voice-samples` | Add a voice sample (max 5) |
| GET | `/api/voice-samples` | List voice samples |
| DELETE | `/api/voice-samples/:id` | Delete a voice sample |
| POST | `/api/webhooks/revenuecat` | Handle RevenueCat webhook events |

### Generate Comments Logic (POST /api/generate-comments)

1. Verify Firebase Bearer token → get `firebaseUid` → fetch User from DB
2. Check daily limit: FREE = 10/day, PRO/CREATOR/TEAM = unlimited
3. If limit hit → return `429` with upgrade message
4. Build system prompt with platform + tone instructions
5. Append voice samples (if any) as style reference
6. Call OpenAI: `gpt-4o-mini` (FREE), `gpt-4o` (PRO+)
7. Parse JSON response → array of `{ tone, text, characterCount }`
8. Save `GenerationHistory` record
9. Increment `generationsToday` (auto-reset if `lastResetAt` is a different calendar day)
10. Return `{ suggestions: [{ tone, text, characterCount }] }`

### AI System Prompt Design

**Platform rules:**
- LinkedIn: professional, value-adding, 2–3 sentences
- Instagram: casual, emoji-friendly, short
- Twitter/X: <280 chars, witty or insightful
- YouTube: enthusiastic, encourage discussion
- Facebook: conversational, community-oriented
- Reddit: genuine, match subreddit culture

**Tone modifiers:**
- Professional: formal, industry terminology
- Witty: clever wordplay, light humor
- Supportive: encouraging, validating
- Curious: ask an insightful question
- Contrarian: respectfully challenge the premise

**Response format:** JSON array `[{ tone, text, characterCount }]`

### Error Response Format

All errors return: `{ error: string, code: string }`

### Environment Variables

```
DATABASE_URL
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
OPENAI_API_KEY
REVENUECAT_WEBHOOK_SECRET
```

### Deployment

- Platform: **Vercel** (Next.js)
- Target response times: <3s (FREE), <5s (PRO)

---

## FRONTEND (`/frontend`)

**Stack:** Flutter (Dart) · Riverpod · go_router · Firebase Auth · RevenueCat · ML Kit OCR

### Directory Layout

```
frontend/
├── android/                        # Android-specific config (permissions, manifest)
├── lib/
│   ├── main.dart                   # App entry point, Firebase init, Riverpod root
│   ├── core/
│   │   ├── api/
│   │   │   └── api_client.dart     # HTTP singleton — auto-attaches Firebase ID token
│   │   ├── models/
│   │   │   ├── user.dart           # User model + fromJson
│   │   │   ├── suggestion.dart     # Suggestion model + fromJson
│   │   │   ├── draft.dart          # Draft model + fromJson
│   │   │   └── voice_sample.dart   # VoiceSample model + fromJson
│   │   └── providers/
│   │       ├── auth_provider.dart  # Firebase auth state
│   │       ├── user_provider.dart  # Current user + plan info
│   │       └── api_provider.dart   # ApiClient provider
│   └── features/
│       ├── auth/
│       │   ├── login_screen.dart   # Google + Email/Password login
│       │   └── auth_repository.dart
│       ├── generator/
│       │   ├── home_screen.dart    # Main generation UI
│       │   ├── generator_provider.dart
│       │   └── widgets/
│       │       ├── platform_selector.dart
│       │       ├── tone_selector.dart
│       │       ├── suggestion_card.dart
│       │       └── usage_progress_bar.dart
│       ├── drafts/
│       │   ├── drafts_screen.dart
│       │   └── drafts_provider.dart
│       ├── voice/
│       │   ├── voice_screen.dart
│       │   └── voice_provider.dart
│       ├── settings/
│       │   ├── settings_screen.dart
│       │   └── paywall_screen.dart
│       └── overlay/
│           ├── overlay_service.dart  # Floating bubble logic
│           └── overlay_entry.dart    # Compact UI inside overlay
├── pubspec.yaml
└── .env                             # NEXT_API_URL (via --dart-define)
```

### Flutter Dependencies (`pubspec.yaml`)

| Package | Purpose |
|---|---|
| `firebase_core` | Firebase initialization |
| `firebase_auth` | Google + Email/Password auth |
| `http` | API calls |
| `flutter_overlay_window` | Floating bubble (SYSTEM_ALERT_WINDOW) |
| `google_ml_kit` | OCR / text recognition from screenshots |
| `flutter_riverpod` | State management |
| `go_router` | Navigation / routing |
| `shared_preferences` | Local storage |
| `purchases_flutter` | RevenueCat in-app subscriptions |
| `image_picker` | Screenshot input for OCR mode |

### Screens

| Screen | Description |
|---|---|
| `LoginScreen` | Google Sign-In + Email/Password. On success → sync user → navigate home |
| `HomeScreen` | Text input, platform chips, tone multi-select, OCR button, generate button, results list, copy, save draft |
| `DraftsScreen` | List drafts, tap to copy, swipe to delete |
| `VoiceSamplesScreen` | Add/delete voice samples (max 5), "My Voice" badge |
| `SettingsScreen` | Plan badge, usage progress, upgrade button, overlay toggle, sign out |
| `PaywallScreen` | RevenueCat offerings — Pro / Creator plans |

### HomeScreen Behaviour

- Text field: "Paste post text here..."
- Platform selector: LinkedIn · Instagram · Twitter · YouTube · Facebook · Reddit
- Tone selector: Professional · Witty · Supportive · Curious · Contrarian (multi-select)
- Screenshot button → `image_picker` → ML Kit OCR → fills text field
- Generate → POST `/api/generate-comments` → display suggestion cards
- Each card: tone label + text + character count + Copy button
- Copy → clipboard + SnackBar "Copied! Go paste it."
- "Save as Draft" below results
- FREE users: linear progress bar "X / 10 generations used today"
- Limit hit: show upgrade bottom sheet instead of generating

### Floating Overlay

- Package: `flutter_overlay_window`
- 56×56dp draggable bubble with CommentAI logo
- Tap → compact HomeScreen-like bottom sheet inside overlay
- Requires `SYSTEM_ALERT_WINDOW` permission (requested during onboarding)
- Requires Android foreground service
- Toggle in SettingsScreen

### API Client (`core/api/api_client.dart`)

- Singleton class
- Auto-fetches Firebase ID token and attaches as `Authorization: Bearer <token>`
- Base URL from `--dart-define=NEXT_API_URL`
- Error handling:
  - `429` → show upgrade dialog
  - `401` → re-authenticate
  - `500` → show error SnackBar

---

## MONETIZATION

| Plan | Price | Limit | Model | Voice | Overlay | Team |
|---|---|---|---|---|---|---|
| FREE | $0 | 10/day | gpt-4o-mini | No | No | No |
| PRO | $4.99/mo | Unlimited | gpt-4o | 5 samples | Yes | No |
| CREATOR | $9.99/mo | Unlimited | gpt-4o | 5 samples | Yes | Up to 3 |
| TEAM | $24.99/mo | Unlimited | gpt-4o | 5 samples | Yes | Up to 10 |

RevenueCat webhook → `POST /api/webhooks/revenuecat` → update `User.plan` in DB.

---

## ANALYTICS (PostHog)

Events to track:

| Event | Properties |
|---|---|
| `comment_generated` | platform, tones[], model_used, suggestion_count |
| `comment_copied` | tone, character_count |
| `draft_saved` | — |
| `draft_deleted` | — |
| `voice_sample_added` | — |
| `voice_sample_deleted` | — |
| `paywall_shown` | — |
| `subscription_started` | plan |
| `subscription_cancelled` | plan |
| `overlay_opened` | — |
| `overlay_closed` | — |

---

## DEVELOPMENT NOTES

- Use Firebase Emulator for local auth testing
- Backend: `npm run dev` in `/backend`
- Frontend: `flutter run` in `/frontend` with `--dart-define=NEXT_API_URL=http://localhost:3000`
- All API errors must return `{ error: string, code: string }`
- Overlay feature requires foreground service on Android — handle permissions gracefully
- Flutter build: APK for internal testing → Play Store release

---

## IMPLEMENTATION ORDER (Recommended)

1. Backend: Prisma schema + DB setup
2. Backend: Firebase Admin + `verifyFirebaseToken` helper
3. Backend: `/api/users/sync` and `/api/users/me`
4. Backend: `/api/generate-comments` (core feature)
5. Backend: Drafts + Voice Samples endpoints
6. Backend: RevenueCat webhook
7. Frontend: Firebase + Riverpod setup + routing
8. Frontend: LoginScreen
9. Frontend: HomeScreen + ApiClient
10. Frontend: DraftsScreen + VoiceSamplesScreen
11. Frontend: SettingsScreen + PaywallScreen
12. Frontend: Floating Overlay service
