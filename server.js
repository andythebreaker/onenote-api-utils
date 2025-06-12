const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTEBOOK_ID = process.env.ONENOTE_NOTEBOOK_ID;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  const notebookId = NOTEBOOK_ID || req.query.notebookId;
  if (!notebookId) {
    return res.status(400).send('ONENOTE_NOTEBOOK_ID not set');
  }
  const dataPath = path.join(__dirname, 'notebook_data', `${notebookId}.json`);
  if (!fs.existsSync(dataPath)) {
    return res.status(404).send('Notebook data not found. Run fetchNotebook.js first.');
  }
  let notebookData;
  try {
    notebookData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    return res.status(500).send('Failed to read notebook data');
  }
  res.render('test-res', {
    sectionCollection: notebookData,
    firstPageContent: notebookData[0]?.sectionPages[0]?.pageBody || ''
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
