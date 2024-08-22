export const debugLog = (...message: any) => {
    const debugEnabled = false;

    if (debugEnabled) {
        console.log(...message);
    }
};
