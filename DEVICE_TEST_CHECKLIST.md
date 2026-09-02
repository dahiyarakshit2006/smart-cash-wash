# /wash Phase 1 — Real Device Test Checklist

Everything in this build has been verified in a desktop Chrome environment
(browser automation + direct DB checks). Two things specifically **cannot**
be verified without a real device and are flagged below. Run this on a real
low-end Android phone, on the phone's own mobile data (not wifi) with
throttling/airplane-mode toggles, per the brief's done criteria.

## Setup

1. Open `https://<your-deployed-url>/wash/login` in Chrome on the phone.
2. Log in with a seeded worker phone number (e.g. `+919810000001`), OTP
   code `000000` (mocked — see `src/lib/auth.ts` for the real-provider
   plug-in point).
3. Accept the consent screen.
4. From the browser menu, "Add to Home Screen" / "Install app" — confirms
   PWA installability.

## Test 1 — Median time to log one car (target: under 15s incl. both photos)

1. Open the app from the home-screen icon (not the browser tab).
2. Tap a car in "Today's route".
3. Time from tap to "Done" tap, including taking both photos with the real
   camera.
4. Repeat for 5 different cars. Report the median.

**What to watch for:** no spinner, no loading state, no visible delay
between tapping "Done" and returning to the route list — this is a hard
constraint, not a nice-to-have. If you see any loading UI, that's a bug to
report back, not something to work around.

## Test 2 — Offline queue survives an app kill mid-shift

This is the one **I could not fully verify** in this environment. I proved:
- Zero data loss across repeated offline-simulate + reload cycles (17ms
  enqueue, real uploads confirmed landing in Supabase Storage afterward).
- The recovery code path for a photo killed *mid-compression*
  (`processCompressionQueue` in `src/lib/photo-queue/queue.ts`) is
  implemented and code-reviewed, but I was never able to actually catch a
  photo mid-compression to kill against — compression finishes in
  under a second on desktop Chrome, faster than my tooling's round-trip
  latency could interrupt it.

On the real device:

1. Turn on airplane mode (full radio off, not just wifi — this is the
   "zero signal" case, stricter than the DevTools throttling test).
2. Log 2-3 cars (before + after photos) while in airplane mode.
3. Immediately force-kill the app (swipe away from recent apps) after
   tapping "Done" on the last one — try to catch it while the photo is
   still compressing, not just queued.
4. Reopen the app. Confirm the route list still shows those cars as done
   locally is not the test — the test is whether the photos actually
   reach Supabase Storage once connectivity returns.
5. Turn airplane mode off.
6. Wait ~30s (manual retry fallback interval) or force a foreground
   resume of the app.
7. Check the Supabase dashboard → Storage → `wash-photos` bucket → confirm
   all photos from step 2 are present.

Report: did anything go missing? At what point (queued-but-not-compressed,
compressed-but-not-uploaded) if anything did.

## Test 3 — Any input beyond what the brief specified?

I did not add any input beyond what's listed in the brief's worker flow —
phone number entry at login is authentication, not part of the per-car
loop, and the geolocation consent toggle was explicitly requested (decision
#4). If, using the real app, you find a point where you expected the app to
ask you something and it didn't (or the reverse — it asks for something
that feels unnecessary), that's worth flagging back to me directly, since
you're the one actually holding the phone and squeegee.

## What to send back

- Median seconds from Test 1.
- Pass/fail + notes from Test 2.
- Any extra-input findings from Test 3.
- Any screen that felt slow, confusing, or wrong on a real device vs. how
  it looked in my testing.
