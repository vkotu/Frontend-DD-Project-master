'use strict';
var USER_NAME = "";
var AVAILABLE_ROOMS;
var PREV_ROOM;
var SHOW_CREATE_ROOM = false;


var EVENT_HANDLERS = (function () {

        function init() {
            handleNewUser();
            handleChatSubmit();
            handleCreateRoom();
            handleCancelCreateRoom();
            handleToogleCreateRoom();
        }

        function handleNewUser () {
            // On user submit name form.
            $('#nameForm').submit(function () {
                USER_NAME = $.trim($('#userName').val());
                // Validate user name
                if (!USER_NAME) {
                    alert('Please provide a name.');
                    return false;
                }
                // Init socket and validate name, if all ok show chat screen.
                SOCKET_IO_HANDLER.initSocketioOnUserEntry(); 
                return false;
            });
        }
        
        // On chat message submit.
        function handleChatSubmit () {
            $('#chatForm').submit(function(event){
                event.preventDefault();
                var msg, info;
                if (!$.trim(USER_NAME)) {
                    alert('Please provide a name before you chat');
                    return false;
                }
                msg = $.trim($('#inputMsg').val());
                if (!msg) {
                    return false;
                }
                info = {
                    message: msg,
                    userName: USER_NAME,
                    roomId: $('#rooms-list .selected').attr("id")
                }
                // Emit message to server and let it broadcast to other clients in room.
                SOCKET_IO_HANDLER.emitChatMsg(info);
                apiService.saveMessage(info);
        
                domUpdatesHandler.addMessage('self-message', {
                    message: msg
                });
                // Reset input 
                $('#inputMsg').val('');
                return false;
              });
        }
        // On user selects a room
        function handleRoomClick () {
            var roomId = $(this).attr("id");
            // use clicked the room he is already in. Do not do anything.
            if (PREV_ROOM == roomId) {
                return;
            }
            // Select the tab of selected room.
            domUpdatesHandler.updateSelectedRoomInList(AVAILABLE_ROOMS, roomId);
            // User clicked a room for first time remove the info text on screen and enable chat container.
            if (PREV_ROOM === undefined) {
                domUpdatesHandler.enableChatBox();
            }
        
            // Reset the content if user is coming from another room.
            if (PREV_ROOM) { $('#chatContainer').text("") };
            // Get complete room info.
            apiService.getRoomById(roomId)
                .done(getRoomDataSuccess)
                .fail(failure);
            // Get existing messages for the room user selected.
            apiService.getMessagesByRoomId(roomId)
                .done(getMessageDataSucces)
                .fail(failure);
            // Leave old room and join in to the current room user selected.
            SOCKET_IO_HANDLER.socketJoinRoom(roomId);    
        }

        
        function handleToogleCreateRoom () {
            $('#toggleCreateRoom').click(toggleCreateRoom);
        }

        function handleCancelCreateRoom () {
            $('#cancelCreateRoom').click(toggleCreateRoom);
        }

        function handleCreateRoom () {
            $('#createRoomBtn').click(createRoom);
        }


        function toggleCreateRoom() {
            // Reset name in case user entered before
            $('#roomName').val("");
            // 
            SHOW_CREATE_ROOM = !SHOW_CREATE_ROOM;
            SHOW_CREATE_ROOM ? 
                domUpdatesHandler.showCreateRoomForm() : domUpdatesHandler.hideCreateRoomForm();
            
        }

        function createRoom () {
            var name = $.trim($('#roomName').val());
            if (!name) {
                alert("Room name is empty");
                return;
            }
            if (_.find(AVAILABLE_ROOMS, function (o) { return o.name === name})) {
                alert('Room name already exist');
                return;
            }
            apiService.createNewRoom(name)
                .done(function (data) {
                    console.log(data);
                    var room = { name: data.name, id: data.id} ;
                    AVAILABLE_ROOMS.push(room);

                    domUpdatesHandler.addRoomToList(room, EVENT_HANDLERS.handleRoomClick);
                    SOCKET_IO_HANDLER.emitNewRoom('new_room', room);
                    toggleCreateRoom();
                })
                .fail(function (err) {
                    alert("Something went wrong");
                    console.error(err);
                    toggleCreateRoom();
                });
                
        }
        // Utility functions 
        // Once existing messages data available add them to the chat.
        function getMessageDataSucces(data) {
            _.forEach(data, function (info) {
                if (info.name == USER_NAME) {
                    domUpdatesHandler.addMessage('self-message', info);
                } else {
                    domUpdatesHandler.addMessage('incoming-message', info);
                }
            });
        }

        // Once selected room data available update the room name.
        function getRoomDataSuccess (data) {
            if (_.isEmpty(data)) {
                alert("No data found");
                return;
            }
            var users = data.users || [];
            // Update room name in page.
            $('#room-name').text(data.name || '');
        }
        
        init();

        return {
            handleRoomClick : handleRoomClick
        }
})();

// Failure handler
function failure(err) {
    alert('Some thing went wrong');
    console.error("Some thing went wrong: ");
    console.error(err);
}