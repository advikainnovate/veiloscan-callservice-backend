const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ApiKeyModel extends Model {
        static associate(models) {
            ApiKeyModel.belongsTo(models.Organization, {
                foreignKey: 'organizationId',
                as: 'organization',
            });
        }
    }

    ApiKeyModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            organizationId: { type: DataTypes.UUID, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false },
            apiKeyHash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            lastUsedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: 'ApiKey',
            tableName: 'api_keys',
            paranoid: false,
            timestamps: true,
            indexes: [
                { unique: true, fields: ['apiKeyHash'] },
                { fields: ['organizationId'] },
            ],
        }
    );

    return ApiKeyModel;
};
