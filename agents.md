# Agent Instructions

## UI Verification

When verifying that a UI change works correctly, always check **both desktop and mobile** layouts. The paper card layout, action buttons, and absolutely-positioned elements (e.g. download count badge) behave differently on mobile (≤768px) where the card switches to a vertical flex layout and buttons go full-width. A change that looks correct on desktop can be broken on mobile.
