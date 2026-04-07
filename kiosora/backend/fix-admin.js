const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    const admins = await mongoose.connection.collection('admins').find({}).toArray();
    console.log('Admin count:', admins.length);
    console.log('Admins:', JSON.stringify(admins, null, 2));
    process.exit();
}).catch(err => console.log('Error:', err.message));