import CallSDK, { CALL_STATUS, EVENTS, QUALITY } from './index.js';

if (typeof window !== 'undefined') {
    window.VeiloscanCallSDK = CallSDK;
    window.VeiloscanCallSDKConstants = { CALL_STATUS, EVENTS, QUALITY };
}

export { CallSDK, CALL_STATUS, EVENTS, QUALITY };
export default CallSDK;
