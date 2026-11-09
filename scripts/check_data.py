"""Check the frozen CSVs against the original BLS API response, without a network call."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw = json.loads((root / 'data/bls_api_2015_2024.json').read_text())
assert raw['status'] == 'REQUEST_SUCCEEDED'
series = {s['seriesID']: {int(v['year']): float(v['value']) for v in s['data'] if v['period'] == 'A01'} for s in raw['Results']['series']}
assert len(series) == 20
with (root / 'data/food_spending.csv').open(newline='') as f:
    wide = list(csv.DictReader(f))
with (root / 'data/food_spending_long.csv').open(newline='') as f:
    tidy = list(csv.DictReader(f))
assert len(wide) == 50 and len(tidy) == 100
assert all(all(value != '' for value in r.values()) for r in wide + tidy)
assert len({(r['year'], r['income_quintile']) for r in wide}) == 50
assert len({(r['year'], r['income_quintile'], r['food_category']) for r in tidy}) == 100
quintiles = ['Lowest', 'Second', 'Middle', 'Fourth', 'Highest']
items = {'total_expenditures_usd': 'TOTALEXP', 'food_total_usd': 'FOODTOTL', 'food_at_home_usd': 'FOODHOME', 'food_away_from_home_usd': 'FOODAWAY'}
for r in wide:
    year = int(r['year']); rank = quintiles.index(r['income_quintile']) + 1
    assert int(r['quintile_rank']) == rank
    for field, item in items.items():
        assert float(r[field]) == series[f'CXU{item}LB01{rank+1:02d}M'][year]
    assert 0 < float(r['food_total_usd']) < float(r['total_expenditures_usd'])
    assert abs(float(r['food_at_home_usd']) + float(r['food_away_from_home_usd']) - float(r['food_total_usd'])) <= 2
    assert abs(float(r['food_share_percent']) - 100*float(r['food_total_usd'])/float(r['total_expenditures_usd'])) < .0006
assert {int(r['year']) for r in wide} == set(range(2015, 2025))
for r in tidy:
    parent = next(w for w in wide if w['year'] == r['year'] and w['income_quintile'] == r['income_quintile'])
    field = {'At home': 'food_at_home_usd', 'Away from home': 'food_away_from_home_usd'}[r['food_category']]
    assert float(r['category_expenditure_usd']) == float(parent[field])
    assert float(r['total_expenditures_usd']) == float(parent['total_expenditures_usd'])
    assert abs(float(r['category_share_percent']) - 100*float(r['category_expenditure_usd'])/float(r['total_expenditures_usd'])) < .0006
print('PASS: 20 BLS series; all 200 spending values match the raw response; 50 wide / 100 tidy records; no blank fields or duplicate keys; shares, rank and rounding verified.')
