# UCAAT2026

Demo repository for UCAAT 2026 - How self-healing will revolutionize your automated tests with AI.

## Prerequisites

Before you start, make sure `node` and `npm` are installed:

```bash
node -v
npm -v
```

If a command is not found, install Node.js (npm is bundled with Node.js).

## Install Node.js / npm (if needed)

### macOS

Option 1 (official site):

1. Download the LTS installer: <https://nodejs.org/>
2. Install Node.js
3. Verify:

```bash
node -v
npm -v
```

Option 2 (Homebrew):

```bash
brew install node
```

### Windows

1. Download the LTS installer: <https://nodejs.org/>
2. Run the installer (keep npm enabled)
3. Open a new terminal (PowerShell or CMD)
4. Verify:

```bash
node -v
npm -v
```

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y nodejs npm
```

Verify:

```bash
node -v
npm -v
```

Note: depending on your distribution, the versions available via `apt` can be outdated. The official site or `nvm` may be preferable.

## Project installation

Move into the project folder:

```bash
cd /path/to/UCAAT2026
```

Install dependencies:

```bash
npm install
```

## Install Playwright (E2E tests)

The project includes end-to-end tests with Playwright.

After `npm install`, install the Playwright browsers:

```bash
npx playwright install
```

On Linux (if system dependencies are missing), use:

```bash
npx playwright install --with-deps
```

Finally, install [Playwright MCP](https://playwright.dev/docs/test-agents) (here, with VSCode):

```bash
npx playwright init-agents --loop=vscode
```

## Install `nodemon` (optional)

`nodemon` is already listed as a dev dependency of the project, so `npm run dev` works without a global install.

If you also want it globally on your machine:

```bash
npm install -g nodemon
```

Verify:

```bash
nodemon -v
```

## Run the site

### Development mode (hot reload)

The server restarts automatically when you modify `server.js`.

```bash
npm run dev
```

### Normal mode

```bash
npm start
```

## Run the E2E tests (Playwright)

### Headless mode (CI / terminal)

```bash
npm run test:e2e
```

### Headed mode (visible browser)

```bash
npm run test:e2e:headed
```

### Playwright UI mode

```bash
npm run test:e2e:ui
```

Notes:

- Playwright automatically starts the server via `npm start` (`webServer` configuration).
- If the server is already running on `http://127.0.0.1:3000`, Playwright reuses it.
- Test reports/files (`playwright-report/`, `test-results/`) are ignored by Git.

## Open the site

In your browser, open:

```text
http://localhost:3000
```

## Login

Use the following credentials:

- Username: `admin`
- Password: `password`

After signing in, you will be redirected to:

```text
http://localhost:3000/admin
```

## Self-healing CI

A GitHub Actions workflow automatically detects failing E2E tests on push to `main` and attempts to fix them using Claude Code. If a fix is applied, a pull request is opened for review.

### Setup

1. **Generate a Claude Code OAuth token** (requires an active Claude subscription):

```bash
claude setup-token
```

2. **Add the token to your GitHub repository secrets:**

   Go to **Settings → Secrets and variables → Actions → New repository secret** and create a secret named `CLAUDE_CODE_OAUTH_TOKEN` with the token value.

3. **Allow GitHub Actions to create pull requests:**

   Go to **Settings → Actions → General → Workflow permissions** and enable **"Allow GitHub Actions to create and approve pull requests"**.

Once configured, any push to `main` that modifies `tests/`, `server.js`, `public/`, `playwright.config.js`, or `package*.json` will trigger the workflow. If tests fail, Claude evaluates each failure with a confidence score and only fixes tests it is confident are outdated (score > 0.7). A detailed report is included in the pull request description.

## Important notes

- The session is stored in memory (for demo/dev).
- If you restart the server, the session is lost (you need to sign in again).
- The `/admin` route is protected: if you are not signed in, you will be redirected to `/`.
- The E2E tests cover login, access to `/admin`, and sign out.
