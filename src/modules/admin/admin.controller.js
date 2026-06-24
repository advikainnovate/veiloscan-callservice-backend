const adminService = require('./admin.service');

// ── Auth ──────────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'username and password required' });
        }
        const result = adminService.login(username, password);
        return res.json({ success: true, data: result });
    } catch (err) {
        return res.status(401).json({ success: false, message: err.message });
    }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const getOverview = async (req, res, next) => {
    try {
        const data = await adminService.getOverview();
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getUsageByOrg = async (req, res, next) => {
    try {
        const { page, limit, from, to } = req.query;
        const data = await adminService.getUsageByOrg({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            from, to,
        });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getApiKeyActivity = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const data = await adminService.getApiKeyActivity({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
        });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

// ── Organizations ─────────────────────────────────────────────────────────────

const listOrganizations = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const data = await adminService.listOrganizations({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search: search || '',
        });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getOrganization = async (req, res, next) => {
    try {
        const data = await adminService.getOrganization(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: 'Organization not found' });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const activateOrganization = async (req, res, next) => {
    try {
        const data = await adminService.setOrganizationActive(req.params.id, true);
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const deactivateOrganization = async (req, res, next) => {
    try {
        const data = await adminService.setOrganizationActive(req.params.id, false);
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

// ── Call Analytics ────────────────────────────────────────────────────────────

const getCallStats = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const data = await adminService.getCallStats({ from, to });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getCallsOverTime = async (req, res, next) => {
    try {
        const { from, to, interval } = req.query;
        const data = await adminService.getCallsOverTime({ from, to, interval });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getRecentCalls = async (req, res, next) => {
    try {
        const { page, limit, status, from, to } = req.query;
        const data = await adminService.getRecentCalls({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            status, from, to,
        });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

// ── Chat Analytics ────────────────────────────────────────────────────────────

const getChatStats = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const data = await adminService.getChatStats({ from, to });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

const getMessagesOverTime = async (req, res, next) => {
    try {
        const { from, to, interval } = req.query;
        const data = await adminService.getMessagesOverTime({ from, to, interval });
        return res.json({ success: true, data });
    } catch (err) { next(err); }
};

module.exports = {
    login,
    getOverview,
    getUsageByOrg,
    getApiKeyActivity,
    listOrganizations,
    getOrganization,
    activateOrganization,
    deactivateOrganization,
    getCallStats,
    getCallsOverTime,
    getRecentCalls,
    getChatStats,
    getMessagesOverTime,
};
