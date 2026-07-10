const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AccountApiKey extends Model {
        static associate(models) {
            AccountApiKey.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
        }
    }

    AccountApiKey.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            accountId: { type: DataTypes.UUID, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false },
            apiHashKey: { type: DataTypes.STRING, allowNull: false },
            remark: { type: DataTypes.STRING, allowNull: true },
            status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
            deletedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: 'AccountApiKey',
            tableName: 'account_api_keys',
            paranoid: true,
            timestamps: true,
        }
    );

    return AccountApiKey;
};
