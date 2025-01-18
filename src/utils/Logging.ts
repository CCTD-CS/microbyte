export const debugLog = (...message: any) => {
    const debugEnabled = false; // Disabled for releases

    if (debugEnabled) {
        console.log(...message);
    }
};
