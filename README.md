# excel-json

Turn an Excel spreadsheet into a website in two steps: convert the `.xlsx` file to JSON, then display that JSON as a table.

Everything runs in the browser. No server, build step or install is needed, and uploaded files never leave your computer.

## Structure

| Folder | What it does |
| --- | --- |
| `converter/` | Upload an `.xlsx` file and get its data as JSON (copy it or download `data.json`). |
| `website/` | Reads `data.json` and shows it as a table. It knows nothing about Excel. |

## How it works

1. Open `converter/index.html` and choose an `.xlsx` file (or drag it onto the page).
2. If the workbook has several sheets, pick the one you want.
3. Click **Copy JSON** or **Download data.json**.
4. Replace `website/data.json` with the result.
5. Open the website to see the data as a table.

Each row of the sheet becomes one object, keyed by the column headings in the first row:

```json
[
  { "Product": "Cola 0.33 l", "Category": "Drinks", "Price": 0.89, "Stock": 240 }
]
```

## Running it

The converter works by opening `converter/index.html` directly.

The website loads `data.json` with `fetch`, which browsers block for pages opened from disk. Serve the folder instead:

```bash
cd website
python -m http.server
```

Then open http://localhost:8000. The VS Code "Live Server" extension works too.

## Built with

- Plain HTML, CSS and JavaScript
- [SheetJS (xlsx)](https://sheetjs.com/) 0.18.5, loaded from cdnjs, for reading Excel files
