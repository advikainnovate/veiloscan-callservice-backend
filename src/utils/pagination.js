const { PGSN } = require('pgsn');

exports.getPagingData = (data, page, limit) => {
    const { count: totalItems, rows } = data;
    return PGSN.getPagingData({ rows: rows, totalItems, page, limit });
};

exports.paginate = async (Model, options = {}, query = {}) => {
    let { page, limit } = query;

    if (page === undefined && limit === undefined) {
        return await Model.findAll(options);
    }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = page === 1 ? 0 : limit * (page - 1);

    const paginatedOptions = {
        ...options,
        limit,
        offset,
    };

    const response = await Model.findAndCountAll(paginatedOptions);
    const { count: totalItems, rows } = response;
    return PGSN.getPagingData({ rows, totalItems, page, limit });
};
