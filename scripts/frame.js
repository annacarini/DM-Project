// Make an instance of two and place it on the page.
class Frame {
    constructor(x, y, size, color, max_elements, two) {
        this.linewidth = THICK_LINE;

        this.x = x;
        this.y = y;

        this.two = two;

        this.group = new Two.Group();

        this.elements = [];
        this.max_elements = max_elements
        this.initialSize = size;
        this.size = size;
        this.color = color;

        // Font usato per scrivere i numeri dentro i frame (la misura deve dipendere dalla dimensione del frame)
        this.textStyle = fontStyleSmallBlackCentered;
        this.textStyle.weight = 450;
        this.textStyle.size = this.size / 6.8;

        this.sorted = false;
        this.texture = createCustomTexture(this.size, this.size, this.color, 'rgba(0, 0, 0, 0.2)', this.size / 40, this.size / 12)
        this.view = true

        this.rect = two.makeRectangle(0, 0, this.size, this.size);
        this.rect.opacity = 0.75;
        this.rect.linewidth = this.linewidth;

        this.rect_content = two.makeRectangle(0, -(size - this.linewidth)/2, size - this.linewidth, 0);
        this.rect_content.fill = this.color
        this.rect_content.noStroke()

        this.color_line = two.makeRectangle(0, size*0.6, size/2, this.linewidth*1.5);
        this.color_line.fill = "black";
        this.color_line.noStroke();
        this.color_line.visible = false;

        this.group.add(this.rect);
        this.group.add(this.rect_content);
        this.group.add(this.color_line);

        two.add(this.group);

        this.setPosition(x, y);

    }

    showColorLine(show) {
        this.color_line.fill = this.color;
        this.color_line.visible = show;
    }

    copy(frame) {
        this.fill(frame.elements);
        this.setColor(frame.color);
        this.setSorted(frame.sorted)
    }


    /****************** GET-SET ***********/

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.group.translation.set(x, y);
    }


    setView(value) {
        this.view = value;
        for (var i = 0; i < this.elements.length; i++) {
            var text = this.elements[i][1];
            text.visible = this.view;
        }
    }


    setSorted(value) {
        this.sorted = value;
        if (this.sorted == true && this.texture.loaded)
            this.rect_content.fill = this.texture
        else
            this.rect_content.fill = this.color
    }


    setColor(color) {
        this.color = color;
        this.texture = createCustomTexture(this.size, this.size, this.color, ColorManager.getDarkerColor(this.color), this.size / 40, this.size / 12)
        this.rect_content.opacity = 1;
        if (this.sorted && this.texture.loaded) {
            this.rect_content.fill = this.texture
        }
        else {
            this.rect_content.fill = color;
        }
    }


    getValue(indx) {
        return this.elements[indx][0];
    }


    getValues() {
        var ret = [];
        for (var i = 0; i < this.elements.length; i++) {
            ret.push(this.elements[i][0]);
        }
        return ret;
    }


    getRealSize() {
        return this.size * this.group.scale;
    }




    /********************* READ-WRITE *************************/

    resetFrame() {
        var ret = this.getValues();

        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i][1].remove();
        }
        this.elements = [];
        this.rect_content.position.y = - (this.rect.height - this.linewidth) / 2;
        this.rect_content.height = 0;

        return ret;
    }


    fill(new_elements) {
        this.elements = [];

        if (new_elements.length < 1) {
            return;
        }

        var offset = (this.size) / this.max_elements;
        this.rect_content.height = (offset * new_elements.length) - this.linewidth;
        this.rect_content.position.y = offset * (new_elements.length - this.max_elements) / 2;

        this.textStyle.size = this.size / 6.8;

        for (var i = 0; i < new_elements.length; i++) {
            var text = this.two.makeText(new_elements[i], this.rect_content.position.x, (i - ((this.max_elements - 1) / 2)) * offset, this.textStyle);
            text.visible = this.view;
            this.elements.push([new_elements[i], text]);
            this.group.add(text);
        }
    }


    addElement(element) {
        var offset = (this.size - this.linewidth) / this.max_elements
        this.rect_content.height += offset
        this.rect_content.position.y +=  offset / 2

        this.textStyle.size = this.size / 6.8;
        var text = this.two.makeText(element, 0, (this.elements.length - ((this.max_elements - 1) / 2)) * offset, this.textStyle)
        text.visible = this.view
        this.group.add(text)

        this.elements.push([element, text]);
    }


    removeElement(indx) {
        var element = this.elements.splice(indx, 1);
        var value = element[0][0];
        var text = element[0][1];

        var height_removed = (this.size - this.linewidth) / this.max_elements;
        this.rect_content.height -= height_removed;
        this.rect_content.position.y -=  height_removed / 2;

        // trasla gli elementi rimasti in alto
        for (var i = indx; i < this.elements.length; i++) {
            this.elements[i][1].position.y -= height_removed;
        }
        
        // se hai tolto tutti i numeri, metti l'altezza pari a zero
        if (this.elements.length == 0) {
            this.rect_content.height = 0;
        }

        text.remove();

        return value;
    }
    

    /******************* REDRAW **************/

    // Per il redraw quando cambia la misura della finestra
    resizeFrame(newSize) {
        var scaleFactor = newSize / this.initialSize;
        this.group.scale = scaleFactor;
    }

}
  