import { Response } from "express";
import { TeamIdentity } from "./TableSchemas/TeamsTable";



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

export const RESPONSE_OK = 200;               // Generic success
export const RESPONSE_CREATED = 201;          // Resource successfully created
export const RESPONSE_NO_CONTENT = 204;       // Success, but no content returned

export const RESPONSE_BAD_REQUEST = 400;      // Invalid request from client
export const RESPONSE_UNAUTHORIZED = 401;     // Authentication required or failed
export const RESPONSE_FORBIDDEN = 403;        // Authenticated but not allowed
export const RESPONSE_NOT_FOUND = 404;        // Resource not found

export const RESPONSE_CONFLICT = 409;         // Conflict with current state (e.g., duplicate resource)

export const RESPONSE_INTERNAL_ERROR = 500;   // Generic server error
export const RESPONSE_NOT_IMPLEMENTED = 501;  // Server doesn’t support functionality
export const RESPONSE_SERVICE_UNAVAILABLE = 503; // Server unavailable (maintenance, overloaded, etc.)

export function SetResponse(res: Response, status: number, result?: any) {
  return res.status(status).json(result);
}

export async function MakeCall(
    dbCall: () => Promise<any>,
    res: Response,
    errorMsg: string,
    goodStatus: number = RESPONSE_OK,
    badStatus: number = RESPONSE_INTERNAL_ERROR
) {
    try {
        await dbCall();
        SetResponse(res, goodStatus);
    }
    catch (error) {
        console.log("Failed to MakeCall " + errorMsg);
        SetResponse(res, badStatus, { Error: "Error fetching from database with " + errorMsg  });
    }
}

export function GetUnique(a: Array<any>) {
    return Array.from(new Set(a));
}

export async function MakeCallWithDatabaseResult(
    dbCall: () => Promise<any>,
    res: Response,
    errorMsg: string,
    goodStatus: number = RESPONSE_OK,
    badStatus: number = RESPONSE_INTERNAL_ERROR
) {
    try {
        const result = await dbCall();
        SetResponse(res, goodStatus, result);
    }
    catch (error) {
        console.log("Failed to MakeCallWithDatabaseResult " + errorMsg + error);
        SetResponse(res, badStatus, { Error: "Error fetching from database with " + errorMsg });
    }
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

/**
 * Throws an error if the provided value is null or undefined.
 */
export function requireValue<T>(value: T | undefined | null, message: string): T {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}

/**
 * Finds an item in an array and throws if not found.
 */
export function maybeFind<T>(
    array: T[],
    predicate: (value: T, index: number, obj: T[]) => boolean,
    message: string
): T {
    return requireValue(array.find(predicate), message);
}

export function FindTeamName(teamId: number, identities: TeamIdentity[]) {
    return identities.find(x => x.Id == teamId)?.Name;
}