// MOCKED DB FOR TESTING
module.exports = {
  query: async (text, params) => {
    console.log('Mock DB Query:', text, params);
    if (text.includes('INSERT INTO UserImages')) {
      return { rows: [{ id: 'mock-user-img-' + Date.now(), user_id: params[0], image_url: params[1], type: params[2] }] };
    }
    if (text.includes('INSERT INTO ClothingImages')) {
      return { rows: [{ id: 'mock-cloth-img-' + Date.now(), user_id: params[0], image_url: params[1], source: params[2] }] };
    }
    if (text.includes('INSERT INTO Users')) {
      return { rows: [{ id: 'mock-id', email: params[0] || 'test@example.com' }] };
    }
    if (text.includes('SELECT * FROM Users')) {
      return { rows: [] };
    }
    if (text.includes('SELECT image_url FROM ClothingImages') || text.includes('SELECT image_url FROM UserImages')) {
      return { rows: [{ image_url: 'https://storage.placeholder.com/mock-image.jpg' }] };
    }
    if (text.includes('INSERT INTO TryOnResults')) {
      return { rows: [{ id: 'mock-result-' + Date.now() }] };
    }
    if (text.includes('SELECT * FROM TryOnResults WHERE id =')) {
      return {
        rows: [{
          id: params[0],
          user_id: 'mock-user',
          clothing_image: 'https://storage.placeholder.com/mock-cloth.jpg',
          person_image: 'https://storage.placeholder.com/mock-person.jpg',
          generated_image: 'https://storage.placeholder.com/generated-tryon.jpg'
        }]
      };
    }
    return { rows: [] };
  },
};
