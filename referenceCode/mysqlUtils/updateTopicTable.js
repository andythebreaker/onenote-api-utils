import fs from 'fs'
import path from 'path'
import { createConnection, updateTopicsTable } from './mysqlUtils.js'
import { db_data_dir } from '../docxProcessApi/commonPath.js'
import processTopicJson from '../docxProcessApi/processJson.js'

const connection = await createConnection();
try {
    // Process each topic file
    for (let i = 1; i <= 5; i++) {
        const filePath = path.join(db_data_dir, `topic_${i}.json`);
        console.log(`Processing ${filePath}...`);
        const topicJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const processedTopicJson = processTopicJson(topicJson);
        await updateTopicsTable(connection, processedTopicJson);
    }
} catch (error) {
    console.error(`Error processing topic_${i}.json:`, error);
} finally {
    await connection.end();
}