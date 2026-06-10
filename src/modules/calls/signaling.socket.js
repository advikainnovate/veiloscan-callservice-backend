const callService = require("./call.session.service");

const activeRooms = new Map();

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log(`Socket Connected: ${socket.id}`);

        /**
         * JOIN SESSION
         */
        socket.on(
            "join-session",
            async ({ sessionId }) => {

                try {

                    if (!sessionId) {
                        return socket.emit(
                            "error",
                            {
                                message:
                                    "Session ID required"
                            }
                        );
                    }

                    if (!activeRooms.has(sessionId)) {
                        activeRooms.set(
                            sessionId,
                            new Set()
                        );
                    }

                    const room =
                        activeRooms.get(
                            sessionId
                        );

                    /**
                     * Max 2 participants
                     */
                    if (room.size >= 2) {

                        return socket.emit(
                            "room-full",
                            {
                                sessionId
                            }
                        );
                    }

                    room.add(socket.id);

                    socket.join(sessionId);

                    socket.sessionId =
                        sessionId;

                    io.to(sessionId).emit(
                        "participant-joined",
                        {
                            socketId:
                                socket.id,
                            participants:
                                room.size
                        }
                    );

                    /**
                     * Call officially starts
                     * when second participant joins
                     */
                    if (room.size === 2) {

                        await callService
                            .activateSession(
                                sessionId
                            );

                        io.to(
                            sessionId
                        ).emit(
                            "call-started"
                        );
                    }

                } catch (error) {

                    console.error(
                        "join-session",
                        error
                    );

                    socket.emit(
                        "error",
                        {
                            message:
                                "Unable to join room"
                        }
                    );
                }
            }
        );

        /**
         * OFFER
         */
        socket.on(
            "offer",
            (data) => {

                socket.to(
                    data.sessionId
                ).emit(
                    "offer",
                    data
                );
            }
        );

        /**
         * ANSWER
         */
        socket.on(
            "answer",
            (data) => {

                socket.to(
                    data.sessionId
                ).emit(
                    "answer",
                    data
                );
            }
        );

        /**
         * ICE CANDIDATE
         */
        socket.on(
            "ice-candidate",
            (data) => {

                socket.to(
                    data.sessionId
                ).emit(
                    "ice-candidate",
                    data
                );
            }
        );

        /**
         * MANUAL LEAVE
         */
        socket.on(
            "leave-session",
            async ({ sessionId }) => {

                try {

                    leaveRoom(
                        io,
                        socket,
                        sessionId
                    );

                } catch (err) {

                    console.error(
                        err
                    );
                }
            }
        );

        /**
         * DISCONNECT
         */
        socket.on(
            "disconnect",
            async () => {

                try {

                    if (
                        socket.sessionId
                    ) {

                        leaveRoom(
                            io,
                            socket,
                            socket.sessionId
                        );
                    }

                    console.log(
                        `Socket Disconnected: ${socket.id}`
                    );

                } catch (err) {

                    console.error(
                        err
                    );
                }
            }
        );
    });
};

/**
 * ROOM CLEANUP
 */
async function leaveRoom(
    io,
    socket,
    sessionId
) {

    const room =
        activeRooms.get(
            sessionId
        );

    if (!room) return;

    room.delete(socket.id);

    socket.leave(sessionId);

    io.to(sessionId).emit(
        "participant-left",
        {
            socketId:
                socket.id,
            participants:
                room.size
        }
    );

    /**
     * End call when room becomes empty
     */
    if (room.size === 0) {

        activeRooms.delete(
            sessionId
        );

        try {

            await callService
                .endSession(
                    sessionId
                );

        } catch (error) {

            console.error(
                "Failed to end session",
                error
            );
        }
    }
}