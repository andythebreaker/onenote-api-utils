import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __currentpath = fileURLToPath(import.meta.url);
const __currentdir = path.dirname(__currentpath);
const __rootdir = path.join(__currentdir, '..');
const db_data_dir = path.join(__rootdir, 'data', 'db');
fs.mkdirSync(db_data_dir, { recursive: true });

export {__rootdir, db_data_dir};