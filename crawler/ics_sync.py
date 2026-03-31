import json
import os
import requests
from datetime import datetime

ICS_URL = "https://calendar.google.com/calendar/ical/mr7kibfjcm3gu52v6t64lreras%40group.calendar.google.com/public/basic.ics"
OUTPUT_EVENTS = "frontend-next/public/data/events.json"
OUTPUT_ACTIVITY = "frontend-next/public/data/activity_summary.json"


def parse_ics(text):
    events = []
    current = {}

    for line in text.splitlines():
        line = line.strip()

        if line == "BEGIN:VEVENT":
            current = {}
        elif line == "END:VEVENT":
            events.append(current)
        else:
            if ":" in line:
                key, value = line.split(":", 1)
                key = key.split(";")[0]
                current[key] = value

    parsed = []
    for e in events:
        parsed.append({
            "source_id": e.get("UID"),
            "title": e.get("SUMMARY"),
            "event_date": e.get("DTSTART"),
            "end_time": e.get("DTEND"),
            "venue": e.get("LOCATION"),
            "description": e.get("DESCRIPTION"),
        })

    return parsed


def normalize_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value[:8], "%Y%m%d").strftime("%Y-%m-%d")
    except:
        return value


def transform(events):
    out = []
    for e in events:
        out.append({
            "source_id": e.get("source_id"),
            "title": e.get("title"),
            "event_date": normalize_date(e.get("event_date")),
            "venue": e.get("venue"),
        })
    return out


def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("Fetching ICS...")
    res = requests.get(ICS_URL, timeout=30)
    res.raise_for_status()

    raw_events = parse_ics(res.text)
    events = transform(raw_events)

    save(OUTPUT_EVENTS, events)

    print(f"Saved {len(events)} events")

    summary = {
        "generated_at": datetime.utcnow().isoformat(),
        "event_count": len(events)
    }

    save(OUTPUT_ACTIVITY, summary)


if __name__ == "__main__":
    main()
