import type { Microbit } from "microbyte";

/**
 * Used for displaying the status of the Microbit
 */
export const getMicrobitStatus = (microbit: Microbit) => {
    return {
        statusConnected: microbit.getDeviceState(),
        reconnects: microbit.isAutoReconnectEnabled(),
    };
};

