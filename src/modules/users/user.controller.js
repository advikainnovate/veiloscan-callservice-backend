const { sendServiceResponse } = require('../../helpers');
const userService = require('./user.service');

exports.register = async (req, res, next) => {
    try {
        const { body } = req;
        const response = await userService.register(body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { body } = req;
        const response = await userService.login(body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { body } = req;
        const response = await userService.createUser(body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.profile = async (req, res, next) => {
    try {
        const { user } = req;
        const response = await userService.profile(user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.checkDisplayName = async (req, res, next) => {
    try {
        const { body } = req;
        const response = await userService.checkDisplayName(body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getDashboard = async (req, res, next) => {
    try {
        const { query } = req;
        const response = await userService.getDashboard(query);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { query } = req;
        const response = await userService.getAllUsers(query);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getAllUserDropdown = async (req, res, next) => {
    try {
        const { query } = req;
        const response = await userService.getAllUserDropdown(query);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.findUser = async (req, res, next) => {
    try {
        const { params } = req;
        const response = await userService.findUser(params.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { params, body } = req;
        const response = await userService.changePassword(params.id, body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { params, body } = req;
        const response = await userService.updateUser(params.id, body);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { params } = req;
        const response = await userService.deleteUser(params.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};
