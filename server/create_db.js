// const mysql = require('mysql2/promise');
// require('dotenv').config();

// async function createDatabase() {
//     const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

//     console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

//     try {
//         const connection = await mysql.createConnection({
//             host: DB_HOST,
//             user: DB_USER,
//             password: DB_PASSWORD, // This might need handling if it's strictly ""
//             port: DB_PORT || 3306
//         });

//         console.log(`Checking if database '${DB_NAME}' exists...`);
//         await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
//         console.log(`✅ Database '${DB_NAME}' created or already exists.`);

//         await connection.end();
//     } catch (error) {
//         console.error('❌ Error creating database:', error.message);
//         process.exit(1);
//     }
// }

// createDatabase();
