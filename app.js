var express = require("express");
var app = express();
var http_serv = require("http").Server(app);
var io = require("socket.io")(http_serv);
var bodyParser = require('body-parser');
var path = require('path');
var port = process.env.PORT || 8000;
// Load the full build.
var _ = require('lodash');

var index = require("./app/js/index.js");
var handleIo = require("./app/js/handleIo.js");
var fakeAPI = require("./app/js/fakeAPI.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.use('/api', fakeAPI());

app.use("/", index());

http_serv.listen(port, function () {
    console.info("Sever started on port: '" + port +"'");
});

io.on('connection', handleIo);
