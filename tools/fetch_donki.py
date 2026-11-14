import json, os, sys, time, datetime, urllib.request, urllib.error, urllib.parse

KEY = os.environ.get("NASA_API_KEY")
if not KEY:
    sys.exit("NASA_API_KEY env var missing")

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

ENDPOINTS = {
    "CME": {},
    "CMEAnalysis": {"mostAccurateOnly": "true", "speed": "0", "halfAngle": "0", "catalog": "ALL"},
    "SEP": {},
    "GST": {},
}

START_YEAR = 2010
today = datetime.date.today()


def get(ep, params):
    q = dict(params)
    q["api_key"] = KEY
    url = "https://api.nasa.gov/DONKI/%s?%s" % (ep, urllib.parse.urlencode(q))
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                body = r.read().decode("utf-8")
                return r.status, json.loads(body) if body.strip() else []
        except urllib.error.HTTPError as e:
            last = "HTTP %s" % e.code
            if e.code in (404, 400):
                return e.code, None
            time.sleep(2 * (attempt + 1))
        except Exception as e:
            last = str(e)
            time.sleep(2 * (attempt + 1))
    return last, None


summary = {"downloaded_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": "https://api.nasa.gov/ (DONKI)", "endpoints": {}}

for ep, extra in ENDPOINTS.items():
    records = []
    errors = []
    for year in range(START_YEAR, today.year + 1):
        for month in range(1, 13):
            s = datetime.date(year, month, 1)
            if s > today:
                break
            nxt = datetime.date(year + (month == 12), (month % 12) + 1, 1)
            e = min(nxt - datetime.timedelta(days=1), today)
            p = dict(extra)
            p["startDate"] = s.isoformat()
            p["endDate"] = e.isoformat()
            status, data = get(ep, p)
            if data is None:
                errors.append({"month": s.isoformat(), "status": status})
            else:
                records.extend(data)
            time.sleep(0.25)
        print(ep, year, "records so far", len(records), flush=True)
    path = os.path.join(OUT, "donki_%s_%d-%d.json" % (ep, START_YEAR, today.year))
    if records:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False)
    summary["endpoints"][ep] = {
        "records": len(records),
        "errors": errors,
        "file": os.path.basename(path) if records else None,
        "bytes": os.path.getsize(path) if records else 0,
    }
    print(ep, len(records), "errors:", len(errors), flush=True)

with open(os.path.join(OUT, "_download_summary.json"), "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
print("done")
