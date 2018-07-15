'use strict';
var socket;
var userName = "";
var availableRooms;
var prevRoom;
var showCreateRoom = false;

function init() {
    handleNewUser();
    handleChatSubmit();
}

function handleNewUser () {
    $('#nameForm').submit(function () {
        userName = $.trim($('#userName').val());
        //Validate user name
        if (!userName) {
            alert('Please provide a name.');
            return false;
        }
        // Hide username form and show chat contianer
        if (userName) {
            $('.user-name-container').css({
                'display': 'none',
            });
            $('.chat-rooms-container').css({
                'display': 'flex'
            });
        }
        $('#name').text(userName);
        updateOnlineStatus();
        apiService.getRooms()
            .done(function(data) {
                if (!data.length) {
                    alert("No rooms found");
                    return;
                }
                availableRooms = data;
                updateRooms(data);
            })
            .fail(failure);
        establishSocketIoOnUserConn();    
        return false;
    });
}

function updateRooms (data) {
    if(!data.length) {
        return;
    }
    $('#room-name').text("Hello " + userName);
    data.forEach(room => {
        $('#rooms-list').append(
            $('<div id="room_' + room.id +'">').text(room.name)
        );
        $('#rooms-list #room_' + room.id).click(handleRoomClick);
    });
}

function handleRoomClick (event) {
    var roomId = $(this).attr("id");
    // use clicked the room he is already in. Do not do anything
    if (prevRoom == roomId) {
        return;
    }
    // Select the tab of selected room.
    _.forEach(availableRooms, function (room) {
        if ("room_" + room.id == roomId) {
            $('#room_' + room.id).addClass("selected");
        } else {
            $('#room_' + room.id).removeClass("selected");
        }
    });
    //Remove the initial information text
    $('.enable-info').css({
        display: 'none'
    });
    //Enable the chat container and chat form
    $('.chat-container').css({
        display: 'flex'
    });
    $('.chat-form').css({
        display: 'flex'
    });
    //Reset the content if user is coming from another room
    $('#chatContainer').text("");
    //Get room info
    apiService.getRoomById(roomId)
        .done(getRoomDataSuccess)
        .fail(failure);
    // Get message for the room user selected
    apiService.getMessagesByRoomId(roomId)
        .done(getMessageSucces)
        .fail(failure);
    //Now initialize socket connection
    establishSocketIoConnForRoom(roomId);    
}

function getMessageSucces(data) {
    _.forEach(data, function (info) {
        if (info.name == userName) {
            $('#chatContainer').append($('<div class="self-message">')
            .html('<span>' + info.message + '</span>'));
            $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
        } else {
            $('#chatContainer').append($('<div class="incoming-message">')
            .html('<span>' + info.message + '</span>')
            .append($('<span class="user-name">').text(info.name)));
            // $('.incoming-message').after($('<div>').text("testing"));
        }
        $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
    });
}

function getRoomDataSuccess (data) {
    if (_.isEmpty(data)) {
        alert("No data found");
        return;
    }
    var users = data.users || [];
    $('#room-name').text(data.name || '');
}

function establishSocketIoOnUserConn () {
    if (socket === undefined) {
        socket = io();
        socket.removeAllListeners();
    }

    socket.emit('new_user', {
        name: userName
    });

    socket.on('new_user', function (name) {
        if (!name) {
            return;
        }
        console.info('you are connected (' + name +')');
    });
} 

function establishSocketIoConnForRoom (roomId) {
    if (socket === undefined) {
        socket = io();
    }
    //First leave the previous room
    // remove all listeners when changin rooms to avoid multiple listener registrations
    socket.removeAllListeners();

    if (prevRoom != roomId && prevRoom !== undefined) {
        socket.emit('leave_room', {
            room: prevRoom,
            name: userName
        });
    }
    if (prevRoom != roomId) {
        console.info("emiting join room (" + roomId + ") for: " + userName);
        socket.emit('join_room', {
            room: roomId,
            name: userName
        });
        prevRoom = roomId;
    }
    // Listen for new user join and updated list of names
    socket.on('user_joined', function (data) {
        console.info("User " + data.newUserJoined+ " Joined");
        // Add message to let others know a user just joined
        $('#chatContainer').append($('<div class="user-info">')
            .html('<span>' + data.newUserJoined + ' joined the room!!</span>'));
        $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
        // Update the usernames list in chat header
        updateList(data);
    });
    // Listen for user left and update list
    socket.on('user_left', function (data) {
        console.info("User " + data.userLeft+ " Joined");
        // Add a small message to let others know a user just joined
        $('#chatContainer').append($('<div class="user-info">')
            .html('<span>' + data.userLeft + ' left the room!!</span>'));
        $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
        //Update the usernames list in chat header
        updateList(data);
    });

    socket.on('chat_message', function (data) {
        if(data && !$.trim(data.msg)) {
            return;
        }
        $('#chatContainer').append($('<div class="incoming-message">')
            .html('<span>' + data.msg + '</span>')
            .append($('<span class="user-name">').text(data.userName)));
        // $('.incoming-message').after($('<div>').text("testing"));
        $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
    });

    function updateList (data) {
        //Add the current first
        var usersList = "<span>" + userName + "</span>";
        var activeUsersInRoom = data.activeUsersInRoom[roomId];
        _.remove(activeUsersInRoom, function (v) {
                return v === userName;
            });
        usersList =  activeUsersInRoom.length > 0 ? usersList + ", " +  activeUsersInRoom.join(", ") : usersList;
        $('#users-list').html(usersList);
    }
}

function handleChatSubmit () {
    $('#chatForm').submit(function(event){
        event.preventDefault();
        if (!$.trim(userName)) {
            alert('Please provide a name before you chat');
            return false;
        }
        var msg = $.trim($('#inputMsg').val());
        if (!msg) {
            return false;
        }
        var info = {
            msg: msg,
            userName: userName,
            roomId: $('#rooms-list .selected').attr("id")
        }
        socket.emit('chat_message', info);
        apiService.saveMessage(info);
        $('#chatContainer').append($('<div class="self-message">')
            .html('<span>' + $('#inputMsg').val() + '</span>'));
        $('#inputMsg').val('');
        $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
        return false;
      });
}

function updateOnlineStatus() {
    var timeSpent = 0;
    setInterval(function () {
        timeSpent += 1;
        var m = timeSpent > 1 ? 'minutes' : 'minute';
        $('#status').text('Online for '+ timeSpent + ' ' + m);
    }, 1000 * 60);
    $('#status').text('Online for less than a minute');
}


function failure(err) {
    alert('Some thing went wrong');
    console.error("Some thing went wrong: ");
    console.log(err);
}

function toggleCreateRoom() {
    $('#roomName').val("");
    if (!showCreateRoom) {
        $('#creatRoomForm').css({
            display: 'flex'
        });
        $('#toggleCreateRoom').css({
            display: 'none'
        });
        $("#rooms-list").scrollTop($("#rooms-list")[0].scrollHeight);
        showCreateRoom = true;
    } else {
        $('#creatRoomForm').css({
            display: 'none'
        });
        $('#toggleCreateRoom').css({
            display: 'flex'
        });
        showCreateRoom = false;
    }
}

function createRoom () {
    var name = $.trim($('#roomName').val());
    if (!name) {
        alert("Room name is empty");
        return;
    }
    if (_.find(availableRooms, function (o) { return o.name === name})) {
        alert('Room name already exist');
        return;
    }
    apiService.createNewRoom(name)
        .done(function (data) {
            console.log(data);
            availableRooms.push({ name: data.name, id: data.id});
            $('#rooms-list').append(
                $('<div id="room_' + data.id +'">').text(data.name)
            );
            $('#rooms-list #room_' + data.id).click(handleRoomClick);
            toggleCreateRoom();
            $("#rooms-list").scrollTop($("#rooms-list")[0].scrollHeight);
        })
        .fail(function (err) {
            alert("Something went wrong");
            console.error(err);
            toggleCreateRoom();
        });
        
}

init();