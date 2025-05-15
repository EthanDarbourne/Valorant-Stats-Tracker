def generate_insert_statements(table_name, columns, data_columns):
    # Check that all columns have the same number of values
    if len(columns) != len(data_columns):
        raise ValueError(f"Received {len(columns)} column names and {len(data_columns)} arrays")
    num_rows = len(data_columns[0])
    if any(len(col) != num_rows for col in data_columns):
        for i in range(len(columns)):
            print(f"Column {columns[i]} has length {len(data_columns[i])}")
        raise ValueError("All columns must have the same number of values.")

    insert_statements = []
    for i in range(num_rows):
        values = []
        for col in data_columns:
            val = col[i]
            # Escape and wrap strings with quotes
            if isinstance(val, str):
                val = val.replace("'", "''")  # escape single quotes
                values.append(f"'{val}'")
            elif val is None:
                values.append("NULL")
            else:
                values.append(str(val))

        columns_sql = '"' + "\", \"".join(columns) + '"'
        values_sql = ", ".join(values)
        statement = f"INSERT INTO \"{table_name}\" ({columns_sql}) VALUES ({values_sql});"
        insert_statements.append(statement)

    return insert_statements


# === Example usage ===

columns = ["Name", "Region"]
data_columns = [
    ['DetonatioN FocusMe', 'DRX', 'Gen.G Esports', 'Global Esports', 'Paper Rex', 'Rex Regum Qeon', 'T1', 'TALON', 'Team Secret', 'ZETA DIVISION', 'Bleed Esports'],
    ["APAC", "APAC", "APAC", "APAC", "APAC", "APAC", "APAC", "APAC", "APAC", "APAC", "APAC"]
]


statements = generate_insert_statements("Teams", columns, data_columns)
with open("insert_statements.sql", "w") as f:
    for stmt in statements:
        f.write(stmt + "\n")

print(f"{len(data_columns[0])} insert statements written to insert_statements.sql")