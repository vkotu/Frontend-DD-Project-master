

var domUpdatesHandler = (function domUpdateHandler () {
    var api;

    function setStatusInterval() {
        var timeSpent = 0;
        // update status every one minute
        setInterval(function () {
            timeSpent += 1;
            var m = timeSpent > 1 ? 'minutes' : 'minute';
            $('#status').text('Online for '+ timeSpent + ' ' + m);
        }, 1000 * 60);
        // Default to this on user login
        $('#status').text('Online for less than a minute');
    }

    function updateSelectedRoomInList (availableRooms, roomIdSelected){
        _.forEach(availableRooms, function (room) {
            if ("room_" + room.id == roomIdSelected) {
                $('#room_' + room.id).addClass("selected");
            } else {
                $('#room_' + room.id).removeClass("selected");
            }
        });
    }

    function enableChatBox () {
        $('.enable-info').css({
            display: 'none'
        });
        // Enable the chat box and chat form
        $('.chat-container').css({
            display: 'flex'
        });
        $('.chat-form').css({
            display: 'flex'
        });
    }

    function enableChatContainer () {
        $('.user-name-container').css({
            'display': 'none',
        });
        $('.chat-rooms-container').css({
            'display': 'flex'
        });
    }

    function addRoomToList(room, handleRoomClick) {
        var roomListElm = $("#rooms-list");

        roomListElm.append(
            $('<div id="room_' + room.id +'">').text(room.name)
        );
        // Add click handler
        $('#rooms-list #room_' + room.id).click(handleRoomClick);

        roomListElm.scrollTop($("#rooms-list")[0].scrollHeight);
    }

    function updateRoomsList (rooms, handleRoomClick) {
        if(!rooms.length) {
            return;
        }
        
        rooms.forEach(room => {
            addRoomToList(room, handleRoomClick);
        });
    }

    function addMessage (className, info) {
        // Append new message to chat
        var chatContainer = $('#chatContainer');

        chatContainer.append($('<div class="'+ className + '">')
            .html('<span>' + info.message + '</span>'));
        // Append name of the user who sent the new incoming message.
        if (className === 'incoming-message') {
            chatContainer.append($('<span class="user-name">').text(info.name))
        }    
        // Scroll to the latest message    
        chatContainer.scrollTop($("#chatContainer")[0].scrollHeight);
    }

    function showCreateRoomForm () {
        $('#creatRoomForm').css({
            display: 'flex'
        });
        $('#toggleCreateRoom').css({
            display: 'none'
        });
        $("#rooms-list").scrollTop($("#rooms-list")[0].scrollHeight);
    };

    function hideCreateRoomForm () {
        $('#creatRoomForm').css({
            display: 'none'
        });
        $('#toggleCreateRoom').css({
            display: 'flex'
        });
        $("#rooms-list").scrollTop($("#rooms-list")[0].scrollHeight);
    }

    api = {
        updateRoomsList: updateRoomsList,
        updateSelectedRoomInList: updateSelectedRoomInList,
        enableChatBox: enableChatBox,
        enableChatContainer: enableChatContainer,
        setStatusInterval: setStatusInterval,
        addMessage: addMessage,
        showCreateRoomForm: showCreateRoomForm,
        hideCreateRoomForm: hideCreateRoomForm,
        addRoomToList: addRoomToList
    }

    return api;

})();