const corsOptions = {
    origin: 'http://localhost:5173',
    optionSuccessStatus: 200,
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
    credentials: true,
    preflightContinue: true,
}

module.exports = { corsOptions }