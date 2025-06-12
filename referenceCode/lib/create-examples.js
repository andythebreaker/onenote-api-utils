import request from 'request';
//import _ from 'underscore';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createHash } from 'crypto';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import _ from 'lodash';
import logger from './logger.js';
import downloadImg from './download-img.js';
import { JSDOM } from 'jsdom';
import ENV from './envar.js';

// Setup common root (path)
const __currentpath = fileURLToPath(import.meta.url);
const __currentdir = path.dirname(__currentpath);
const __rootdir = path.join(__currentdir, '..');

// Setup database
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { cache: [] });

// Common OneNote API root
const api_root = 'https://www.onenote.com/api/v1.0/me/notes/notebooks'

// Initialize database
async function initDB() {
    await db.read();

    // Set default data if file is empty
    db.data ||= { cache: [] };

    await db.write();
}

async function findUser(id) {
    await db.read();
    const uuu = _.find(db.data.cache, { id });
    return uuu ? { found: true, jn: uuu.jn } : { found: false };
}

async function upsertUser(id, jn) {
    await db.read();

    // Find existing user
    let user = _.find(db.data.cache, { id });

    if (user) {
        // If user exists, update
        _.assign(user, { jn: jn });
        console.log('User updated:', user);
    } else {
        // If user doesn't exist, add
        user = { id: id, jn };
        db.data.cache.push(user);
        logger.info('User added:', JSON.stringify(user));
    }

    await db.write();
}

(async () => {
    await initDB();
})();

// Create directory for data and cache
const dataRoot = path.join(__rootdir, 'data');
const cacheRoot = path.join(dataRoot, 'cache');
fs.mkdirSync(dataRoot, { recursive: true })
fs.mkdirSync(cacheRoot, { recursive: true })

const imgHashTableFile = path.join(dataRoot, `imgHash.json`);
if (!fs.existsSync(imgHashTableFile)) {
    logger.info('Init hash table');
    fs.writeFileSync(imgHashTableFile, JSON.stringify([]));
}
let imgHashTable;
try {
    const fileContent = fs.readFileSync(imgHashTableFile, 'utf8');
    imgHashTable = JSON.parse(fileContent);
} catch (error) {
    logger.error('Error reading or parsing imgHash.json:', error);
    imgHashTable = [];
}

const updateCache = (cacheFile, data) => {
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2))
}

const updateImgHash = (imgHash) => {
    const checkHs = imgHashTable.find(e => e.id === imgHash.id);
    if (checkHs === undefined) {
        imgHashTable.push(imgHash);
        fs.writeFileSync(imgHashTableFile, JSON.stringify(imgHashTable, null, 2));
    }
}

var getImgPathByUrl = (imgUrl) => {
    const imgId = createHash('sha256').update(imgUrl).digest('hex');
    const checkHs = imgHashTable.find(e => e.id === imgId);
    if (checkHs === undefined) {
        console.log('Error getting image path');
        return null;
    } else{
        return checkHs.path;
    }
}

// Create directory for assets and images
const assetsRoot = path.join(__rootdir, 'assets');
const imgRoot = path.join(assetsRoot, 'images');
fs.mkdirSync(assetsRoot, { recursive: true })
fs.mkdirSync(imgRoot, { recursive: true })

var APIOptConstructor = function(url, accessToken){
    return {
        url: url,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
};

var CreateExamples = function () {

    this.x = function getNotebookJson(accessToken, callback) {
        logger.info('getNotebookJson');
        const url = 'https://www.onenote.com/api/v1.0/notebooks/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c';
        const options = {
            url: url,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }
        };

        request.get(options, (error, response, body) => {
            if (error) {
                return callback(error);
            }
            if (response.statusCode !== 200) {
                //logger.info(response);
                //return callback(new Error('Failed to get notebook JSON: ' + response.statusCode));
                return callback({ "@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks/$entity", "id": "0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c", "self": "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c", "createdTime": "2025-01-26T12:27:14Z", "name": "國考中文醫學知識網站架設計畫", "createdBy": "Lee Chia-Ju", "lastModifiedBy": "Lee Chia-Ju", "lastModifiedTime": "2025-01-26T12:27:14Z", "isDefault": false, "userRole": "Contributor", "isShared": true, "sectionsUrl": "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c/sections", "sectionGroupsUrl": "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c/sectionGroups", "links": { "oneNoteClientUrl": { "href": "onenote:https://d.docs.live.net/56ce32fba64785ca/%e6%96%87%e4%bb%b6/%e5%9c%8b%e8%80%83%e4%b8%ad%e6%96%87%e9%86%ab%e5%ad%b8%e7%9f%a5%e8%ad%98%e7%b6%b2%e7%ab%99%e6%9e%b6%e8%a8%ad%e8%a8%88%e7%95%ab" }, "oneNoteWebUrl": { "href": "https://onedrive.live.com/redir.aspx?cid=56ce32fba64785ca&amp;page=edit&amp;resid=56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c&amp;parId=56CE32FBA64785CA!s1c31845129c941aba531cb2f0c10f189" } } });
            }
            try {
                const json = JSON.parse(body);
                callback(json);
            } catch (parseError) {
                callback(parseError);
            }
        });
    }

    this.y = function getNotebookJson(accessToken, uri, callback) {
        console.log(uri);
        const url = uri;
        const options = {
            url: url,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }
        };

        request.get(options, (error, response, body) => {
            if (error) {
                return callback(error);
            }
//if response !== 200
            if (response.statusCode !== 200) {
//use cache
                findUser(createHash('sha256').update(uri).digest('hex'))
                .then((uuu) => {
                    if (uuu.found) {
                        callback(uuu.jn);
                    } else {
                        callback({ shit_: {topic:"cache not found","log":body}, shit: "json"});
                }});
            }else{
                try {
                    const json = JSON.parse(body);
                    upsertUser(createHash('sha256').update(uri).digest('hex'), { shit_: json, shit: "json" }).then(() => {
                        callback({ shit_:json, shit: "json" });
                    });
    
                } catch (parseError) {
                    upsertUser(createHash('sha256').update(uri).digest('hex'), { shit_: body, shit: "html" }).then(() => {
                        callback({ shit_: body, shit: "html" });
                    });
                }
            }

        });
    }

    this.getNotebookContent = function (accessToken, notebookId, callback) {
        logger.info('getNotebookContent')

        // Check existance of the images director with given notebookID
        const imgDir = path.join(imgRoot, notebookId);
        fs.mkdirSync(imgDir, { recursive: true })
        
        // Check existance of cache with given notebookID
        const cacheFile = path.join(cacheRoot, `${notebookId}.json`);
        
        // If ENV.USE_CACHE and cache exists, then load data from cache
        if (ENV.USE_CACHE && fs.existsSync(cacheFile)) {
            logger.info('Returning cached content for notebook:', notebookId);
            const cacheData = fs.readFileSync(cacheFile);
            return callback(null, JSON.parse(cacheData));
        }

        const url = `${api_root}/${notebookId}/sections`;
        const options = APIOptConstructor(url, accessToken);

        request.get(options, (error, response, body) => {
            if (error) {
                logger.error('Error fetching sections:', error);
                return callback(error);
            }
            if (response.statusCode !== 200) {
                logger.error('Failed to get notebook sections: ' + response.statusCode)
                return callback(new Error('Failed to get notebook sections: ' + response.statusCode));
            }
            try {
                const sections = JSON.parse(body).value;
                const sectionCollection = [];
                const failLoadedPages = [];
                let completedSections = 0;
                
                logger.info(JSON.stringify(sections));
                sections.forEach((section) => {
                    const sectionOptions = APIOptConstructor(section.pagesUrl, accessToken);

                    request.get(sectionOptions, (sectionError, sectionResponse, sectionBody) => {
                        if (sectionError) {
                            logger.error('sectionError');
                            return callback(sectionError);
                        }
                        if (sectionResponse.statusCode !== 200) {
                            logger.error(`Failed to get section ${section.pagesUrl}(Code: ${sectionResponse.statusCode})`);
                            return callback(new Error('Failed to get section pages: ' + sectionResponse.statusCode));
                        }
                        try {
                            const pages = JSON.parse(sectionBody).value;
                            const pageCollection = [];
                            let completedPages = 0;
                            
                            logger.info(JSON.stringify(pages));
                            pages.forEach((page) => {
                                const pageOptions = APIOptConstructor(page.contentUrl, accessToken);
                                request.get(pageOptions, (pageError, pageResponse, pageBody) => {
                                    if (pageError) {
                                        logger.error('pageError');
                                        return callback(pageError);
                                    }
                                    if (pageResponse.statusCode !== 200) {
                                        logger.warn(`Failed to get page ${page.contentUrl}(Code: ${pageResponse.statusCode})`);
                                        const failLoadedPage = {
                                            page: page,
                                            errorCode: pageResponse.statusCode
                                        };
                                        failLoadedPages.push(failLoadedPage);
                                        // return callback(new Error('Failed to get page content: ' + pageResponse.statusCode));
                                    }

                                    // Check if any image is in the page and download it
                                    const dom = new JSDOM(pageBody);
                                    const imgElements = dom.window.document.querySelectorAll('img');
                                    imgElements.forEach((img, index) => {
                                        const imgUrl = img.src;
                                        const imgId = createHash('sha256').update(imgUrl).digest('hex');
                                        const imgName = `${section.name}_${page.title}_${index}.jpg`.replace(/[/|\\|\s]/g, '_');
                                        // console.log(imgName);
                                        const imgFilePath = path.join(imgDir, imgName);

                                        if (!fs.existsSync(imgFilePath)) {
                                            downloadImg(accessToken, imgUrl, imgFilePath, (err, fileName) => {
                                                if (err) {
                                                    logger.error('Error downloading image:', err);
                                                } else {
                                                    logger.info('Image downloaded: ' + fileName);
                                                }
                                            });
                                        };
                                        // Replace the src attribute with the local path
                                        img.src = path.join(`/assets/images/${notebookId}`, imgName);
                                        // Update imgHash table
                                        updateImgHash({id: imgId, path: img.src});
                                    });

                                    // Update pageBody with the new img src paths
                                    pageBody = dom.serialize();
                                    
                                    const pageContent = {
                                        pageInfo: page,
                                        pageBody: pageBody
                                    }
                                    pageCollection.push(pageContent);

                                    completedPages++;
                                    if (completedPages === pages.length) {
                                        const sectionContent = {
                                            sectionInfo: section,
                                            sectionPages: pageCollection,
                                            failedPages: failLoadedPages
                                        };
                                        sectionCollection.push(sectionContent);
                                        completedSections++;
                                        if (completedSections === sections.length) {
                                            logger.info('All sections and pages fetched successfully');

                                            // Update cache
                                            updateCache(cacheFile, sectionCollection);

                                            callback(null, sectionCollection);
                                        }
                                    }
                                });
                            });
                        } catch (parseError) {
                            logger.error('Error parsing section body:', parseError);
                            return callback(parseError);
                        }
                    });
                });
            } catch (parseError) {
                logger.error('Error parsing sections\' content:', parseError);
                callback(parseError);
            }
        });
    }
};
export default new CreateExamples();
export  { getImgPathByUrl };