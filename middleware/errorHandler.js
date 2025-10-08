import { STATUS_CODES } from '../constants.js';

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode == STATUS_CODES.OK ? STATUS_CODES.INTERNAL_SERVER_ERROR : res.statusCode;

    let title;
    switch (statusCode) {
        case STATUS_CODES.VALIDATION_ERROR:
            title = "Validation Error";
            break;
        case STATUS_CODES.UNAUTHORIZED:
            title = "Unauthorized";
            break;
        case STATUS_CODES.FORBIDDEN:
            title = "Forbidden";
            break;
        case STATUS_CODES.NOT_FOUND:
            title = "Not Found";
            break;
        case STATUS_CODES.INTERNAL_SERVER_ERROR:
            title = "Server Error";
            break;
        default:
            title = "Error";
            break;
    }

    res.status(statusCode).json({
        title,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
}

export default errorHandler;