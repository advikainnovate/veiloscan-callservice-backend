const { PreconditionException } = require('../helpers');

const options = {
    basic: {
        abortEarly: false,
        convert: true,
    },
    array: {
        abortEarly: false,
        convert: true,
    },
};

module.exports = (schema) => (req, res, next) => {
    Object.keys(schema).forEach((key) => {
        const validationOptions = Array.isArray(req[key]) ? options.array : options.basic;
        const { value, error } = schema[key].validate(req[key], validationOptions);
        if (error) {
            console.log(error);
            const message = error.details[0].message || 'Invalid Inputs';
            throw new PreconditionException(message);
        }
        req[key] = value;
    });
    next();
};
