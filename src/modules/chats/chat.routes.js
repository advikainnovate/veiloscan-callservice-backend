const express =
    require(
        "express"
    );

const router =
    express.Router();

const controller =
    require(
        "./chat.controller"
    );

router.post(
    "/rooms",
    controller.createRoom
);

router.get(
    "/rooms/:roomId/messages",
    controller.getMessages
);

module.exports =
    router;