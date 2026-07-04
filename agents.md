# Agent Instructions

## UI Verification

When verifying that a UI change works correctly, always check **both desktop and mobile** layouts. The paper card layout, action buttons, and absolutely-positioned elements (e.g. download count badge) behave differently on mobile (≤768px) where the card switches to a vertical flex layout and buttons go full-width. A change that looks correct on desktop can be broken on mobile.

## Analytics

The site has self-hosted analytics (`Analytics::Tracker`) with an admin dashboard at `/admin/analytics` (HTTP basic auth via `PERSONAL_UN` / `PERSONAL_PASS`). When verifying tracking end-to-end, note what is deliberately **never** tracked: requests with a blank or bot-like User-Agent, `/admin` and `/dktest` paths, and any session that has authenticated via basic auth (visiting an admin page marks the session as the site owner). To generate events, use a fresh session with a real browser User-Agent. Daily buckets follow the site's configured time zone (Eastern), not UTC.
