
class Section {
    constructor(x, y, width, height) {
        
        // Dimensioni
        this.width = width;
        this.height = height;

        // Centro
        this.center = Point2D(x, y);
        
        // Angoli
        this.topLeftCorner = Point2D(Math.round(x - width/2), Math.round(y - height/2));
        this.topRightCorner = Point2D(Math.round(x + width/2), Math.round(y - height/2));
        this.bottomLeftCorner = Point2D(Math.round(x - width/2), Math.round(y + height/2));
        this.bottomRightCorner = Point2D(Math.round(x + width/2), Math.round(y + height/2));
    }
}



function Point2D(x, y) {
    return {
        x: x,
        y: y
      }
}