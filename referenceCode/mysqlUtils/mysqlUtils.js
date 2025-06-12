import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { __rootdir } from '../docxProcessApi/commonPath.js'

const configPath = path.join(__rootdir, 'mysql.cfg'); // Adjust the path to your config file
const mysqlConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function createConnection() {
    const connection = await mysql.createConnection(mysqlConfig);
    return connection;
}


async function updateTopicsTable(connection, topic_contents) {  
    // Fetch existing topics
    const [existingTopics] = await connection.execute('SELECT id, topic, tab_no, path, department_id, docTree, tables FROM topics');

    // Get the maximum ID from existing topics
    const maxId = existingTopics.reduce((max, topic) => Math.max(max, topic.id), 0);
    let nextId = maxId + 1;
  
    // Compare and update
    for (const topic of topic_contents) {
      const existing = existingTopics.find(
        t => (t.topic === topic.topic) && (t.department_id === topic.department_id) && (t.tab_no === topic.tab_no) && (t.path === topic.path)
    );
  
      if (!existing) {
        // Insert new topic
        await connection.execute(
          'INSERT INTO topics (id, topic, tab_no, path, department_id, docTree, tables) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nextId, topic.topic, topic.tab_no, topic.path, topic.department_id, JSON.stringify(topic.docTree), JSON.stringify(topic.tables)]
        );
        console.log(`Inserted new topic: "${topic.topic}" with ID ${nextId}`);
        nextId++;
      } else if (
        existing.topic !== topic.topic ||
        existing.tab_no !== topic.tab_no ||
        existing.path !== topic.path ||
        existing.department_id !== topic.department_id ||
        JSON.stringify(existing.docTree) !== JSON.stringify(topic.docTree) ||
        JSON.stringify(existing.tables) !== JSON.stringify(topic.tables)
      ) {
        // Update existing topic if any field is different
        await connection.execute(
            'UPDATE topics SET tab_no = ?, path = ?, department_id = ?, docTree = ?, tables = ? WHERE id = ?',
            [topic.tab_no, topic.path, topic.department_id, 
            JSON.stringify(topic.docTree), JSON.stringify(topic.tables), existing.id]
        );
        console.log(`Updated topic: "${topic.topic}"`);
      } else {
        console.log(`Topic "${topic.topic}" already exists and is up-to-date. Skipping.`);
      }
    }
  }

export { createConnection, updateTopicsTable };
