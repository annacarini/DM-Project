class Player {
    constructor(x, y, two) {

        this.two = two
        this.x = x
        this.y = y

        this.group = new Two.Group()
        this.play = two.makeCircle(x, y, 30)
        this.playStatus = false

        this.play.fill = 'gray'

        this.group.add(this.play)

        two.add(this.group)
        two.update();

        this.play._renderer.elem.addEventListener('click', () => {
            this._playTriggered()
        });
    }

    _playTriggered() {
        this.setPlayStatus(!this.playStatus)
    }


    getPlayStatus() {
        return this.playStatus
    }


    setPlayStatus(value) {
        this.playStatus = value
        if (this.playStatus == true) {
            this.play.fill = 'red'
        }
        else {
            this.play.fill = 'gray'
        }
    }
}
