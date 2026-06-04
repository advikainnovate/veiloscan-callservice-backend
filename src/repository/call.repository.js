const { Op } = require('sequelize');
const db = require('../database/models');

const activeStatuses = ['initiated', 'ringing', 'connected'];

exports.create = async (payload) => db.CallSessionModel.create(payload);

exports.findById = async (id) =>
    db.CallSessionModel.findOne({
        where: { id },
        include: [
            { model: db.UserModel, as: 'caller', attributes: ['id', 'username', 'display_name', 'email'] },
            { model: db.UserModel, as: 'receiver', attributes: ['id', 'username', 'display_name', 'email'] },
        ],
    });

exports.findExistingActiveCall = async ({ callerId = null, guestId = null, receiverId, qrId }) => {
    const actorQuery = callerId ? { callerId } : { guestId };

    return db.CallSessionModel.findOne({
        where: {
            receiverId,
            qrId,
            ...actorQuery,
            status: { [Op.in]: activeStatuses },
        },
        order: [['initiatedAt', 'DESC']],
    });
};

exports.update = async (id, payload) => {
    await db.CallSessionModel.update(payload, { where: { id } });
    return this.findById(id);
};

exports.getHistory = async ({ userId, guestId, limit = 50 }) => {
    const where = guestId
        ? { guestId }
        : {
              [Op.or]: [{ callerId: userId }, { receiverId: userId }],
          };

    return db.CallSessionModel.findAll({
        where,
        include: [
            { model: db.UserModel, as: 'caller', attributes: ['id', 'username', 'display_name', 'email'] },
            { model: db.UserModel, as: 'receiver', attributes: ['id', 'username', 'display_name', 'email'] },
        ],
        limit,
        order: [['initiatedAt', 'DESC']],
    });
};

exports.getActiveCalls = async ({ userId, guestId }) => {
    const actorQuery = guestId
        ? { guestId }
        : {
              [Op.or]: [{ callerId: userId }, { receiverId: userId }],
          };

    return db.CallSessionModel.findAll({
        where: {
            ...actorQuery,
            status: { [Op.in]: activeStatuses },
        },
        order: [['initiatedAt', 'DESC']],
    });
};

exports.getDailyCallCount = async (receiverId) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return db.CallSessionModel.count({
        where: {
            receiverId,
            startedAt: { [Op.gte]: startOfDay },
        },
    });
};
