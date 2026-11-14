"""Downloads the RadLab (NASA OSDR) dose-rate windows used by Sol Rewind.
Usage: python tools/fetch_radlab.py OUT_DIR
No API key needed. The URL must end with a slash (.../radlab/api/).
"""
import datetime, os, sys, urllib.parse, urllib.request

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
BASE = "https://visualization.osdr.nasa.gov/radlab/api/"
WINDOW = "(timestamp>=2024-05-08T00:00)AND(timestamp<2024-05-16T00:00)"
JOBS = {
    "radlab_iss_2024-05-08_to_15.csv": ("(spacecraft=ISS)AND" + WINDOW, "absorbed_dose_rate,dose_equivalent_rate,instrument"),
    "radlab_moon_2024-05-08_to_15.csv": ("(celestial_body=Moon)AND" + WINDOW, "absorbed_dose_rate,dose_equivalent_rate,instrument,spacecraft,trajectory"),
    "radlab_mars_2024-05-08_to_15.csv": ("(celestial_body=Mars)AND" + WINDOW, "absorbed_dose_rate,dose_equivalent_rate,instrument,spacecraft,trajectory"),
}
for name, (query, fields) in JOBS.items():
    # The API wants the field name written exactly as "fields+" (not percent-encoded), so build the query by hand.
    qs = "query=%s&fields+=%s&format=csv" % (urllib.parse.quote(query), urllib.parse.quote(fields))
    with urllib.request.urlopen(BASE + "?" + qs, timeout=200) as r:
        data = r.read()
    with open(os.path.join(OUT, name), "wb") as f:
        f.write(data)
    print(name, len(data), "bytes", datetime.datetime.now().isoformat(timespec="seconds"))
