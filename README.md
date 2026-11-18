# Episode Atlas

A small, responsive show search and episode guide powered by the public TVmaze API. Search by show name, pick the right show from the results, and load its episodes using the TVmaze show ID.

## Run it

No API key, build step, or dependency install is required.

### Quickest: open one file

Download `Episode-Atlas-Standalone.html` from this repository and open it in your browser. It contains the HTML, CSS, and JavaScript in one file, so there is no installation or local server to start. Keep an internet connection on so it can request show data from TVmaze.

### Run the project files

1. Download or clone this repository.
2. Open `index.html` in a modern browser. If your browser blocks local file requests, open a terminal in this folder and run `python3 -m http.server 8000`, then visit `http://localhost:8000`.
3. Type a show name, choose a result with the arrow keys (or click it), and press Enter.

## How the API flow works

1. The text in the search box is a **query**, not an identifier. After the user types at least two characters, the page waits 300 ms and sends a `GET` request to `https://api.tvmaze.com/search/shows?q=...`.
2. TVmaze responds with JSON. Each search result has a `show` object with a stable numeric `show.id`, plus the title, year, network, genres, and image. The page displays several matches so the user can select the intended show if names are repeated or similar.
3. When a result is selected, the page saves that result's `show.id` and sends two requests: `GET /shows/{id}` for show details and `GET /shows/{id}/episodes` for the episode array. For example, for show ID `82`, the episode request is `https://api.tvmaze.com/shows/82/episodes`.
4. The browser parses the JSON and builds the show card and episode list. The optional season selector filters the episode data already loaded; changing seasons does not send another request.

The search request is like asking TVmaze, “Which shows could match this text?” The ID is the unambiguous key for subsequent requests. This avoids relying on show names, which can collide. Search is debounced to reduce unnecessary requests, and older in-flight requests are cancelled when a new search starts.

## Main files

- `index.html` — page structure and accessible form controls.
- `styles.css` — responsive visual design.
- `app.js` — API requests, result selection, and rendering.

## API and attribution

The project uses TVmaze's public REST API, which returns JSON and does not require an API key for these endpoints. TVmaze's API documentation describes the show search endpoint and the show episode list endpoint. The application links back to TVmaze to credit the source.

- API documentation: <https://www.tvmaze.com/api>
- Show search: <https://api.tvmaze.com/search/shows?q=girls>
- Episode list example: <https://api.tvmaze.com/shows/1/episodes>

The free API has rate limits and responses may be cached by TVmaze. See its current documentation for terms, rate limits, and data-use requirements. This is a learning project and is not affiliated with TVmaze.
