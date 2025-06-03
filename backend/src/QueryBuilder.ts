import { Pool, PoolClient, QueryResult } from "pg";
import { ColumnIdentifier, Quote, QuoteAll, SQLComparator, SQLJoinType } from "./Helpers";

export class QueryBuilder {
    private str: string = "";
    private pool: Pool;
    private client: PoolClient | null = null;

    private inSelect: boolean = false;
    private selectCount: number = 0;
    private parameterCount: number = 0;
    private parameters: any[] = [];

    private insertCount: number = 0;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    append(value: string): this {
        this.str += value;
        return this;
    }

    clear(): this {
        this.str = "";
        this.parameterCount = 0;
        this.parameters = [];
        this.inSelect = false;
        this.selectCount = 0;
        this.insertCount = 0;
        return this;
    }

    LogDebugInfo() {
        console.debug("Current Query: " + this.toString());
        console.debug("Current parameters: " + this.parameters);
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

    Insert(tableName: string, cols: string[]) {
        this.append(`INSERT INTO ${Quote(tableName)} (${QuoteAll(cols)}) VALUES `);
        return this;
    }

    AddValue(row: any[]) {
        if(this.insertCount > 0) this.append(", ");
        this.append('(' + row.map(() => this.GetParameterString()).join(", ") + ')')
        this.parameters.push(...row);
        ++this.insertCount;
        return this;
    }

    AddValues(rows: any[][]) {
        rows.forEach(x => this.AddValue(x));
        return this;
    }

    GetReturnValue(returnVal: string) {
        this.append(` RETURNING ${Quote(returnVal)}`);
        return this;
    }

    Set(columns: Parameter[]) {
        this.append(" SET ");
        this.append(columns.map(col => `${Quote(col[0])} = ${this.GetParameterString()}`).join(", "))
        this.parameters.push(...columns.map(x => x[1]));
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
        this.inSelect = true;
        this.selectCount = 1000;
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
        this.parameters.push(...clauses.map(x => x[2]));
        return this;
    }

    WhereClause() {
        this.append(" WHERE ");
        return this;
    }

    OpenBracket() {
        this.append("(");
        return this;
    }

    CloseBracket() {
        this.append(")");
        return this;
    }

    WhereNull(col: ColumnIdentifier) {
        this.append(`${Quote(col)} IS NULL`)
        return this;
    }

    WhereNotNull(col: ColumnIdentifier) {
        this.append(`${Quote(col)} IS NOT NULL`)
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

    async BeginTransaction() {
        if(this.client == null) {
            console.trace("Beginning transaction before client connected");
            throw new Error("Not connected");
        }
        await this.pool.query("BEGIN");
    }
    
    async Connect() {
        if(this.client != null) {
            console.trace("Connection already made");
            throw new Error("Already connected");
        }
        this.client = await this.pool.connect();
    }

    async Commit() {
        if(this.client == null) {
            console.trace("Committing before client connected");
            throw new Error("Not connected");
        }
        await this.client.query("COMMIT");
    }

    async Rollback() {
        if(this.client == null) {
            console.trace("Rollback before client connected");
            throw new Error("Not connected");
        }
        await this.pool.query("ROLLBACK");
    }

    async Disconnect() {
        if(this.client == null) { 
            console.trace("Client not connected yet");
            throw new Error("Not connected");
        }
        this.client.release();
    }

    async Execute(): Promise<QueryResult<any>> {
        
        try {
            let result;
            if(this.client != null) {
                result = await this.client.query(this.toString(), this.parameters);
            }
            else {
                result = await this.pool.query(this.toString(), this.parameters);
            }
            this.clear();
            return result;
        }
        catch (error) {
            console.trace(`Query: ${Quote(this.toString())}\r\nParameters: ${this.parameters}`);
            throw error;
        }
    }
}

type Parameter = [ColumnIdentifier, any]
type WhereClause = [ColumnIdentifier, SQLComparator, any]; // column to compare to, comparator, parameter
