export const debugLog = (...message: any) => {
    const debugEnabled = true; // Disabled for releases

    if (debugEnabled) {
        console.log(...message);
    }
};
