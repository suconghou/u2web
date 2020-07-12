
export const toStream = (datas) => {
    const init = {};
    const get = async () => {
        const data = datas.shift()
        const done = !data;
        return {
            data,
            done,
            err: null,
        }
    }
    const process = async (c) => {
        const { data, done, err } = await get()
        if (err) {
            c.error(err)
            return
        }
        if (data) {
            c.enqueue(new Uint8Array(data))
        }
        if (done) {
            c.close()
        }
    }
    const body = new ReadableStream({
        async start(c) {
            await process(c)
        },
        async pull(c) {
            await process(c)
        }
    })
    return new Response(body, init)
}


export const download = (blob, fileName) => {
    if (window.navigator.msSaveOrOpenBlob) {
        return navigator.msSaveBlob(blob, fileName);
    }
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    }, 200);
};


export const saveBuffer = async (datas, fileName) => {
    const resp = toStream(datas)
    const blob = await resp.blob()
    download(blob, fileName)
}

