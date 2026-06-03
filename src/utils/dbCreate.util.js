/**
 * Database Creation Utility Script
 *
 * Runs the Sequelize CLI command to create the database.
 *
 * How config is resolved:
 * 1. The Sequelize CLI reads '.sequelizerc' from the project root.
 * 2. It points to 'src/config/database.js'.
 * 3. Connection variables and the database name are loaded directly from the '.env' file.
 *
 * Behavior:
 * Intercepts the error if the database already exists, printing a skip message
 * and exiting with code 0 (success) to keep automation pipelines green.
 */
const { exec } = require('child_process');

exec('npx sequelize-cli db:create', (error, stdout, stderr) => {
    if (error) {
        const message = (stderr || error.message || '').toLowerCase();
        if (message.includes('already exists') || message.includes('exist')) {
            console.log('Database already exists. Skipping creation...');
            process.exit(0);
        }
        console.error('Failed to create database:', stderr || error.message);
        process.exit(1);
    }
    console.log('Database created successfully.');
    process.exit(0);
});
