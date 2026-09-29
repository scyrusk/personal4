---
name: qa-guide
description: QA guidelines for Sauvik's personal site (Rails 7) — where the running app is, how to start it if it isn't, and which pages to exercise.
triggers:
- /qa-changes
---

# QA guidelines for sauvik.me (personal4)

## Environment

- The app is usually **already running at `http://localhost:3000`**. Check first with
  `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/publications` (expect 200). If it answers, use it:
  don't start another server, and don't run `bundle install`, `bin/setup`, migrations or seeds.
- Rails reloads code on each request in development, so the running server shows whatever branch is checked out in
  the checkout it was started from. Confirm that checkout is on the PR's branch
  (`lsof -a -d cwd -p "$(lsof -t -iTCP:3000 -sTCP:LISTEN | head -1)"` gives its directory, then
  `git -C <that dir> branch --show-current`). If it's
  serving a different branch, say so and ask rather than restarting someone else's server.
- If nothing answers on port 3000, start it from this checkout as `agents.md` ("Running the dev server")
  describes: `bin/link-dev-data`, then Ruby 3.2.2 via chruby and
  `RAILS_DEVELOPMENT_HOSTS=host.docker.internal,.trycloudflare.com bin/rails s -d -p 3000 -P tmp/pids/agent.pid`.
  Stop only a server you started, with `kill "$(cat tmp/pids/agent.pid)"`. The server on port 3017 is the owner's.

## Key pages

- `/` — the one-page site; `/about`, `/recruiting`, `/students` and `/publications` are the same page scrolled to
  that section, with the section in the URL and title.
- `/recruiting` — the recruiting box. The "I'm a…" toggle switches between "Prospective Ph.D. student" and
  "Collaborator / visitor" panels; below them are the box's two call-to-action buttons. Recruiting links also appear
  in the sidebar (desktop) and the sticky header strip (mobile), so check a recruiting change in all three places.
- `/publications` — search, topic and preset filter chips, "More filters", numbered pagination (`?page=`), the
  per-paper cite panel (BibTeX/APA/MLA/RIS) and the PDF link. A year URL such as `/2024` redirects to
  `/publications?year=2024`.
- `/papers/<id>/serve` — a paper's PDF. A paper without a hosted PDF gets a branded recovery page with a 404
  status (e.g. ids 50 and 73); that's expected, not a regression.

Skip `/admin` and `/admin/analytics` (HTTP basic auth; visiting them marks the session as the site owner).
`mailto:` links can't be followed in a browser here: check their `href`, including any `subject=`.

## Viewports

Test every UI change at desktop width and at mobile width (≤768px, e.g. 390×844). Below 768px the layout changes
substantially (mobile header and bottom nav, full-width buttons, vertical paper cards), so a change that works on
desktop can break on mobile.
