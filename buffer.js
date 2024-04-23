class Buffer {
    constructor(x, y, length, frameSize, two) {

        this.group = new Two.Group();

        this.two = two

        this.x = x
        this.y = y
        this.frame_size = frameSize
        this.length = length
        this.spaceBetween = SPACE_BETWEEN_FRAMES;
        this.frames = []

        this.linewidth = THICK_LINE

        this.sorting = false

        var spaceOutputFrame = 10
        var totalWidth = length*frameSize + (length - 1 + spaceOutputFrame)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;
        for (var i = 0; i < length; i++) {
            var newFrame = new Frame(framePosition, y, frameSize, "white", MAX_ELEMENTS_PER_FRAME, two)
            newFrame.setView(1)
            this.frames.push(newFrame)
            this.group.add(newFrame.group)
            framePosition += frameSize + this.spaceBetween;
        }

        framePosition += spaceOutputFrame*SPACE_BETWEEN_FRAMES
        this.outputFrame = new Frame(framePosition, y, frameSize, "rgb(255, 0, 0)", MAX_ELEMENTS_PER_FRAME, two)
        var txt = two.makeText("Output frame", framePosition, y - frameSize * 0.6, fontSizeSmall);
        this.group.add(this.outputFrame.group)
        this.group.add(txt)

        two.add(this.group)
    }


    getSorting() {
        return this.sorting
    }


    setPosition(x, y) {
        this.group.translation.set(x, y)
    }


    read(frames) {
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i]
            this.frames[i].copy(frame)
        }
    }


    writeFromTo(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = frame.getValue(indx)
        frame.removeElement(indx)
        this.outputFrame.addElement(this.outputFrame.elements.length, value)
    }


    writeFromToAnimation(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = frame.getValue(indx)

        const removeTweens = frame.removeElementAnimation(indx, 1000)
        const waitTweens = new TWEEN.Tween(null).to(null, 200)
        const addTweens = this.outputFrame.addElementAnimation(value, 500)
        removeTweens[removeTweens.length - 1].chain(waitTweens)
        waitTweens.chain(addTweens[0])

        return [removeTweens[0], addTweens[addTweens.length - 1]]
    }


    sort() {
        this.sorting = true

    }
}