import express from 'express';
const router = express.Router();
import isJSON from 'is-json';
import { JSDOM } from 'jsdom';
import liveConnect from '../lib/liveconnect-client.js';
import createExamples from '../lib/create-examples.js';
import { getImgPathByUrl } from '../lib/create-examples.js';
import config from '../config.js';
import ENV from '../lib/envar.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* GET Index page */
router.get('/', function (req, res) {
    var authUrl = liveConnect.getAuthUrl();
    res.render('index', { title: 'Diagmind 國考醫學知識網站 預覽版', authUrl: authUrl });
});

/* POST Create example request */
router.post('/', function (req, res) {
    var accessToken = req.cookies['access_token'];
    var exampleType = req.body['submit'];

    // Render the API response with the created links or with error output
    var createResultCallback = function (error, httpResponse, body) {
        if (error) {
            return res.render('error', {
                message: 'HTTP Error',
                error: { details: JSON.stringify(error, null, 2) }
            });
        }

        // Parse the body since it is a JSON response
        var parsedBody;
        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            parsedBody = {};
        }
        // Get the submitted resource url from the JSON response
        var resourceUrl = parsedBody['links'] ? parsedBody['links']['oneNoteWebUrl']['href'] : null;

        if (resourceUrl) {
            res.render('result', {
                title: 'OneNote API Result',
                body: body,
                resourceUrl: resourceUrl
            });
        } else {
            res.render('error', {
                message: 'OneNote API Error',
                error: { status: httpResponse.statusCode, details: body }
            });
        }
    };

    // Request the specified create example
    switch (exampleType) {
        case 'x':
            createExamples.x(accessToken, (a) => {
                //console.log(a);
                res.render('result', {
                    title: 'OneNote API Result',
                    body: JSON.stringify(a),
                    resourceUrl: '["https://www.onenote.com/api/v1.0/notebooks/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c"]',
                    serverUrl: config.serverUrl
                });
            });
            break;
        default:
            //console.log(exampleType);   
            createExamples.y(accessToken, exampleType, (a) => {
                //console.log(a);
                //if (isJSON(String(a))) {
                if (a.shit === "json") {
                    res.json(a.shit_);
                } else {
                    // Parse the HTML content
                    const dom = new JSDOM(a.shit_);
                    const doc = dom.window.document;

                    // Process the img elements
                    const imgElements = doc.querySelectorAll('img');
                    imgElements.forEach(img => {
                        // Replace img.src with local path
                        img.src = getImgPathByUrl(img.src);
                    });
                    // Serialize the updated HTML content
                    const updatedHtml = dom.serialize();
                    res.json({ html: updatedHtml });
                }
            });
            break;
    }
});


router.get('/vitepress2md', async function (req, res) {
     let cacheFile = req.query.cacheFile || ENV.CACHE_FILE;
    if (!path.isAbsolute(cacheFile)) {
        cacheFile = path.join(__dirname, '..', cacheFile);
    }
    if (!fs.existsSync(cacheFile)) {
        return res.status(400).json({ error: 'Cache file not found' });
    }
    const jsonData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const outputDir = path.join(__dirname, '../public/vitepressOUTPUT/htmls');
    const MDoutputDir = path.join(__dirname, '../public/vitepressOUTPUT/mds');
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    if (fs.existsSync(MDoutputDir)) {
        fs.rmSync(MDoutputDir, { recursive: true, force: true });
    }
    // Iterate over each object in the JSON array
    const promises = jsonData.map(async (obj) => {
        const ob = obj.sectionPages;
        for (const o of ob) {
            const html_file_name = o.pageInfo.id;
            const html_file_sutff = o.pageBody;
            // Save html file to ../public/vitepressOUTPUT/htmls
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            if (!fs.existsSync(MDoutputDir)) {
                fs.mkdirSync(MDoutputDir, { recursive: true });
            }
            const outputPath = path.join(__dirname, '../public/vitepressOUTPUT/htmls/' + html_file_name + '.html');
            fs.writeFileSync(outputPath, html_file_sutff, 'utf8');

            // Wait process finish: cd ../public/vitepressOUTPUT , pandoc ./htmls/html_file_name.html -t gfm -o ./mds/html_file_name.md
            const cmd = 'cd ' + path.join(__dirname, '../public/vitepressOUTPUT') + ` && ${ENV.DEV?'~/.local/bin/':''}pandoc ./htmls/` + html_file_name + '.html -t gfm -o ./mds/' + html_file_name + '.md';
            await new Promise((resolve, reject) => {
                exec(cmd, function (error, stdout, stderr) {
                    if (error) {
                        console.error('error: ' + error);//TODO send to front end
                        reject(error);
                        return;
                    }
                    console.log('stdout: ' + stdout);//TODO send to front end
                    console.log('stderr: ' + stderr);//TODO send to front end
                    // Read the generated markdown file
                    const mdFilePath = path.join(__dirname, '../public/vitepressOUTPUT/mds/' + html_file_name + '.md');
                    let mdContent = fs.readFileSync(mdFilePath, 'utf8');//.split('\n');
var l = [];
                    // Remove the first line and the last two lines
                    mdContent = mdContent.replaceAll("position:absolute;","");//.slice(1, -2);
//for each line
for (let line of mdContent.split('\n')) {
    //if line start with 零、壹、貳、參、肆、伍、陸、柒、捌、玖、拾、念、佰、仟、零、〇、一、二、三、四、五、六、七、八、九、十、廿、百、千、拾、佰、仟、萬、億、兆、京、廿、卅、卌、皕
    if (line.match(/^<span[^<>]+>(零|壹|貳|參|肆|伍|陸|柒|捌|玖|拾|念|佰|仟|零|〇|一|二|三|四|五|六|七|八|九|十|廿|百|千|拾|佰|仟|萬|億|兆|京|廿|卅|卌|皕)/)&&line.includes('、')) {
        //replace it with #
        line = '## ' + line;
    }
    l.push(line);
}
                    // Write the updated content back to the file
                    fs.writeFileSync(mdFilePath, l.join('\n'), 'utf8');//.join('\n'), 'utf8');
                    resolve();
                });
            });
        }
    });

    await Promise.all(promises);
    res.json({ success: true });
});

export default router;
