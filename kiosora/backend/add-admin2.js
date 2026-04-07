const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/siembre_kiosk').then(async () => {
    const hash = await bcrypt.hash('kiosora@26!', 10);
    await mongoose.connection.collection('admins').insertOne({
        username: 'kiosora26',
        email: 'siembrekiosk6@gmail.com',
        password: hash
    });
    console.log('Admin created!');
    process.exit();
}).catch(err => {
    console.log('Error:', err.message);
    process.exit();
});