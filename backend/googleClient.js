const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

let auth;
try {
  auth = new JWT({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
} catch (error) {
  console.warn('Google Service Account key file missing or invalid. Set up service-account.json in the backend directory.');
}

const getSheetsClient = async (sheetId) => {
  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  return doc;
};

const getDriveClient = () => {
  return google.drive({ version: 'v3', auth });
};

module.exports = {
  auth,
  getSheetsClient,
  getDriveClient,
};
