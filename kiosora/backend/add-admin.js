const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/siembre_kiosk').then(async () => {
    const hash = await bcrypt.hash('panergayo14', 10);
    await mongoose.connection.collection('admins').insertOne({
        username: 'sn_admin',
        email: 'snpanergayo@gbox.ncf.edu.ph',
        password: hash
    });
    console.log('Admin created!');
    process.exit();
}).catch(err => {
    console.log('Error:', err.message);
    process.exit();
});