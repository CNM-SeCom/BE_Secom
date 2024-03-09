require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const mobileRouter = require('./src/routes/mobile');


const configViewEngine = require('./src/config/viewEngine');

const app = express();
const PORT = 3000;

configViewEngine(app);
app.use('/', mobileRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
