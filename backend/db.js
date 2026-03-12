const { getSheetsClient } = require('./googleClient');
require('dotenv').config();

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const query = async (text, params) => {
  console.log('Query:', text, params);
  
  if (!SPREADSHEET_ID) {
    console.warn('GOOGLE_SHEET_ID not set in environment. Falling back to empty response.');
    return { rows: [] };
  }

  try {
    const doc = await getSheetsClient(SPREADSHEET_ID);

    if (text.includes('INSERT INTO UserImages')) {
      const sheet = doc.sheetsByTitle['UserImages'];
      const id = 'user-img-' + Date.now();
      const row = {
        id,
        user_id: params[0],
        image_url: params[1],
        type: params[2],
        created_at: new Date().toISOString()
      };
      await sheet.addRow(row);
      return { rows: [row] };
    }

    if (text.includes('INSERT INTO ClothingImages')) {
      const sheet = doc.sheetsByTitle['ClothingImages'];
      const id = 'cloth-img-' + Date.now();
      const row = {
        id,
        user_id: params[0],
        image_url: params[1],
        source: params[2],
        created_at: new Date().toISOString()
      };
      await sheet.addRow(row);
      return { rows: [row] };
    }

    if (text.includes('SELECT image_url, product_name FROM ClothingImages WHERE id = $1')) {
      const sheet = doc.sheetsByTitle['ClothingImages'];
      const rows = await sheet.getRows();
      const img = rows.find(r => r.get('id') === params[0]);
      return { rows: img ? [{ image_url: img.get('image_url'), product_name: img.get('source') }] : [] };
    }

    if (text.includes('SELECT image_url FROM UserImages WHERE id = $1')) {
      const sheet = doc.sheetsByTitle['UserImages'];
      const rows = await sheet.getRows();
      const img = rows.find(r => r.get('id') === params[0]);
      return { rows: img ? [{ image_url: img.get('image_url') }] : [] };
    }

    if (text.includes('INSERT INTO TryOnResults')) {
      const sheet = doc.sheetsByTitle['TryOnResults'];
      const id = 'result-' + Date.now();
      const row = {
        id,
        user_id: params[0],
        clothing_image: params[1],
        person_image: params[2],
        generated_image: params[3],
        product_name: params[4],
        created_at: new Date().toISOString()
      };
      await sheet.addRow(row);
      return { rows: [row] };
    }

    if (text.includes('SELECT * FROM TryOnResults WHERE id =')) {
      const sheet = doc.sheetsByTitle['TryOnResults'];
      const rows = await sheet.getRows();
      const result = rows.find(r => r.get('id') === params[0]);
      return { rows: result ? [result.toObject()] : [] };
    }
    
    // Auth specific (New: Store login data)
    if (text.includes('INSERT INTO Users')) {
       const sheet = doc.sheetsByTitle['Users'];
       const row = {
         id: 'user-' + Date.now(),
         email: params[0],
         password_hash: params[1],
         created_at: new Date().toISOString()
       };
       await sheet.addRow(row);
       return { rows: [row] };
    }
    
    if (text.includes('SELECT * FROM Users WHERE email =')) {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(r => r.get('email') === params[0]);
        return { rows: user ? [user.toObject()] : [] };
    }

    return { rows: [] };
  } catch (error) {
    console.error('Google Sheets Error:', error.message);
    return { rows: [] };
  }
};

module.exports = { query };
