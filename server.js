require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const ApiRouter = require('./src/routes/SeCom_API');
const cors = require('cors')
const corsOptions = require('./src/config/cors.config')

const app = express();
app.use(express.json());
const PORT = 3000;
const http = require('http');
const WebSocket = require('ws');
const wsRoutes = require('./src/routes/webSocketRouter');
const webSocketController = require('./src/controllers/webSocketController');

const server = http.createServer(app);

const wss = new WebSocket.Server({ port: 3001 });
app.use(cors())
app.use('/', ApiRouter);
app.use('/ws', wsRoutes);
wss.on('connection', webSocketController.handleConnection);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
