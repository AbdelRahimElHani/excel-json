// Excel -> Converter -> JSON
// Reads an .xlsx file with the XLSX library and turns one sheet into JSON:
// a list of rows, where each row is an object keyed by the column headings.

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const sheetPicker = document.getElementById("sheetPicker");
const sheetSelect = document.getElementById("sheetSelect");
const outputEl = document.getElementById("output");
const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");

let workbook = null;

// --- File selection -------------------------------------------------------

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) loadFile(fileInput.files[0]);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  if (event.dataTransfer.files.length > 0) loadFile(event.dataTransfer.files[0]);
});

sheetSelect.addEventListener("change", () => convertSheet(sheetSelect.value));

// --- Reading the Excel file -----------------------------------------------

function loadFile(file) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    showError("Please choose an .xlsx file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target.result);
      workbook = XLSX.read(data, { type: "array", cellDates: true });
    } catch (error) {
      showError("This file could not be read. Is it a valid .xlsx file?");
      return;
    }

    // Fill the sheet picker; it is only shown when there is a choice to make.
    sheetSelect.innerHTML = "";
    workbook.SheetNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      sheetSelect.appendChild(option);
    });
    sheetPicker.hidden = workbook.SheetNames.length < 2;

    convertSheet(workbook.SheetNames[0]);
  };

  reader.onerror = () => showError("The file could not be opened.");

  setStatus("Reading " + file.name + " ...");
  reader.readAsArrayBuffer(file);
}

// --- Converting a sheet to JSON -------------------------------------------

function convertSheet(name) {
  const rows = sheetToRows(workbook.Sheets[name]);

  if (rows.length === 0) {
    resultEl.hidden = false;
    outputEl.value = "[]";
    setStatus("Sheet \"" + name + "\" has no data rows below the header row.");
    return;
  }

  outputEl.value = JSON.stringify(rows, null, 2);
  resultEl.hidden = false;
  setStatus(rows.length + (rows.length === 1 ? " row" : " rows") + " converted from sheet \"" + name + "\".");
}

// First row = column headings. Every following row becomes one object.
function sheetToRows(sheet) {
  if (!sheet || !sheet["!ref"]) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const headers = [];

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
    let header = cellText(cell).trim() || "Column " + (col - range.s.c + 1);

    // Two columns with the same heading would overwrite each other in JSON.
    let unique = header;
    let count = 2;
    while (headers.includes(unique)) {
      unique = header + " " + count;
      count++;
    }
    headers.push(unique);
  }

  const rows = [];

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const record = {};
    let hasValue = false;

    headers.forEach((header, index) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: range.s.c + index })];
      const value = cellValue(cell);
      if (value !== "") hasValue = true;
      record[header] = value;
    });

    if (hasValue) rows.push(record); // skip completely empty rows
  }

  return rows;
}

// Numbers and true/false stay real JSON values; everything else (text, dates)
// is exported as the text Excel displays.
function cellValue(cell) {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  if (cell.t === "n" || cell.t === "b") return cell.v;
  return cellText(cell);
}

function cellText(cell) {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  if (cell.t === "d") {
    return cell.w !== undefined ? cell.w : cell.v.toLocaleDateString();
  }
  if (cell.w !== undefined) return cell.w;
  return String(cell.v);
}

// --- Copy and download ----------------------------------------------------

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value);
  } catch (error) {
    // Fallback for browsers that block the clipboard API on local pages.
    outputEl.select();
    document.execCommand("copy");
  }

  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy JSON";
  }, 1500);
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob([outputEl.value], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

// --- Status messages ------------------------------------------------------

function setStatus(message) {
  statusEl.textContent = message;
  statusEl.classList.remove("error");
}

function showError(message) {
  statusEl.textContent = message;
  statusEl.classList.add("error");
  resultEl.hidden = true;
}
