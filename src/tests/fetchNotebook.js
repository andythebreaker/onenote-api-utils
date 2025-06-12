const OneNoteClient = require('../clients/onenoteClient');
const config = require('../config');
const fs = require('fs/promises');
const path = require('path');

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
        
        // Get sections
        const sections = await client.getSections();
        console.log(`[${getTimestamp()}] Found ${sections.length} sections`);
        
        // List pages in each section
        for (const section of sections) {
            const sectionInfo = {'section': section, 'pages': []};
            const pages = await client.getPages(section.id);
            console.log(`[${getTimestamp()}] Found ${pages.length} pages in section "${section.displayName}"`);
            
            // Create safe filename from section name
            const safeFileName = section.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filePath = path.join(outputDir, `${safeFileName}.json`);

            // Save to JSON file
            sectionInfo.pages = pages;
            await fs.writeFile(filePath, JSON.stringify(sectionInfo, null, 2));
            console.log(`[${getTimestamp()}] Saved pages from "${section.displayName}" to ${filePath}`);        
        }
        
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
