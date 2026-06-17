const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Organization = sequelize.define(
        'Organization',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },

            callRequestsCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            chatRequestsCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: 'organizations',
            timestamps: true,
        }
    );

    return Organization;
};
