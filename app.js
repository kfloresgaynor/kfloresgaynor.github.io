'use strict';

/*
 * Historical source data carried forward from Ohio_Rape_SOL_Historical_Timeline.xlsx.
 * The static baseline chart shows amendment/application ranges. The selected-offense
 * chart calculates an offense-specific period under the assumptions stated in the UI.
 */

const COLORS = {
  ink: '#17324d',
  inkSoft: '#40556b',
  muted: '#6b7c8f',
  grid: '#d9e1e8',
  rowActive: '#eef6fb',
  retro: '#ffd966',
  sol: '#70ad47',
  solDark: '#477a29',
  dna: '#a9d18e',
  white: '#ffffff'
};

const DATES = {
  minimum: '1989-08-01',
  hb49RetroStart: '1993-03-09',
  hb49Effective: '1999-03-09',
  hb6RetroStart: '1995-07-16',
  hb6Effective: '2015-07-16',
  baselineStart: '1989-01-01',
  baselineEnd: '2050-12-31'
};

const BASELINE_ROWS = [
  {
    id: 'dana',
    label: 'Dana Beatty',
    segments: [
      {
        type: 'sol',
        start: '1989-08-01',
        end: '1995-08-01',
        label: '6 years',
        description: 'Six-year statute-of-limitations segment: 8/1/1989 through 8/1/1995.'
      }
    ]
  },
  {
    id: 'hb49',
    label: '1997 Ohio H.B. 49',
    segments: [
      {
        type: 'retro',
        start: '1993-03-09',
        end: '1999-03-09',
        description: 'Earlier offense dates eligible for H.B. 49 under the unexpired-case rule: 3/9/1993 through 3/9/1999.'
      },
      {
        type: 'sol',
        start: '1999-03-09',
        end: '2019-03-09',
        label: '20 years',
        description: 'Twenty-year statute-of-limitations segment: 3/9/1999 through 3/9/2019.'
      }
    ]
  },
  {
    id: 'hb6',
    label: '2015 Ohio H.B. 6',
    segments: [
      {
        type: 'retro',
        start: '1995-07-16',
        end: '2015-07-16',
        description: 'Earlier offense dates eligible for H.B. 6 under the unexpired-case rule: 7/16/1995 through 7/16/2015.'
      },
      {
        type: 'sol',
        start: '2015-07-16',
        end: '2040-07-16',
        label: '25 years',
        description: 'Twenty-five-year statute-of-limitations segment: 7/16/2015 through 7/16/2040.'
      },
      {
        type: 'dna',
        start: '2040-07-16',
        end: '2045-07-16',
        label: '5 years',
        description: 'Illustrative five-year DNA segment: 7/16/2040 through 7/16/2045, assuming a qualifying DNA determination on 7/16/2040.'
      }
    ]
  }
];

const dateInput = document.querySelector('#offense-date');
const dateError = document.querySelector('#date-error');
const selectedDateDisplay = document.querySelector('#selected-date-display');
const applicableLaw = document.querySelector('#applicable-law');
const baseDeadline = document.querySelector('#base-deadline');
const dnaDisplay = document.querySelector('#dna-display');
const applicationBadge = document.querySelector('#application-badge');
const explanation = document.querySelector('#analysis-explanation');
const baselineNote = document.querySelector('#baseline-note');
const dnaScenarioNote = document.querySelector('#dna-scenario-note');
const baselineChart = document.querySelector('#baseline-chart');
const selectedChart = document.querySelector('#selected-chart');

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC'
});

function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISO(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function formatDate(value) {
  return dateFormatter.format(typeof value === 'string' ? parseISO(value) : value);
}

function addCalendarYears(iso, years) {
  const source = parseISO(iso);
  const targetYear = source.getUTCFullYear() + years;
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
  return toISO(new Date(Date.UTC(targetYear, month, Math.min(day, lastDay))));
}

function compareISO(a, b) {
  return parseISO(a).getTime() - parseISO(b).getTime();
}

function todayISO() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
}

function isValidSelectedDate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso)
    && compareISO(iso, DATES.minimum) >= 0
    && compareISO(iso, dateInput.max) <= 0;
}

function analyzeOffenseDate(iso) {
  let regime;
  let years;
  let dnaApplicable = false;
  let application;
  let badge;
  let description;

  if (compareISO(iso, DATES.hb49RetroStart) < 0) {
    regime = 'dana';
    years = 6;
    application = 'original six-year rule';
    badge = 'Later amendments do not revive this period';
    description = `The six-year period ends on ${formatDate(addCalendarYears(iso, 6))}. Because that period expired before H.B. 49 took effect on March 9, 1999, the later 20-year and 25-year amendments do not revive it under the assumptions used here.`;
  } else if (compareISO(iso, DATES.hb6RetroStart) < 0) {
    regime = 'hb49';
    years = 20;
    application = 'H.B. 49 applied retroactively';
    badge = '20-year period · H.B. 49';
    description = `The former six-year period had not expired immediately before March 9, 1999, so H.B. 49’s 20-year period is modeled as controlling. The resulting deadline is ${formatDate(addCalendarYears(iso, 20))}, which falls before H.B. 6 took effect on July 16, 2015; H.B. 6 and its DNA provisions therefore do not apply under this model.`;
  } else {
    regime = 'hb6';
    years = 25;
    dnaApplicable = true;
    if (compareISO(iso, DATES.hb6Effective) < 0) {
      application = 'H.B. 6 applied retroactively';
      badge = '25-year period · H.B. 6 retroactivity';
      description = `The prior 20-year period was not barred immediately before July 16, 2015, so H.B. 6’s 25-year period is modeled as controlling. Because the offense date is on or after July 16, 1995, the DNA provisions are also within the 2015 amendment’s application range under the no-tolling assumptions used here.`;
    } else {
      application = 'H.B. 6 applied prospectively';
      badge = '25-year period · H.B. 6';
      description = `The offense occurred on or after July 16, 2015, so the 25-year period is modeled as applying prospectively. The DNA provisions may also apply if the statute’s qualifying DNA-match conditions are satisfied.`;
    }
  }

  const deadline = addCalendarYears(iso, years);
  const illustrativeDnaEnd = dnaApplicable ? addCalendarYears(deadline, 5) : null;

  return {
    offenseDate: iso,
    regime,
    years,
    deadline,
    dnaApplicable,
    illustrativeDnaEnd,
    application,
    badge,
    description
  };
}

function svgElement(tag, attributes = {}, text = null) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (text !== null) element.textContent = text;
  return element;
}

function addSvgTitle(parent, text) {
  parent.appendChild(svgElement('title', {}, text));
}

function createDefinitions(svg) {
  const defs = svgElement('defs');

  const retroPattern = svgElement('pattern', {
    id: 'retroPattern',
    width: 10,
    height: 10,
    patternUnits: 'userSpaceOnUse',
    patternTransform: 'rotate(45)'
  });
  retroPattern.appendChild(svgElement('rect', { width: 10, height: 10, fill: COLORS.retro }));
  retroPattern.appendChild(svgElement('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: COLORS.ink, 'stroke-opacity': 0.13, 'stroke-width': 2 }));

  const dnaPattern = svgElement('pattern', {
    id: 'dnaPattern',
    width: 11,
    height: 11,
    patternUnits: 'userSpaceOnUse',
    patternTransform: 'rotate(-45)'
  });
  dnaPattern.appendChild(svgElement('rect', { width: 11, height: 11, fill: COLORS.dna }));
  dnaPattern.appendChild(svgElement('line', { x1: 0, y1: 0, x2: 0, y2: 11, stroke: COLORS.ink, 'stroke-opacity': 0.12, 'stroke-width': 2 }));

  defs.append(retroPattern, dnaPattern);
  svg.appendChild(defs);
}

function dateScale(startISO, endISO, x0, x1) {
  const start = parseISO(startISO).getTime();
  const end = parseISO(endISO).getTime();
  return (iso) => {
    const value = parseISO(iso).getTime();
    return x0 + ((value - start) / (end - start)) * (x1 - x0);
  };
}

function baselineTicks(isMobile) {
  if (isMobile) return [1989, 2000, 2010, 2020, 2030, 2040, 2050];
  return [1989, 1995, 2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035, 2040, 2045, 2050];
}

function segmentFill(type) {
  if (type === 'retro') return 'url(#retroPattern)';
  if (type === 'dna') return 'url(#dnaPattern)';
  return COLORS.sol;
}

function renderBaseline(analysis) {
  const width = Math.max(320, baselineChart.clientWidth || 1000);
  const isMobile = width < 650;
  const left = isMobile ? 14 : 205;
  const right = isMobile ? 14 : 28;
  const top = isMobile ? 46 : 52;
  const rowGap = isMobile ? 126 : 100;
  const barHeight = isMobile ? 30 : 38;
  const bottom = 62;
  const height = top + BASELINE_ROWS.length * rowGap + bottom;
  const plotStart = left;
  const plotEnd = width - right;
  const scale = dateScale(DATES.baselineStart, DATES.baselineEnd, plotStart, plotEnd);

  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-labelledby': 'baseline-svg-title baseline-svg-desc'
  });
  svg.appendChild(svgElement('title', { id: 'baseline-svg-title' }, 'Historical Ohio rape statute-of-limitations timeline'));
  svg.appendChild(svgElement('desc', { id: 'baseline-svg-desc' }, `The selected offense date is ${formatDate(analysis.offenseDate)}. The active legal regime is ${analysis.application}.`));
  createDefinitions(svg);

  // Axis caption.
  if (isMobile) {
    svg.appendChild(svgElement('text', {
      x: plotStart,
      y: 22,
      fill: COLORS.ink,
      'font-size': 12,
      'font-weight': 800
    }, 'Statute of limitations'));
  } else {
    svg.appendChild(svgElement('text', {
      x: 22,
      y: height / 2,
      fill: COLORS.ink,
      'font-size': 12,
      'font-weight': 800,
      transform: `rotate(-90 22 ${height / 2})`,
      'text-anchor': 'middle'
    }, 'Statute of limitations'));
  }

  // Active row backgrounds first.
  BASELINE_ROWS.forEach((row, index) => {
    if (row.id !== analysis.regime) return;
    const barY = isMobile ? top + index * rowGap + 32 : top + index * rowGap;
    svg.appendChild(svgElement('rect', {
      x: plotStart - 6,
      y: barY - 12,
      width: plotEnd - plotStart + 12,
      height: barHeight + 24,
      rx: 9,
      fill: COLORS.rowActive
    }));
  });

  // Grid and ticks.
  baselineTicks(isMobile).forEach((year) => {
    const tickDate = `${year}-01-01`;
    const x = scale(tickDate);
    svg.appendChild(svgElement('line', {
      x1: x,
      x2: x,
      y1: top - 10,
      y2: height - bottom + 4,
      stroke: COLORS.grid,
      'stroke-width': 1
    }));
    svg.appendChild(svgElement('text', {
      x,
      y: height - 31,
      fill: COLORS.muted,
      'font-size': isMobile ? 10 : 11,
      'text-anchor': year === 1989 ? 'start' : year === 2050 ? 'end' : 'middle'
    }, String(year)));
  });

  // Rows and segments.
  BASELINE_ROWS.forEach((row, index) => {
    const barY = isMobile ? top + index * rowGap + 32 : top + index * rowGap;
    const labelY = isMobile ? barY - 11 : barY + barHeight / 2 + 5;
    const rowIsActive = row.id === analysis.regime;

    svg.appendChild(svgElement('text', {
      x: isMobile ? plotStart : plotStart - 14,
      y: labelY,
      fill: rowIsActive ? COLORS.ink : COLORS.inkSoft,
      'font-size': isMobile ? 12 : 13,
      'font-weight': rowIsActive ? 800 : 650,
      'text-anchor': isMobile ? 'start' : 'end'
    }, row.label));

    row.segments.forEach((segment) => {
      const x = scale(segment.start);
      const segmentWidth = Math.max(1, scale(segment.end) - x);
      const isRetroForSelection = segment.type === 'retro' && compareISO(analysis.offenseDate, DATES.hb6Effective) < 0;
      const segmentRelevant = rowIsActive && (
        segment.type === 'sol'
        || (segment.type === 'dna' && analysis.dnaApplicable)
        || isRetroForSelection
      );
      const opacity = rowIsActive ? 1 : 0.34;

      const group = svgElement('g', {
        opacity,
        tabindex: 0,
        'aria-label': segment.description
      });
      const rect = svgElement('rect', {
        x,
        y: barY,
        width: segmentWidth,
        height: barHeight,
        rx: 4,
        fill: segmentFill(segment.type),
        stroke: segmentRelevant ? COLORS.ink : 'rgba(23,50,77,0.18)',
        'stroke-width': segmentRelevant ? 2.5 : 0.8
      });
      group.appendChild(rect);
      addSvgTitle(group, segment.description);

      if (segment.label) {
        const inside = segmentWidth >= (isMobile ? 62 : 74);
        const textY = inside ? barY + barHeight / 2 + 4 : barY + barHeight + 17;
        const textColor = inside
          ? (segment.type === 'dna' ? COLORS.ink : COLORS.white)
          : COLORS.ink;
        group.appendChild(svgElement('text', {
          x: x + segmentWidth / 2,
          y: textY,
          fill: textColor,
          'font-size': isMobile ? 10.5 : 12,
          'font-weight': 800,
          'text-anchor': 'middle'
        }, segment.label));
        if (!inside) {
          group.appendChild(svgElement('line', {
            x1: x + segmentWidth / 2,
            x2: x + segmentWidth / 2,
            y1: barY + barHeight,
            y2: barY + barHeight + 8,
            stroke: COLORS.ink,
            'stroke-width': 1
          }));
        }
      }

      svg.appendChild(group);
    });

    // Selected offense marker is shown on the active row.
    if (rowIsActive) {
      const markerX = scale(analysis.offenseDate);
      const labelX = Math.min(plotEnd - 52, Math.max(plotStart + 52, markerX));
      svg.appendChild(svgElement('line', {
        x1: markerX,
        x2: markerX,
        y1: barY - 9,
        y2: barY + barHeight + 9,
        stroke: COLORS.ink,
        'stroke-width': 3
      }));
      svg.appendChild(svgElement('circle', {
        cx: markerX,
        cy: barY + barHeight / 2,
        r: 5,
        fill: COLORS.white,
        stroke: COLORS.ink,
        'stroke-width': 2.5
      }));
      svg.appendChild(svgElement('text', {
        x: labelX,
        y: isMobile ? barY + barHeight + 36 : barY - 16,
        fill: COLORS.ink,
        'font-size': isMobile ? 10 : 11,
        'font-weight': 800,
        'text-anchor': 'middle'
      }, formatDate(analysis.offenseDate)));
    }
  });

  // Axis baseline and title.
  const axisY = height - bottom + 4;
  svg.appendChild(svgElement('line', {
    x1: plotStart,
    x2: plotEnd,
    y1: axisY,
    y2: axisY,
    stroke: COLORS.inkSoft,
    'stroke-width': 1
  }));
  svg.appendChild(svgElement('text', {
    x: (plotStart + plotEnd) / 2,
    y: height - 8,
    fill: COLORS.ink,
    'font-size': 12,
    'font-weight': 800,
    'text-anchor': 'middle'
  }, 'Year'));

  baselineChart.replaceChildren(svg);
}

function selectedWindowTicks(startISO, endISO) {
  const startYear = parseISO(startISO).getUTCFullYear();
  const endYear = parseISO(endISO).getUTCFullYear();
  const ticks = [];
  const firstFive = Math.ceil(startYear / 5) * 5;
  for (let year = firstFive; year <= endYear; year += 5) ticks.push(year);
  return ticks;
}

function renderSelectedWindow(analysis) {
  const width = Math.max(320, selectedChart.clientWidth || 1000);
  const isMobile = width < 650;
  const height = isMobile ? 230 : 205;
  const left = isMobile ? 14 : 60;
  const right = isMobile ? 14 : 30;
  const plotStart = left;
  const plotEnd = width - right;
  const barY = isMobile ? 82 : 70;
  const barHeight = isMobile ? 42 : 46;
  const chartEnd = analysis.dnaApplicable ? analysis.illustrativeDnaEnd : analysis.deadline;
  const scale = dateScale(analysis.offenseDate, chartEnd, plotStart, plotEnd);

  const svg = svgElement('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-labelledby': 'selected-svg-title selected-svg-desc'
  });
  svg.appendChild(svgElement('title', { id: 'selected-svg-title' }, 'Calculated limitations period for the selected offense'));
  svg.appendChild(svgElement('desc', { id: 'selected-svg-desc' }, analysis.dnaApplicable
    ? `A ${analysis.years}-year base period ending ${formatDate(analysis.deadline)}, followed by an illustrative five-year DNA period ending ${formatDate(analysis.illustrativeDnaEnd)}.`
    : `A ${analysis.years}-year base period ending ${formatDate(analysis.deadline)}.`));
  createDefinitions(svg);

  selectedWindowTicks(analysis.offenseDate, chartEnd).forEach((year) => {
    const tickISO = `${year}-01-01`;
    if (compareISO(tickISO, analysis.offenseDate) <= 0 || compareISO(tickISO, chartEnd) >= 0) return;
    const x = scale(tickISO);
    svg.appendChild(svgElement('line', {
      x1: x,
      x2: x,
      y1: 42,
      y2: barY + barHeight + 24,
      stroke: COLORS.grid,
      'stroke-width': 1
    }));
    svg.appendChild(svgElement('text', {
      x,
      y: barY + barHeight + 45,
      fill: COLORS.muted,
      'font-size': 10.5,
      'text-anchor': 'middle'
    }, String(year)));
  });

  const deadlineX = scale(analysis.deadline);
  const solWidth = Math.max(1, deadlineX - plotStart);
  const solGroup = svgElement('g');
  const solRect = svgElement('rect', {
    x: plotStart,
    y: barY,
    width: solWidth,
    height: barHeight,
    rx: 5,
    fill: COLORS.sol,
    stroke: COLORS.solDark,
    'stroke-width': 1
  });
  solGroup.appendChild(solRect);
  addSvgTitle(solGroup, `${analysis.years}-year base period: ${formatDate(analysis.offenseDate)} through ${formatDate(analysis.deadline)}.`);
  solGroup.appendChild(svgElement('text', {
    x: plotStart + solWidth / 2,
    y: barY + barHeight / 2 + 5,
    fill: COLORS.white,
    'font-size': isMobile ? 11 : 13,
    'font-weight': 850,
    'text-anchor': 'middle'
  }, `${analysis.years} years`));
  svg.appendChild(solGroup);

  if (analysis.dnaApplicable) {
    const dnaEndX = scale(analysis.illustrativeDnaEnd);
    const dnaWidth = Math.max(1, dnaEndX - deadlineX);
    const dnaGroup = svgElement('g');
    dnaGroup.appendChild(svgElement('rect', {
      x: deadlineX,
      y: barY,
      width: dnaWidth,
      height: barHeight,
      rx: 5,
      fill: 'url(#dnaPattern)',
      stroke: COLORS.solDark,
      'stroke-width': 1
    }));
    addSvgTitle(dnaGroup, `Illustrative five-year DNA period: ${formatDate(analysis.deadline)} through ${formatDate(analysis.illustrativeDnaEnd)}. Actual timing depends on the qualifying DNA determination date.`);
    dnaGroup.appendChild(svgElement('text', {
      x: deadlineX + dnaWidth / 2,
      y: barY + barHeight / 2 + 4,
      fill: COLORS.ink,
      'font-size': isMobile ? 9.5 : 11.5,
      'font-weight': 850,
      'text-anchor': 'middle'
    }, '5 years'));
    svg.appendChild(dnaGroup);
  }

  const boundaries = [
    { iso: analysis.offenseDate, label: `Offense: ${formatDate(analysis.offenseDate)}`, anchor: 'start' },
    { iso: analysis.deadline, label: `Base deadline: ${formatDate(analysis.deadline)}`, anchor: analysis.dnaApplicable ? 'middle' : 'end' }
  ];
  if (analysis.dnaApplicable) {
    boundaries.push({ iso: analysis.illustrativeDnaEnd, label: `Illustrative DNA end: ${formatDate(analysis.illustrativeDnaEnd)}`, anchor: 'end' });
  }

  boundaries.forEach((boundary, index) => {
    const x = scale(boundary.iso);
    svg.appendChild(svgElement('line', {
      x1: x,
      x2: x,
      y1: barY - 13,
      y2: barY + barHeight + 12,
      stroke: COLORS.ink,
      'stroke-width': index === 0 ? 2.5 : 1.5
    }));
    let labelX = x;
    let anchor = boundary.anchor;
    if (index === 1 && analysis.dnaApplicable && isMobile) {
      labelX = x - 4;
      anchor = 'end';
    }
    svg.appendChild(svgElement('text', {
      x: labelX,
      y: index === 1 ? barY - 25 : barY + barHeight + (isMobile ? 69 : 65),
      fill: COLORS.ink,
      'font-size': isMobile ? 9.5 : 10.5,
      'font-weight': 750,
      'text-anchor': anchor
    }, boundary.label));
  });

  svg.appendChild(svgElement('text', {
    x: plotStart,
    y: 24,
    fill: COLORS.inkSoft,
    'font-size': 11,
    'font-weight': 750
  }, 'Modeled period after the selected offense date'));

  selectedChart.replaceChildren(svg);
}

function updateTable(regime) {
  document.querySelectorAll('#baseline-table tbody tr').forEach((row) => {
    const active = row.dataset.regime === regime;
    row.classList.toggle('is-active', active);
    if (active) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  });
}

function updatePresets(value) {
  document.querySelectorAll('.preset-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.date === value);
  });
}

function updateUI() {
  const value = dateInput.value;
  if (!isValidSelectedDate(value)) {
    dateError.hidden = false;
    dateError.textContent = `Enter a date from ${formatDate(DATES.minimum)} through ${formatDate(dateInput.max)}.`;
    return;
  }
  dateError.hidden = true;

  const analysis = analyzeOffenseDate(value);
  selectedDateDisplay.textContent = formatDate(analysis.offenseDate);
  applicableLaw.textContent = `${analysis.years} years`;
  baseDeadline.textContent = formatDate(analysis.deadline);
  applicationBadge.textContent = analysis.badge;
  explanation.textContent = analysis.description;

  if (analysis.dnaApplicable) {
    dnaDisplay.textContent = `Potentially applicable; illustrative end ${formatDate(analysis.illustrativeDnaEnd)}`;
    dnaScenarioNote.hidden = false;
    dnaScenarioNote.textContent = `Illustrative DNA scenario: the light-green segment assumes a qualifying DNA determination is completed on the base deadline, ${formatDate(analysis.deadline)}, producing a five-year period through ${formatDate(analysis.illustrativeDnaEnd)}. The actual statutory deadline depends on the determination date and is not automatically five years beyond the base deadline.`;
  } else {
    dnaDisplay.textContent = 'Not applicable under this model';
    dnaScenarioNote.hidden = true;
    dnaScenarioNote.textContent = '';
  }

  const regimeLabel = BASELINE_ROWS.find((row) => row.id === analysis.regime).label;
  baselineNote.textContent = `The selected offense date is highlighted on the ${regimeLabel} row. The applicable statute-of-limitations segment${analysis.dnaApplicable ? ' and the illustrative DNA segment' : ''} are emphasized.`;

  renderBaseline(analysis);
  renderSelectedWindow(analysis);
  updateTable(analysis.regime);
  updatePresets(value);

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('date', value);
    window.history.replaceState({}, '', url);
  } catch (_) {
    // Query-string updates are optional when the file is opened locally.
  }
}

function initialize() {
  dateInput.max = todayISO();

  const queryDate = new URLSearchParams(window.location.search).get('date');
  if (queryDate && isValidSelectedDate(queryDate)) dateInput.value = queryDate;

  dateInput.addEventListener('input', updateUI);
  dateInput.addEventListener('change', updateUI);
  document.querySelectorAll('.preset-button').forEach((button) => {
    button.addEventListener('click', () => {
      dateInput.value = button.dataset.date;
      updateUI();
      dateInput.focus();
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateUI, 120);
  });

  updateUI();
}

initialize();
