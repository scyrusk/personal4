# Agent Instructions

## Running the dev server

The dev database (`db/development.sqlite3`) and uploaded files (`public/uploads`, including every paper PDF) are gitignored, so a fresh git worktree renders an empty site. In a worktree, run `bin/link-dev-data` first: it symlinks both from the main checkout (it does nothing in the main checkout and never replaces real files). The linked database is shared with the main checkout, so don't run migrations, seeds or other deliberate writes against it without asking.

Start the server detached (`-d`) with Ruby 3.2.2 via chruby, on port 3000 with its own pid file, allowing the hosts the zrok share (`host.docker.internal`) and a Cloudflare quick tunnel use:

```bash
source /opt/homebrew/opt/chruby/share/chruby/chruby.sh && chruby ruby-3.2.2
bin/link-dev-data
RAILS_DEVELOPMENT_HOSTS=host.docker.internal,.trycloudflare.com bin/rails s -d -p 3000 -P tmp/pids/agent.pid
```

Check it with `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/publications` (expect 200), and stop it with `kill "$(cat tmp/pids/agent.pid)"`. The server on port 3017 (pid in the main checkout's `tmp/pids/server.pid`) is the owner's, not yours: never stop or restart it. If port 3000 is taken by a server you did not start, ask before touching it.

## UI Verification

When verifying that a UI change works correctly, always check **both desktop and mobile** layouts. The paper card layout, action buttons, and absolutely-positioned elements (e.g. download count badge) behave differently on mobile (≤768px) where the card switches to a vertical flex layout and buttons go full-width. A change that looks correct on desktop can be broken on mobile.

## Analytics

The site has self-hosted analytics (`Analytics::Tracker`) with an admin dashboard at `/admin/analytics` (HTTP basic auth via `PERSONAL_UN` / `PERSONAL_PASS`). When verifying tracking end-to-end, note what is deliberately **never** tracked: requests with a blank or bot-like User-Agent, `/admin` and `/dktest` paths, and any session that has authenticated via basic auth (visiting an admin page marks the session as the site owner). To generate events, use a fresh session with a real browser User-Agent. Daily buckets follow the site's configured time zone (Eastern), not UTC.

Events are sessionized into journeys (`session_token` + `step_index`, 30-minute gap timeout) that feed the dashboard's "Visitor flow" sankey. Besides server-side pageviews, `journey_tracking.js` beacons client-side events (section views, outbound/email clicks, CV downloads) to `POST /analytics/event`. When verifying these end-to-end: section views only fire after the visitor engages (scroll/keypress/pointer) **and** the section stays on screen for 1 second, and queued events are sent one at a time with a 400ms gap — so wait a few seconds after interacting before checking the database.
