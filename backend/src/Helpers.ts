


export function Quote(col: string) {
    return `"${col}"`;
}

export function QuoteAll(cols: string[]) {
    return cols.map(col => `"${col}"`).join(", ")
}

export function toInputDateString(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}
