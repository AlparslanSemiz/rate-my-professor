<div align="center">

<img src="android-app/app/src/main/ic_launcher-playstore.png" alt="RateMyProf app icon" width="96">

# RateMyProf

**A lecture and professor rating platform for students at KIT: Android app, REST backend and admin panel in one repository.**

[![Course](https://img.shields.io/badge/KIT-PSE%20team%20project-2b6cb0?style=flat)](#team)
[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%204-2b6cb0?style=flat)](backend/)
[![App](https://img.shields.io/badge/app-Android-2b6cb0?style=flat)](android-app/)
[![Admin panel](https://img.shields.io/badge/admin-React%2019-2b6cb0?style=flat)](admin-web/)

### [Live demo of the admin panel](https://demo.ratemyprofessor.dev)

Runs in your browser with sample data, no backend.

</div>

## Why

A place for KIT students to rate and read reviews of professors and lectures. RateMyProf lets
them rate lectures and professors, ask and answer questions, and report bad content from an
Android app, while administrators moderate everything from a web panel. It was built as a
team project in KIT's **PSE (Praxis der Softwareentwicklung)** course and deployed at
`ratemyprofessor.dev` during the course.

## Features

- Rate lectures and professors, ask and answer questions, report content, manage a profile (Android app).
- Moderation console: users, comments, answers, lectures and professors, bug reports (forwarded as GitLab issues).
- Audit and activity logs with undo: every administrative edit is stored with before/after values and can be reverted from the panel.
- Two kinds of sessions from one API: `/auth/**` and the app routes give the Android client year-long sessions, `/admin/**` gives the panel one-day sessions. The endpoint decides, not the account ([backend/docs/admin-api.md](backend/docs/admin-api.md)).
- Same-origin by design: one nginx serves the panel under `/admin/` and the API on the same host, so the panel needs no CORS ([backend/docs/deployment.md](backend/docs/deployment.md)).

## Status

Course project (summer semester 2026). The admin panel demo above runs on sample data.
Development happened on KIT's GitLab, and this is a cleaned-up portfolio copy of the final
state, with the project's commit history from the course.

## Tech stack

| Folder | What | Stack |
| --- | --- | --- |
| [`backend/`](backend/) | REST API for the app and the panel: sessions, ratings, Q&A, reports, moderation, audit log | Spring Boot 4, Java 21, PostgreSQL, Flyway, Docker |
| [`android-app/`](android-app/) | The student app | Android, Java, Retrofit |
| [`admin-web/`](admin-web/) | The moderation console | React 19, TypeScript, Mantine, TanStack Query, Vite, Vitest |

Tests: `./mvnw verify` for the backend; six test layers with Vitest, Testing Library and
`axe-core` accessibility checks for the panel.

## Run locally

```bash
# backend + PostgreSQL + mail catcher (dev values only; see backend/README.md)
cd backend && docker compose up --build

# admin panel (dev server proxies /api to the backend; see admin-web/README.md)
cd admin-web && npm ci && npm run dev

# Android app: open android-app/ in Android Studio and run on an emulator
```

Production secrets (database, mail, API keys, GitLab token) are read from environment
variables only; nothing in this repository is a real credential.

## Project structure

```
backend/       Spring Boot API, Flyway migrations, docker-compose files, docs
android-app/   Android client
admin-web/     React moderation panel, e2e tests, docs
docs/planning/ planning documents, CI/CD notes, schema, user stories
```

## Team

Built by a team of six KIT students in the PSE course (summer semester 2026):

- **[Alparslan Semiz](https://github.com/AlparslanSemiz)**: built the admin panel (dashboards, users, moderation, bug reports, typed REST client with token auth); on the backend wrote tests and fixed bugs, and set up the server and the Docker deployment; added settings features to the Android app
- **Luis Bauer**: backend
- **Enno Leipe**: Android app and backend
- **Philipp Schneider**: Android app
- **[Mustafa Aslan](https://github.com/Mustafa-Aslan-1733)**: Android app, backend and admin panel
- **[Yavuz Çağan](https://github.com/YavuzCaganDE)**: backend, admin panel and Android app

No license file is included in this repository.
