# Rate My Professor — KIT lecture-rating platform

A lecture- and professor-rating platform for students at the Karlsruhe Institute of Technology, built as a team project in KIT's **PSE (Praxis der Softwareentwicklung)** course. Students rate lectures and professors, ask and answer questions and report content from an Android app; administrators moderate everything from a web panel.

During the course it was deployed at **ratemyprofessor.dev**.

The whole system is in this repository:

| Folder | What | Stack |
| --- | --- | --- |
| [`backend/`](backend/) | REST API for the Android app and the admin panel: sessions, ratings, Q&A, reports, moderation, audit log | Spring Boot 4, Java 21, PostgreSQL, Flyway, Docker |
| [`android-app/`](android-app/) | The student app: browse and rate lectures and professors, ask and answer questions, report content, profile | Android, Java, Retrofit |
| [`admin-web/`](admin-web/) | Moderation console: users, comments, answers, lectures & professors, bug reports (→ GitLab issues), audit & activity logs with undo | React 19, TypeScript, Mantine, TanStack Query, Vite, Vitest |

## Highlights

- **Two kinds of sessions from one API.** `/auth/**` and the app routes give the Android client year-long sessions; `/admin/**` gives the panel one-day sessions — decided by the endpoint, not the account ([backend/docs/admin-api.md](backend/docs/admin-api.md)).
- **Same-origin by design.** One nginx serves the panel under `/admin/` and the API on the same host, so the panel never needs CORS ([backend/docs/deployment.md](backend/docs/deployment.md)).
- **Immutable audit log with undo.** Every administrative edit is recorded with before/after values and can be reverted from the panel.
- **Tested.** `./mvnw verify` for the backend; six test layers with Vitest, Testing Library and `axe-core` accessibility checks for the panel.

## Run locally

```bash
# backend + database (dev values only; see backend/README.md)
cd backend && docker compose up -d

# admin panel
cd admin-web && npm ci && npm run dev

# Android app: open android-app/ in Android Studio and run on an emulator
```

Production secrets (database, mail, API keys, GitLab token) are read from environment variables only; nothing in this repository is a real credential.

## Team

Built by a team of six KIT students in the PSE course (summer semester 2026):

- **[Alparslan Semiz](https://github.com/AlparslanSemiz)** — built most of the admin panel, about half of the backend, and parts of the Android app
- **Luis Bauer** — backend
- **Enno Leipe** — Android app and backend
- **Philipp Schneider** — Android app
- **[Mustafa Aslan](https://github.com/Mustafa-Aslan-1733)** — Android app, backend and admin panel
- **[Yavuz Çağan](https://github.com/YavuzCaganDE)** — backend, admin panel and Android app

Development happened on KIT's GitLab; this is a cleaned-up portfolio copy of the final state (single commit, no history).
