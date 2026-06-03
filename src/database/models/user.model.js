const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserModel extends Model {
        static associate() {
            // associations can be defined here
        }
    }

    UserModel.init(
        {
            idd: { type: DataTypes.STRING, allowNull: true, unique: true },
            role: {
                type: DataTypes.STRING,
                defaultValue: 'user',
            },
            username: { type: DataTypes.STRING, allowNull: false, unique: true },
            display_name: { type: DataTypes.STRING, allowNull: true },
            email: { type: DataTypes.STRING, allowNull: false, unique: true },
            password: { type: DataTypes.STRING, allowNull: false },
            countryCode: { type: DataTypes.STRING, allowNull: true },
            phone: { type: DataTypes.STRING, allowNull: true, unique: true },
            emergencyContact: { type: DataTypes.STRING, allowNull: true },
            phoneVerification: { type: DataTypes.BOOLEAN, defaultValue: false },
            emailVerification: { type: DataTypes.BOOLEAN, defaultValue: false },
            isBlock: { type: DataTypes.BOOLEAN, defaultValue: false },
            gender: { type: DataTypes.ENUM('male', 'female', 'other'), defaultValue: 'male' },
            status: { type: DataTypes.STRING, defaultValue: 'pending' },
        },
        {
            sequelize,
            modelName: UserModel.name,
            tableName: 'users',
            paranoid: true,
            timestamps: true,
        }
    );

    return UserModel;
};
