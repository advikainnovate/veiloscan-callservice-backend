const { Op, fn, col, literal } = require('sequelize');
const db = require('../../database/models');

exports.createQRCode = async (payload) => db.QrCodeModel.create(payload);

exports.createBatch = async (payload) => db.QrBatchModel.create(payload);

exports.findBatchById = async (id) => db.QrBatchModel.findOne({ where: { id } });

exports.findBatchesForDay = async (startOfDay, nextDayStart) =>
    db.QrBatchModel.findAll({
        where: { createdAt: { [Op.gte]: startOfDay, [Op.lt]: nextDayStart } },
        attributes: ['batchNumber'],
        order: [['createdAt', 'DESC']],
    });

exports.findByToken = async (token) => db.QrCodeModel.findOne({ where: { token } });

exports.findByHumanToken = async (humanToken) => db.QrCodeModel.findOne({ where: { humanToken } });

exports.findById = async (id) => db.QrCodeModel.findOne({ where: { id } });

exports.findUserQRCodes = async (assignedUserId) => db.QrCodeModel.findAll({ where: { assignedUserId } });

exports.findActiveOrDisabledByUser = async (assignedUserId) =>
    db.QrCodeModel.findOne({
        where: {
            assignedUserId,
            status: { [Op.in]: ['active', 'disabled'] },
        },
    });

exports.assignQRCode = async (qrCodeId, userId) => {
    await db.QrCodeModel.update(
        {
            assignedUserId: userId,
            status: 'active',
            assignedAt: new Date(),
        },
        { where: { id: qrCodeId } }
    );
    return this.findById(qrCodeId);
};

exports.updateQRCode = async (qrCodeId, payload, where = {}) => {
    await db.QrCodeModel.update(payload, { where: { id: qrCodeId, ...where } });
    return this.findById(qrCodeId);
};

exports.getUnassignedQRCodes = async (limit = 50, cursor) => {
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
            // Ignore malformed cursors and return the first page.
        }
    }

    return db.QrCodeModel.findAll({
        where,
        order: [
            ['createdAt', 'DESC'],
            ['id', 'DESC'],
        ],
        limit: limit + 1,
    });
};

exports.getBatchSummary = async (batchId) =>
    db.QrCodeModel.findOne({
        where: { batchId },
        attributes: [
            [fn('count', col('id')), 'total'],
            [literal('count(case when "assignedUserId" is not null then 1 end)'), 'assigned'],
        ],
        raw: true,
    });
