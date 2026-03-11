const fs = require('fs');
const path = require('path');

// Create a dummy image file
const dummyImagePath = path.join(__dirname, 'dummy.jpg');
fs.writeFileSync(dummyImagePath, Buffer.alloc(1024, 'dummy image data'));

async function testFlow() {
    try {
        console.log('Testing Upload User Image...');
        let formDataUser = new FormData();
        // Using a simple blob approach that works with native fetch FormData
        formDataUser.append('image', new Blob([fs.readFileSync(dummyImagePath)], { type: 'image/jpeg' }), 'dummy.jpg');
        formDataUser.append('type', 'front');
        formDataUser.append('userId', 'mock-user-123');

        let res = await fetch('http://localhost:5001/upload/user-image', {
            method: 'POST',
            body: formDataUser
        });
        let userData = await res.json();
        console.log('User image upload result:', userData);

        console.log('\nTesting Upload Clothing Image...');
        let formDataClothing = new FormData();
        formDataClothing.append('image', new Blob([fs.readFileSync(dummyImagePath)], { type: 'image/jpeg' }), 'dummy.jpg');
        formDataClothing.append('source', 'gallery');
        formDataClothing.append('userId', 'mock-user-123');

        res = await fetch('http://localhost:5001/upload/clothing-image', {
            method: 'POST',
            body: formDataClothing
        });
        let clothingData = await res.json();
        console.log('Clothing image upload result:', clothingData);

        console.log('\nTesting Try-On Generation...');
        res = await fetch('http://localhost:5001/generate-tryon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'mock-user-123',
                clothingImageId: clothingData.id,
                personImageId: userData.id
            })
        });
        let tryonData = await res.json();
        console.log('Try-On generation result:', tryonData);

        console.log('\nTesting Fetch Result...');
        res = await fetch(`http://localhost:5001/generate-tryon/${tryonData.id}`);
        let finalResult = await res.json();
        console.log('Final Result:', finalResult);

    } catch (err) {
        console.error('Error during testing:', err);
    } finally {
        if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
    }
}

testFlow();
