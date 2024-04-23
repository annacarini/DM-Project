class Buffer {
    constructor(length, frame_width, height, max_elements, two) {

        this.group = new Two.Group();

        this.two = two

        this.frame_width = frame_width
        this.height = height
        this.length = length

        this.frames = []

        this.linewidth = 5
        this.rect = two.makeRectangle(0, 0, (length - 1) * frame_width, height);
        this.rect_output = two.makeRectangle((length - 1) * frame_width, 0, frame_width, height)
        this.rect.linewidth = this.linewidth
        this.rect_output.linewidth = this.linewidth

        this.output_frame = new Frame(frame_width, height, "rgb(255, 0, 0)", max_elements, two)
        this.output_frame.setPosition((length - 1) * frame_width, 0)
        this.max_elements = max_elements

        this.group.add(this.rect);
        this.group.add(this.rect_output);
        this.group.add(this.output_frame.group)

        two.add(this.group)
    }


    getToSort() {
        return 1
    }


    setPosition(x, y) {
        this.group.translation.set(x, y)
    }


    read(frames) {
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i]
            frame.setPosition((this.group.position.x) - (((this.length / 2) - i) * this.frame_width), this.group.position.y)
            this.group.add(frame)
            this.frames.push(frame)
        }
    }


    writeFromTo(frame, indx) {
        var value = frame.getValue(indx)
        frame.removeElement(indx)
        this.output_frame.addElement(frame.elements.length - 1, value)
    }


    writeFromToAnimation(frame, indx) {
        var value = frame.getValue(indx)
        const rem_group = frame.removeElementAnimation(indx, 1000)
        const add_group = this.output_frame.addElementAnimation(frame.elements.length - 1, value, 500)

        return rem_group
    }

}