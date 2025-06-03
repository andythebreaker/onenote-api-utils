const OneNoteClient = require('../clients/onenoteClient');
const config = require('../../config/config.json');

async function main() {
    const client = new OneNoteClient(config);

    await client.initialize();

    // Check available notebooks to find the notebook ID
    const notebooks = await client._getNotebooks();
    console.log('Available notebooks:', notebooks);
}

main().catch(console.error);