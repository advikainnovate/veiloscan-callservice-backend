const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class QrBatchModel extends Model {
        static associate(models) {
            QrBatchModel.belongsTo(models.UserModel, {
                as: 'creator',
                foreignKey: 'createdBy',
            });
            QrBatchModel.hasMany(models.QrCodeModel, {
                as: 'qrCodes',
                foreignKey: 'batchId',
            });
        }
    }

    QrBatchModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            batchNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
            purpose: { type: DataTypes.STRING(20), allowNull: false },
            status: { type: DataTypes.STRING(30), allowNull: false },
            quantity: { type: DataTypes.INTEGER, allowNull: false },
            createdBy: { type: DataTypes.UUID, allowNull: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            printJobRef: { type: DataTypes.STRING(100), allowNull: true },
            distributedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: QrBatchModel.name,
            tableName: 'qr_batches',
            timestamps: true,
        }
    );

    return QrBatchModel;
};
