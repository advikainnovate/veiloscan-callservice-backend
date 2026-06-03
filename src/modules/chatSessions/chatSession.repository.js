const { Op } = require('sequelize');
const db = require('../../database/models');

const participantIncludes = [
    { model: db.UserModel, as: 'participant1', attributes: ['id', 'username', 'display_name', 'email'] },
    { model: db.UserModel, as: 'participant2', attributes: ['id', 'username', 'display_name', 'email'] },
];

exports.create = async (payload) => db.ChatSessionModel.create(payload);

exports.findById = async (id) =>
    db.ChatSessionModel.findOne({
        where: { id },
        include: participantIncludes,
    });

exports.findByParticipants = async (user1Id, user2Id) =>
    db.ChatSessionModel.findOne({
        where: {
            [Op.or]: [
                { participant1Id: user1Id, participant2Id: user2Id },
                { participant1Id: user2Id, participant2Id: user1Id },
            ],
        },
        order: [['createdAt', 'DESC']],
    });

exports.findUserChatSessions = async (userId, limit = 50, activeOnly = false) => {
    const where = {
        [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
    };

    if (activeOnly) {
        where.status = 'active';
    }

    return db.ChatSessionModel.findAll({
        where,
        include: participantIncludes,
        order: [
            ['lastMessageAt', 'DESC'],
            ['createdAt', 'DESC'],
        ],
        limit,
    });
};

exports.update = async (id, payload) => {
    await db.ChatSessionModel.update(payload, { where: { id } });
    return this.findById(id);
};

exports.closeExpired = async (expirationCutoff) =>
    db.ChatSessionModel.update(
        {
            status: 'ended',
            endedAt: new Date(),
        },
        {
            where: {
                status: 'active',
                startedAt: { [Op.lt]: expirationCutoff },
            },
        }
    );

exports.countActiveByUser = async (userId) =>
    db.ChatSessionModel.count({
        where: {
            status: 'active',
            [Op.or]: [{ participant1Id: userId }, { participant2Id: userId }],
        },
    });
