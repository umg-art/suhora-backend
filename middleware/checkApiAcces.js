const API_ACCESS_KEY = process.env.API_ACCESS_KEY

// Middleware to check API Access Key
const checkApiAccessKey = (req, res, next) => {
    const apiKey = req.headers['api-access-key'];  // Get the key from the request header

    if (!apiKey || apiKey !== API_ACCESS_KEY) {
        return res.status(403).json({ success: false, message: 'Invalid or missing API access key' });
    }

    // If the key is valid, continue to the next middleware or route
    next();
};


module.exports = {
    checkApiAccessKey
}