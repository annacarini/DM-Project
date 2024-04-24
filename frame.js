// Make an instance of two and place it on the page.
class Frame {
    constructor(x, y, size, color, max_elements, two) {
        this.linewidth = THICK_LINE;

        this.x = x;
        this.y = y;
        this.size = size;

        this.two = two;

        this.group = new Two.Group();

        this.elements = [];
        this.max_elements = max_elements
        this.color = color

        this.sorted = false
        this.view = 1 // 0 relation, 1 buffer

        this.rect = two.makeRectangle(0, 0, this.size, this.size);
        this.rect.opacity = 0.75;
        this.rect.linewidth = this.linewidth

        this.rect_content = two.makeRectangle(0, -(size - this.linewidth)/2, size- this.linewidth, 0);
        this.rect_content.fill = this.color
        this.rect_content.noStroke()

        this.rect_search = two.makeRectangle(0, -(size - this.linewidth)/2 + ((this.size - 5) / this.max_elements)/2, size - this.linewidth, (this.size - 5) / this.max_elements)
        this.rect_search.fill = "rgba(0, 0, 0, 0.5)"
        this.rect_search.noStroke()
        this.rect_search.visible = false

        this.group.add(this.rect)
        this.group.add(this.rect_content)
        this.group.add(this.rect_search)

        two.add(this.group)

        this.setPosition(x, y);

        this._yPosition = []
        var offset = (this.size - this.linewidth)/this.max_elements
        for (var i = 0; i < this.max_elements; i++) {
            this._yPosition.push(offset * (i - (this.max_elements - 1)/2))
        }


        // PROVA CLICK HANDLER (funziona!), nota: bisogna per forza fare two.update() prima di assegnare l'event listener, se no non funziona!!
        two.update();
        this.group._renderer.elem.addEventListener('click', () => {
            console.log("Content: " + this.elements);   // quando clicchi ti stampa nella console gli elementi di questo frame
        }, false);
    }


    getValue(indx) {
        return this.elements[indx][0]
    }


    getValues() {
        var ret = []
        for (var i = 0; i < this.elements.length; i++) {
            ret.push(this.elements[i][0])
        }
        return ret
    }

    
    setPosition(x, y) {
        this.x = x
        this.y = y
        this.group.translation.set(x, y)
    }


    setView(value) {
        this.view = value
        for (var i = 0; i < this.elements.length; i++) {
            var text = this.elements[i][1]
            text.visible = this.view
        }
    }


    setSorted(value) {
        this.sorted = value
        if (this.sorted == true) {
            //aggiungere la texture
        }
        else {
            //rimuovere la texture
        }
    }


    setColor(color) {
        //cambiare colore
        this.rect_content.fill = color;     // DA CONTROLLARE
        this.color = color;                 // serve per far funzionare la funzione "mergeSiblings" di relation
    }


    copy(frame) {
        this.fill(frame.getValues())
        this.setColor(frame.color)
    }


    _resetRectSearch() {
        this.rect_search.position.y = -(this.size - this.linewidth)/2 + ((this.size - 5) / this.max_elements)/2
        this.rect_search.visible = false
    }


    resetFrame() {
        var ret = this.getValues()

        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i][1].remove()
        }
        this.elements = []
        this.rect_content.position.y = - (this.rect.height - this.linewidth) / 2
        this.rect_content.height = 0

        return ret
    }


    fill(new_elements) {
        this.elements = []
        var offset = (this.size) / this.max_elements
        this.rect_content.height = (offset * new_elements.length) - this.linewidth
        this.rect_content.position.y = offset * (new_elements.length - this.max_elements) / 2

        for (var i = 0; i < new_elements.length; i++) {
            var text = this.two.makeText(new_elements[i], this.rect_content.position.x, (i - ((this.max_elements - 1) / 2)) * offset)
            text.visible = this.view
            this.elements.push([new_elements[i], text]);
            this.group.add(text)
        }
    }


    addElement(element) {
        var offset = (this.size - this.linewidth) / this.max_elements
        this.rect_content.height += offset
        this.rect_content.position.y +=  offset / 2

        var text = this.two.makeText(element, 0, (this.elements.length - ((this.max_elements - 1) / 2)) * offset)
        text.visible = this.view
        this.group.add(text)

        this.elements.push([element, text]);
    }


    addElementAnimation(element, time) {
        const tween = new TWEEN.Tween(this.rect_search).to({opacity: 0}, time / 2)
        tween.onStart(() => {
            this.addElement(element)
            this.rect_search.position.y = (this.size - this.linewidth)/2 - (this.max_elements - this.elements.length + 0.5)*(this.size - this.linewidth) / this.max_elements;
            this.rect_search.visible = true;
        })
        const tween2 = new TWEEN.Tween(this.rect_search).to({opacity: 1}, time / 2)
        tween.chain(tween2)
        tween2.onComplete(() => {this._resetRectSearch();})

        return [tween, tween2]
    }


    removeElement(indx) {
        var element = this.elements.splice(indx, 1);
        var value = element[0][0]
        var text = element[0][1]

        var height_removed = (this.size - this.linewidth) / this.max_elements
        this.rect_content.height -= height_removed
        this.rect_content.position.y -=  height_removed / 2
        for (var i = indx; i < this.elements.length; i++) {
            this.elements[i][1].position.y -= height_removed
        }

        text.remove()

        return value
    }


    removeElementAnimation(indx, time) {
        const tween = new TWEEN.Tween(this.rect_search).to({opacity: 0}, time / 2)
        tween.onStart(() => {
            this.rect_search.position.y += (this.rect_search.height * indx);
            this.rect_search.visible = true;
        })
        const tween2 = new TWEEN.Tween(this.rect_search).to({opacity: 1}, time / 2)
        tween.chain(tween2)
        tween2.onComplete(() => {this._resetRectSearch(); this.removeElement(indx)})

        return [tween, tween2]
    }


    findAnimation(indx, time) {
        const offset = this.rect_search.height
        var new_y = this.rect_search.position.y
        var group = new TWEEN.Group()
        var last_tween = null
        var new_tween = null

        var i = 0
        while (i < indx) {
            new_y += offset
            new_tween = new TWEEN.Tween(null, group).to(null, time/indx)
            if (last_tween != null)
                last_tween.chain(new_tween)
            else
                new_tween.start()
            last_tween = new_tween
            new_tween = new TWEEN.Tween(this.rect_search.position, group).to({y: new_y}, 0)
            last_tween.chain(new_tween)
            last_tween = new_tween
            i++
        }
        if (last_tween != null) {
            last_tween.onComplete(this._resetRectSearch)
        }

        return group
    }


    findMax() {
        var max = 0
        var indx = -1
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] > max) {
                max = this.elements[i]
                indx = i
            }
        }
        return max, indx
    }


    findMin() {
        var min = Infinity
        var indx = -1
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] < min) {
                min = this.elements[i]
                indx = i
            }
        }
        return min, indx
    }
}
  