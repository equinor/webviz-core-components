export default function download_file({filename, data, mimeType}) {
    const link = document.createElement("a");

    if (data instanceof Blob) {
        link.setAttribute("href", URL.createObjectURL(data));
    } else {
        link.setAttribute("href", `data:${mimeType};base64,${data}`);
    }

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
