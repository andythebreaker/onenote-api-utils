const required = ['ONENOTE_CLIENT_ID'];
for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`Environment variable ${k} is required`);
  }
}
module.exports = {
  notebookId: process.env.ONENOTE_NOTEBOOK_ID,
  clientId: process.env.ONENOTE_CLIENT_ID,
  tenantId: process.env.ONENOTE_TENANT_ID,
};
