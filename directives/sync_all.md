# SOP: Synchronize Itinerary & AI Guides

This directive explains how to keep the JPapp itinerary in sync with the master Google Doc and ensure all AI guide texts are pre-created.

## Overview
The synchronization process is handled by a single Python script that:
1. Fetches the latest itinerary from the Google Doc.
2. Updates the `src/App.jsx` file with the new data.
3. Generates or updates AI guide texts in `src/data/guides.json`.

## Prerequisites
- **Python 3.x** installed.
- **Dependencies**: `requests`, `python-dotenv`.
  ```bash
  pip install requests python-dotenv
  ```
- **Environment Variables**: A `.env` file in the project root with your Google API Key.
  ```env
  GOOGLE_API_KEY=your_api_key_here
  ```

## How to Sync
Run the following command from the project root:

```bash
python execution/sync_all.py
```

### What happens during sync?
1. **Fetching**: The script downloads the text export of the Google Doc.
2. **Parsing**: It parses the document looking for Parts, Days, and Events (pattern: `* HH:MM | Activity`).
3. **Booking Status**: The script automatically detects the booking status:
   - **Confirmed**: Sets `status: "confirmed"` if "(Booked)", "(confirmed)", "booked", or "confirmed" is detected in the activity name or notes.
   - **Pending**: Sets `status: "pending"` if "pending" or "need to book" is detected and makes sense for activity.
4. **App Update**: It replaces the `itineraryData` array in `src/App.jsx`.
5. **AI Generation**: For each unique activity, it calculates a hash based on the details. If the activity is new or details have changed, it calls the Gemini API to generate a fresh guide script.
6. **Caching**: Results are saved to `src/data/guides.json`.

## Troubleshooting
- **No changes in App.jsx**: Check if the Google Doc structure matches the expected pattern (e.g. `🗓️ Part 1`, `Day 1`, `* 09:00 | Activity`).
- **AI Guides not updating**: Ensure your `GOOGLE_API_KEY` is valid and has access to the Gemini API.
- **Syntax Errors in App.jsx**: If the script somehow corrupts `App.jsx`, you can revert using git or manually fix the `itineraryData` array structure.

## Deployment
Always run the sync script **before** deploying changes to Firebase to ensure the latest content is included in the build.

```bash
python execution/sync_all.py
npm run build
firebase deploy
```
