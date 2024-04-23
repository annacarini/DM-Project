class Frame {

    constructor(two, x, y, size, color, values) {

        this.x = x;
        this.y = y;

        this.size = size;

        this.square = two.makeRectangle(x, y, size, size);
        this.square.fill = color;

        this.values = values;
    }

    setColor(color) {
        this.square.fill = color;
    }
}