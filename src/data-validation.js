// Fail before drawing if the frozen dataset is incomplete or internally inconsistent.
export function validateRows(rows, quintiles) {
  if (rows.length !== 50) throw new Error('Expected 50 BLS records.');
  const keys = new Set();
  const amounts = ['total_expenditures_usd', 'food_total_usd', 'food_at_home_usd', 'food_away_from_home_usd'];
  for (const row of rows) {
    const key = `${row.year}-${row.income_quintile}`;
    if (!Number.isInteger(row.year) || row.year < 2015 || row.year > 2024 ||
        !quintiles.includes(row.income_quintile) || row.quintile_rank !== quintiles.indexOf(row.income_quintile) + 1 || keys.has(key)) {
      throw new Error('Invalid or duplicate year/quintile record.');
    }
    if (amounts.some(field => !Number.isFinite(row[field]) || row[field] <= 0) ||
        row.food_total_usd >= row.total_expenditures_usd ||
        Math.abs(row.food_at_home_usd + row.food_away_from_home_usd - row.food_total_usd) > 2) {
      throw new Error('Invalid expenditure amounts or rounding inconsistency.');
    }
    keys.add(key);
  }
}
