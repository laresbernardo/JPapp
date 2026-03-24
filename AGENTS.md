# Agent Instructions for Syncing Itinerary with Google Docs

## Quick Sync Command
When asked to "sync the site with Google Doc" or similar, follow these steps:

### 1. Fetch Google Doc Content
```bash
# Google Doc URL for export
https://docs.google.com/document/d/18tBATiJ796mLbsPoKMmLdSbqhhyCwdGWhXBZxXRQ9No/export?format=txt
```

### 2. Read Current App Data
- File: `src/App.jsx`
- Look for: `const itineraryData = [...]`

### 3. Compare and Update
Common differences to check:
- **Day 1 (Fri, Mar 27):** Senso-ji time should be 07:00, not 08:00
- **Day 1 & 2:** "Ginza Central & Depachika (Food Halls)" vs "Ginza Central & Architecture"
- **Day 8 (Fri, Apr 3):** Missing events: Train to Nara, Nakatanidou Mochi, Train to Uji, Return to Kyoto
- **Day 9 (Sat, Apr 4):** Missing events: Train to Osaka, Osaka Night Free Walking Tour

### 4. Run Verification
```bash
npm run lint  # Check for code errors
npm run build # Verify it compiles
```

### 5. Report Changes
List all updates made to the itinerary data.

## Google Doc Structure
The Google Doc contains:
- Summary of Days (table)
- Summary of Stays (hotels)
- Preparation & Logistics
- Part 1: Tokyo East (Days 0-2)
- Part 2: Tokyo West (Days 3-4)
- Part 3: Kyoto (Days 5-8)
- Part 4: Osaka (Days 9-10)
- Bonus Add-on Ideas
- Hotel Area Recommendations
- Top Restaurant Recommendations
- Practical Tips
- Vocab Phrases (partial)

## App Structure
The React app has:
- `itineraryData` array with parts, days, and events
- Each event has: time, activity, type, transportMode, note, status
- Vocab data in `vocabData` array
- Activity recommendations in `getActivityRecommendations`

## Notes
- The Google Doc export may be incomplete (ends after "Photos" section)
- Keep additional vocab sections in the app if they're useful
- The app may have more specific details than the Google Doc (which is OK)

## Sync Procedure (Reference)
This is the complete procedure for syncing the itinerary with Google Docs:

6. Update the app data to match the Google Doc
7. Format notes following the **Notes Formatting Rules** below
8. Run `npm run lint` and `npm run build` to verify
9. Report all changes made

## Notes Formatting Rules
To ensure notes look "nice" (bulleted list with bolded prefixes), follow these rules when updating `itineraryData`:
1. Use the format `Label: Content` within the `note` string.
2. Supported labels include: `Welcome`, `Pass`, `Transport`, `Travel`, `Highlight`, `Tip`, `Action`, `Strategy`, `Logistics`, `Eat`, `Vibe`, `Where`, `Why`, `Activity`, `Experience`, `Architecture`, `Admission`, `Recommendation`, `Task`, `Hotel`, `Info`, `Venue`.
3. Separate different points with a space or newline (the `NoteRenderer` handles the splitting based on the `Label:` pattern).
4. You can use standard bolding `**text**` inside the content if needed (requires NoteRenderer support).

The Google Doc ID is: `18tBATiJ796mLbsPoKMmLdSbqhhyCwdGWhXBZxXRQ9No`
