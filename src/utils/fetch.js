import Papa from 'papaparse'


export async function parseCsv(filename) {
    const response = await fetch(filename);
    const data = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function (results) {
                resolve({
                    header: results.meta.fields,
                    rows: results.data,
                });
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

export async function getFile(filename) {
    const response = await fetch("/" + filename);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
}