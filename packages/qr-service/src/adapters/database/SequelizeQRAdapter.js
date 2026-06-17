const { Op } = require('sequelize');
const IQRDatabaseAdapter = require('./IQRDatabaseAdapter');

/**
 * Sequelize Database Adapter for QR Service
 * Implements IQRDatabaseAdapter using Sequelize ORM
 */
class SequelizeQRAdapter extends IQRDatabaseAdapter {
    constructor(sequelizeModels) {
        super();
        if (!sequelizeModels) {
            throw new Error('Sequelize models object is required');
        }
        this.models = sequelizeModels;
    }

    async createQRCode(payload) {
        return this.models.QrCodeModel.create(payload);
    }

    async createBatch(payload) {
        return this.models.QrBatchModel.create(payload);
    }

    async findQRCodeById(id) {
        return this.models.QrCodeModel.findOne({ where: { id } });
    }

    async findQRCodeByToken(token) {
        return this.models.QrCodeModel.findOne({ where: { token } });
    }

    async findQRCodeByHumanToken(humanToken) {
        return this.models.QrCodeModel.findOne({ where: { humanToken } });
    }

    async findQRCodesByUserId(userId) {
        return this.models.QrCodeModel.findAll({
            where: { assignedUserId: userId },
            order: [['createdAt', 'DESC']],
        });
    }

    async findUnassignedQRCodes(limit = 50, cursor = null) {
        const where = { status: 'unassigned' };

        if (cursor) {
            try {
                const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
                const [cursorTime, cursorId] = decodedCursor.split(':');

                if (cursorTime && cursorId) {
                    const cursorDate = new Date(cursorTime);
                    where[Op.or] = [
                        { createdAt: { [Op.lt]: cursorDate } },
                        {
                            createdAt: cursorDate,
                            id: { [Op.lt]: cursorId },
                        },
                    ];
                }
            } catch (error) {
                // Ignore malformed cursors
            }
        }

        return this.models.QrCodeModel.findAll({
            where,
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
            ],
            limit,
        });
    }

    async findBatchesByDateRange(startDate, endDate) {
        return this.models.QrBatchModel.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate,
                },
            },
            attributes: ['batchNumber'],
            order: [['createdAt', 'DESC']],
        });
    }

    async findBatchById(id) {
        return this.models.QrBatchModel.findOne({ where: { id } });
    }

    async updateQRCode(qrCodeId, updates) {
        await this.models.QrCodeModel.update(updates, {
            where: { id: qrCodeId },
        });
        return this.findQRCodeById(qrCodeId);
    }

    async updateBatch(batchId, updates) {
        await this.models.QrBatchModel.update(updates, {
            where: { id: batchId },
        });
        return this.findBatchById(batchId);
    }
}

module.exports = SequelizeQRAdapter;
