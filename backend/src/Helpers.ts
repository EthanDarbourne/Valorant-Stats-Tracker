


function QuoteColumn(col: string) {
    return `"${col}"`;
}


type StringPair = [string, string];
export type ColumnIdentifier = string | StringPair;

function QuoteIdentifier(
  a: ColumnIdentifier,
  b?: string
): string {
  if (Array.isArray(a)) {
    const [tableName, colName] = a;
    return `${Quote(tableName)}.${Quote(colName)}`;
  } else if (typeof a === 'string' && typeof b === 'string') {
    return `${Quote(a)}.${Quote(b)}`;
  } else {
    throw new Error('Invalid arguments to QuoteIdentifier');
  }
}

export function Quote(val: ColumnIdentifier) {
  if(typeof val === 'string') {
    return QuoteColumn(val);
  }
  else if(Array.isArray(val)) {
    return QuoteIdentifier(val);
  }
  else {
    throw new Error('Invalid arguments to QuoteIt');
  }
}

export function QuoteAll(cols: string[]) {
    return cols.map(col => `"${col}"`).join(", ")
}

export function toInputDateString(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}


export const SQLComparator = {
  EQUAL: '=',
  NOT_EQUAL: '!=',
  LESS_THAN: '<',
  LESS_THAN_EQUAL: '<=',
  GREATER_THAN: '>',
  GREATER_THAN_EQUAL: '>=',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  IN: 'IN',
  NOT_IN: 'NOT IN',
  IS: 'IS',
  IS_NOT: 'IS NOT',
  OR: 'OR',
  AND: 'AND',
} as const; // todo: extract OR and AND

export type SQLComparator = (typeof SQLComparator)[keyof typeof SQLComparator];

// Cross is default
export const SQLJoinType = {
  INNER: 'INNER',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FULL: 'FULL',
  CROSS: 'CROSS',
} as const;

export type SQLJoinType = (typeof SQLJoinType)[keyof typeof SQLJoinType];