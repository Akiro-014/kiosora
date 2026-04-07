const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use the Atlas connection string directly
const ATLAS_URI = 'mongodb://kiosora:siembre2026@ac-s0q6gmn-shard-00-00.zaseehi.mongodb.net:27017,ac-s0q6gmn-shard-00-01.zaseehi.mongodb.net:27017,ac-s0q6gmn-shard-00-02.zaseehi.mongodb.net:27017/siembre_kiosk?ssl=true&replicaSet=atlas-3qu350-shard-0&authSource=admin&appName=kiosora';

mongoose.connect(ATLAS_URI).then(async () => {
    console.log('✅ Connected to Atlas');

    const hash = await bcrypt.hash('siembre2026', 10);

    await mongoose.connection.collection('admins').deleteMany({ username: 'kiosora26 ' });

    await mongoose.connection.collection('admins').insertOne({
        username: 'kiosora26',
        email: 'siembrekiosk@gmail.com',
        password: hash,
        createdAt: new Date()
    });

    console.log('✅ Admin created in Atlas!');
    console.log('   Username: kiosora26');
    console.log('   Email: siembrekiosk@gmail.com');
    console.log('   Password: siembre2026');
    process.exit(0);

}).catch(err => {
    console.log('❌ Error:', err.message);
    process.exit(1);
});