export default class {
    constructor(fn, reset, duration) {
        this.fn = fn;
        this.duration = duration;
        this.fnReset = reset;
    }
    start() {
        this.stoped = false;
        this.init();
    }
    stop() {
        clearTimeout(this.timer);
        this.stoped = true;
    }
    reset() {
        if (this.played) {
            this.played = false;
            this.fnReset();
            this.start();
        }
    }
    delay() {
        this.delayed = true;
    }
    do() {
        this.fn();
        this.played = true;
    }
    init() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.delayed) {
                this.delayed = false;
            }
            else {
                if (!this.played) {
                    this.do();
                }
            }
            if (!this.stoped) {
                this.init();
            }
        }, this.duration);
    }
}
