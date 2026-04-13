## Summary

<!-- What changed and why (1–3 sentences). -->

## Release hygiene (check what applies)

- [ ] **CHANGELOG** — `[Unreleased]` updated if user-visible or notable for operators.
- [ ] **Version** — If this PR should ship as a tagged release: `package.json` version + dated section in `CHANGELOG.md` (see [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)).
- [ ] **Blog (minor/major)** — If `x` or `y` bump: add `content/blog/en|ko/release-*-*.mdx` from [`docs/templates/`](docs/templates/) when you publish the narrative.
- [ ] **Tests / verify** — `pnpm verify` (or CI green).

## Notes

<!-- Risks, follow-ups, feature flags, env vars. -->
