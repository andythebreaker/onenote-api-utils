const generate = require('json-schema-generator');
const fs = require('fs'); // Added to handle file writing
const json = require('../src/notebook_data/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c.json');
const schema = generate(json);
fs.writeFileSync('./schema-output.json', JSON.stringify(schema, null, 2)); // Write schema to a JSON file
