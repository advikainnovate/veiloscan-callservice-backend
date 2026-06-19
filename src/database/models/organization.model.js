const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class OrganizationModel extends Model {
        static associate(models) {
            OrganizationModel.hasMany(models.ApiKey, {
                foreignKey: 'organizationId',
                as: 'apiKeys',
            });
        }
    }

    OrganizationModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            name: { type: DataTypes.STRING, allowNull: false },
            isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            callRequestsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            chatRequestsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        },
        {
            sequelize,
            modelName: 'Organization',
            tableName: 'organizations',
            paranoid: false,
            timestamps: true,
        }
    );

    return OrganizationModel;
};
