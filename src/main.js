import * as d3 from 'd3';
import './styles.css';

// One shared state drives every view. Each chart changes state through select().
const state = { year: 2024, quintile: 'Lowest', type: 'all' };
const quintiles = ['Lowest', 'Second', 'Middle', 'Fourth', 'Highest'];
const names = { Lowest: 'Lowest 20%', Second: 'Second 20%', Middle: 'Middle 20%', Fourth: 'Fourth 20%', Highest: 'Highest 20%' };
const colors = { home: '#216d77', away: '#df8751', ink: '#17333a', muted: '#a7b2af' };
const fmtMoney = d3.format('$,.0f');
const fmtPct = d3.format('.1f');
const tooltip = d3.select('#tooltip');
let rows = [];

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
  Object.assign(state, next);
  render();
}

function showTooltip(event, row, type = state.type) {
  const title = `${names[row.income_quintile]} · ${row.year}`;
  const category = { all: 'All food', home: 'Food at home', away: 'Food away from home' }[type];
  tooltip.html(`<strong>${title}</strong><span>${category}: ${fmtPct(share(row, type))}% of expenditures</span><span>Annual spending: ${fmtMoney(row[field(type)])}</span><span>Total expenditures: ${fmtMoney(row.total_expenditures_usd)}</span>`)
    .classed('visible', true);
  moveTooltip(event);
}

function moveTooltip(event) {
  const width = tooltip.node().offsetWidth;
  const left = Math.min(event.clientX + 16, window.innerWidth - width - 12);
  tooltip.style('left', `${Math.max(12, left)}px`).style('top', `${Math.max(12, event.clientY + 16)}px`);
}

function hideTooltip() { tooltip.classed('visible', false); }

function chartFrame(selector, height, margins) {
  const host = d3.select(selector);
  const width = host.node().clientWidth;
  host.selectAll('*').remove();
  const svg = host.append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
  return { svg, width, height, plotWidth: width - margins.left - margins.right, plotHeight: height - margins.top - margins.bottom,
    plot: svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`) };
}

function axisStyle(selection) {
  selection.select('.domain').remove();
  selection.selectAll('line').attr('stroke', '#dbe1de');
  selection.selectAll('text').attr('fill', '#59716f').attr('font-size', 11).attr('font-family', 'DM Sans, sans-serif');
}

function drawSummary() {
  const row = selectedRow();
  const low = rows.find(r => r.year === state.year && r.income_quintile === 'Lowest');
  const high = rows.find(r => r.year === state.year && r.income_quintile === 'Highest');
  const typeLabel = { all: 'food', home: 'food at home', away: 'food away from home' }[state.type];
  d3.select('#selected-label').text(`${names[state.quintile].toUpperCase()} INCOME QUINTILE · ${state.year}`);
  d3.select('#share-value').text(fmtPct(share(row)));
  d3.select('#summary-description').text(`of annual expenditures went to ${typeLabel}`);
  d3.select('#spending-label').text(`ANNUAL ${typeLabel.toUpperCase()} SPENDING`);
  d3.select('#spending-value').text(fmtMoney(row[field(state.type)]));
  d3.select('#gap-value').text(`${fmtPct(share(low) - share(high))} pp`);
  d3.selectAll('#type-control button').classed('active', function () { return this.dataset.type === state.type; })
    .attr('aria-pressed', function () { return this.dataset.type === state.type; });
  d3.select('#year-select').property('value', state.year);
}

function drawQuintiles() {
  const margin = { top: 14, right: 28, bottom: 36, left: 108 };
  const { plot, plotWidth, plotHeight } = chartFrame('#quintile-chart', 288, margin);
  const current = rows.filter(r => r.year === state.year);
  const x = d3.scaleLinear().domain([0, 20]).range([0, plotWidth]);
  const y = d3.scaleBand().domain(quintiles).range([0, plotHeight]).padding(.38);
  const size = d3.scaleSqrt().domain(d3.extent(rows, r => r.food_total_usd)).range([5, 13]);

  plot.append('g').attr('class', 'grid').call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSize(plotHeight).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickFormat(d => `${d}%`)).call(axisStyle);
  plot.selectAll('.row-guide').data(quintiles).join('line').attr('class', 'row-guide')
    .attr('x1', 0).attr('x2', plotWidth).attr('y1', q => y(q) + y.bandwidth()/2).attr('y2', q => y(q) + y.bandwidth()/2);
  plot.selectAll('.row-label').data(quintiles).join('text').attr('class', 'row-label')
    .attr('x', -13).attr('y', q => y(q) + y.bandwidth()/2 + 4).attr('text-anchor', 'end')
    .classed('selected', q => q === state.quintile).text(q => names[q]);

  const marks = plot.selectAll('.dot-hit').data(current).join('g').attr('class', 'dot-hit')
    .attr('transform', r => `translate(${x(share(r))},${y(r.income_quintile) + y.bandwidth()/2})`)
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', r => `${names[r.income_quintile]}, ${state.year}: ${fmtPct(share(r))} percent. Select quintile.`)
    .on('click', (event, r) => select({ quintile: r.income_quintile }))
    .on('keydown', (event, r) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ quintile: r.income_quintile }); } })
    .on('mouseenter', (event, r) => showTooltip(event, r)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip);
  marks.append('circle').attr('r', 20).attr('fill', 'transparent');
  marks.append('circle').attr('class', 'data-dot').attr('r', r => size(r.food_total_usd))
    .attr('fill', r => r.income_quintile === state.quintile ? colors.ink : '#b8c9c5')
    .attr('stroke', '#fff').attr('stroke-width', 2);
  marks.filter(r => r.income_quintile === state.quintile).append('text').attr('class', 'value-label')
    .attr('x', r => size(r.food_total_usd) + 9).attr('y', 4).text(r => `${fmtPct(share(r))}%`);
}

function drawComposition() {
  const margin = { top: 13, right: 28, bottom: 36, left: 108 };
  const { plot, plotWidth, plotHeight } = chartFrame('#composition-chart', 288, margin);
  const current = rows.filter(r => r.year === state.year);
  const x = d3.scaleLinear().domain([0, 20]).range([0, plotWidth]);
  const y = d3.scaleBand().domain(quintiles).range([0, plotHeight]).padding(.38);
  plot.append('g').attr('class', 'grid').call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickSize(plotHeight).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues([0, 5, 10, 15, 20]).tickFormat(d => `${d}%`)).call(axisStyle);
  plot.selectAll('.row-label').data(quintiles).join('text').attr('class', 'row-label')
    .attr('x', -13).attr('y', q => y(q) + y.bandwidth()/2 + 4).attr('text-anchor', 'end')
    .classed('selected', q => q === state.quintile).text(q => names[q]);

  const segments = current.flatMap(row => {
    const home = share(row, 'home');
    const away = share(row, 'away');
    return [{ row, type: 'home', start: 0, value: home }, { row, type: 'away', start: home, value: away }];
  });
  plot.selectAll('.segment').data(segments).join('rect').attr('class', 'segment')
    .attr('x', d => x(d.start)).attr('y', d => y(d.row.income_quintile))
    .attr('width', d => Math.max(1, x(d.value))).attr('height', y.bandwidth()).attr('rx', 2)
    .attr('fill', d => colors[d.type])
    .attr('opacity', d => (state.type === 'all' || state.type === d.type) ? 1 : .32)
    .attr('stroke', d => d.row.income_quintile === state.quintile && state.type === d.type ? colors.ink : 'none')
    .attr('stroke-width', 2)
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', d => `${names[d.row.income_quintile]}, ${d.type === 'home' ? 'at home' : 'away from home'}: ${fmtPct(d.value)} percent. Select category and quintile.`)
    .on('click', (event, d) => select({ quintile: d.row.income_quintile, type: d.type }))
    .on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ quintile: d.row.income_quintile, type: d.type }); } })
    .on('mouseenter', (event, d) => showTooltip(event, d.row, d.type)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip);
}

function drawTrend() {
  const compact = d3.select('#trend-chart').node().clientWidth < 620;
  const margin = { top: 17, right: compact ? 22 : 92, bottom: 36, left: 46 };
  const { plot, plotWidth, plotHeight } = chartFrame('#trend-chart', 306, margin);
  const x = d3.scaleLinear().domain([2015, 2024]).range([0, plotWidth]);
  const y = d3.scaleLinear().domain([0, 20]).range([plotHeight, 0]);
  const years = compact ? [2015, 2018, 2021, 2024] : [2015, 2017, 2019, 2021, 2023, 2024];
  plot.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues([0, 5, 10, 15, 20]).tickSize(-plotWidth).tickFormat(''));
  plot.select('.grid').call(axisStyle).attr('opacity', .6);
  plot.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format('d'))).call(axisStyle);
  plot.append('g').call(d3.axisLeft(y).tickValues([0, 5, 10, 15, 20]).tickFormat(d => `${d}%`)).call(axisStyle);
  plot.append('line').attr('class', 'year-marker').attr('x1', x(state.year)).attr('x2', x(state.year)).attr('y1', 0).attr('y2', plotHeight);

  const line = d3.line().x(r => x(r.year)).y(r => y(share(r))).curve(d3.curveMonotoneX);
  const groups = quintiles.map(quintile => ({ quintile, data: rows.filter(r => r.income_quintile === quintile).sort((a,b) => a.year-b.year) }));
  plot.selectAll('.trend-line').data(groups).join('path').attr('class', 'trend-line')
    .attr('d', g => line(g.data)).attr('stroke', g => g.quintile === state.quintile ? colors.ink : '#a8b7b5')
    .attr('stroke-width', g => g.quintile === state.quintile ? 3 : 1.8).attr('opacity', g => g.quintile === state.quintile ? 1 : .8);
  plot.selectAll('.trend-point').data(rows).join('circle').attr('class', 'trend-point')
    .attr('cx', r => x(r.year)).attr('cy', r => y(share(r)))
    .attr('r', r => r.year === state.year && r.income_quintile === state.quintile ? 6 : 3.6)
    .attr('fill', r => r.income_quintile === state.quintile ? colors.ink : '#a8b7b5')
    .attr('stroke', '#fff').attr('stroke-width', 1.4);
  // An invisible larger hit target makes each year usable by mouse and keyboard.
  plot.selectAll('.trend-hit').data(rows.filter(r => r.income_quintile === state.quintile)).join('circle').attr('class', 'trend-hit')
    .attr('cx', r => x(r.year)).attr('cy', r => y(share(r))).attr('r', compact ? 10 : 11)
    .attr('fill', 'transparent').attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', r => `${names[r.income_quintile]}, ${r.year}: ${fmtPct(share(r))} percent. Select year.`)
    .on('click', (event, r) => select({ year: r.year }))
    .on('keydown', (event, r) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select({ year: r.year }); } })
    .on('mouseenter', (event, r) => showTooltip(event, r)).on('mousemove', moveTooltip).on('mouseleave', hideTooltip);
  if (!compact) {
    const endpoints = groups.map(g => ({ ...g, originalY: y(share(g.data.at(-1))) }))
      .sort((a, b) => a.originalY - b.originalY);
    endpoints.forEach((g, i) => { g.labelY = i ? Math.max(g.originalY, endpoints[i - 1].labelY + 16) : g.originalY; });
    const overflow = Math.max(0, endpoints.at(-1).labelY - plotHeight);
    endpoints.forEach(g => { g.labelY -= overflow; });
    plot.selectAll('.end-connector').data(endpoints).join('line').attr('class', 'end-connector')
      .attr('x1', plotWidth + 2).attr('x2', plotWidth + 8)
      .attr('y1', g => g.originalY).attr('y2', g => g.labelY)
      .attr('stroke', '#8da09c').attr('stroke-width', 1);
    plot.selectAll('.end-label').data(endpoints).join('text').attr('class', 'end-label')
      .attr('x', plotWidth + 10).attr('y', g => g.labelY + 4)
      .classed('selected', g => g.quintile === state.quintile).text(g => g.quintile);
  }
}

function render() {
  hideTooltip();
  drawSummary();
  drawQuintiles();
  drawComposition();
  drawTrend();
}

async function init() {
  rows = await d3.csv('/data/food_spending.csv', d => ({
    year: +d.year, income_quintile: d.income_quintile, quintile_rank: +d.quintile_rank,
    total_expenditures_usd: +d.total_expenditures_usd, food_total_usd: +d.food_total_usd,
    food_at_home_usd: +d.food_at_home_usd, food_away_from_home_usd: +d.food_away_from_home_usd,
  }));
  if (rows.length !== 50) throw new Error('Expected 50 BLS records; check data/food_spending.csv');
  d3.select('#year-select').selectAll('option').data(d3.range(2024, 2014, -1)).join('option')
    .attr('value', d => d).text(d => d);
  d3.selectAll('#type-control button').on('click', function () { select({ type: this.dataset.type }); });
  d3.select('#year-select').on('change', function () { select({ year: +this.value }); });
  d3.select('#reset-button').on('click', () => select({ year: 2024, quintile: 'Lowest', type: 'all' }));
  new ResizeObserver(() => render()).observe(d3.select('.dashboard-grid').node());
  render();
}

init().catch(error => {
  console.error(error);
  d3.select('.hero').append('p').attr('class', 'load-error').text('The dashboard data could not be loaded. Please refresh or follow the local setup instructions.');
});
