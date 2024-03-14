const WebSocket = require('ws');

const clients = new Map();
const groups = new Map();

function handleConnection(ws, req) {
    console.log(req.url)
    const userId = getUserIdFromUrl(req.url).split('=')[1];
    clients.set(userId, ws);
    // clients.get(userId).send('Connected to server:'+userId);
    console.log("connected user:", userId)

    ws.on('message', function incoming(message) {
        console.log(message.toString())
    });

    ws.on('close', function close() {
        handleDisconnection(userId);
    });
}

function getUserIdFromUrl(url) {
    return url.split('/').pop();
}

function registerGroup(groupId, userId) {
    const groupMembers = groups.get(groupId) || new Set();
    groupMembers.add(userId);
    groups.set(groupId, groupMembers);
}

function handleDisconnection(userId) {
    
    clients.delete(userId);
    console.log("delete user:::", userId)
    groups.forEach((groupMembers, groupId) => {
        if (groupMembers.has(userId)) {
            groupMembers.delete(userId);
            if (groupMembers.size === 0) {
                groups.delete(groupId);
            }
        }
    });
}

function sendMessageToUser(receiverId, message) {
    if (clients.has(receiverId)) {
        clients.get(receiverId).send(JSON.stringify(message));
        return { success: true, message: 'Message sent to user successfully' };
    } else {
        return { success: false, message: 'User not found' };
    }
}

function sendMessageToGroup(groupId, message) {
    const groupMembers = groups.get(groupId);
    if (groupMembers) {
        groupMembers.forEach(memberId => {
            if (clients.has(memberId)) {
                clients.get(memberId).send(message);
            }
        });
        return { success: true, message: 'Message sent to group successfully' };
    } else {
        return { success: false, message: 'Group not found' };
    }
}

module.exports = {
    handleConnection,
    sendMessageToUser,
    sendMessageToGroup
};
