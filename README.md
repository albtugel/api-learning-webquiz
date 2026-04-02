# WebQuiz Studio

A small quiz app that supports creating, solving, and tracking quizzes. It works with a live API (JSON Server) and automatically falls back to local storage if the API is offline.

## Project Structure

- `index.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `data/db.json`
- `server/mock.php` (optional PHP mock)
- `docs/api.md` (API description)
- `docs/api.http` (ready-to-run HTTP requests)

## Run With JSON Server

1. Start the API:

```bash
npx json-server --watch data/db.json --port 8888
```

2. Serve the frontend (from the project root):

```bash
python3 -m http.server 8080
```

3. Open `http://localhost:8080` in the browser.

## Offline Mode

If the API is not reachable, the app switches to local storage automatically. Use the **Refresh** button to re-check the API.

## Documentation

- `docs/api.md` lists endpoints and request/response examples.
- `docs/api.http` contains ready-made requests for the VS Code REST Client extension.

## Configuration

- Update the API URL inside `assets/js/app.js` if your API runs on a different port.
