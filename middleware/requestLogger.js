const requestLogger = (req, res, next) => {
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl;
    const timeStamp = new Date().toISOString();

    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${timeStamp} | ${method} ${url} | ${res.statusCode} | ${duration}ms`);
    });

    next();
};

export default requestLogger;