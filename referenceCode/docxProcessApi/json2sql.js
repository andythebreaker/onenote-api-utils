import fs from 'fs';

/**
 * Converts a list of JSON objects into an SQL INSERT statement.
 * @param {string} inputJsonPath - Path to the input JSON file.
 * @param {string} outputSqlPath - Path to save the generated SQL file.
 * @param {string} tableName - Name of the SQL table.
 */
function jsonFile2sqlFile(inputJsonPath, outputSqlPath, tableName) {
    // Read and parse the JSON file
    const jsonData = JSON.parse(fs.readFileSync(inputJsonPath, 'utf8'));

    // Generate SQL INSERT statements dynamically
    const sql = json2sql(jsonData, tableName);

    // Save the SQL to the output file
    fs.writeFileSync(outputSqlPath, sql, 'utf8');
    console.log(`SQL file generated: ${outputSqlPath}`);
}

function json2sql(jsonData, tableName) {
    // Generate SQL INSERT statements dynamically
    const sqlStatements = jsonData.map(obj => {
        const values = Object.values(obj)
            .map(value => {
                if (typeof value === 'string') {
                    // Escape strings and handle quotes
                    return `'${value.replace(/'/g, "''")}'`;
                } else if (typeof value === 'object' && value !== null) {
                    // Serialize nested JSON objects
                    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                } else {
                    // Handle numbers and other primitive types
                    return value;
                }
            }).join(', ');
        return `(${values})`;
    }).join(',\n');

    // Generate the full SQL statement
    const sql = `INSERT INTO ${tableName} (${Object.keys(jsonData[0]).join(', ')}) VALUES\n${sqlStatements};`;

    return sql;
}

export default { jsonFile2sqlFile, json2sql };