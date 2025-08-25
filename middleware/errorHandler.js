import { constants } from '../constants.js';

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode == 200? 500: res.statusCode;

    let title;
    switch (statusCode) {
        case constants.VALIDATION_ERROR:
            title = "Validation Error";
            break;
        case constants.UNAUTHORIZED:
            title = "Unauthorized";
            break;
        case constants.FORBIDDEN:
            title = "Forbidden";
            break;
        case constants.NOT_FOUND:
            title = "Not Found";
            break;
        case constants.SERVER_ERROR:
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