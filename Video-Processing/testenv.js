// envTest.js
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DO_BUCKET_NAME =', process.env.DO_BUCKET_NAME);