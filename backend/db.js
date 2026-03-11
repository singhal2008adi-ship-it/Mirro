const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    Users: [],
    UserImages: [],
    ClothingImages: [],
    TryOnResults: []
  }, null, 2));
}

const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDB = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

module.exports = {
  query: async (text, params) => {
    console.log('Query:', text, params);
    const db = getDB();

    if (text.includes('INSERT INTO UserImages')) {
      const newImg = { id: 'user-img-' + Date.now(), user_id: params[0], image_url: params[1], type: params[2], created_at: new Date() };
      db.UserImages.push(newImg);
      saveDB(db);
      return { rows: [newImg] };
    }

    if (text.includes('INSERT INTO ClothingImages')) {
      const newImg = { id: 'cloth-img-' + Date.now(), user_id: params[0], image_url: params[1], source: params[2], created_at: new Date() };
      db.ClothingImages.push(newImg);
      saveDB(db);
      return { rows: [newImg] };
    }

    if (text.includes('SELECT image_url, product_name FROM ClothingImages WHERE id = $1')) {
      const img = db.ClothingImages.find(i => i.id === params[0]);
      return { rows: img ? [img] : [] };
    }

    if (text.includes('SELECT image_url FROM UserImages WHERE id = $1')) {
      const img = db.UserImages.find(i => i.id === params[0]);
      return { rows: img ? [img] : [] };
    }

    if (text.includes('INSERT INTO TryOnResults')) {
      const newResult = {
        id: 'result-' + Date.now(),
        user_id: params[0],
        clothing_image: params[1],
        person_image: params[2],
        generated_image: params[3],
        product_name: params[4],
        created_at: new Date()
      };
      db.TryOnResults.push(newResult);
      saveDB(db);
      return { rows: [newResult] };
    }

    if (text.includes('SELECT * FROM TryOnResults WHERE id =')) {
      const result = db.TryOnResults.find(r => r.id === params[0]);
      return { rows: result ? [result] : [] };
    }

    return { rows: [] };
  },
};
