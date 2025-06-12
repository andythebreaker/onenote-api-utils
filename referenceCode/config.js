import ENV from './lib/envar.js';
var serverUrl = "";

if (ENV.DEV) {
    serverUrl = `http${ENV.HTTPS ? 's' : ''}://localhost:${ENV.PORT}`;
} else {
    serverUrl = `https://diagmindtw.com/${ENV.PORT}.php`;
}
console.log("Sever run at ", serverUrl);

export default {
    // Live Connect API information
    clientId: ENV.ONENOTE_CLIENT_ID,
    clientSecret: ENV.ONENOTE_CLIENT_SECRET,
    redirectUrl: serverUrl + '/callback',
    serverUrl: serverUrl
};
