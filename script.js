/**
 * Sales Dashboard — script.js
 * Handles: CSV loading, parsing, filtering, KPI computation, and all Chart.js rendering.
 * Data source: 200_sales_data.csv (same directory as index.html)
 */

// ─────────────────────────────────────────────
// 1. GLOBAL STATE
// ─────────────────────────────────────────────

/** Raw parsed data from CSV (array of objects) */
let allData = [];

/** Currently active filters */
const activeFilters = {
  region: 'all',
  category: 'all',
  customer: 'all',
  channel: 'all',
};

/**
 * Registry of Chart.js instances.
 * Stored so they can be destroyed and re-created on filter change.
 */
const charts = {};

// ─────────────────────────────────────────────
// 2. COLOUR PALETTE
// ─────────────────────────────────────────────

const PALETTE = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

/** Returns a semi-transparent version of a colour for fill areas */
const alpha = (hex, a = 0.15) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

// ─────────────────────────────────────────────
// 3. CSV PARSING
// ─────────────────────────────────────────────

/**
 * Fetches and parses the CSV file into an array of plain objects.
 * @returns {Promise<Object[]>}
 */
async function loadCSV() {
  const response = await fetch('200_sales_data.csv');
  if (!response.ok) throw new Error(`Failed to load CSV: ${response.status}`);
  const text = await response.text();

  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      const val = (values[i] ?? '').trim();
      // Parse numeric columns
      row[h] = isNaN(val) || val === '' ? val : parseFloat(val);
    });
    return row;
  });
}

// ─────────────────────────────────────────────
// 4. FILTERING
// ─────────────────────────────────────────────

/** Returns the subset of allData matching current active filters */
function getFilteredData() {
  return allData.filter(row => {
    if (activeFilters.region   !== 'all' && row.Region            !== activeFilters.region)   return false;
    if (activeFilters.category !== 'all' && row.Product_Category  !== activeFilters.category) return false;
    if (activeFilters.customer !== 'all' && row.Customer_Type     !== activeFilters.customer) return false;
    if (activeFilters.channel  !== 'all' && row.Sales_Channel     !== activeFilters.channel)  return false;
    return true;
  });
}

// ─────────────────────────────────────────────
// 5. FILTER POPULATION
// ─────────────────────────────────────────────

/**
 * Reads unique values from the full dataset and populates <select> options.
 * Runs once after data is loaded.
 */
function populateFilters() {
  const unique = key => [...new Set(allData.map(r => r[key]))].sort();

  fillSelect('filter-region',   unique('Region'));
  fillSelect('filter-category', unique('Product_Category'));
  fillSelect('filter-customer', unique('Customer_Type'));
  fillSelect('filter-channel',  unique('Sales_Channel'));
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

// ─────────────────────────────────────────────
// 6. KPI COMPUTATION & RENDER
// ─────────────────────────────────────────────

function renderKPIs(data) {
  const totalRevenue     = data.reduce((s, r) => s + r.Sales_Amount, 0);
  const totalTransactions = data.length;
  const totalQty         = data.reduce((s, r) => s + r.Quantity_Sold, 0);
  const avgDiscount      = data.length ? data.reduce((s, r) => s + r.Discount, 0) / data.length : 0;

  document.getElementById('kpi-revenue').textContent      = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('kpi-transactions').textContent = totalTransactions.toLocaleString();
  document.getElementById('kpi-qty').textContent          = totalQty.toLocaleString();
  document.getElementById('kpi-discount').textContent     = `${(avgDiscount * 100).toFixed(1)}%`;

  document.getElementById('data-count').textContent = `${totalTransactions} records`;
}

// ─────────────────────────────────────────────
// 7. AGGREGATION HELPERS
// ─────────────────────────────────────────────

/** Groups data by a key and sums a numeric field */
function groupBySum(data, key, valueField) {
  const map = {};
  data.forEach(row => {
    const k = row[key];
    map[k] = (map[k] || 0) + row[valueField];
  });
  return map;
}

/** Groups data by a key and counts occurrences */
function groupByCount(data, key) {
  const map = {};
  data.forEach(row => {
    const k = row[key];
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

/** Returns sorted [labels, values] arrays from a map */
function sortedEntries(map, descending = true) {
  const entries = Object.entries(map).sort((a, b) => descending ? b[1] - a[1] : a[1] - b[1]);
  return [entries.map(e => e[0]), entries.map(e => e[1])];
}

// ─────────────────────────────────────────────
// 8. CHART CREATION / UPDATE HELPERS
// ─────────────────────────────────────────────

/**
 * Destroys existing chart instance (if any) and creates a new one.
 * @param {string} id       - Canvas element id
 * @param {Object} config   - Chart.js configuration object
 */
function renderChart(id, config) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, config);
}

/** Shared base options for most bar/line charts */
function baseOptions(yLabel = '') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 }, color: '#6b7280' },
        grid: { display: false },
      },
      y: {
        ticks: { font: { size: 11 }, color: '#6b7280' },
        grid: { color: '#f3f4f6' },
        title: { display: !!yLabel, text: yLabel, color: '#9ca3af', font: { size: 11 } },
      },
    },
  };
}

/** Shared base options for doughnut/pie charts */
function pieOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 }, padding: 14, usePointStyle: true },
      },
      tooltip: { mode: 'index' },
    },
  };
}

// ─────────────────────────────────────────────
// 9. INDIVIDUAL CHART RENDERERS
// ─────────────────────────────────────────────

/** Sales Trend — monthly revenue line chart */
function renderTrend(data) {
  // Build month buckets (Jan–Dec 2023)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly = Array(12).fill(0);

  data.forEach(row => {
    const month = new Date(row.Sale_Date).getMonth(); // 0-based
    if (month >= 0 && month < 12) monthly[month] += row.Sales_Amount;
  });

  renderChart('chart-trend', {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue',
        data: monthly,
        borderColor: PALETTE[0],
        backgroundColor: alpha(PALETTE[0], 0.1),
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      ...baseOptions('USD'),
      plugins: {
        ...baseOptions().plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    },
  });
}

/** Revenue per Region — Polar Area Chart */
function renderRegion(data) {
  const map = groupBySum(data, 'Region', 'Sales_Amount');
  const [labels, values] = sortedEntries(map);

  // Build semi-transparent fills and solid borders from the palette
  const bgColors    = labels.map((_, i) => alpha(PALETTE[i % PALETTE.length], 0.72));
  const borderColors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

  renderChart('chart-region', {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks: {
            display: false,          // hide radial tick labels for cleanliness
            backdropColor: 'transparent',
          },
          grid: { color: 'rgba(0,0,0,0.06)' },
          pointLabels: { display: false },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11 },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: $${ctx.parsed.r.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    },
  });
}

/** Revenue per Product Category — vertical bar */
function renderCategory(data) {
  const map = groupBySum(data, 'Product_Category', 'Sales_Amount');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-category', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: baseOptions('USD'),
  });
}

/** Quantity Sold per Category — vertical bar */
function renderQtyCategory(data) {
  const map = groupBySum(data, 'Product_Category', 'Quantity_Sold');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-qty-category', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Qty Sold',
        data: values,
        backgroundColor: PALETTE.slice(2, 2 + labels.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: baseOptions('Units'),
  });
}

/** Sales per Sales Representative — grouped bar */
function renderRep(data) {
  const map = groupBySum(data, 'Sales_Rep', 'Sales_Amount');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-rep', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      ...baseOptions('USD'),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    },
  });
}

/** Top 10 Highest Sales — horizontal bar sorted desc */
function renderTop10(data) {
  const sorted = [...data]
    .sort((a, b) => b.Sales_Amount - a.Sales_Amount)
    .slice(0, 10);

  const labels = sorted.map((r, i) => `#${i + 1} ${r.Sales_Rep} (${r.Product_Category})`);
  const values = sorted.map(r => r.Sales_Amount);

  renderChart('chart-top10', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sales Amount',
        data: values,
        backgroundColor: PALETTE.slice(0, values.length),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      ...baseOptions('USD'),
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.x.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    },
  });
}

/** Customer Type Distribution — doughnut */
function renderCustomer(data) {
  const map = groupByCount(data, 'Customer_Type');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-customer', {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: [PALETTE[0], PALETTE[2]], borderWidth: 2 }],
    },
    options: pieOptions(),
  });
}

/** Payment Method Usage — pie */
function renderPayment(data) {
  const map = groupByCount(data, 'Payment_Method');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-payment', {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: [PALETTE[0], PALETTE[1], PALETTE[3]], borderWidth: 2 }],
    },
    options: pieOptions(),
  });
}

/** Sales Channel Distribution — doughnut */
function renderChannel(data) {
  const map = groupByCount(data, 'Sales_Channel');
  const [labels, values] = sortedEntries(map);

  renderChart('chart-channel', {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: [PALETTE[4], PALETTE[5]], borderWidth: 2 }],
    },
    options: pieOptions(),
  });
}

/** Discount vs Sales — scatter plot */
function renderScatter(data) {
  // Build scatter points {x: discount%, y: sales_amount}
  const points = data.map(r => ({
    x: parseFloat((r.Discount * 100).toFixed(1)),
    y: parseFloat(r.Sales_Amount.toFixed(2)),
  }));

  renderChart('chart-scatter', {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Transaction',
        data: points,
        backgroundColor: alpha(PALETTE[0], 0.55),
        borderColor: PALETTE[0],
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Discount: ${ctx.parsed.x}%  |  Revenue: $${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Discount (%)', color: '#9ca3af', font: { size: 11 } },
          ticks: { font: { size: 11 }, color: '#6b7280' },
          grid: { color: '#f3f4f6' },
        },
        y: {
          title: { display: true, text: 'Sales Amount (USD)', color: '#9ca3af', font: { size: 11 } },
          ticks: { font: { size: 11 }, color: '#6b7280' },
          grid: { color: '#f3f4f6' },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────
// 10. RENDER ALL (calls each chart renderer)
// ─────────────────────────────────────────────

function renderAll() {
  const data = getFilteredData();

  renderKPIs(data);
  renderTrend(data);
  renderRegion(data);
  renderCategory(data);
  renderQtyCategory(data);
  renderRep(data);
  renderTop10(data);
  renderCustomer(data);
  renderPayment(data);
  renderChannel(data);
  renderScatter(data);
}

// ─────────────────────────────────────────────
// 11. EVENT LISTENERS — FILTERS
// ─────────────────────────────────────────────

function attachFilterListeners() {
  const filterMap = {
    'filter-region':   'region',
    'filter-category': 'category',
    'filter-customer': 'customer',
    'filter-channel':  'channel',
  };

  Object.entries(filterMap).forEach(([id, key]) => {
    document.getElementById(id).addEventListener('change', e => {
      activeFilters[key] = e.target.value;
      renderAll();
    });
  });

  document.getElementById('reset-filters').addEventListener('click', () => {
    // Reset state
    Object.keys(activeFilters).forEach(k => (activeFilters[k] = 'all'));
    // Reset UI dropdowns
    document.querySelectorAll('.filter-select').forEach(sel => (sel.value = 'all'));
    renderAll();
  });
}

// ─────────────────────────────────────────────
// 12. BOOTSTRAP — entry point
// ─────────────────────────────────────────────

(async function init() {
  try {
    allData = await loadCSV();
    populateFilters();
    attachFilterListeners();
    renderAll();
  } catch (err) {
    console.error('Dashboard init failed:', err);
    document.getElementById('data-count').textContent = 'Error loading data';
  }
})();
