const activeRooms = new Map();

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );

        socket.on(
            "join-session",
            ({ sessionId }) => {

                socket.join(sessionId);

                if (
                    !activeRooms.has(sessionId)
                ) {
                    activeRooms.set(
                        sessionId,
                        []
                    );
                }

                activeRooms
                    .get(sessionId)
                    .push(socket.id);

                socket.to(sessionId).emit(
                    "participant-joined",
                    {
                        socketId: socket.id
                    }
                );
            }
        );

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

        socket.on(
            "leave-session",
            ({ sessionId }) => {

                socket.leave(sessionId);

                socket.to(sessionId).emit(
                    "participant-left",
                    {
                        socketId: socket.id
                    }
                );
            }
        );

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Socket disconnected:",
                    socket.id
                );
            }
        );
    });
};