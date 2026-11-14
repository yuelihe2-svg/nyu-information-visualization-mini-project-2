import * as d3 from 'd3';
import foodDataUrl from '../data/food_spending.csv?url';
import './styles.css';
import { validateRows } from './data-validation.js';

// One shared state drives every view. Each chart changes state through select().
const state = { year: 2024, quintile: 'Lowest', type: 'all', trendMode: 'overlay', zoom: false };
// Source ranks stay 1 = Lowest through 5 = Highest. Display higher incomes first.
const rankedQuintiles = ['Lowest', 'Second', 'Middle', 'Fourth', 'Highest'];
const quintiles = [...rankedQuintiles].reverse();
const names = { Lowest: 'Lowest 20%', Second: 'Second 20%', Middle: 'Middle 20%', Fourth: 'Fourth 20%', Highest: 'Highest 20%' };
const colors = { home: '#216d77', away: '#b8622e', ink: '#17333a', muted: '#718783' };
const fmtMoney = d3.format('$,.0f');
const fmtPct = d3.format('.1f');
const tooltip = d3.select('#tooltip');
let rows = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let animateUpdate = false;
const history = [];

// Interrupt from the displayed position so rapid selections never queue stale moves.
function motion(selection) {
  selection.interrupt('selection');
  return animateUpdate
    ? selection.transition('selection').duration(420).ease(d3.easeCubicInOut)
    : selection;
}

function field(type) {
  return type === 'home' ? 'food_at_home_usd' : type === 'away' ? 'food_away_from_home_usd' : 'food_total_usd';
}

function share(row, type = state.type) {
  return 100 * row[field(type)] / row.total_expenditures_usd;
}

function selectedRow() {
  return rows.find(row => row.year === state.year && row.income_quintile === state.quintile);
}

function select(next) {
  if (Object.keys(next).every(key => state[key] === next[key])) return;
  history.push({ ...state });
  if (history.length > 100) history.shift();
  Object.assign(state, next);
  render(true);
}

function showTooltip(event, row, type = state.type) {
  const title = `${names[row.income_quintile]} · ${row.year}`;
  const category = { all: 'All food', home: 'Food at home', away: 'Food away from home' }[type];
  tooltip.html(`<strong>${title}</strong><span>${category}: ${fmtPct(share(row, type))}% of expenditures</span><span>Annual spending: ${fmtMoney(row[field(type)])}</span><span>Total expenditures: ${fmtMoney(row.total_expenditures_usd)}</span>`)
    .classed('visible', true);
  if (event.type === 'focus') {
    const bounds = event.currentTarget.getBoundingClientRect();
    moveTooltip({ clientX: bounds.right, clientY: bounds.bottom });
  } else moveTooltip(event);
}

function moveTooltip(event) {
  const width = tooltip.node().offsetWidth;
  const left = Math.min(event.clientX + 16, window.innerWidth - width - 12);
  const height = tooltip.node().offsetHeight;
  const top = Math.min(event.clientY + 16, window.innerHeight - height - 12);
  tooltip.style('left', `${Math.max(12, left)}px`).style('top', `${Math.max(12, top)}px`);
}

function hideTooltip() { tooltip.classed('visible', false); }

function chartFrame(selector, height, margins) {
  const host = d3.select(selector);
  const width = host.node().clientWidth;
  const svg = host.selectAll('svg').data([null]).join('svg')
    .attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
  return { svg, width, height, plotWidth: width - margins.left - margins.right, plotHeight: height - margins.top - margins.bottom,
    plot: svg.selectAll('.plot').data([null]).join('g').attr('class', 'plot')
      .attr('transform', `translate(${margins.left},${margins.top})`) };
}

function axisStyle(selection) {
  selection.select('.domain').remove();
  selection.selectAll('line').attr('stroke', '#dbe1de');
  selection.selectAll('text').attr('fill', '#59716f').attr('font-size', 14).attr('font-family', 'DM Sans, Arial, sans-serif');
}

function drawSummary() {
  const row = selectedRow();
  const typeLabel = { all: 'food', home: 'food at home', away: 'food away from home' }[state.type];
  d3.select('#selected-label').text(`${names[state.quintile].toUpperCase()} INCOME QUINTILE · ${state.year}`);
  d3.select('#share-value').text(fmtPct(share(row)));
  d3.select('#summary-description').text(`of annual expenditures went to ${typeLabel}`);
  d3.select('#spending-label').text(`ANNUAL ${typeLabel.toUpperCase()} SPENDING`);
  d3.select('#spending-value').text(fmtMoney(row[field(state.type)]));
  d3.selectAll('#type-control button').classed('active', function () { return this.dataset.type === state.type; })
    .attr('aria-pressed', function () { return this.dataset.type === state.type; });
  d3.select('#year-select').property('value', state.year);
  d3.select('#quintile-select').property('value', state.quintile);
  d3.select('#undo-button').property('disabled', history.length === 0);
  const category = { all: 'All food', home: 'At home', away: 'Away from home' }[state.type];
  d3.select('#compare-context').text(`${category} · ${state.year} · share of total expenditures`);
  d3.select('#composition-context').text(`${state.year} · both categories shown · selected: ${names[state.quintile]}`);
  d3.select('#trend-context').text(`${category} · dark line: ${names[state.quintile]} · selected year: ${state.year}`);
  // Titles describe the current data, rather than retaining the initial finding.
  const largest = d3.greatest(rows.filter(r => r.year === state.year), r => share(r));
  d3.select('#quintile-title').text(`${largest.income_quintile} quintile has the largest share`);
  d3.select('#composition-title').text(row.food_at_home_usd >= row.food_away_from_home_usd ? 'At-home spending is larger' : 'Away-from-home spending is larger');
  const first = rows.find(r => r.year === 2015 && r.income_quintile === state.quintile);
  const last = rows.find(r => r.year === 2024 && r.income_quintile === state.quintile);
  const change = share(last) - share(first);
  d3.select('#trend-title').text(`Share ${change >= 0 ? 'rose' : 'fell'} ${fmtPct(Math.abs(change))} pp from 2015 to 2024`);
  d3.select('#selection-announcement').text(`${names[state.quintile]}, ${state.year}. ${category}: ${fmtPct(share(row))} percent of total expenditures, ${fmtMoney(row[field(state.type)])}. All three charts updated.`);
  const previous = rows.find(r => r.year === state.year - 1 && r.income_quintile === state.quintile);
  d3.select('#trend-observation').text(previous
    ? `${state.year - 1} → ${state.year}: ${fmtPct(share(previous))}% → ${fmtPct(share(row))}% (${d3.format('+.1f')(share(row) - share(previous))} pp).`
    : `2015: ${fmtPct(share(row))}% of total spending.`);
}

function drawQuintiles() {
  const margin = { top: 14, right: 58, bottom: 36, left: 108 };
  const { plot, plotWidth, plotHeight } = chartFrame('#quintile-chart', 288, margin);
  const current = rows.filter(r => r.year === state.year);
  const x = d3.scaleLinear().domain([0, 20]).range([0, plotWidth]);
  const y = d3.scaleBand().domain(quintiles).range([0, plotHeight]).padding(.38);
  // A zero-based square-root radius keeps circle area proportional to dollars.
  const size = d3.scaleSqrt().domain([0, d3.max(rows, r => r.food_total_usd)]).range([0, 13]);

  plot.selectAll('.grid').data([null]).join('g').attr('class', 'grid').call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSize(plotHeight).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.selectAll('.x-axis').data([null]).join('g').attr('class', 'x-axis').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues(plotWidth < 240 ? [0, 10, 20] : [0, 5, 10, 15, 20]).tickFormat(d => `${d}%`)).call(axisStyle);
  plot.selectAll('.row-guide').data(quintiles).join('line').attr('class', 'row-guide')
    .attr('x1', 0).attr('x2', plotWidth).attr('y1', q => y(q) + y.bandwidth()/2).attr('y2', q => y(q) + y.bandwidth()/2);
  plot.selectAll('.row-label').data(quintiles).join('text').attr('class', 'row-label')
    .attr('x', -13).attr('y', q => y(q) + y.bandwidth()/2 + 4).attr('text-anchor', 'end')
    .classed('selected', q => q === state.quintile).text(q => names[q]);

  const marks = plot.selectAll('.dot-hit').data(current, r => r.income_quintile).join('g').attr('class', 'dot-hit')
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-pressed', r => r.income_quintile === state.quintile)
    .attr('aria-label', r => `${names[r.income_quintile]}, ${state.year}: ${fmtPct(share(r))} percent. Select quintile.`)
    .on('click', (event, r) => select({ quintile: r.income_quintile }))
    .on('keydown', (event, r) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ quintile: r.income_quintile }); } })
    .on('mouseenter', (event, r) => showTooltip(event, r)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip)
    .on('focus', (event, r) => showTooltip(event, r)).on('blur', hideTooltip);
  motion(marks).attr('transform', r => `translate(${x(share(r))},${y(r.income_quintile) + y.bandwidth()/2})`);
  marks.selectAll('.dot-target').data(r => [r]).join('circle').attr('class', 'dot-target').attr('r', 20).attr('fill', 'transparent');
  motion(marks.selectAll('.data-dot').data(r => [r]).join('circle').attr('class', 'data-dot')).attr('r', r => size(r.food_total_usd))
    .attr('fill', r => r.income_quintile === state.quintile ? colors.ink : colors.muted)
    .attr('stroke', '#fff').attr('stroke-width', 2);
  marks.selectAll('.value-label').data(r => r.income_quintile === state.quintile ? [r] : []).join('text').attr('class', 'value-label')
    .attr('x', r => size(r.food_total_usd) + 9).attr('y', 4).text(r => `${fmtPct(share(r))}%`);
  const legendWidth = Math.min(300, d3.select('#size-legend').node().clientWidth);
  const legend = d3.select('#size-legend').selectAll('svg').data([null]).join('svg')
    .attr('width', legendWidth).attr('height', 42).attr('viewBox', `0 0 ${legendWidth} 42`).attr('role', 'img')
    .attr('aria-label', 'Circle area reference: 5,000, 10,000 and 15,000 dollars in annual all-food spending.');
  const samples = legend.selectAll('g').data([5000,10000,15000]).join('g').attr('transform',(d,i)=>`translate(${18+i*legendWidth/3},21)`);
  samples.selectAll('circle').data(d=>[d]).join('circle').attr('r',size).attr('fill',colors.muted).attr('stroke','#fff').attr('stroke-width',2);
  samples.selectAll('text').data(d=>[d]).join('text').attr('x',16).attr('y',4).attr('fill',colors.ink).attr('font-size',14).text(d=>`$${d/1000}k`);
}

function drawComposition() {
  const margin = { top: 13, right: 58, bottom: 36, left: 108 };
  const { plot, plotWidth, plotHeight } = chartFrame('#composition-chart', 288, margin);
  const current = rows.filter(r => r.year === state.year);
  const x = d3.scaleLinear().domain([0, 20]).range([0, plotWidth]);
  const y = d3.scaleBand().domain(quintiles).range([0, plotHeight]).padding(.38);
  plot.selectAll('.grid').data([null]).join('g').attr('class', 'grid').call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSize(plotHeight).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.selectAll('.x-axis').data([null]).join('g').attr('class', 'x-axis').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues(plotWidth < 240 ? [0, 10, 20] : [0, 5, 10, 15, 20]).tickFormat(d => `${d}%`)).call(axisStyle);
  plot.selectAll('.row-label').data(quintiles).join('text').attr('class', 'row-label')
    .attr('x', -13).attr('y', q => y(q) + y.bandwidth()/2 + 4).attr('text-anchor', 'end')
    .classed('selected', q => q === state.quintile).text(q => names[q]);

  const segments = current.flatMap(row => {
    const home = share(row, 'home');
    const away = share(row, 'away');
    return [{ row, type: 'home', start: 0, value: home }, { row, type: 'away', start: home, value: away }];
  });
  const bars = plot.selectAll('.segment').data(segments, d => `${d.row.income_quintile}-${d.type}`).join('rect').attr('class', 'segment')
    .attr('y', d => y(d.row.income_quintile)).attr('height', y.bandwidth()).attr('rx', 2)
    .attr('fill', d => colors[d.type])
    .attr('stroke', d => d.row.income_quintile === state.quintile && state.type === d.type ? colors.ink : '#fff')
    .attr('stroke-width', 2)
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-pressed', d => d.row.income_quintile === state.quintile && state.type === d.type)
    .attr('aria-label', d => `${names[d.row.income_quintile]}, ${d.type === 'home' ? 'at home' : 'away from home'}: ${fmtPct(d.value)} percent. Select category and quintile.`)
    .on('click', (event, d) => select({ quintile: d.row.income_quintile, type: d.type }))
    .on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ quintile: d.row.income_quintile, type: d.type }); } })
    .on('mouseenter', (event, d) => showTooltip(event, d.row, d.type)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip)
    .on('focus', (event, d) => showTooltip(event, d.row, d.type)).on('blur', hideTooltip);
  motion(bars).attr('x', d => x(d.start)).attr('width', d => Math.max(1, x(d.value)))
    .attr('opacity', 1);
}

// Derive one domain from ALL years and quintiles in the category. Changing the
// selected group/year never changes scale, and every facet uses this same domain.
function trendDomain() {
  if (!state.zoom) return [0, 20];
  const max = d3.max(rows, r => share(r));
  return [0, Math.ceil(max + .5)];
}

function drawTrend() {
  const domain = trendDomain();
  const facets = state.trendMode === 'facets';
  d3.select('#trend-chart').property('hidden', facets);
  d3.select('#trend-facets').property('hidden', !facets);
  d3.selectAll('#trend-mode button').attr('aria-pressed', function () { return this.dataset.mode === state.trendMode; })
    .classed('active', function () { return this.dataset.mode === state.trendMode; });
  d3.select('#zoom-trend').property('checked', state.zoom);
  d3.select('#trend-scale-note').classed('zoomed', state.zoom).text(state.zoom
    ? `Zoomed Y-axis: 0–${domain[1]}%. Same scale for all groups; dot and bar charts stay at 0–20%.`
    : 'Y-axis: 0–20%.');
  d3.select('#trend-context').text(`${{all:'All food',home:'At home',away:'Away from home'}[state.type]} · selected: ${names[state.quintile]} · selected year: ${state.year} · ${facets ? 'small multiples' : 'overlaid lines'}`);
  if (facets) { drawFacets(domain); return; }
  drawOverlay(domain);
}

function drawOverlay(domain) {
  const compact = d3.select('#trend-chart').node().clientWidth < 620;
  const margin = { top: 17, right: compact ? 22 : 100, bottom: 36, left: 46 };
  const { plot, plotWidth, plotHeight } = chartFrame('#trend-chart', 306, margin);
  const x = d3.scaleLinear().domain([2015, 2024]).range([0, plotWidth]);
  const y = d3.scaleLinear().domain(domain).range([plotHeight, 0]);
  const ticks = state.zoom ? d3.ticks(...domain, 5) : [0, 5, 10, 15, 20];
  const years = plotWidth < 280 ? [2015, 2020, 2024] : compact ? [2015, 2018, 2021, 2024] : [2015, 2017, 2019, 2021, 2023, 2024];
  plot.selectAll('.grid').data([null]).join('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues(ticks).tickSize(-plotWidth).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.selectAll('.x-axis').data([null]).join('g').attr('class', 'x-axis').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format('d'))).call(axisStyle);
  plot.selectAll('.y-axis').data([null]).join('g').attr('class', 'y-axis').call(d3.axisLeft(y).tickValues(ticks).tickFormat(d => `${d}%`)).call(axisStyle);
  motion(plot.selectAll('.year-marker').data([null]).join('line').attr('class', 'year-marker'))
    .attr('x1', x(state.year)).attr('x2', x(state.year)).attr('y1', 0).attr('y2', plotHeight);

  // Straight segments connect observed annual means without inventing a smooth trajectory.
  const line = d3.line().x(r => x(r.year)).y(r => y(share(r)));
  const groups = quintiles.map(quintile => ({ quintile, data: rows.filter(r => r.income_quintile === quintile).sort((a,b) => a.year-b.year) }));
  motion(plot.selectAll('.trend-line').data(groups, g => g.quintile).join('path').attr('class', 'trend-line'))
    .attr('d', g => line(g.data)).attr('stroke', g => g.quintile === state.quintile ? colors.ink : colors.muted)
    .attr('stroke-width', g => g.quintile === state.quintile ? 3 : 1.8).attr('opacity', 1);
  motion(plot.selectAll('.trend-point').data(rows, r => `${r.income_quintile}-${r.year}`).join('circle').attr('class', 'trend-point'))
    .attr('cx', r => x(r.year)).attr('cy', r => y(share(r)))
    .attr('r', r => r.year === state.year && r.income_quintile === state.quintile ? 6 : 3.6)
    .attr('fill', r => r.income_quintile === state.quintile ? colors.ink : colors.muted)
    .attr('stroke', '#fff').attr('stroke-width', 1.4);
  // An invisible larger hit target makes each year usable by mouse and keyboard.
  const targets = plot.selectAll('.trend-hit').data(rows.filter(r => r.income_quintile === state.quintile), r => r.year).join('circle').attr('class', 'trend-hit')
    .attr('r', 12)
    .attr('fill', 'transparent').attr('tabindex', 0).attr('role', 'button')
    .attr('aria-pressed', r => r.year === state.year)
    .attr('aria-label', r => `${names[r.income_quintile]}, ${r.year}: ${fmtPct(share(r))} percent. Select year.`)
    .on('click', (event, r) => select({ year: r.year }))
    .on('keydown', (event, r) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ year: r.year }); } })
    .on('mouseenter', (event, r) => showTooltip(event, r)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip)
    .on('focus', (event, r) => showTooltip(event, r)).on('blur', hideTooltip);
  motion(targets).attr('cx', r => x(r.year)).attr('cy', r => y(share(r)));
  if (!compact) {
    const endpoints = groups.map(g => ({ ...g, originalY: y(share(g.data.at(-1))) }))
      .sort((a, b) => a.originalY - b.originalY);
    endpoints.forEach((g, i) => { g.labelY = i ? Math.max(g.originalY, endpoints[i - 1].labelY + 20) : g.originalY; });
    const overflow = Math.max(0, endpoints.at(-1).labelY - plotHeight);
    endpoints.forEach(g => { g.labelY -= overflow; });
    motion(plot.selectAll('.end-connector').data(endpoints, g => g.quintile).join('line').attr('class', 'end-connector'))
      .attr('x1', plotWidth + 2).attr('x2', plotWidth + 8)
      .attr('y1', g => g.originalY).attr('y2', g => g.labelY)
      .attr('stroke', colors.muted).attr('stroke-width', 1);
    const labels = plot.selectAll('.end-label').data(endpoints, g => g.quintile).join('text').attr('class', 'end-label')
      .classed('selected', g => g.quintile === state.quintile).text(g => g.quintile);
    motion(labels).attr('x', plotWidth + 10).attr('y', g => g.labelY + 4);
  } else {
    plot.selectAll('.end-connector, .end-label').remove();
  }
}

function drawFacets(domain) {
  const panels = d3.select('#trend-facets').selectAll('.facet').data(quintiles, q => q).join(enter => {
    const panel = enter.append('section').attr('class', 'facet');
    panel.append('h3');
    panel.append('div').attr('class', 'facet-chart').attr('role', 'group');
    return panel;
  }).classed('selected', q => q === state.quintile);
  panels.select('h3').text(q => `${names[q]}${q === state.quintile ? ' · Selected' : ''}`);
  panels.each(function(q) {
    const host = d3.select(this).select('.facet-chart').attr('aria-label', `${names[q]}, annual food share; ${domain[0]} to ${domain[1]} percent`).node();
    const { plot, plotWidth, plotHeight } = chartFrame(host, 190, {top:14,right:24,bottom:30,left:46});
    const data = rows.filter(r => r.income_quintile === q).sort((a,b) => a.year-b.year);
    const x = d3.scaleLinear().domain([2015,2024]).range([0,plotWidth]);
    const y = d3.scaleLinear().domain(domain).range([plotHeight,0]);
    const ticks = state.zoom ? d3.ticks(...domain, 4) : [0,10,20];
    plot.selectAll('.grid').data([null]).join('g').attr('class','grid')
      .call(d3.axisLeft(y).tickValues(ticks).tickSize(-plotWidth).tickFormat('')).call(axisStyle);
    plot.selectAll('.x-axis').data([null]).join('g').attr('class','x-axis').attr('transform',`translate(0,${plotHeight})`)
      .call(d3.axisBottom(x).tickValues([2015,2020,2024]).tickFormat(d3.format('d'))).call(axisStyle);
    plot.selectAll('.y-axis').data([null]).join('g').attr('class','y-axis')
      .call(d3.axisLeft(y).tickValues(ticks).tickFormat(d=>`${d}%`)).call(axisStyle);
    motion(plot.selectAll('.year-marker').data([null]).join('line').attr('class','year-marker'))
      .attr('x1',x(state.year)).attr('x2',x(state.year)).attr('y1',0).attr('y2',plotHeight);
    motion(plot.selectAll('.facet-line').data([data]).join('path').attr('class','facet-line'))
      .attr('d',d3.line().x(r=>x(r.year)).y(r=>y(share(r))))
      .attr('stroke',q===state.quintile?colors.ink:colors.muted).attr('stroke-width',q===state.quintile?3:2);
    motion(plot.selectAll('.facet-point').data(data,r=>r.year).join('circle').attr('class','facet-point'))
      .attr('cx',r=>x(r.year)).attr('cy',r=>y(share(r))).attr('r',r=>r.year===state.year?5:3)
      .attr('fill',q===state.quintile?colors.ink:colors.muted).attr('stroke','#fff').attr('stroke-width',1);
    const targets=plot.selectAll('.facet-hit').data(data,r=>r.year).join('circle').attr('class','facet-hit')
      .attr('r',12).attr('fill','transparent').attr('tabindex',0).attr('role','button')
      .attr('aria-pressed',r=>r.year===state.year && q===state.quintile)
      .attr('aria-label',r=>`${names[q]}, ${r.year}: ${fmtPct(share(r))} percent. Select quintile and year.`)
      .on('click',(event,r)=>select({quintile:q,year:r.year}))
      .on('keydown',(event,r)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select({quintile:q,year:r.year});}})
      .on('mouseenter',(event,r)=>showTooltip(event,r)).on('mousemove',moveTooltip).on('mouseleave',hideTooltip)
      .on('focus',(event,r)=>showTooltip(event,r)).on('blur',hideTooltip);
    motion(targets).attr('cx',r=>x(r.year)).attr('cy',r=>y(share(r)));
  });
}

// Native tables expose exact values without hover, SVG, or color interpretation.
function drawTables() {
  const populate = (selector, data, caption) => {
    const table = d3.select(selector);
    table.select('caption').text(caption);
    const tr = table.select('tbody').selectAll('tr').data(data).join('tr');
    tr.selectAll('*').remove();
    tr.append('th').attr('scope', 'row').text(r => `${r.year} · ${names[r.income_quintile]}`);
    const cells = r => [fmtMoney(r.total_expenditures_usd), fmtMoney(r.food_total_usd), fmtMoney(r.food_at_home_usd), fmtMoney(r.food_away_from_home_usd), `${fmtPct(share(r, 'all'))}%`, `${fmtPct(share(r, 'home'))}%`, `${fmtPct(share(r, 'away'))}%`];
    tr.selectAll('td').data(cells).join('td').text(d => d);
  };
  populate('#comparison-table', rows.filter(r => r.year === state.year), `${state.year}: all five income quintiles`);
  populate('#history-table', rows.filter(r => r.income_quintile === state.quintile), `${names[state.quintile]}: annual values, 2015–2024`);
}

function downloadData() {
  const data = rows.map(r => ({ ...r, food_share_pct: share(r, 'all'), home_share_pct: share(r, 'home'), away_share_pct: share(r, 'away') }));
  const url = URL.createObjectURL(new Blob([d3.csvFormat(data)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'food-budget-atlas-2015-2024.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render(animate = false) {
  animateUpdate = animate && !reducedMotion.matches;
  hideTooltip();
  drawSummary();
  drawQuintiles();
  drawComposition();
  drawTrend();
  drawTables();
}

async function init() {
  rows = await d3.csv(foodDataUrl, d => ({
    year: +d.year, income_quintile: d.income_quintile, quintile_rank: +d.quintile_rank,
    total_expenditures_usd: +d.total_expenditures_usd, food_total_usd: +d.food_total_usd,
    food_at_home_usd: +d.food_at_home_usd, food_away_from_home_usd: +d.food_away_from_home_usd,
  }));
  validateRows(rows, rankedQuintiles);
  // Match visual, keyboard and table order without changing source rank meanings.
  rows.sort((a, b) => a.year - b.year || b.quintile_rank - a.quintile_rank);
  d3.select('#year-select').selectAll('option').data(d3.range(2024, 2014, -1)).join('option')
    .attr('value', d => d).text(d => d);
  d3.select('#quintile-select').selectAll('option').data(quintiles).join('option').attr('value',d=>d).text(d=>names[d]);
  d3.select('#quintile-select').on('change',function(){select({quintile:this.value});});
  d3.select('#undo-button').on('click',()=>{if(history.length){Object.assign(state,history.pop());render(true);}});
  d3.select('.skip-link').on('click',event=>{
    event.preventDefault();
    document.querySelector('#data-details').open=true;
    document.querySelector('#data-details summary').focus();
    document.querySelector('#data-details').scrollIntoView({block:'start'});
  });
  d3.selectAll('#type-control button').on('click', function () { select({ type: this.dataset.type }); });
  d3.select('#year-select').on('change', function () { select({ year: +this.value }); });
  d3.select('#reset-button').on('click', () => select({ year: 2024, quintile: 'Lowest', type: 'all', trendMode: 'overlay', zoom: false }));
  d3.selectAll('#trend-mode button').on('click', function () { select({trendMode: this.dataset.mode}); });
  d3.select('#zoom-trend').on('change', function () { select({zoom:this.checked}); });
  const headers = ['Year · income quintile', 'Total spending ($)', 'All food ($)', 'At home ($)', 'Away ($)', 'All food (%)', 'At home (%)', 'Away (%)'];
  d3.selectAll('.data-table thead tr').selectAll('th').data(headers).join('th').attr('scope', 'col').text(d => d);
  d3.select('#download-data').on('click', downloadData);
  d3.select('#print-dashboard').on('click', () => window.print());
  let detailsWereOpen = false;
  window.addEventListener('beforeprint', () => {
    const details = document.querySelector('#data-details');
    detailsWereOpen = details.open; details.open = true;
  });
  window.addEventListener('afterprint', () => { document.querySelector('#data-details').open = detailsWereOpen; render(); });
  d3.select(window).on('keydown.tooltip', event => { if (event.key === 'Escape') hideTooltip(); });
  d3.select(window).on('scroll.tooltip', () => {
    const focused = document.activeElement;
    if (focused?.matches('svg [tabindex]') && tooltip.classed('visible')) {
      const bounds = focused.getBoundingClientRect();
      moveTooltip({ clientX: bounds.right, clientY: bounds.bottom });
    } else hideTooltip();
  });
  new ResizeObserver(() => render()).observe(d3.select('.dashboard-grid').node());
  render();
  reducedMotion.addEventListener('change', () => render());
}

init().catch(error => {
  console.error(error);
  d3.selectAll('.controls,.summary,.dashboard-grid,.data-section').property('hidden',true);
  d3.select('.hero').append('p').attr('class', 'load-error').attr('role','alert').text('The dashboard data could not be loaded or verified. Please reopen the original dashboard file or follow the local setup instructions.');
});
