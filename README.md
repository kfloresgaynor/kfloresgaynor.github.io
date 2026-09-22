# Ohio Rape Statute of Limitations Interactive Timeline

This package contains a responsive, dependency-free web visualization based on the dates and assumptions in `Ohio_Rape_SOL_Historical_Timeline.xlsx`.

## Files

- `index.html` — page structure and accessible source/disclaimer content
- `styles.css` — responsive desktop and mobile styling
- `app.js` — date logic, Gantt-style SVG charts, highlighting, and calculations
- `Ohio_Rape_SOL_Interactive_Timeline_Standalone.html` — a single-file version with the CSS and JavaScript embedded

## Run locally

The files contain no external JavaScript or CSS dependencies. You can open `index.html` directly, or serve the directory locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Embed

Copy the directory to a web server and link to `index.html`, or use the standalone HTML file. A basic iframe embed is:

```html
<iframe
  src="/path/to/index.html"
  title="Applicability of the Criminal Statute of Limitations on Rape in Ohio"
  loading="lazy"
  style="width:100%;min-height:1500px;border:0;"
></iframe>
```

## Data and legal logic

The thresholds and baseline segments are declared near the top of `app.js`:

- 8/1/1989 through 3/8/1993: six-year period; later amendments do not revive an already expired period.
- 3/9/1993 through 7/15/1995: 20-year period under H.B. 49’s unexpired-case application rule.
- 7/16/1995 and later: 25-year period under H.B. 6; the DNA provisions are within the amendment’s application range under the no-tolling assumptions used here.

For offenses within the DNA application range, the selected-offense chart displays an **illustrative** five-year segment beginning on the 25-year deadline. This assumes the qualifying DNA determination is completed on that deadline. The actual statute depends on the DNA determination date and is not an automatic five-year addition in every case.

## Responsive behavior

The baseline SVG uses a desktop layout with row labels on the left and switches to a stacked mobile layout with row labels above each bar. Short duration labels are moved outside narrow segments so “6 years” and “5 years” remain readable.

## Accessibility

- Native date input with keyboard-accessible preset buttons
- Text summary updated in an `aria-live` region
- SVG titles and descriptions
- Patterned fills in addition to color
- A complete HTML data table and written explanation below the charts

## Scope

The page intentionally follows the assumptions and exclusions displayed in the visualization. It is an editorial and research aid, not legal advice.
