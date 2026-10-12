import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.DASHBOARD_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  const initialPosition = await page.locator('.dot-hit').first().getAttribute('transform');
  const sample = async (action, selectors) => page.evaluate(async ({ action, selectors }) => {
    const nodes = selectors.map(([selector]) => document.querySelector(selector));
    const read = () => nodes.map((node, i) => node.getAttribute(selectors[i][1]));
    const before = read();
    if (action.type) document.querySelector(`[data-type="${action.type}"]`).click();
    else {
      const dropdown = document.querySelector('#year-select');
      dropdown.value = action.year;
      dropdown.dispatchEvent(new Event('change'));
    }
    await new Promise(resolve => setTimeout(resolve, 180));
    const middle = read();
    await new Promise(resolve => setTimeout(resolve, 400));
    return { before, middle, after: read(), retained: nodes.every((node, i) => node === document.querySelector(selectors[i][0])) };
  }, { action, selectors });
  const assertMoves = result => {
    assert(result.retained, 'Marks must persist across updates');
    result.before.forEach((start, i) => {
      assert.notEqual(result.after[i], start, 'Geometry must reach a new destination');
      assert.notEqual(result.middle[i], start, 'Geometry must move during the transition');
      assert.notEqual(result.middle[i], result.after[i], 'Transition must contain intermediate geometry');
    });
  };
  assertMoves(await sample({ type: 'home' }, [
    ['.dot-hit', 'transform'], ['.trend-line', 'd'], ['.trend-hit', 'cy'],
  ]));
  assertMoves(await sample({ year: '2020' }, [
    ['.segment', 'width'], ['.year-marker', 'x1'], ['.data-dot', 'r'],
  ]));

  // A rapid sequence must settle at the latest state, without queued old updates.
  await page.evaluate(async () => {
    document.querySelector('[data-type="away"]').click();
    await new Promise(resolve => setTimeout(resolve, 70));
    document.querySelector('[data-type="all"]').click();
    await new Promise(resolve => setTimeout(resolve, 70));
    document.querySelector('#reset-button').click();
  });
  await page.waitForTimeout(520);
  const settled = await page.locator('.dot-hit').first().getAttribute('transform');
  // SVG transform interpolation decomposes through browser float matrices.
  const coordinates = transform => transform.match(/-?\d+(?:\.\d+)?/g).map(Number);
  coordinates(settled).forEach((value, i) => {
    assert(Math.abs(value - coordinates(initialPosition)[i]) < 0.001, 'Interrupted transitions must reach the latest data values');
  });
  assert.equal(await page.locator('.dot-hit').count(), 5);
  assert.equal(await page.locator('.segment').count(), 10);
  assert.equal(await page.locator('.trend-line').count(), 5);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.dot-hit').first().getAttribute('transform'), settled);
  assert.equal(await page.locator('#share-value').innerText(), '15.7');
  const expected = await page.locator('.dot-hit').first().getAttribute('aria-label');
  assert(expected.includes('2024: 15.7'));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await page.evaluate(() => {
    document.querySelector('[data-type="home"]').click();
    return {
      transitions: [...document.querySelectorAll('svg *')].some(node => node.__transition),
      position: document.querySelector('.dot-hit').getAttribute('transform'),
    };
  });
  assert.equal(reduced.transitions, false, 'Reduced motion must apply updates synchronously');
  assert.notEqual(reduced.position, settled);
  await page.locator('.dot-hit').first().focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('.dot-hit').first().evaluate(node => node === document.activeElement), 'Keyboard focus must survive updates');
  assert.deepEqual(errors, []);
  console.log('Pass: intermediate geometry, persistent marks, rapid selections, reduced motion, retained keyboard focus, no browser errors.');
} finally {
  await browser.close();
}
