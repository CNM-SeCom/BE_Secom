require('dotenv').config();
const AWS = require('aws-sdk');
const express = require('express');
const ApiRouter = require('./src/routes/SeCom_API');
const cloudinaryRouter = require('./src/routes/cloudinaryRouter');
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
const wss = new WebSocket.Server({ server });

app.use(cors())
app.use('/', ApiRouter);
app.use('/cloudinary', cloudinaryRouter);
app.use('/ws', wsRoutes);

// Xử lý kết nối WebSocket trong cùng một file
wss.on('connection', webSocketController.handleConnection);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
