'use strict';
var http = require('http');
var _ = require('lodash');
var clients = {};
var activeUsersInRoom = {
};

function handleIo(socket) {
    console.log('New client connected: ' + socket.id);

    if (clients[socket.id] === undefined) {
        clients[socket.id] = {};
    }

    socket.on('join_room', function(info) {
        var curRoom = info.room;
        if (activeUsersInRoom[curRoom] !== undefined) {
            activeUsersInRoom[curRoom].push(info.name)
        } else {
            activeUsersInRoom[curRoom] = [info.name];
        }
        socket.join(curRoom);
        console.log(socket.id + " joined: " + info.room);
        //Let others know new user joined this room
        console.log("emiting user_joined : " + socket.id);
        socket.to(info.room).emit('user_joined', {
            newUserJoined: info.name,
            activeUsersInRoom: activeUsersInRoom
        });
        //Send the updated users list to the own client
        socket.emit('user_joined', {
            newUserJoined: info.name,
            activeUsersInRoom: activeUsersInRoom
        });
        clients[socket.id].inRoom = curRoom;
    });

    socket.on("leave_room", function(info) {
        console.log(socket.id + " leave  " + info.room );
        var curRoom = info.room;
        if (clients[socket.id].inRoom == curRoom) {
            clients[socket.id].inRoom = null;
        }
        socket.leave(curRoom);
        _.remove(activeUsersInRoom[curRoom], function (v) {
            return v === info.name;
        });
        //Let others know a user left this room
        socket.to(curRoom).emit('user_left', {
            userLeft: info.name,
            activeUsersInRoom: activeUsersInRoom
        });
    });

    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected");
        // //Let others know a user left this room
        var room = _.get(clients[socket.id], 'inRoom');
        if (room) {
            _.remove(activeUsersInRoom[room], function (v) {
                return v === _.get(clients[socket.id], 'name');
            });
            socket.to(room).emit('user_left', {
                userLeft: _.get(clients[socket.id], 'name'),
                activeUsersInRoom: activeUsersInRoom
            });
        }
        delete clients[socket.id];
        console.log(clients);
    });

    socket.on('chat_message', function (info) {
        console.log('incoming message from: ' + info.userName);
        console.log( _.get(clients[socket.id], 'inRoom'));
        console.log(info.roomId);
        var room = info.roomId;

        console.log("emitting to room: " + room);
        socket.to(room).emit('chat_message', info);
        console.log(clients);
    });

    socket.on('new_user', function(info) {
        if (clients[socket.id]) {
            clients[socket.id].name = info.name;
        }
        console.log(clients);
        socket.emit('new_user', info.name);
    });
};

module.exports = handleIo;