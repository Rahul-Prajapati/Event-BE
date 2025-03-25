const errorHandler = (err, req, res, next) => {
    console.log("ErrorHandler");
    if (req.headersSent) {
        return next(err);
    }
    res.status(500).json({
        message: err.message,
    });
};


module.exports = errorHandler;