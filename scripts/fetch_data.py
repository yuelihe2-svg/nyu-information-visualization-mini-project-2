"""Fetch and validate annual Consumer Expenditure Survey quintile means.

Run with ``python scripts/fetch_data.py``. No third-party packages are needed.
The BLS API publishes current annual figures; this project deliberately freezes
the 2015–2024 window so the dashboard and report remain reproducible.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
YEARS = range(2015, 2025)
QUINTILES = {"02": "Lowest", "03": "Second", "04": "Middle", "05": "Fourth", "06": "Highest"}
ITEMS = {
    "TOTALEXP": "total_expenditures",
    "FOODTOTL": "food_total",
    "FOODHOME": "food_at_home",
    "FOODAWAY": "food_away_from_home",
}


def series_id(item: str, quintile: str) -> str:
    return f"CXU{item.replace(' ', '')}LB01{quintile}M"


def main() -> None:
    requested = [series_id(item, quintile) for quintile in QUINTILES for item in ITEMS]
    payload = json.dumps({"seriesid": requested, "startyear": "2015", "endyear": "2024"}).encode()
    request = Request(API, data=payload, headers={"Content-Type": "application/json"})
    with urlopen(request, timeout=60) as response:
        raw = json.load(response)
    if raw.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS API failed: {raw.get('message')}")

    lookup = {series["seriesID"]: series["data"] for series in raw["Results"]["series"]}
    if set(lookup) != set(requested):
        raise ValueError("BLS returned an incomplete set of series")

    values: dict[tuple[int, str], dict[str, float]] = {}
    for quintile in QUINTILES:
        for item, column in ITEMS.items():
            records = lookup[series_id(item, quintile)]
            for record in records:
                if record["period"] != "A01":
                    continue
                year = int(record["year"])
                if year in YEARS:
                    values.setdefault((year, quintile), {})[column] = float(record["value"])

    if len(values) != len(YEARS) * len(QUINTILES):
        raise ValueError(f"Expected 50 year/quintile rows, received {len(values)}")

    rows = []
    for year, quintile in sorted(values):
        measures = values[(year, quintile)]
        if set(measures) != set(ITEMS.values()):
            raise ValueError(f"Missing measures for {year}, quintile {quintile}")
        total = measures["total_expenditures"]
        food = measures["food_total"]
        if not (0 < food < total):
            raise ValueError(f"Unexpected spending levels for {year}, quintile {quintile}")
        if abs(food - measures["food_at_home"] - measures["food_away_from_home"]) > 2:
            raise ValueError(f"Food subtotals fail rounding check for {year}, quintile {quintile}")
        rows.append({
            "year": year,
            "income_quintile": QUINTILES[quintile],
            "quintile_rank": int(quintile) - 1,
            "total_expenditures_usd": int(total),
            "food_total_usd": int(food),
            "food_at_home_usd": int(measures["food_at_home"]),
            "food_away_from_home_usd": int(measures["food_away_from_home"]),
            "food_share_percent": round(100 * food / total, 3),
            "away_share_of_food_percent": round(100 * measures["food_away_from_home"] / food, 3),
        })

    data_dir = ROOT / "data"
    data_dir.mkdir(exist_ok=True)
    (data_dir / "bls_api_2015_2024.json").write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")
    with (data_dir / "food_spending.csv").open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} complete rows from {len(requested)} official BLS series")
    print("2024 food share by quintile:")
    for row in rows:
        if row["year"] == 2024:
            print(f"  {row['income_quintile']:>7}: {row['food_share_percent']:.1f}%")


if __name__ == "__main__":
    main()
