export const checkIfUrlIsCurrent = (url: string) => {
    const r = new RegExp('^(?:[a-z]+:)?//', 'i');
    // Absolute URL
    if (r.test(url)) {
        return url === window.location.href;
    }
    else {
        const absoluteUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ":" : ""}${window.location.port}${window.location.pathname}${url}`;
        return absoluteUrl === window.location.href;
    }
};
