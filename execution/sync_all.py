import os
import re
import json
import hashlib
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
DOC_ID = "18tBATiJ796mLbsPoKMmLdSbqhhyCwdGWhXBZxXRQ9No"
DOC_EXPORT_URL = f"https://docs.google.com/document/d/{DOC_ID}/export?format=txt"

APP_PATH = "src/App.jsx"
GUIDES_PATH = "src/data/guides.json"

def fetch_google_doc():
    print(f"Fetching Google Doc from {DOC_EXPORT_URL}...")
    response = requests.get(DOC_EXPORT_URL)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch Google Doc: {response.status_code}")
    # Normalize line endings
    return response.text.replace('\r\n', '\n')

def parse_itinerary(text):
    print("Parsing itinerary from Google Doc...")
    parts = []
    current_part = None
    current_day = None

    lines = text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Detect Parts (🗓️ Part X: Title)
        part_match = re.search(r"🗓️ Part (\d+): (.*)", line)
        if part_match:
            current_part = {
                "title": f"Part {part_match.group(1)}: {part_match.group(2).strip()}",
                "subtitle": "", # Will infer from content if possible
                "dates": "",
                "area": "",
                "days": []
            }
            parts.append(current_part)
            current_day = None
            
            # Try to grab subtitle/dates/area from next few lines
            for j in range(1, 4):
                if i + j < len(lines):
                    next_line = lines[i+j].strip()
                    if "Stay:" in next_line:
                        current_part["subtitle"] = next_line
                    elif "Area:" in next_line:
                        current_part["area"] = next_line.replace("Area:", "").strip()
                    elif "-" in next_line and any(m in next_line for m in ["Mar", "Apr"]):
                        current_part["dates"] = next_line
            continue

        # Detect Days (Day X: Date | Label)
        day_match = re.search(r"Day (\d+): (.*?)\s*\|\s*(.*)", line)
        if day_match and current_part:
            current_day = {
                "date": day_match.group(2).strip(),
                "label": f"Day {day_match.group(1)}: {day_match.group(3).strip()}",
                "events": []
            }
            current_part["days"].append(current_day)
            continue

        # Detect Events (* HH:MM | Activity)
        event_match = re.search(r"^\*\s*(\d{2}:\d{2})\s*\|\s*(.*)", line)
        if event_match and current_day:
            time = event_match.group(1)
            activity = event_match.group(2).strip()
            
            # Collect notes from subsequent lines starting with *
            notes = []
            k = i + 1
            while k < len(lines):
                next_line = lines[k].strip()
                if next_line.startswith("*") and not re.search(r"^\*\s*\d{2}:\d{2}", next_line):
                    notes.append(next_line.lstrip("*").strip())
                    k += 1
                elif not next_line:
                    k += 1
                else:
                    break

            # Detect booking status from activity name or notes
            notes_str = " ".join(notes).lower()
            status = ""
            if "(booked)" in activity.lower() or "(confirmed)" in activity.lower() or "confirmed" in notes_str or "booked" in notes_str:
                status = "confirmed"
            elif "pending" in activity.lower() or "pending" in notes_str or "need to book" in notes_str:
                status = "pending"

            current_day["events"].append({
                "time": time,
                "activity": activity,
                "type": infer_type(activity),
                "transportMode": infer_transport(notes),
                "note": " ".join(notes),
                "status": status
            })

    return parts

def infer_type(activity):
    act = activity.lower()
    if any(k in act for k in ["sushi", "ramen", "food", "dinner", "lunch", "market", "mochi", "street food", "gyoza", "meal", "snack"]):
        return "food"
    if any(k in act for k in ["train", "shinkansen", "airport", "bus", "flight", "check-out", "arrival", "departure", "move"]):
        return "transport"
    if any(k in act for k in ["hotel", "check-in", "stay"]):
        return "hotel"
    if any(k in act for k in ["temple", "shrine", "museum", "park", "garden", "castle", "view", "sky", "art", "monument", "tower"]):
        return "sight"
    if any(k in act for k in ["walk", "stroll", "explore", "stroll"]):
        return "walk"
    return "sight"

def infer_transport(notes):
    notes_str = " ".join(notes).lower()
    if "taxi" in notes_str:
        return "taxi"
    if "walk" in notes_str or "walking" in notes_str:
        return "walk"
    if "boat" in notes_str or "cruise" in notes_str:
        return "boat"
    if "train" in notes_str or "subway" in notes_str or "line" in notes_str or "shinkansen" in notes_str:
        return "public"
    return "public"

def update_app_jsx(parts):
    print(f"Updating {APP_PATH}...")
    with open(APP_PATH, 'r') as f:
        content = f.read()

    start_marker = "const itineraryData = ["
    end_marker = "];"
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        raise Exception("Could not find itineraryData in App.jsx")
    
    # Use balanced bracket counting or find the specific marker after the array
    end_pattern = r"\];\n\n\s+const getTypeIcon"
    match = re.search(end_pattern, content)
    if not match:
        raise Exception("Could not find the end of itineraryData in App.jsx")
    
    end_idx = match.start() + 1 # include the closing bracket

    # We need to format the JSON slightly to look like JS objects (optional but cleaner)
    # Actually standard JSON is fine for JS.
    itinerary_json = json.dumps(parts, indent=2)
    
    new_content = content[:start_idx + len("const itineraryData = ")] + itinerary_json + content[end_idx:]
    
    with open(APP_PATH, 'w') as f:
        f.write(new_content)
    print("App.jsx updated successfully.")

def generate_guides(parts):
    print("Generating/Updating AI guides...")
    if not GOOGLE_API_KEY:
        print("Warning: GOOGLE_API_KEY not found in .env. Skipping guide generation.")
        return

    try:
        with open(GUIDES_PATH, 'r') as f:
            guides = json.load(f)
    except:
        guides = {}

    updated = False
    for part in parts:
        for day in part["days"]:
            for event in day["events"]:
                activity = event.get("activity")
                if not activity:
                    continue
                
                # Create a robust key/hash
                # We want to re-generate if time, place, or notes change significantly
                event_fingerprint = {
                    "activity": activity,
                    "day": day["label"],
                    "time": event["time"],
                    "note": event["note"]
                }
                event_hash = hashlib.md5(json.dumps(event_fingerprint, sort_keys=True).encode()).hexdigest()
                
                # Check if we need to regenerate
                if activity not in guides or guides[activity].get("hash") != event_hash:
                    print(f"Generating guide for: {activity}...")
                    text = call_gemini(activity, day["label"], event["time"])
                    if text:
                        guides[activity] = {
                            "text": text,
                            "hash": event_hash
                        }
                        updated = True
                    else:
                        print(f"Failed to generate guide for {activity}")

    if updated:
        with open(GUIDES_PATH, 'w') as f:
            json.dump(guides, f, indent=2)
        print(f"Updated {GUIDES_PATH}")
    else:
        print("No guide updates needed.")

def call_gemini(place, day, time):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={GOOGLE_API_KEY}"
    context = f" This is for an activity planned for {day} at {time}."
    prompt = f"Write an engaging, 300-350 word audio-guide script about {place} in Japan.{context} Include history, interesting curiosities, and context. Don't introduce yourself. Make it sound like a friendly, deeply knowledgeable local tour guide speaking to tourists. Do not include any text formatting like * or #, just use plain, readable text that flows well when spoken aloud."
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Gemini API error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"Error calling Gemini: {e}")
    return None

if __name__ == "__main__":
    try:
        doc_text = fetch_google_doc()
        parts = parse_itinerary(doc_text)
        
        # Validation/Check for specific requirements in AGENTS.md
        # Day 1 Senso-ji should be 07:00
        # This is more of a verification, but we can log it.
        
        update_app_jsx(parts)
        generate_guides(parts)
        
        print("\nSync process completed successfully.")
    except Exception as e:
        print(f"\nSync failed: {e}")
        import traceback
        traceback.print_exc()
