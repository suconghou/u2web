
export const webp = (() => document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0)();
export const webm = window.MediaSource && MediaSource.isTypeSupported(`video/webm;codecs="vp9"`)
export const timeBefore = time => {
    time = new Date(time).getTime();
    const dur = (+new Date() - time) / 1000;
    const f = [
        {
            t: 31536000,
            v: '年'
        },
        {
            t: 2592000,
            v: '个月'
        },
        {
            t: 604800,
            v: '星期'
        },
        {
            t: 86400,
            v: '天'
        },
        {
            t: 3600,
            v: '小时'
        },
        {
            t: 60,
            v: '分钟'
        },
        {
            t: 1,
            v: '秒'
        }
    ];
    for (let i = 0, j = f.length; i < j; i++) {
        const { t, v } = f[i];
        const c = Math.floor(dur / t);
        if (c !== 0 && c > 0) {
            return `${c}${v}前`;
        }
    }
    return '刚刚';
};

export const formatDuration = t => {
    if (t == 'P0D') {
        return '直播'
    }
    const m = { 'H': ':00:00', 'M': ':00', 'S': '' };
    const l = m[t.substr(-1)]
    const arr = t.match(/[0-9]\d{0,3}/g).map(v => v.length == 1 ? '0' + v : v)
    return arr.join(':') + l;
}

export const formatCount = c => {
    if (c < 1e4) {
        return `${c}次观看`
    }
    if (c < 1e5) {
        return `${(c / 1e4).toFixed(1)}万次观看`
    }
    return `${Math.round(c / 1e4)}万次观看`
}


export const z = t => {
    t = Math.round(t);
    if (t > 0) {
        if (t < 10) {
            return `0${t}`;
        }
        return `${t}`;
    }
    return "00";
};

export const timeDuration = t => {
    t = Math.round(t)
    const h = Math.floor(t / 3600);
    const m = Math.floor((t - h * 3600) / 60);
    const s = t - h * 3600 - m * 60;
    return `${h ? h + ":" : ""}${z(m)}:${z(s)}`;
};


export const addEventListenerOnce = (element, event, fn) => {
    const func = function (e) {
        element.removeEventListener(event, func);
        fn.call(this, e);
    };
    element.addEventListener(event, func);
};

export const byteFormat = size => {
    if (!size || size <= 0) {
        return '0 B';
    }
    const name = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let pos = 0;
    while (size >= 1024) {
        size /= 1024;
        pos++;
    }
    return size.toFixed(2) + ' ' + name[pos];
};

export const debounce = (func, delay) => {
    let inDebounce;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay);
    };
};

export class asyncQueue {
    constructor(tasks) {
        this.tasks = tasks;
        this.run();
    }
    push(task) {
        this.tasks.push(task);
        this.run();
    }
    clear() {
        this.tasks = []
    }
    async run() {
        if (this.runing) {
            return;
        }
        this.runing = true;
        let item;
        while ((item = this.tasks.shift())) {
            try {
                await item();
            } catch (e) {
                // ignore error
            }
        }
        this.runing = false;
    }
}
