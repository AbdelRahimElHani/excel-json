// JSON -> Website
// Loads the local data.json file and renders it as a table.
// This page never touches Excel: it only knows about data.json.

const statusEl = document.getElementById("status");
const tableWrap = document.getElementById("tableWrap");
const tableEl = document.getElementById("table");

loadData();

async function loadData() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("data.json was not found (HTTP " + response.status + ").");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      showError("data.json is empty or is not a list of rows.");
      return;
    }

    renderTable(data);
    statusEl.textContent = data.length + (data.length === 1 ? " row" : " rows") + " loaded from data.json";
  } catch (error) {
    if (location.protocol === "file:") {
      // Browsers block reading local files when a page is opened by double-click.
      showError(
        "The browser blocked data.json because this page was opened directly from the disk. " +
        "Start a local server in this folder (for example the VS Code extension \"Live Server\", " +
        "or run: python -m http.server) and open the page from there."
      );
    } else {
      showError("data.json could not be loaded: " + error.message);
    }
  }
}

function renderTable(rows) {
  // Collect every column name that appears in any row, in order of first appearance.
  const columns = [];
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!columns.includes(key)) columns.push(key);
    });
  });

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      const value = row[column];
      td.textContent = value === undefined || value === null ? "" : String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  tableEl.innerHTML = "";
  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
  tableWrap.hidden = false;
}

function showError(message) {
  statusEl.textContent = message;
  statusEl.classList.add("error");
  tableWrap.hidden = true;
}
