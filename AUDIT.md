# Publication audit

Audit date: 26 November 2026

This is a sanitized record of the publication audit requested in the course submission guidelines. It contains no credentials, private configuration values, or secret scan output.

## What was checked

The first pass was performed without modifying files or running the application. It reviewed:

- Git status, tracked files, recent history, and repository organization
- current files and every reachable commit for common high-risk credential patterns
- history for sensitive filenames such as environment files, private keys, certificates, and credential files
- ignore rules for local dependencies, build output, reports, logs, and environment files
- API endpoints, request cancellation, identifier handling, DOM rendering, external links, and error states
- consistency risks between the split files and `Episode-Atlas-Standalone.html`
- README coverage of purpose, collection, persistence, interaction, setup, learning, limitations, and assistance
- the demonstration screenshot for accidental personal or sensitive information

## First-pass findings

### Confirmed issues requiring action

1. `.gitignore` covered operating-system files and logs but did not exclude common local dependency, coverage, build, or environment files.
2. The standalone file duplicates the main HTML, CSS, and JavaScript, but the test suite only checked that inline style and script blocks existed. It would not detect a stale standalone copy after a future change.

### Recommended improvements

- Continue a live browser check before submission because structural tests cannot guarantee future TVmaze availability or every browser interaction.

### Checks with no confirmed issue

- No credential, API-token, private-key, or other high-risk secret pattern was found in the current tracked files or reachable file history.
- No sensitive configuration or key filename was found in reachable file history.
- The application uses the documented public HTTPS API and does not contain an API key.
- API text is rendered through `textContent`; HTML summaries are converted to plain text before display.
- Search text and selected IDs are URL-encoded, and obsolete requests are cancelled with `AbortController`.
- The README explains that persistence is not applicable, gives a reason, contains the other required course documentation, and includes a credited live-data screenshot.
- The screenshot contains public TVmaze programme data only and no user, account, or credential information.

## Fixes made

- Expanded `.gitignore` for `node_modules`, coverage, build output, and environment files while allowing a future safe `.env.example`.
- Added a smoke test that compares the standalone JavaScript and bundled CSS with the split source files so drift is detected.

## Repeat audit and evidence

After the fixes:

- `git diff --check` reported no whitespace errors.
- All five dependency-free smoke tests passed, including the new standalone synchronization check.
- The JavaScript syntax check passed for `app.js`.
- A live TVmaze search request returned a JSON result successfully.
- The high-risk credential and sensitive-filename scans were repeated with no confirmed finding.
- Common dependency, coverage, build, environment, log, and operating-system files are ignored.
- The public repository returned HTTP 200 in an anonymous request.

## Remaining limitations

- Automated checks do not replace a visual browser test of search, selection, filtering, and error states.
- TVmaze availability, rate limits, image hosting, and response fields remain external dependencies.
- A secret scan reduces risk but cannot prove that a repository is safe.
