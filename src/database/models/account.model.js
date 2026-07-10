const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Account extends Model {
        static associate(models) {
            Account.hasMany(models.AccountApiKey, { foreignKey: 'accountId', as: 'apiKeys' });
            Account.hasMany(models.CallRequest, { foreignKey: 'accountId', as: 'callRequests' });
            Account.hasMany(models.ChatRequest, { foreignKey: 'accountId', as: 'chatRequests' });
        }
    }

    Account.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            idd: { type: DataTypes.STRING, allowNull: true, unique: true },
            userId: { type: DataTypes.UUID, allowNull: false },
            societyId: { type: DataTypes.UUID, allowNull: true },
            remark: { type: DataTypes.STRING, allowNull: true },
            status: { type: DataTypes.ENUM('active', 'inactive', 'pending', 'hold', 'blocked'), defaultValue: 'pending' },
            deletedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: 'Account',
            tableName: 'accounts',
            paranoid: true,
            timestamps: true,
        }
    );

    return Account;
};
