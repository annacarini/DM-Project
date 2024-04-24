class Frame {
    constructor(x, y, width, height, color, max_elements, two) {
        this.linewidth = THICK_LINE;

        this.x = x;
        this.y = y;
        this.size = width;

        this.two = two;

        this.group = new Two.Group();

        this.elements = [];
        this.max_elements = max_elements
        this.width = width
        this.height = height
        this.color = color

        this.sorted = false
        this.view = 1 // 0 relation, 1 buffer

        this.rect = two.makeRectangle(0, 0, this.width, this.height);
        this.rect.opacity = 0.75;
        this.rect.linewidth = this.linewidth

        this.rect_content = two.makeRectangle(0, -(height - this.linewidth)/2, width - this.linewidth, 0);
        this.rect_content.fill = this.color
        this.rect_content.noStroke()

        this.rect_search = two.makeRectangle(0, -(height - this.linewidth)/2 + ((this.height - 5) / this.max_elements)/2, width - this.linewidth, (this.height - 5) / this.max_elements)
        this.rect_search.fill = "rgba(0, 0, 0, 0.5)"
        this.rect_search.noStroke()
        this.rect_search.visible = false

        this.group.add(this.rect)
        this.group.add(this.rect_content)
        this.group.add(this.rect_search)

        two.add(this.group)

        this.setPosition(x, y);


        // PROVA CLICK HANDLER (funziona!), nota: bisogna per forza fare two.update() prima di assegnare l'event listener, se no non funziona!!
        two.update();
        this.group._renderer.elem.addEventListener('click', () => {
            console.log("Content: " + this.elements);   // quando clicchi ti stampa nella console gli elementi di questo frame
        }, false);
    }


    getValue(indx) {
        return this.elements[indx][0]
    }

    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.group.translation.set(x, y);
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


    _resetRectSearch() {
        this.rect_search.position.y = -(this.height - this.linewidth)/2 + ((this.height - 5) / this.max_elements)/2
        this.rect_search.visible = false
    }


    resetFrame() {
        var ret = this.elements;
        for (let i=0; i < this.elements.length; i++) {
            this.elements[i][1].remove();
            //this.elements[i][1].opacity = 0.4;
        }
        this.elements = [];
        
        //cambiare colore
        //this.rect_content.opacity = 0;  // TEMPORANEO

        return ret
    }


    fill(new_elements) {
        var offset = (this.height) / this.max_elements
        this.rect_content.height = (offset * new_elements.length) - this.linewidth
        this.rect_content.position.y = offset * (new_elements.length - this.max_elements) / 2

        for (var i = 0; i < new_elements.length; i++) {
            var text = this.two.makeText(new_elements[i], this.rect_content.position.x, (i - (Math.floor(this.max_elements / 2))) * offset)
            text.visible = this.view
            this.elements.push([new_elements[i], text]);
            this.group.add(text)
        }
    }


    addElement(indx, element) {
        var offset = (this.height - this.linewidth) / this.max_elements
        this.rect_content.height += offset
        this.rect_content.position.y +=  offset / 2

        var text = this.two.makeText(element, this.rect_content.position.x, (indx - (Math.floor(this.max_elements / 2))) * offset)
        text.visible = this.view
        this.group.add(text)

        this.elements.splice(indx, 0, [element, text]);
    }


    addElementAnimation(indx, element, time) {
        var group = new TWEEN.Group()

        this.addElement(indx, element)

        this.rect_search.position.y += (this.rect_search.height * indx)
        this.rect_search.visible = true

        const tween = new TWEEN.Tween(this.rect_search, group).to({opacity: 0}, time / 2)
        const tween2 = new TWEEN.Tween(this.rect_search, group).to({opacity: 1}, time / 2)
        tween.chain(tween2)
        tween2.onComplete(() => {this._resetRectSearch()})

        tween.start()
        return group
    }


    removeElement(indx) {
        console.log(indx)
        var element = this.elements.splice(indx, 1);
        var value = element[0][0]
        var text = element[0][1]

        var height_removed = (this.height - this.linewidth) / this.max_elements
        this.rect_content.height -= height_removed
        this.rect_content.position.y -=  height_removed / 2

        text.remove()

        return value
    }


    removeElementAnimation(indx, time) {
        var group = new TWEEN.Group()

        this.rect_search.position.y += (this.rect_search.height * indx)
        this.rect_search.visible = true
    
        const tween = new TWEEN.Tween(this.rect_search, group).to({opacity: 0}, time / 2)
        const tween2 = new TWEEN.Tween(this.rect_search, group).to({opacity: 1}, time / 2)
        tween.chain(tween2)
        tween2.onComplete(() => {this._resetRectSearch(); this.removeElement(indx)})

        tween.start()
        return group
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
  