'use strict';

var express = require('express');
var path = require('path');

module.exports = function (req, res, next) {
    var router = express.Router()
    router.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/../public/templates/index.html'));
    });

    router.all('*', function (req, res) {
        res.redirect('/');
    });
    //
    return router;
}