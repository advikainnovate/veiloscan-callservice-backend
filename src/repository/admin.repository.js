const { Op, fn, col } = require('sequelize');
const db = require('../database/models');

// ── Helpers ───────────────────────────────────────────────────────────────────

const dateRange = (from, to) => {
    const where = {};
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt[Op.gte] = new Date(from);
        if (to)   where.createdAt[Op.lte] = new Date(to);
    }
    return where;
};

// ── Organizations ─────────────────────────────────────────────────────────────

const getAllOrganizations = async ({ page = 1, limit = 20, search = '' } = {}) => {
    const offset = (page - 1) * limit;
    const where  = search ? { name: { [Op.iLike]: `%${search}%` } } : {};
    return db.Organization.findAndCountAll({
        where,
        include: [{ model: db.ApiKey, as: 'apiKeys', attributes: ['id', 'name', 'isActive', 'lastUsedAt'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
};

const getOrganizationDetail = async (id) => {
    return db.Organization.findByPk(id, {
        include: [{ model: db.ApiKey, as: 'apiKeys', attributes: { exclude: ['apiKeyHash'] } }],
    });
};

const toggleOrganizationActive = async (id, isActive) => {
    await db.Organization.update({ isActive }, { where: { id } });
    return db.Organization.findByPk(id);
};

// ── Dashboard Overview ────────────────────────────────────────────────────────

const getOverview = async () => {
    const [
        totalOrgs,
        activeOrgs,
        totalCalls,
        activeCalls,
        totalMessages,
        totalRooms,
        totalApiKeys,
    ] = await Promise.all([
        db.Organization.count(),
        db.Organization.count({ where: { isActive: true } }),
        db.CallSession.count(),
        db.CallSession.count({ where: { status: { [Op.in]: ['connected', 'ringing', 'connecting'] } } }),
        db.ChatMessage.count(),
        db.ChatRoom.count(),
        db.ApiKey.count({ where: { isActive: true } }),
    ]);

    return {
        organizations: { total: totalOrgs, active: activeOrgs, inactive: totalOrgs - activeOrgs },
        calls: { total: totalCalls, active: activeCalls },
        messages: { total: totalMessages },
        rooms: { total: totalRooms },
        apiKeys: { active: totalApiKeys },
    };
};

// ── Call Analytics ────────────────────────────────────────────────────────────

const getCallStats = async ({ from, to, organizationId } = {}) => {
    const where = { ...dateRange(from, to) };

    const [total, byStatus, avgDuration, videoCalls] = await Promise.all([
        db.CallSession.count({ where }),

        db.CallSession.findAll({
            where,
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true,
        }),

        db.CallSession.findOne({
            where: { ...where, durationSeconds: { [Op.not]: null } },
            attributes: [[fn('AVG', col('durationSeconds')), 'avg']],
            raw: true,
        }),

        db.CallSession.count({ where: { ...where, hasVideo: true } }),
    ]);

    return {
        total,
        byStatus: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {}),
        avgDurationSeconds: avgDuration?.avg ? Math.round(parseFloat(avgDuration.avg)) : 0,
        videoCalls,
        audioCalls: total - videoCalls,
    };
};

const getCallsOverTime = async ({ from, to, interval = 'day' } = {}) => {
    const where = dateRange(from, to);
    const VALID_INTERVALS = { hour: 'hour', day: 'day', month: 'month' };
    const trunc = VALID_INTERVALS[interval] || 'day';

    const rows = await db.CallSession.findAll({
        where,
        attributes: [
            [fn('DATE_TRUNC', trunc, col('createdAt')), 'period'],
            [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE_TRUNC', trunc, col('createdAt'))],
        order:  [[fn('DATE_TRUNC', trunc, col('createdAt')), 'ASC']],
        raw: true,
    });

    return rows.map((r) => ({ period: r.period, count: parseInt(r.count) }));
};

const getRecentCalls = async ({ page = 1, limit = 20, status, from, to } = {}) => {
    const where = { ...dateRange(from, to) };
    if (status) where.status = status;

    return db.CallSession.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
    });
};

// ── Chat Analytics ────────────────────────────────────────────────────────────

const getChatStats = async ({ from, to } = {}) => {
    const where = dateRange(from, to);

    const [totalMessages, byStatus, byType, totalRooms, activeRooms] = await Promise.all([
        db.ChatMessage.count({ where }),

        db.ChatMessage.findAll({
            where,
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true,
        }),

        db.ChatMessage.findAll({
            where,
            attributes: ['messageType', [fn('COUNT', col('id')), 'count']],
            group: ['messageType'],
            raw: true,
        }),

        db.ChatRoom.count(),
        db.ChatRoom.count({ where: { status: 'active' } }),
    ]);

    return {
        totalMessages,
        byStatus: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {}),
        byType:   byType.reduce((acc, r) => { acc[r.messageType] = parseInt(r.count); return acc; }, {}),
        rooms: { total: totalRooms, active: activeRooms },
    };
};

const getMessagesOverTime = async ({ from, to, interval = 'day' } = {}) => {
    const where = dateRange(from, to);
    const VALID_INTERVALS = { hour: 'hour', day: 'day', month: 'month' };
    const trunc = VALID_INTERVALS[interval] || 'day';

    const rows = await db.ChatMessage.findAll({
        where,
        attributes: [
            [fn('DATE_TRUNC', trunc, col('createdAt')), 'period'],
            [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE_TRUNC', trunc, col('createdAt'))],
        order:  [[fn('DATE_TRUNC', trunc, col('createdAt')), 'ASC']],
        raw: true,
    });

    return rows.map((r) => ({ period: r.period, count: parseInt(r.count) }));
};

// ── Usage per Organization ────────────────────────────────────────────────────

const getUsageByOrganization = async ({ from, to, page = 1, limit = 20 } = {}) => {
    const where = dateRange(from, to);

    const orgs = await db.Organization.findAll({
        attributes: ['id', 'name', 'isActive', 'callRequestsCount', 'chatRequestsCount', 'createdAt'],
        order: [['callRequestsCount', 'DESC']],
        limit,
        offset: (page - 1) * limit,
    });

    return orgs;
};

// ── API Key Activity ──────────────────────────────────────────────────────────

const getApiKeyActivity = async ({ page = 1, limit = 20 } = {}) => {
    return db.ApiKey.findAndCountAll({
        attributes: { exclude: ['apiKeyHash'] },
        include: [{ model: db.Organization, as: 'organization', attributes: ['id', 'name'] }],
        order: [['lastUsedAt', 'DESC NULLS LAST']],
        limit,
        offset: (page - 1) * limit,
    });
};

module.exports = {
    getAllOrganizations,
    getOrganizationDetail,
    toggleOrganizationActive,
    getOverview,
    getCallStats,
    getCallsOverTime,
    getRecentCalls,
    getChatStats,
    getMessagesOverTime,
    getUsageByOrganization,
    getApiKeyActivity,
};
