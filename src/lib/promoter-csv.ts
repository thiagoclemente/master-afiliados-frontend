export type ParsedPromoterCsvRow = {
  lineNumber: number;
  values: string[];
  record: Record<string, string>;
};

export type ParsedPromoterCsvDocument = {
  header: string[];
  rows: ParsedPromoterCsvRow[];
};

const stripBom = (value: string) => value.replace(/^\uFEFF/, "");

export const normalizeCsvColumnName = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "");

const isBlankRow = (row: string[]) => row.every((value) => value.trim().length === 0);

export function parsePromoterCsvDocument(input: string): ParsedPromoterCsvDocument {
  const content = stripBom(input).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField.trim());
    currentField = "";
  };

  const pushRow = () => {
    pushField();
    if (!isBlankRow(currentRow)) {
      rows.push(currentRow);
    }
    currentRow = [];
  };

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      const nextChar = content[index + 1];
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushField();
      continue;
    }

    if (char === "\n" && !inQuotes) {
      pushRow();
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  if (rows.length === 0) {
    return { header: [], rows: [] };
  }

  const [headerRow, ...valueRows] = rows;
  const header = headerRow.map((value) => value.trim());

  return {
    header,
    rows: valueRows.map((values, index) => {
      const record: Record<string, string> = {};

      header.forEach((columnName, columnIndex) => {
        const normalizedColumnName = columnName.trim();
        if (!normalizedColumnName) return;
        record[normalizedColumnName] = values[columnIndex]?.trim() ?? "";
      });

      return {
        lineNumber: index + 2,
        values: values.map((value) => value.trim()),
        record,
      };
    }),
  };
}

export function hasPromoterCsvProductLinkColumns(header: string[]): boolean {
  return header.some((columnName) => {
    const normalized = normalizeCsvColumnName(columnName);
    return normalized === "offerlink" || normalized === "productlink";
  });
}

export function getFirstPromoterCsvValue(
  record: Record<string, string>,
  aliases: string[]
): string | undefined {
  for (const alias of aliases) {
    const normalizedAlias = normalizeCsvColumnName(alias);
    const match = Object.entries(record).find(
      ([columnName]) => normalizeCsvColumnName(columnName) === normalizedAlias
    );

    if (!match) continue;

    const value = match[1]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function resolvePromoterCsvLink(record: Record<string, string>): string | undefined {
  return getFirstPromoterCsvValue(record, [
    "Offer Link",
    "offerLink",
    "Product Link",
    "productLink",
  ]);
}
