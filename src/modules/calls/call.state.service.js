const { BadRequestException, ForbiddenException } = require('../../helpers');
const { logger } = require('../../utils');

const parseActor = (rawUserId) => {
    if (rawUserId === 'system') {
        return { kind: 'system', id: 'system', rawId: 'system' };
    }

    if (!rawUserId) {
        throw new ForbiddenException('Invalid user identity');
    }

    if (String(rawUserId).startsWith('guest:')) {
        return { kind: 'guest', id: String(rawUserId).replace('guest:', ''), rawId: rawUserId };
    }

    return { kind: 'user', id: rawUserId, rawId: rawUserId };
};

const isReceiver = (call, actor) => {
    return actor.kind === 'user' && call.receiverId === actor.id;
};

const isCaller = (call, actor) => {
    if (actor.kind === 'guest') {
        return call.guestId === actor.id;
    }

    if (actor.kind === 'user') {
        return call.callerId === actor.id;
    }

    return false;
};

const assertActorCanView = (call, actor, callId) => {
    if (actor.kind === 'system') {
        return;
    }

    const isParticipant = call.receiverId === actor.id || call.callerId === actor.id || (actor.kind === 'guest' && call.guestId === actor.id);

    if (!isParticipant) {
        logger.warn(`Unauthorized call access attempt on ${callId} by ${actor.rawId}`);
        throw new ForbiddenException('You do not have permission to access this call');
    }
};

const canTransition = (call, actor, nextStatus, endedReason) => {
    if (actor.kind === 'system') {
        if (nextStatus === 'ended' || nextStatus === 'failed') {
            return;
        }
        throw new ForbiddenException('System cannot perform this call action');
    }

    if (call.status === 'ended' || call.status === 'failed') {
        throw new BadRequestException('Call has already finished');
    }

    if (nextStatus === 'ringing') {
        if (!isCaller(call, actor)) {
            throw new ForbiddenException('Only the caller can move a call to ringing');
        }
        if (call.status !== 'initiated') {
            throw new BadRequestException('Call can only ring after initiation');
        }
        return;
    }

    if (nextStatus === 'connected') {
        if (!isReceiver(call, actor)) {
            throw new ForbiddenException('Only the receiver can connect the call');
        }
        if (call.status !== 'initiated' && call.status !== 'ringing') {
            throw new BadRequestException('Only a pending call can be connected');
        }
        return;
    }

    if (nextStatus === 'failed') {
        if (!isReceiver(call, actor)) {
            throw new ForbiddenException('Only the receiver can reject the call');
        }
        if (call.status !== 'initiated' && call.status !== 'ringing') {
            throw new BadRequestException('Only a pending call can be rejected');
        }
        if (endedReason && endedReason !== 'rejected' && endedReason !== 'busy') {
            throw new BadRequestException('Invalid failure reason for receiver rejection');
        }
        return;
    }

    if (nextStatus === 'ended') {
        if (!isCaller(call, actor) && !isReceiver(call, actor)) {
            throw new ForbiddenException('Only participants can end the call');
        }
        return;
    }

    throw new BadRequestException('Unsupported call status update');
};

const buildTransitionUpdate = (call, nextStatus, endedReason) => {
    const updateData = { status: nextStatus };

    if (nextStatus === 'connected' && !call.startedAt) {
        updateData.startedAt = new Date();
    }

    if (nextStatus === 'ended' || nextStatus === 'failed') {
        updateData.endedAt = new Date();
        updateData.endedReason = endedReason || (nextStatus === 'failed' ? 'error' : 'completed');
    }

    return updateData;
};

const callStateService = {
    parseActor,
    assertActorCanView,
    canTransition,
    buildTransitionUpdate,
};

module.exports = callStateService;
