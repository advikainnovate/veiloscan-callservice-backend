require('dotenv').config();
const { Client } = require('pg');

const targetDb = process.env.SERVICE_DB_NAME || 'service_dbin';
const user = process.env.DB_USER || process.env.DB_USERNAME || 'postgres';
const password = process.env.DB_PASSWORD || process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT, 10) || 5432;
const defaultDb = process.env.DB_DEFAULT_DATABASE || 'postgres';

const client = new Client({
    user,
    password,
    host,
    port,
    database: defaultDb,
});

async function main() {
    try {
        await client.connect();
        console.log(`Connected to postgres on ${host}:${port} as ${user}`);

        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [targetDb]
        );

        if (result.rowCount > 0) {
            console.log(`Database '${targetDb}' already exists. Skipping creation.`);
            process.exit(0);
        }

        await client.query(`CREATE DATABASE ${targetDb}`);
        console.log(`Database '${targetDb}' created successfully.`);
        process.exit(0);
    } catch (error) {
        if (error.code === '42P04') {
            console.log(`Database '${targetDb}' already exists. Skipping creation.`);
            process.exit(0);
        }

        console.error('Failed to create database:', error.message || error);
        process.exit(1);
    } finally {
        await client.end().catch(() => {});
    }
}

main();
