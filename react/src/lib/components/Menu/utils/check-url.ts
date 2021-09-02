export const checkIfUrlIsCurrent = (url: string) => {
    if (url.charAt(0) === "/") {
        url = url.substr(1);
    }
    const base = window.location.href;
    const stack = base.split("/"),
        parts = url.split("/");
    stack.pop(); // remove current file name (or empty string)
    // (omit if "base" is the current folder without trailing slash)
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == ".") continue;
        if (parts[i] == "..") stack.pop();
        else stack.push(parts[i]);
    }
    return stack.join("/") === window.location.href;
};
