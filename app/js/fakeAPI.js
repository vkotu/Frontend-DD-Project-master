'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser')
var shortid = require('shortid')

module.exports = function (req, res, next) {
    var router = express.Router();


        // logging middleware
    router.use(function(req, res, next) {
        console.log('\nReceived:',{url: req.originalUrl, body: req.body, query: req.query})
        next()
    })

    // Simple in memory database
    //{name: 'Ryann', message: 'ayyyyy', id: 'gg35545', reaction: null},{name: 'Nick', message: 'lmao', id: 'yy35578', reaction: null}, {name: 'Danielle', message: 'leggooooo', id: 'hh9843', reaction: null}
    const database = [
    { name: 'Analytics', id: 0, users: [], messages: [] },
    { name: 'Business', id: 1, users: [], messages: [] },
    { name: 'Design', id: 2, users: [], messages: [] },
    { name: 'Engineering', id: 3, users: [], messages: [] },
    { name: 'HR', id: 4, users: [], messages: [] },
    { name: 'Operations', id: 5, users: [], messages: [] },
    { name: 'Operations', id: 7, users: [], messages: [] },
    { name: 'Special Ops', id: 8, users: [], messages: [] }
    ]


    // Utility functions
    const findRoom = (roomId) => {
    const room = database.find((room) => {
        return room.id === parseInt(roomId)
    })
    if (room === undefined){
        return {error: `a room with id ${roomId} does not exist`}
    }
    return room
    }

    const findRoomIndex = (roomId) => {
    const roomIndex = database.findIndex((room) => {
        return room.id === parseInt(roomId)
    })
    return roomIndex
    }

    const findMessageIndex = (room, messageId) => {
    const messageIndex = room.messages.findIndex((message) => {
        return message.id === messageId
    })
    return messageIndex
    }

    const logUser = (room, username) => {
    const userNotLogged = !room.users.find((user) => {
        return user === username
    })

    if (userNotLogged) {
        room.users.push(username)
    }
    }

    // API Routes
    router.get('/rooms', function(req, res) {
        console.log("*****************");
        console.log("*****************");
        console.log("*****************");
        console.log("*****************");
        const rooms = database.map((room) => {
        return {name: room.name, id: room.id}
        })
        console.log('Response:',rooms)
        res.json(rooms)
    })

    router.get('/rooms/:roomId', function(req, res) {
    var room = findRoom(req.params.roomId)
    if (room.error) {
        console.log('Response:',room)
        res.json(room)
    } else {
        console.log('Response:',{name: room.name, id: room.id, users: room.users})
        res.json({name: room.name, id: room.id, users: room.users})
    }
    })

    router.route('/rooms/:roomId/messages')
    .get(function(req, res) {
        var room = findRoom(req.params.roomId)
        if (room.error) {
        console.log('Response:',room)
        res.json(room)
        } else {
        console.log('Response:',room.messages)
        res.json(room.messages)
        }
    })
    .post(function(req, res) {
        var room = findRoom(req.params.roomId)
        if (room.error) {
        console.log('Response:',room)
        res.json(room)
        } else if (!req.body.name || !req.body.message) {
        console.log('Response:',{error: 'request missing name or message'})
        res.json({error: 'request missing name or message'})
        } else {
        logUser(room, req.body.name)
        const reaction = req.body.reaction || null
        const messageObj = { name: req.body.name, message: req.body.message, id: shortid.generate(), reaction }
        room.messages.push(messageObj)
        console.log("message added ***********");
        console.log(room);
        console.log('Response:',{message: 'OK!'})
        res.json(messageObj)
        }
    })
    //
    return router;
}