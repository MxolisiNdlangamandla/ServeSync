# Servesync

ServeSync is an Angular + Express + MySQL application for store onboarding, staff order handling, and customer QR-based order access.

## Production setup

The backend now creates the configured MySQL database and required tables automatically on startup.

### Afrihost shared hosting

If you are deploying the Node API on Afrihost cPanel, use the backend folder as the application root.

Recommended settings:

```bash
Application root: server
Application startup file: index.js
```

If you uploaded the full project into a folder like `api`, then use:

```bash
Application root: api/server
Application startup file: index.js
```

The error below means Afrihost is looking for a Node app in the wrong root, or the app entry in cPanel is stale:

```bash
No such application or it's broken. Unable to find app venv folder by this path: /home/<user>/nodevenv/api
```

Fix it like this:

1. Delete the broken Node.js application entry from cPanel.
2. Make sure your files are uploaded first.
3. Recreate the Node.js app with the correct application root.
4. Run `npm install` inside that application root.
5. Set the startup file to `index.js`.
6. Add your environment variables.
7. Restart the application.

This repo now includes a backend-only package file in `server/package.json` so shared hosting can install only the API dependencies.

Set these environment variables for the API server:

```bash
JWT_SECRET=replace-with-a-long-random-secret
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=servesync
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
PORT=3000
```

If your hosted MySQL provider requires TLS, set `DB_SSL=true`.

After setting env vars, start the API with:

```bash
npm run server
```

Verify the API and database are live with:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{ "status": "ok", "database": "connected" }
```

## Development server

To start a local development server, run:

```bash
ng serve
```

To run frontend and backend together locally:

```bash
npm run dev
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Upcoming Features

- Client registrations and login for customer-facing accounts.
- Nearby restaurant discovery so clients can search for and browse restaurants around them.
- A broader consumer experience layer for finding restaurants before joining the in-store ordering flow.
