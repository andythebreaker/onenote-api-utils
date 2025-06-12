import fs from 'fs';
import path from 'path';
import { db_data_dir } from './commonPath.js';
import json2sqlUtils from './json2sql.js';
import processTopicJson from './processJson.js';

// Convert departments JSON to SQL
const departmentJsonPath = path.join(db_data_dir, 'departments.json');
const departmentSqlPath = path.join(db_data_dir, 'departments.sql');
json2sqlUtils.jsonFile2sqlFile(departmentJsonPath, departmentSqlPath, 'departments');


// Convert topics JSON to SQL
const topicJsonPath = path.join(db_data_dir, 'topics.json');
const topicSqlPath = path.join(db_data_dir, 'topics.sql');

const topicJson = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
const processedTopicJson = processTopicJson(topicJson);
const topicSql = json2sqlUtils.json2sql(processedTopicJson, 'topics');
fs.writeFileSync(topicSqlPath, topicSql, 'utf8');
