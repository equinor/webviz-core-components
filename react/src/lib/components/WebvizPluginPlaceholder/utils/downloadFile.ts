/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function downloadFile({
    filename,
    data,
    mimeType,
}: {
    filename: string;
    data: Blob | string;
    mimeType: string;
}): void {
    let src: string | undefined = undefined;
    const link = document.createElement("a");
    if (data instanceof Blob) {
        src = URL.createObjectURL(data);
        link.setAttribute("href", src);
    } else {
        link.setAttribute("href", `data:${mimeType};base64,${data}`);
    }

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (src) {
        URL.revokeObjectURL(src);
    }
}
