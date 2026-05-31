const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 — fixes ECONNREFUSED on many networks
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
        
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('📚 Collections:', collections.map(c => c.name).join(', ') || 'none yet');
        
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error(`🔍 Error Code: ${error.code || 'N/A'}`);
        console.error(`💡 Tips:`);
        console.error(`   1. Try connecting via mobile hotspot`);
        console.error(`   2. Set DNS to 8.8.8.8 in network settings`);
        console.error(`   3. Check Atlas Network Access allows 0.0.0.0/0`);
        console.error(`   4. Verify MONGODB_URI password is correct`);
        process.exit(1);
    }
};

module.exports = connectDB;