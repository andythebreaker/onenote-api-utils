const { PublicClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

class OneNoteClient {
    constructor(config = {}) {
        this.config = {
            notebookId: config.notebookId || process.env.ONENOTE_NOTEBOOK_ID,
            clientId: config.clientId || process.env.ONENOTE_CLIENT_ID,
            tenantId: config.tenantId || process.env.ONENOTE_TENANT_ID,
        };
        if (!this.config.clientId) {
            throw new Error('ONENOTE_CLIENT_ID environment variable is required');
        }
        this.pca = new PublicClientApplication({
            auth: {
                clientId: this.config.clientId,
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
        this.tokenResponse = null;
    }

    async initialize() {
        // Device code flow for authentication
        const deviceCodeRequest = {
            scopes: ['User.Read', 'Notes.Read', 'Notes.ReadWrite', 'offline_access'],
            deviceCodeCallback: async (response) => {
                console.log('\n=== Authentication Required ===');
                console.log(`1. Visit: ${response.verificationUri}`);
                console.log(`2. Enter code: ${response.userCode}`);
                console.log('Waiting for authentication...');
            }
        };

        try {
            console.log('Requesting authentication token...');
            this.tokenResponse = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
            
            if (!this.tokenResponse || !this.tokenResponse.accessToken) {
                throw new Error('No access token received');
            }

            console.log('Token acquired successfully');
            
            // Initialize Graph Client with our custom auth provider
            this.graphClient = Client.init({
                authProvider: async (done) => {
                    try {
                        // Get a fresh token if needed
                        const token = await this.getAccessToken();
                        done(null, token);
                    } catch (error) {
                        done(error, null);
                    }
                }
            });
            
            return true;
        } catch (error) {
            console.error('Network/Authentication error:', {
                name: error.name,
                message: error.message,
                errorCode: error.errorCode
            });
            throw error;
        }
    }

    async getAccessToken() {
        try {
            // Check if we have a valid token
            if (this.tokenResponse && this.tokenResponse.expiresOn > new Date()) {
                return this.tokenResponse.accessToken;
            }
            
            // Get a fresh token using silent authentication
            console.log('Token expired, refreshing...');
            
            const silentRequest = {
                account: this.tokenResponse.account,
                scopes: ['User.Read', 'Notes.Read', 'Notes.ReadWrite', 'offline_access'],
            };
            
            this.tokenResponse = await this.pca.acquireTokenSilent(silentRequest);
            console.log('Token refreshed successfully');
            
            return this.tokenResponse.accessToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
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
        // Enforce Graph API page size limits (0-100)
        if (pageSize < 0 || pageSize > 100) {
            throw new Error('pageSize must be between 0 and 100');
        }

        let skip = 0;
        let allPages = [];

        while (true) {
            try {
                const response = await this.graphClient
                    .api(`/me/onenote/sections/${sectionId}/pages`)
                    .query({ $top: pageSize, $skip: skip })
                    .get();

                const pages = response.value;

                if (!pages || pages.length === 0) {
                    break;
                }

                allPages = allPages.concat(pages);

                if (pages.length < pageSize) {
                    break; // all pages retrieved
                }

                skip += pageSize;
            } catch (error) {
                console.error('Error fetching section pages:', error);
                throw error;
            }
        }

        return allPages;
    }

    async getPageContent(pageId) {
        try {
            const content = await this.graphClient
                .api(`/me/onenote/pages/${pageId}/content`)
                .header('Accept', 'text/html')
                .responseType('text')
                .get();
            return content;
        } catch (error) {
            console.error('Error fetching page content:', error);
            throw error;
        }
    }
}

module.exports = OneNoteClient;
