const chatService = require("./chat.service");

const activeRooms = new Map();

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log(
            `Chat Socket Connected: ${socket.id}`
        );

        /**
         * JOIN CHAT ROOM
         */
        socket.on(
            "join-room",
            ({ roomId }) => {

                if (!roomId) {
                    return;
                }

                socket.join(roomId);

                if (
                    !activeRooms.has(roomId)
                ) {
                    activeRooms.set(
                        roomId,
                        new Set()
                    );
                }

                activeRooms
                    .get(roomId)
                    .add(socket.id);

                io.to(roomId).emit(
                    "participant-joined",
                    {
                        socketId:
                            socket.id
                    }
                );
            }
        );

        /**
         * SEND MESSAGE
         */
        socket.on(
            "send-message",
            async (payload) => {

                try {

                    const message =
                        await chatService
                            .saveMessage(
                                payload
                            );

                    io.to(
                        payload.roomId
                    ).emit(
                        "message-received",
                        message
                    );

                } catch (error) {

                    console.error(
                        "send-message",
                        error
                    );

                    socket.emit(
                        "message-error",
                        {
                            roomId: payload.roomId,
                            error: error.message || "Failed to save message"
                        }
                    );
                }
            }
        );

        /**
         * TYPING
         */
        socket.on(
            "typing",
            ({
                roomId,
                userId
            }) => {

                socket.to(
                    roomId
                ).emit(
                    "user-typing",
                    {
                        userId
                    }
                );
            }
        );

        /**
         * STOP TYPING
         */
        socket.on(
            "stop-typing",
            ({
                roomId,
                userId
            }) => {

                socket.to(
                    roomId
                ).emit(
                    "user-stop-typing",
                    {
                        userId
                    }
                );
            }
        );

        /**
         * LEAVE ROOM
         */
        socket.on(
            "leave-room",
            ({ roomId }) => {

                socket.leave(roomId);

                const room =
                    activeRooms.get(
                        roomId
                    );

                if (room) {

                    room.delete(
                        socket.id
                    );

                    if (
                        room.size === 0
                    ) {

                        activeRooms.delete(
                            roomId
                        );
                    }
                }

                io.to(roomId).emit(
                    "participant-left",
                    {
                        socketId:
                            socket.id
                    }
                );
            }
        );

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `Chat Socket Disconnected: ${socket.id}`
                );
            }
        );
    });
};