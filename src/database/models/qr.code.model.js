const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class QrCodeModel extends Model {
        static associate(models) {
            QrCodeModel.belongsTo(models.UserModel, {
                as: 'assignedUser',
                foreignKey: 'assignedUserId',
            });
            QrCodeModel.belongsTo(models.QrBatchModel, {
                as: 'batch',
                foreignKey: 'batchId',
            });
        }
    }

    QrCodeModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            humanToken: { type: DataTypes.STRING(20), allowNull: false, unique: true },
            assignedUserId: { type: DataTypes.UUID, allowNull: true },
            batchId: { type: DataTypes.UUID, allowNull: true },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'unassigned',
            },
            assignedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: QrCodeModel.name,
            tableName: 'qr_codes',
            timestamps: true,
            updatedAt: false,
        }
    );

    return QrCodeModel;
};
