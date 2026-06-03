const BadRequestException = require('./badRequest');
const NotFoundException = require('./notFound');
const PreconditionException = require('./precondition');
const UnauthorizedException = require('./unauthorized');
const ForbiddenException = require('./forbidden');
const UnHandledException = require('./unhandled');
const ErrorResponse = require('./errorResponse');

module.exports = {
    BadRequestException,
    NotFoundException,
    PreconditionException,
    UnauthorizedException,
    ForbiddenException,
    UnHandledException,
    ErrorResponse,
};
