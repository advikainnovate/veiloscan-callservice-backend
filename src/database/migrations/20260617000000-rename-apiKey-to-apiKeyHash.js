'use strict';
const crypto = require('crypto');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Describe current table to check existing columns
        const tableDesc = await queryInterface.describeTable('api_keys');
        // Add new column if it does not exist
        if (!tableDesc['apiKeyHash']) {
            await queryInterface.addColumn('api_keys', 'apiKeyHash', {
                type: Sequelize.STRING(255),
                allowNull: false,
                defaultValue: '',
            });
        }
        // Copy and hash existing apiKey values into apiKeyHash if column was added
        if (!tableDesc['apiKeyHash'] && tableDesc['apiKey']) {
            const [rows] = await queryInterface.sequelize.query('SELECT id, "apiKey" FROM api_keys WHERE "apiKey" IS NOT NULL');
            for (const row of rows) {
                const raw = row.apiKey;
                const hash = crypto.createHash('sha256').update(raw).digest('hex');
                await queryInterface.sequelize.query('UPDATE api_keys SET "apiKeyHash" = :hash WHERE id = :id', {
                    replacements: { hash, id: row.id },
                });
            }
        }
        // Remove old unique index if present
        try {
            await queryInterface.removeIndex('api_keys', 'api_keys_apiKey_unique');
        } catch (e) {}
        // Remove old column if it exists
        if (tableDesc['apiKey']) {
            await queryInterface.removeColumn('api_keys', 'apiKey');
        }
        // Add unique index on apiKeyHash
        try {
            await queryInterface.addIndex('api_keys', ['apiKeyHash'], {
                unique: true,
                name: 'api_keys_apiKeyHash_unique',
            });
        } catch (e) {
            // ignore if index already exists
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Recreate old column if missing
        const tableDesc = await queryInterface.describeTable('api_keys');
        if (!tableDesc['apiKey']) {
            await queryInterface.addColumn('api_keys', 'apiKey', {
                type: Sequelize.STRING(255),
                allowNull: false,
                defaultValue: '',
            });
        }
        // Copy back apiKeyHash values into apiKey (note: original raw keys cannot be recovered)
        const [rows] = await queryInterface.sequelize.query('SELECT id, "apiKeyHash" FROM api_keys WHERE "apiKeyHash" IS NOT NULL');
        for (const row of rows) {
            await queryInterface.sequelize.query('UPDATE api_keys SET "apiKey" = :val WHERE id = :id', {
                replacements: { val: row.apiKeyHash, id: row.id },
            });
        }
        // Remove index on apiKeyHash
        try {
            try {
            await queryInterface.removeIndex('api_keys', 'api_keys_apiKeyHash_unique');
        } catch (e) {
            // ignore if index does not exist
        }
        } catch (e) {}
        // Remove apiKeyHash column if it exists
        if (tableDesc['apiKeyHash']) {
            await queryInterface.removeColumn('api_keys', 'apiKeyHash');
        }
        // Recreate old index on apiKey
        await queryInterface.addIndex('api_keys', ['apiKey'], {
            unique: true,
            name: 'api_keys_apiKey_unique',
        });
    },
};
