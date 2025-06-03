const OneNoteClient = require('../clients/onenoteClient');
const config = require('../../config/config.json');
const fs = require('fs/promises');
const path = require('path');

async function main() {
    const client = new OneNoteClient(config);

    await client.initialize();

    // Check available notebooks to find the notebook ID
    // const notebooks = await client._getNotebooks();
    // console.log('Available notebooks:', notebooks);

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../notebook_data');
    await fs.mkdir(outputDir, { recursive: true });
    
    // // Get sections
    const sections = await client.getSections();
    console.log(`Found ${sections.length} sections in the notebook`);
    
    // // List pages in each section
    for (const section of sections) {
        const sectionInfo = {'section': section, 'pages': []};
        const pages = await client.getPages(section.id, 100);
        console.log(`Found ${pages.length} pages in section ${section.displayName}`);
        
        // Create safe filename from section name
        const safeFileName = section.displayName.replace(/ /g, '_').toLowerCase();
        const filePath = path.join(outputDir, `${safeFileName}.json`);

        // Save to JSON file
        sectionInfo.pages = pages;
        await fs.writeFile(filePath, JSON.stringify(sectionInfo, null, 2));
        console.log(`Saved pages from "${section.displayName}" to ${filePath}`);        
    }
}

main().catch(console.error);