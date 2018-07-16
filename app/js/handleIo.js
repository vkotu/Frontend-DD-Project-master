'use strict';
var http = require('http');
var _ = require('lodash');
// List of clients currently connected.
var CLIENTS = {};
// Contains list of users currently active in a room.
var ACTIVE_USERS_IN_ROOM = {
};

function handleIo(socket) {
    console.log('New client connected: ' + socket.id);
    // Store CLIENTS info based on the unique socket id.
    if (CLIENTS[socket.id] === undefined) {
        CLIENTS[socket.id] = {};
    }

    // On client send join_room 
    socket.on('join_room', function(info) {
        var curRoom = info.room;
        // Contains list of users currently active in a room
        if (ACTIVE_USERS_IN_ROOM[curRoom] !== undefined) {
            ACTIVE_USERS_IN_ROOM[curRoom].push(info.name)
        } else {
            ACTIVE_USERS_IN_ROOM[curRoom] = [info.name];
        }
        // join the room
        socket.join(curRoom);
        // Let others know new user joined this room.
        socket.to(info.room).emit('user_joined', {
            newUserJoined: info.name,
            activeUsersInRoom: ACTIVE_USERS_IN_ROOM
        });
        // Send the updated users list to the own client.
        socket.emit('user_joined', {
            newUserJoined: info.name,
            activeUsersInRoom: ACTIVE_USERS_IN_ROOM
        });
        // Update the room for client.
        CLIENTS[socket.id].inRoom = curRoom;
    });

    // On client request to leave room.
    socket.on("leave_room", function(info) {
        var curRoom = info.room;
        // Reset room for client.
        if (CLIENTS[socket.id].inRoom == curRoom) {
            CLIENTS[socket.id].inRoom = null;
        }
        // Leave room.
        socket.leave(curRoom);
        // Update active users when client left.
        _.remove(ACTIVE_USERS_IN_ROOM[curRoom], function (v) {
            return v === info.name;
        });
        // Let others know a user left this room
        socket.to(curRoom).emit('user_left', {
            userLeft: info.name,
            activeUsersInRoom: ACTIVE_USERS_IN_ROOM
        });
    });

    // On client disconnected.
    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected");
        // Let others know a user left/disconnected this room
        var room = _.get(CLIENTS[socket.id], 'inRoom');
        if (room) {
            _.remove(ACTIVE_USERS_IN_ROOM[room], function (v) {
                return v === _.get(CLIENTS[socket.id], 'name');
            });
            socket.to(room).emit('user_left', {
                userLeft: _.get(CLIENTS[socket.id], 'name'),
                activeUsersInRoom: ACTIVE_USERS_IN_ROOM
            });
        }
        delete CLIENTS[socket.id];
        console.log(CLIENTS);
    });

    // On client emit a message, broadcast to clients connected in the same room.
    socket.on('chat_message', function (info) {
        var room = info.roomId;
        socket.to(room).emit('chat_message', info);
    });

    // On new user login.
    socket.on('new_user', function(info) {
        if (CLIENTS[socket.id]) {
            CLIENTS[socket.id].name = info.name;
        }
        socket.emit('new_user', info.name);
    });
};

module.exports = handleIo;