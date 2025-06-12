const OneNoteClient = require('../clients/onenoteClient');
const config = require('../config');
const fs = require('fs/promises');
const path = require('path');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');

// Helper function to sleep for a specified number of milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format current date and time for logging
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
}

async function fetchAndSaveData(client) {
    try {
        console.log(`\n[${getTimestamp()}] Fetching data...`);

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '../notebook_data');
        await fs.mkdir(outputDir, { recursive: true });

        const assetsDir = path.join(__dirname, '../assets/images', client.config.notebookId);
        await fs.mkdir(assetsDir, { recursive: true });

        const imgHashPath = path.join(__dirname, '../notebook_data/imgHash.json');
        let imgHash = [];
        try {
            const d = await fs.readFile(imgHashPath, 'utf8');
            imgHash = JSON.parse(d);
        } catch (e) {
            imgHash = [];
        }

        const updateImgHash = async (entry) => {
            if (!imgHash.find(h => h.id === entry.id)) {
                imgHash.push(entry);
                await fs.writeFile(imgHashPath, JSON.stringify(imgHash, null, 2));
            }
        };

        // Get sections
        const sections = await client.getSections();
        console.log(`[${getTimestamp()}] Found ${sections.length} sections`);

        const notebookData = [];

        for (const section of sections) {
            const sectionContent = { sectionInfo: section, sectionPages: [] };
            const pages = await client.getPages(section.id);
            console.log(`[${getTimestamp()}] Found ${pages.length} pages in section "${section.displayName}"`);

            for (const page of pages) {
                try {
                    let pageBody = await client.getPageContent(page.id);
                    const dom = new JSDOM(pageBody);
                    const images = dom.window.document.querySelectorAll('img');

                    const downloads = [];

                    images.forEach((img, index) => {
                        const src = img.src;
                        const id = crypto.createHash('sha256').update(src).digest('hex');
                        const safeName = `${section.displayName}_${page.title}_${index}`.replace(/[/\\\s]/g, '_') + '.jpg';
                        const filePath = path.join(assetsDir, safeName);

                        // download if not exists
                        const download = async () => {
                            try {
                                await fs.access(filePath);
                            } catch {
                                const buffer = await client.graphClient.api(src).responseType('arraybuffer').get();
                                await fs.writeFile(filePath, Buffer.from(buffer));
                            }
                        };

                        downloads.push(download());

                        const localPath = path.join('/assets/images', client.config.notebookId, safeName);
                        img.src = localPath;
                        updateImgHash({ id, path: localPath });
                    });

                    await Promise.all(downloads);

                    pageBody = dom.serialize();
                    sectionContent.sectionPages.push({ pageInfo: page, pageBody });
                } catch (err) {
                    console.error(`[${getTimestamp()}] Failed to fetch page content:`, err.message);
                }
            }

            notebookData.push(sectionContent);
        }

        const cacheFile = path.join(outputDir, `${client.config.notebookId}.json`);
        await fs.writeFile(cacheFile, JSON.stringify(notebookData, null, 2));
        console.log(`[${getTimestamp()}] Saved notebook cache to ${cacheFile}`);

        console.log(`[${getTimestamp()}] Data fetch completed successfully`);
        return true;
    } catch (error) {
        console.error(`[${getTimestamp()}] Error fetching data:`, error.message);
        return false;
    }
}

async function main() {
    console.log(`[${getTimestamp()}] OneNote API utility starting...`);

    // Parse command line argument for interval minutes
    let intervalMin = 5;
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--min' && i + 1 < args.length) {
            intervalMin = parseInt(args[i + 1], 10);
            i++;
        } else if (arg.startsWith('--min=')) {
            intervalMin = parseInt(arg.split('=')[1], 10);
        } else if (/^\d+$/.test(arg)) {
            intervalMin = parseInt(arg, 10);
        }
    }

    if (!Number.isFinite(intervalMin) || intervalMin < 0) {
        console.log(`[${getTimestamp()}] Invalid min value, defaulting to 5`);
        intervalMin = 5;
    }

    try {
        // Initialize the client and authenticate
        const client = new OneNoteClient(config);
        await client.initialize();
        console.log(`[${getTimestamp()}] Authentication successful`);

        // Initial data fetch
        await fetchAndSaveData(client);

        if (intervalMin === 0) {
            console.log(`[${getTimestamp()}] min set to 0 - fetch once and exit`);
            return;
        }

        // Enter loop to fetch data periodically
        console.log(`\n[${getTimestamp()}] Entering polling loop - will fetch data every ${intervalMin} minutes`);
        console.log(`[${getTimestamp()}] Press Ctrl+C to stop the process`);

        while (true) {
            const nextFetchTime = new Date(Date.now() + intervalMin * 60 * 1000);
            console.log(`\n[${getTimestamp()}] Next fetch scheduled at ${nextFetchTime.toLocaleTimeString()}`);

            await sleep(intervalMin * 60 * 1000);

            await fetchAndSaveData(client);
        }
    } catch (error) {
        console.error(`[${getTimestamp()}] Fatal error:`, error);
    }
}

// Start the main function
main().catch(error => {
    console.error(`[${getTimestamp()}] Unhandled error:`, error);
    process.exit(1);
});
