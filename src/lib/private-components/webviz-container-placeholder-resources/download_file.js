export default function download_file(filename, data){
    const link = document.createElement('a');

    link.setAttribute('href', 'data:text/plain;base64,' + data);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
