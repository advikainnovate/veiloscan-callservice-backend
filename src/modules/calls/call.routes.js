const router = require("express").Router();

const controller =
    require("./call.controller");

router.post(
    "/session",
    controller.createSession
);

router.get(
    "/session/:sessionId",
    controller.getSession
);

router.post(
    "/session/:sessionId/end",
    controller.endSession
);

module.exports = router;