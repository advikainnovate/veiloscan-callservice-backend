const { HTTP_CODES, MESSAGES, CONSTANTS } = require('../../config');
const { serviceResponse, NotFoundException, BadRequestException } = require('../../helpers');
const { bcrypt, jwt } = require('../../utils');
const userRepository = require('../../repository/user.repository');

exports.register = async (payload) => {
    try {
        const user = await userRepository.findUserByEmail(payload.email);
        if (user) {
            throw new BadRequestException(MESSAGES.ERROR.EMAIL_ALREADY_EXIST);
        }

        payload.username = payload.username || payload.email;
        payload.display_name = payload.display_name || payload.username;
        payload.role = CONSTANTS.ROLE.USER;
        payload.phone = payload.phone || null;
        payload.emergencyContact = payload.emergencyContact || null;
        payload.gender = payload.gender ? payload.gender.toLowerCase() : 'male';
        payload.status = CONSTANTS.USER_STATUS.ACTIVE;
        payload.password = await bcrypt.generatePassword(payload.password);
        const response = await userRepository.register(payload);

        const jwtPayload = {
            id: response.id,
            email: response.email,
            role: response.role,
        };

        const accessToken = jwt.generateAccessToken(jwtPayload);
        const refreshToken = jwt.generateRefreshToken(jwtPayload);

        return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.CREATED, {
            id: response.id,
            idd: response.idd,
            role: response.role,
            username: response.username,
            display_name: response.display_name,
            email: response.email,
            countryCode: response.countryCode,
            phone: response.phone,
            emergencyContact: response.emergencyContact,
            gender: response.gender,
            status: response.status,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.log(error.message);
        throw error;
    }
};

exports.login = async (payload) => {
    const user = await userRepository.findUserByEmail(payload.email);
    if (!user) {
        throw new BadRequestException(MESSAGES.ERROR.INVALID_USER);
    }

    const validPassword = await bcrypt.verifyPassword(payload.password, user.password);
    if (!validPassword) {
        throw new BadRequestException(MESSAGES.ERROR.INVALID_USER);
    }

    if (user.isBlock) {
        throw new BadRequestException(MESSAGES.ERROR.BLOCKED);
    }

    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.generateAccessToken(jwtPayload);
    const refreshToken = jwt.generateRefreshToken(jwtPayload);

    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.LOGIN, {
        id: user.id,
        idd: user.idd,
        role: user.role,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        countryCode: user.countryCode,
        phone: user.phone,
        emergencyContact: user.emergencyContact,
        gender: user.gender,
        status: user.status,
        accessToken,
        refreshToken,
    });
};

exports.createUser = async (payload) => {
    payload.role = payload.role || CONSTANTS.ROLE.USER;
    payload.username = payload.username || payload.email;
    payload.display_name = payload.display_name || payload.username;
    payload.phone = payload.phone || null;
    payload.emergencyContact = payload.emergencyContact || null;
    payload.gender = payload.gender ? payload.gender.toLowerCase() : 'male';
    payload.status = CONSTANTS.USER_STATUS.ACTIVE;
    payload.password = await bcrypt.generatePassword(payload.password);
    const response = await userRepository.register(payload);
    return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.CREATED, {
        id: response.id,
        idd: response.idd,
        role: response.role,
        username: response.username,
        display_name: response.display_name,
        email: response.email,
        countryCode: response.countryCode,
        phone: response.phone,
        emergencyContact: response.emergencyContact,
        gender: response.gender,
        status: response.status,
    });
};

exports.profile = async (userId) => {
    const response = await userRepository.findUser(userId);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.checkDisplayName = async (payload) => {
    const response = await userRepository.checkDisplayName(payload);
    return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.OK, response);
};

exports.getDashboard = async (query) => {
    const response = await userRepository.getDashboard(query);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.getAllUsers = async (query) => {
    const response = await userRepository.getAllUsers(query);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.getAllUserDropdown = async (query) => {
    const response = await userRepository.getAllUserDropdown(query);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.findUser = async (userId) => {
    const response = await userRepository.findUser(userId);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.changePassword = async (id, payload) => {
    const response = await userRepository.changePassword(id, payload);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, response);
};

exports.updateUser = async (id, payload) => {
    const response = await userRepository.update(id, payload);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.OK, response);
};

exports.deleteUser = async (id) => {
    const response = await userRepository.delete(id);
    if (!response) {
        throw new NotFoundException(MESSAGES.ERROR.USER_NOT_EXIST);
    }
    return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.OK, response);
};
