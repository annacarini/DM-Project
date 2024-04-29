
class Section {

    constructor(dom_element) {
        //console.log(dom_element);

        // Dimensioni
        var rect = dom_element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        // Centro
        var x = Math.round(rect.left + this.width/2);
        var y = Math.round(rect.top + this.height/2);
        this.center = Point2D(x, y);
        
        // Angoli
        this.topLeftCorner = Point2D(Math.round(x - this.width/2), Math.round(y - this.height/2));
        this.topRightCorner = Point2D(Math.round(x + this.width/2), Math.round(y - this.height/2));
        this.bottomLeftCorner = Point2D(Math.round(x - this.width/2), Math.round(y + this.height/2));
        this.bottomRightCorner = Point2D(Math.round(x + this.width/2), Math.round(y + this.height/2));

        //console.log(this);
    }
}



function Point2D(x, y) {
    return {
        x: x,
        y: y
      }
}