const jwt      = require('jsonwebtoken');
const { CONFIG } = require('../../config');
const adminRepo  = require('../../repository/admin.repository');

// ── Auth ──────────────────────────────────────────────────────────────────────

const login = (username, password) => {
    if (
        username !== CONFIG.APP.ADMIN_USERNAME ||
        password !== CONFIG.APP.ADMIN_PASSWORD
    ) {
        throw new Error('Invalid admin credentials');
    }

    const token = jwt.sign(
        { role: 'admin', username },
        CONFIG.JWT.ACCESS_TOKEN_SECRET,
        { expiresIn: CONFIG.JWT.ACCESS_TOKEN_TIME }
    );

    return { token, expiresIn: CONFIG.JWT.ACCESS_TOKEN_TIME };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const getOverview          = ()       => adminRepo.getOverview();
const getUsageByOrg        = (opts)   => adminRepo.getUsageByOrganization(opts);
const getApiKeyActivity    = (opts)   => adminRepo.getApiKeyActivity(opts);

// ── Organizations ─────────────────────────────────────────────────────────────

const listOrganizations    = (opts)   => adminRepo.getAllOrganizations(opts);
const getOrganization      = (id)     => adminRepo.getOrganizationDetail(id);
const setOrganizationActive = (id, v) => adminRepo.toggleOrganizationActive(id, v);

// ── Calls ─────────────────────────────────────────────────────────────────────

const getCallStats         = (opts)   => adminRepo.getCallStats(opts);
const getCallsOverTime     = (opts)   => adminRepo.getCallsOverTime(opts);
const getRecentCalls       = (opts)   => adminRepo.getRecentCalls(opts);

// ── Chat ──────────────────────────────────────────────────────────────────────

const getChatStats         = (opts)   => adminRepo.getChatStats(opts);
const getMessagesOverTime  = (opts)   => adminRepo.getMessagesOverTime(opts);

module.exports = {
    login,
    getOverview,
    getUsageByOrg,
    getApiKeyActivity,
    listOrganizations,
    getOrganization,
    setOrganizationActive,
    getCallStats,
    getCallsOverTime,
    getRecentCalls,
    getChatStats,
    getMessagesOverTime,
};
