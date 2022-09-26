export const waitUntilElementIsAvailable = (
    query: string,
    callback: () => void,
    timestepMs = 100,
    maxWaitTimeMs = 5000
): void => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let passedTimeMs = 0;
    const checkIfElementIsAvailable = () => {
        const element = document.getElementById(query);
        if (element) {
            if (intervalId) {
                clearInterval(intervalId);
            }
            callback();
        }
        passedTimeMs += timestepMs;
        if (passedTimeMs >= maxWaitTimeMs && intervalId) {
            clearInterval(intervalId);
        }
    };
    intervalId = setInterval(checkIfElementIsAvailable, timestepMs);
    checkIfElementIsAvailable();
};
