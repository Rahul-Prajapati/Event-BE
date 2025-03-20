const errorHandler = (err, req, res, next) => {
    if (req.headersSent) {
        return next(err);
    }
    res.status(500).json({
        message: err.message,
    });
};


module.exports = errorHandler;