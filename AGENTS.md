# AGENTS.md

## Cursor Cloud specific instructions

### Codebase overview

This is a **documentation-first monorepo** for GA technologies' product planning AI-assisted project management. It contains PMBOK-structured project documentation and Google Apps Script (GAS) automation code for multiple internal business projects.

**Key projects with executable code:**

| Project | Location | Language | Runtime |
|---------|----------|----------|---------|
| LMS (法務研修LMS) | `projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/` | Google Apps Script (.gs) + HTML | Google Apps Script cloud |
| Slack通知 (サブリース) | `projects/AGNT_2026_.../development/slack_notification/` | Google Apps Script (.gs/.js) | Google Apps Script cloud |

### Important caveats

- **No local server**: All executable code is Google Apps Script that runs in Google's cloud. There is no backend server, no database, and no Docker setup to run locally.
- **clasp** (`@google/clasp`) is used for the development workflow: edit `.gs` files locally, then `clasp push` to deploy to Google. Requires Google authentication (`clasp login`).
- **Playwright** is the only Node.js dependency (in `prototypes/`), used for browser-based testing of deployed GAS web apps.
- The HTML files in `prototypes/` use GAS template syntax (`<?= ... ?>`, `<?!= ... ?>`) and cannot render standalone in a browser without the GAS runtime.
- `npm test` in `prototypes/` is not configured (placeholder only). Tests are run via Python Playwright scripts or GAS editor.
- `check_spreadsheets.py` has a pre-existing syntax error (duplicate script content appended after `__main__` block).

### Development workflow

1. Install dependencies: `npm install` in `prototypes/` directory
2. Install clasp globally: `npm install -g @google/clasp`
3. Authenticate: `clasp login` (requires Google account with access)
4. Pull latest GAS code: `clasp pull` (from `prototypes/` directory)
5. Edit `.gs` files locally
6. Push changes: `clasp push` (from `prototypes/` directory)
7. Test via GAS Script Editor or Playwright scripts

See `prototypes/README.md` for detailed function reference and deployment guide.

### Lint / Test / Build

- **No ESLint or TypeScript**: The codebase uses plain JavaScript (GAS V8 runtime). No linter is configured.
- **No build step**: GAS files are pushed directly via clasp.
- **Testing**: Python Playwright scripts in `prototypes/scripts/` or manual testing via GAS Script Editor. All require Google authentication.
