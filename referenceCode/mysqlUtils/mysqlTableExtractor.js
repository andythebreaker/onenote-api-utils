import { createConnection } from './mysqlUtils.js'
import fs from 'fs';
import path from 'path';
import { db_data_dir } from '../docxProcessApi/commonPath.js';

const connection = await createConnection();

// Fetch existing topics with non-empty tables
const [existingTopics] = await connection.execute(
    'SELECT id, topic, tab_no, path, department_id, docTree, tables FROM topics WHERE JSON_LENGTH(tables) > 0'
);

// Process and decode tables
const decodedData = existingTopics.map(topic => ({
    id: topic.id,
    tables: topic.tables.map(table => 
        Buffer.from(table, 'base64').toString('utf8')
    )
}));

// Save to JSON file
const outputPath = path.join(db_data_dir, 'decoded_tables.json');
fs.writeFileSync(outputPath, JSON.stringify(decodedData, null, 2));

await connection.end();