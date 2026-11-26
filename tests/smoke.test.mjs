import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("all runnable project files exist", async () => {
  await Promise.all(
    [
      "index.html",
      "styles.css",
      "app.js",
      "Episode-Atlas-Standalone.html"
    ].map((path) => access(new URL(path, root)))
  );
});

test("the main page exposes search and episode controls", async () => {
  const html = await read("index.html");
  for (const id of [
    "show-search",
    "search-results",
    "show-panel",
    "season-filter",
    "episode-list"
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /href=["']styles\.css["']/);
  assert.match(html, /src=["']app\.js["']/);
});

test("the application uses the intended TVmaze ID flow", async () => {
  const script = await read("app.js");
  assert.match(script, /\/search\/shows\?q=/);
  assert.match(script, /\/shows\/\$\{encodeURIComponent\(showId\)\}/);
  assert.match(
    script,
    /\/shows\/\$\{encodeURIComponent\(showId\)\}\/episodes/
  );
  assert.match(script, /new AbortController\(\)/);
  assert.match(script, /textContent/);
  assert.doesNotMatch(script, /api[_-]?key/i);
});

test("the standalone file contains its own style and script", async () => {
  const standalone = await read("Episode-Atlas-Standalone.html");
  assert.match(standalone, /<style>[\s\S]+<\/style>/);
  assert.match(standalone, /<script>[\s\S]+const API = ['"]https:\/\/api\.tvmaze\.com['"]/);
  assert.doesNotMatch(standalone, /<script[^>]+src=/i);
  assert.doesNotMatch(standalone, /<link[^>]+rel=["']stylesheet["']/i);
});
