const { Op } = require('sequelize');
const db = require('../database/models');
const { PGSN, bcrypt } = require('../utils');
const { BadRequestException } = require('../helpers');
const { MESSAGES, CONSTANTS } = require('../config');
const { v4: uuidv4 } = require('uuid');
const { genMsterId } = require('../utils/master');

exports.register = async (payload) => {
    payload.id = uuidv4();
    payload.role = payload.role || CONSTANTS.ROLE.USER;
    payload.phone = payload.phone || null;

    if ([CONSTANTS.ROLE.ADMIN, CONSTANTS.ROLE.SUPER_ADMIN].includes(payload.role)) {
        const user = await this.findLastUser(payload.role);
        // NXSU01000000001
        payload.idd = user ? genMsterId('NXSU', '01000000000', user.idd) : genMsterId('NXSU', '01000000000', 'NXSU01000000000');
    }

    if (payload.email) {
        const user = await this.findUserByEmail(payload.email);
        if (user) {
            throw new BadRequestException(MESSAGES.ERROR.EMAIL_ALREADY_EXIST);
        }
    }

    if (payload.phone) {
        const user = await this.findUserByPhoneNumber(payload.phone);
        if (user) {
            throw new BadRequestException(MESSAGES.ERROR.PHONE_NUMBER_ALREADY_EXIST);
        }
    }

    // Check display_name uniqueness if provided
    if (payload.display_name && payload.display_name.trim() !== '') {
        const existingUser = await db.UserModel.findOne({
            where: { display_name: payload.display_name.toLowerCase() },
        });
        if (existingUser) {
            throw new BadRequestException('Display name must be unique');
        }
    } else {
        // Set to null if empty to avoid unique constraint issues
        payload.display_name = null;
    }

    const response = await db.UserModel.create(payload);
    return response;
};

exports.findLastUser = async (role) => {
    const response = await db.UserModel.findOne({
        where: { role },
        attributes: ['id', 'idd'],
        limit: 1,
        order: [['createdAt', 'DESC']],
    });
    return response;
};

exports.findUserByEmail = async (email) => {
    const response = await db.UserModel.findOne({ where: { email: email } });
    return response;
};

exports.findUserByPhoneNumber = async (phone) => {
    const response = await db.UserModel.findOne({ where: { phone: phone } });
    return response;
};

exports.checkDisplayName = async (payload) => {
    payload.display_name = payload.display_name.toLowerCase();

    const response = await db.UserModel.findOne({ where: { display_name: payload.display_name } });
    if (response) return { isCreated: false };

    return { isCreated: true };
};

exports.findUser = async (userId) => {
    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ id: userId, deletedAt: null });

    const response = await db.UserModel.findOne({
        where: findQuery,
        attributes: [
            'id',
            'idd',
            'role',
            'username',
            'display_name',
            'email',
            'countryCode',
            'phone',
            'emergencyContact',
            'gender',
            'status',
            'createdAt',
            'updatedAt',
            'deletedAt',
        ],
    });
    return response;
};

exports.getDashboard = async (query) => {
    let { role } = query;

    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ deletedAt: null });

    if (role) {
        findQuery[Op.and].push({ role: role });
    }

    const activeUsers = await db.UserModel.count({ where: { [Op.and]: [...findQuery[Op.and], { status: 'active' }] } });
    const inActiveUsers = await db.UserModel.count({ where: { [Op.and]: [...findQuery[Op.and], { status: 'inactive' }] } });
    const blockedUsers = await db.UserModel.count({ where: { [Op.and]: [...findQuery[Op.and], { status: 'blocked' }] } });
    const pendingUsers = await db.UserModel.count({ where: { [Op.and]: [...findQuery[Op.and], { status: 'pending' }] } });

    return { activeUsers, inActiveUsers, blockedUsers, pendingUsers };
};

exports.getAllUsers = async (query) => {
    let { page, limit, role } = query;

    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ deletedAt: null });

    if (!page && !limit) {
        page = 1;
        limit = 20;
    } else {
        page = parseInt(page);
        limit = parseInt(limit);
    }

    if (role) {
        findQuery[Op.and].push({ role: role });
    }

    const offset = page === 1 ? 0 : limit * (page - 1);
    const response = await db.UserModel.findAndCountAll({
        where: findQuery,
        attributes: [
            'id',
            'idd',
            'role',
            'username',
            'display_name',
            'email',
            'countryCode',
            'phone',
            'emergencyContact',
            'gender',
            'status',
            'createdAt',
            'updatedAt',
            'deletedAt',
        ],
        offset: offset,
        limit: limit,
        order: [['createdAt', 'DESC']],
        distinct: true,
        col: 'id',
    });

    return PGSN.getPagingData(response, page, limit);
};

exports.getAllUserDropdown = async (query) => {
    let { search, role } = query;

    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ idd: { [Op.ne]: null }, deletedAt: null });

    if (search) {
        findQuery[Op.and].push({
            [Op.or]: [
                {
                    display_name: { [Op.iLike]: `%${search}%` },
                },
                {
                    email: { [Op.iLike]: `%${search}%` },
                },
            ],
        });
    }

    if (role) {
        findQuery[Op.and].push({ role: role.toLowerCase() });
    }

    const response = await db.UserModel.findAll({
        where: findQuery,
        attributes: ['id', 'idd', 'display_name', 'email', 'status', 'role'],
        order: [['createdAt', 'DESC']],
    });
    return response;
};

exports.update = async (id, payload) => {
    if (payload.email) {
        const user = await this.findUserByEmail(payload.email);
        if (user && user.id !== id) {
            throw new BadRequestException(MESSAGES.ERROR.EMAIL_ALREADY_EXIST);
        }
    }
    if (payload.phone) {
        const user = await this.findUserByPhoneNumber(payload.phone);
        if (user && user.id !== id) {
            throw new BadRequestException(MESSAGES.ERROR.PHONE_NUMBER_ALREADY_EXIST);
        }
    }
    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ id, deletedAt: null });
    const response = await db.UserModel.findOne({ where: findQuery });
    if (!response) throw new BadRequestException(MESSAGES.ERROR.USER_NOT_EXIST);
    await db.UserModel.update(payload, {
        where: findQuery,
    });
    return response;
};

exports.changePassword = async (id, payload) => {
    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ id, deletedAt: null });
    const user = await db.UserModel.findOne({ where: findQuery });
    if (!user) throw new BadRequestException(MESSAGES.ERROR.USER_NOT_EXIST);

    const isCurrentPasswordValid = await bcrypt.verifyPassword(payload.currentPassword, user.password);
    if (!isCurrentPasswordValid) throw new BadRequestException('Password does not matched!');

    const hashedNewPassword = await bcrypt.generatePassword(payload.newPassword, 10);
    await db.UserModel.update({ password: hashedNewPassword }, { where: findQuery });

    return user;
};

exports.delete = async (id) => {
    const findQuery = {};
    findQuery[Op.and] = [];
    findQuery[Op.and].push({ id, deletedAt: null });
    const response = await db.UserModel.findOne({ where: findQuery });
    if (!response) throw new BadRequestException(MESSAGES.ERROR.USER_NOT_EXIST);
    await db.UserModel.update(
        { deletedAt: new Date() },
        {
            where: findQuery,
        }
    );
    return response;
};
