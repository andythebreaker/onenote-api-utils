const { PublicClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

class OneNoteClient {
    constructor(config) {
        this.config = config;
        this.pca = new PublicClientApplication({
            auth: {
                clientId: config.clientId,
                authority: `https://login.microsoftonline.com/common`,
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: "Info"
                }
            }
        });
    }

    async initialize() {
        // Device code flow for authentication
        const deviceCodeRequest = {
            scopes: ['User.Read', 'Notes.Read', 'Notes.ReadWrite'],
            deviceCodeCallback: async (response) => {
                console.log('\n=== Authentication Required ===');
                console.log(`1. Visit: ${response.verificationUri}`);
                console.log(`2. Enter code: ${response.userCode}`);
                console.log('Waiting for authentication...');
            }
        };

        try {
            console.log('Requesting authentication token...');
            const response = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
            
            if (!response || !response.accessToken) {
                throw new Error('No access token received');
            }

            console.log('Token acquired successfully');

            this.graphClient = Client.init({
                authProvider: (done) => {
                    done(null, response.accessToken);
                }
            });
        } catch (error) {
            console.error('Network/Authentication error:', {
                name: error.name,
                message: error.message,
                errorCode: error.errorCode
            });
            throw error;
        }
    }

    async _getNotebooks() {
        try {
            const notebooks = await this.graphClient
                .api('/me/onenote/notebooks')
                .get();
            return notebooks.value;
        } catch (error) {
            console.error('Error fetching notebooks:', error);
            throw error;
        }
    }

    async getSections() {
        try {
            const sections = await this.graphClient
                .api(`/me/onenote/notebooks/${this.config.notebookId}/sections`)
                .get();
            return sections.value;
        } catch (error) {
            console.error('Error fetching sections:', error);
            throw error;
        }
    }

    async getSectionGroups() {
        try {
            const sectionGroups = await this.graphClient
                .api(`/me/onenote/notebooks/${this.config.notebookId}/sectionGroups`)
                .get();
            return sectionGroups.value;
        } catch (error) {
            console.error('Error fetching section groups:', error);
            throw error;
        }
    }

    async getPages(sectionId, pageSize = 20) {
        // 每次請求的頁面數量上限為100
        if (pageSize < 0 || pageSize > 100) {
            throw new Error("pageSize must be between 0 and 100");
        }
        
        let skip = 0;
        let allPages = [];

        while (true) {
            try {
                const response = await this.graphClient
                    .api(`/me/onenote/sections/${sectionId}/pages`)
                    .query({ $top: pageSize, $skip: skip })
                    .get();
                const pages =  response.value;

                if (!pages || pages.length === 0) {
                    break;
                }

                allPages = allPages.concat(pages);
                if (pages.length < pageSize) {
                    // 已取得所有頁面
                    break;
                }

                skip += pageSize;

            } catch (error) {
                console.error('Error fetching section pages:', error);
                throw error;
            }
        }

        return allPages;
    }
}

module.exports = OneNoteClient;