export function success(message: string): void {
  console.log(`\u2713 ${message}`);
}

export function error(message: string): void {
  console.error(`\u2717 ${message}`);
}

export function info(message: string): void {
  console.log(`\u2139 ${message}`);
}

export function warn(message: string): void {
  console.log(`\u26A0 ${message}`);
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(headers: string[], rows: string[][]): void {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => (r[i] || "").length));
    return Math.max(h.length, maxRowWidth);
  });

  // Print header
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join("  ");
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));

  // Print rows
  for (const row of rows) {
    const line = row.map((cell, i) => (cell || "").padEnd(widths[i])).join("  ");
    console.log(line);
  }
}

export function printKeyValue(data: Record<string, string | number | boolean | undefined>): void {
  const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      console.log(`${key.padEnd(maxKeyLength)}  ${value}`);
    }
  }
}

export function printCsv(headers: string[], rows: string[][]): void {
  // Print header
  console.log(headers.map(escapeCsvField).join(","));

  // Print rows
  for (const row of rows) {
    console.log(row.map(escapeCsvField).join(","));
  }
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
