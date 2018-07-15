'use strict';

var apiService = (function apiService() {
    var origin = $(location).attr('origin');
    var baseURL = origin +  "/api";

    function getRooms () {
        var p = $.get(baseURL + "/rooms");
        return p;
    }

    function getRoomById (id) {
        var id = id.split("_")[1];
        if (id === undefined || id === null) {
            console.error("Id missing");
            return;
        }
        var p = $.get(baseURL + "/rooms/" + id);
        return p;
    }

    function saveMessage(info) {
        if (info.roomId === undefined) {
            console.error("Room id missing");
            return;
        }
        var roomId = info.roomId.split("_")[1];
        var p = $.post(baseURL + "/rooms/" + roomId + "/messages", {
            name: info.userName,
            message: info.msg || '',
            reaction: info.reaction 
        });
        p.done(function (data) {
            console.log('save success');
        }).fail(function (err){
            alert('Save failed');
            console.error(err);
        })
    }

    function getMessagesByRoomId (roomId) {
        if (roomId === undefined) {
            console.error("Room Id is missing");
            return;
        }
        var roomId = roomId.split("_")[1];
        var p = $.get(baseURL + "/rooms/" + roomId + "/messages");
        return p;
    }

    return {
        getRooms: getRooms,
        getRoomById: getRoomById,
        saveMessage: saveMessage,
        getMessagesByRoomId: getMessagesByRoomId
    }

})();





