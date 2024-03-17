require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const ApiRouter = require('./src/routes/SeCom_API');



const configViewEngine = require('./src/config/viewEngine');

const app = express();
app.use(express.json());
const PORT = 3000;
const http = require('http');
const WebSocket = require('ws');
const wsRoutes = require('./src/routes/webSocketRouter');
const webSocketController = require('./src/controllers/webSocketController');

const server = http.createServer(app);

const wss = new WebSocket.Server({ port: 3001 });


configViewEngine(app);
app.use('/', ApiRouter);


app.use('/ws', wsRoutes);
wss.on('connection', webSocketController.handleConnection);
// wss.on('open', webSocketController.handleConnection);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
