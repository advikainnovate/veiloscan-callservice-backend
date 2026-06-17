const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ApiKey = sequelize.define(
        'ApiKey',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            organizationId: {
                type: DataTypes.UUID,
                allowNull: false,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            apiKeyHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },

            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },

            lastUsedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'api_keys',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['apiKeyHash'],
                },
                {
                    fields: ['organizationId'],
                },
            ],
        }
    );

    return ApiKey;
};
