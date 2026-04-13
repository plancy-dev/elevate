# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**User-facing narrative** (why it matters) ships as **blog MDX** for **minor and major** releases (`y` or `x` bumps). This file stays the **canonical technical list**; patch (`z`) releases usually update here only unless you also publish a short note.

---

## [Unreleased]

### Changed

- Blog: dedicated editorial hero for the v0.2.0 release post (`public/blog/release-0-2-0/hero.jpg`) — no longer reuses the flagship post image.

<!-- New changes go here; move into a dated section when you cut the next release. -->

---

## [0.2.0] — 2026-04-10

### Added

- Documentation: versioning & release process ([`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)).
- Studio Productions: suggested artifact role names ([`docs/STUDIO_ARTIFACT_ROLES.md`](docs/STUDIO_ARTIFACT_ROLES.md)), `<datalist>` + hints on episode forms, story-order badges on artifacts, editable **`sort_order`** in artifact edit (with validation and `studioInvalidSortOrder` action error).
- Dashboard Productions episode help: operator line pointing to Runway runbook paths in-repo (`docs/RUNWAY_SHORTS_RUNBOOK.md`, `docs/RUNWAY_SCENE_BUILDER_STEP2.md`).
- GitHub PR template with release hygiene checklist (CHANGELOG / version / blog for minor+).
- Blog: release notes for v0.2.0 (`content/blog/en|ko/release-0-2-0.mdx`).

---

## [0.1.0] — 2026-04-07

Baseline for public marketing site, dashboard, Library, billing (Toss + Lemon Squeezy path), and Studio Productions v1. Earlier history was not tracked in this file.
