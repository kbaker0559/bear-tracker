# Changelog

## v1.9
- Added Supabase connection guide.
- Added config template for safe public anon-key setup.
- Added starter database adapter.
- Added database connection test plan.
- Added in-app checklist for live mode readiness.

## v1.8
- Added live sync integration plan and event design.

## Sprint 3.2 — AI Hole Score Recognition

- Reads all 18 gross hole scores for each player row.
- Reads handwritten OUT, IN, and 18-hole totals for verification.
- Calculates totals independently and flags arithmetic disagreements.
- Loads recognized values and confidence levels into the existing review grid.
- Adds a safe one-click utility for creating upload ZIPs without secrets or generated folders.

## Sprint 3.2.1 - AI Image Preparation
- Automatically detects and crops the bright paper scorecard from the surrounding desk or cart background.
- Automatically rotates portrait/sideways scorecards into landscape orientation before AI recognition.
- Preserves the original photo and allows comparison with the AI-prepared image.
- Uses the prepared image for card identity and hole-score recognition.

## Foundation F1 — Tournament Library
- Added separate browser storage for each tournament.
- Added an explicit active tournament ID so Bear Tracker reopens the intended tournament.
- Added Tournament Library controls for open, duplicate, rename, archive, unarchive, and delete.
- Added Development Copy labeling for safe OCR experiments.
- Migrates the previous single saved round into the library on first launch.
- Added a persistent current-tournament/autosave banner.
