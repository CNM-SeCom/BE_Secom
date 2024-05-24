const corsOptions = {
    origin: '*', // Cho phép tất cả các nguồn
    optionSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức HTTP cho phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
    credentials: true,
    preflightContinue: true,
};

module.exports = { corsOptions }