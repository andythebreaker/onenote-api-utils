# OneNote API Utils

A utility for automatically fetching OneNote data at regular intervals.

## Features

- Authenticate with Microsoft Graph API using device code flow
- Automatically refresh authentication tokens
- Fetch OneNote notebook sections and pages
- Save data as JSON files
- Automatically poll for updates every 5 minutes
- No user interaction required after initial authentication

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your OneNote settings in `config/config.json`:
   ```json
   {
     "notebookId": "your-notebook-id",
     "clientId": "your-client-id",
     "tenantId": "your-tenant-id"
   }
   ```

## Usage

Run the client test script:

```
node src/tests/client_test.js
```

The first time you run the program:
1. You'll be prompted to visit a URL and enter a code
2. After authentication, the program will fetch your OneNote data
3. The program will continue running, automatically fetching data every 5 minutes
4. Data is saved to JSON files in the `src/notebook_data` directory

To stop the program, press `Ctrl+C`.

## How It Works

- The program uses MSAL.js with the device code flow for initial authentication
- It requests the `offline_access` scope to obtain refresh tokens
- MSAL internally manages refreshing tokens when they expire
- The program maintains a persistent connection to the Microsoft Graph API
- Every 5 minutes, it automatically fetches the latest data from your notebook

## Requirements

- Node.js 14 or later
- Microsoft 365 account with OneNote access
- Registered Azure AD application with appropriate permissions