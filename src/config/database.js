const { CONFIG } = require('.');

module.exports = {
    development: {
        username: CONFIG.DB.DB_USERNAME,
        password: CONFIG.DB.DB_PASSWORD,
        database: CONFIG.DB.DB_NAME,
        host: '127.0.0.1',
        port: 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: { ssl: false },
    },
    test: {
        username: CONFIG.DB.DB_USERNAME,
        password: CONFIG.DB.DB_PASSWORD,
        database: CONFIG.DB.DB_NAME,
        host: CONFIG.DB.DB_HOST,
        dialect: CONFIG.DB.DB_DIALECT,
        port: CONFIG.DB.DB_PORT,
        logging: false,
        dialectOptions: {
            ssl: false,
        },
    },
    production: {
        username: CONFIG.DB.DB_USERNAME,
        password: CONFIG.DB.DB_PASSWORD,
        database: CONFIG.DB.DB_NAME,
        host: CONFIG.DB.DB_HOST,
        dialect: CONFIG.DB.DB_DIALECT,
        port: CONFIG.DB.DB_PORT,
        logging: false,
        dialectOptions: {
            ssl: false,
        },
    },
};
