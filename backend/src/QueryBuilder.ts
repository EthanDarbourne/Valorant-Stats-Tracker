import { Pool, QueryResult } from "pg";
import { ColumnIdentifier, Quote, SQLComparator, SQLJoinType } from "./Helpers";

export class QueryBuilder {
  private str: string;

  private inSelect: boolean = false;
  private selectCount: number = 0;
  private parameterCount: number = 0;
  private parameters: any[] = [];

  constructor(initial: string = "") {
    this.str = initial;
  }

  append(value: string): this {
    this.str += value;
    return this;
  }

  prepend(value: string): this {
    this.str = value + this.str;
    return this;
  }

  insertAt(index: number, value: string): this {
    this.str = this.str.slice(0, index) + value + this.str.slice(index);
    return this;
  }

  clear(): this {
    this.str = "";
    return this;
  }

  toString(): string {
    return this.str;
  }


  GetParameterString() {
    ++this.parameterCount;
    return `$${this.parameterCount}`;
  }

  // SQL functions
  Update(tableName: string) {
    this.append(`UPDATE ${Quote(tableName)}`);
    return this;
  }

  Set(columns: Parameter[]) {
    this.append(" SET ");
    this.append(columns.map(col => `${Quote(col[0])} = ${this.GetParameterString()}`).join(" AND "))
    this.parameters.push(columns.map(x => x[1]));
    return this;
  }

  Delete(tableName: string) {
    this.append(`DELETE FROM ${Quote(tableName)}`);
    return this;
  }

  Select() {
    this.inSelect = true;
    this.selectCount = 0;
    this.append("SELECT ");
    return this;
  }

  SelectAll() {
    this.append("SELECT * ");
    return this;
  }

  Selectable(columnName: ColumnIdentifier, alias?: string | null) {
    if(!this.inSelect) {
        throw new Error("Need to be in select mode");
    }
    if(this.selectCount !== 0) {
        this.append(", ");
    }
    ++this.selectCount;
    this.append(Quote(columnName));
    if(alias) {
        this.append(" AS " + Quote(alias));
    }
    return this;
  }

  From(tableName: string, alias?: string | null) {
    if(!this.inSelect || this.selectCount == 0) {
        throw new Error(`Error occured: inSelect {${this.inSelect}} | selectCount {${this.selectCount}}`);
    }
    this.inSelect = false;
    this.append(" FROM " + Quote(tableName));
    if(alias) {
        this.append(" " + Quote(alias));
    }
    return this;
  }


  Join(joinType: SQLJoinType, tableName: string, alias: string, joinClauses: [ColumnIdentifier, ColumnIdentifier][]) {
    this.append(` ${joinType} ${tableName} ${alias} ON `);
    this.append(joinClauses.map(x => `${Quote(x[0])} = ${Quote(x[1])}`).join(" AND "));
    return this;
  }

  // Only supports AND currently todo: add expression tree support
  // and only supports comparison to parameters todo: comparison to other table values ? (do we need this?)
  Where(clauses: WhereClause[]) {
    this.WhereClause();
    this.append(clauses.map(x => `${Quote(x[0])} ${x[1]} ${this.GetParameterString()}`).join(" AND "));
    return this;
  }

  WhereClause() {
    this.append(" WHERE ");
    return this;
  }

  WhereSingle(clause: WhereClause) {
    this.append(`${Quote(clause[0])} ${clause[1]} ${this.GetParameterString()}`);
    this.parameters.push(clause[2]);
    return this;
  }

  WhereOp(op: SQLComparator) {
    this.append(` ${op} `);
    return this;
  }

  EndQuery() {
    this.append(";");
    return this;
  }

  async Execute(pool: Pool): Promise<QueryResult<any>> {
    try {
      return await pool.query(this.toString(), this.parameters);
    }
    catch (error) {
      console.trace(this.toString(), this.parameters);
      throw error;
    }
  }
}

type Parameter = [ColumnIdentifier, any]
type WhereClause = [ColumnIdentifier, SQLComparator, any]; // column to compare to, comparator, parameter
