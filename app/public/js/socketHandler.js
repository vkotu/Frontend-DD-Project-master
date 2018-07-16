var SOCKET_IO_HANDLER;

SOCKET_IO_HANDLER = (function socketioHandler () {
    var socket;

    function initSocketioOnUserEntry () {
        if (socket === undefined) {
            socket = io();
        }
        // Emit info to server on new user.
        socket.emit('new_user', {
            name: USER_NAME
        });
        // Listen for ack from server on new user.
        socket.on('new_user', function (name) {
            if (!name) {
                console.error("Something went wrong while registering user to the socket");
                return;
            }
            console.info('you are connected (' + name +')');
        });
    }

    function socketJoinRoom (roomId) {
        
        if (socket === undefined) { 
            /*
             * This condition should not be excuted unless something wrong
             * as socket must be initialized up on user login
            */
            socket = io(); 
        }

        // Remove all listeners in case when user changing room to avoid multiple listener registrations.
        socket.removeAllListeners();
    
        // First leave if user is coming from previous room.
        if (PREV_ROOM !== roomId && PREV_ROOM !== undefined) {
            socket.emit('leave_room', {
                room: PREV_ROOM,
                name: USER_NAME
            });
        }
        // If prev room is different from current room user clicked, join the new room.
        if (PREV_ROOM !== roomId) {
            console.info("emiting join room (" + roomId + ") for: " + USER_NAME);
            socket.emit('join_room', {
                room: roomId,
                name: USER_NAME
            });
            PREV_ROOM = roomId;
        }

        // Listen for new user join and updated list of names
        socket.on('user_joined', function (data) {
            console.info("User " + data.newUserJoined+ " Joined");
            // Add message to let others know a user just joined
            $('#chatContainer').append($('<div class="user-info">')
                .html('<span>' + data.newUserJoined + ' joined the room!!</span>'));
            $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
            // Update the USER_NAMEs list in chat header
            updateList(data);
        });

        // Listen for user left and update list
        socket.on('user_left', function (data) {
            console.info("User " + data.userLeft+ " Joined");
            // Add a small message to let others know a user just joined
            $('#chatContainer').append($('<div class="user-info">')
                .html('<span>' + data.userLeft + ' left the room!!</span>'));
            $("#chatContainer").scrollTop($("#chatContainer")[0].scrollHeight);
            //Update the USER_NAMEs list in chat header
            updateList(data);
        });

        // On user submits message emit and let server broadcast to other clients connected to the room
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

        // Update the list of user names who are currently active in the room.
        function updateList (data) {
            // Add self user first to the list.
            var usersList = "<span>" + USER_NAME + "</span>";
            var activeUsersInRoom = data.activeUsersInRoom[roomId];
            // To avoid duplicate name showing up self username
            _.remove(activeUsersInRoom, function (v) {
                    return v === USER_NAME;
                });
            // Final user list to show in page
            usersList =  activeUsersInRoom.length > 0 ? usersList + ", " +  activeUsersInRoom.join(", ") : usersList;
            $('#users-list').html(usersList);
        }
    }

    function emitChatMsg (info) {
        socket.emit('chat_message', info);
    }

    return {
        socketJoinRoom: socketJoinRoom,
        emitChatMsg: emitChatMsg,
        initSocketioOnUserEntry: initSocketioOnUserEntry
    };
    
})();