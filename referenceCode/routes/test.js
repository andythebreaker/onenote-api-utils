import express from 'express';
const router = express.Router();
import createExamples from '../lib/create-examples.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', function (req, res) {
    res.render('test', { title: 'Get OneNote Notebook Content' });
});

router.post('/', function (req, res) {
    var accessToken = req.cookies['access_token'];
    var notebookId = req.body['notebookId'];

    createExamples.getNotebookContent(accessToken, notebookId, (error, sectionCollection) => {
        if (error) {
            return res.render('error', {
                message: 'Error fetching notebook content',
                error: { details: JSON.stringify(error, null, 2) }
            });
        }

        // 以下的程式碼是為了要輸出給 VitePress 前端，與此程式檔案的邏輯無關
        const transformedCollection = sectionCollection.map(section => ({
            text: section.sectionInfo.name,
            items: section.sectionPages.map(page => ({
              text: page.pageInfo.title,
              link: `/${page.pageInfo.id}.html`
            }))
          }));

        const vitepressLeft = JSON.stringify(transformedCollection, null, 2);
        const outputDir = path.join(__dirname, '../public/vitepressOUTPUT');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(__dirname, '../public/vitepressOUTPUT/left.json');
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        fs.writeFileSync(outputPath, vitepressLeft, 'utf8');
        // 以上的程式碼是為了要輸出給 VitePress 前端，與此程式檔案的邏輯無關

        res.render('test-res', {
            title: 'OneNote Notebook Content',
            // body: JSON.stringify(content, null, 2)
            sectionCollection: sectionCollection,
            firstPageContent: sectionCollection[0]?.sectionPages[0]?.pageBody || 'No content available'
        });
    });
});

export default router;