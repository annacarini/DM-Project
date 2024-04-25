class Buffer {
    constructor(x, y, length, frameSize, two) {

        this.group = new Two.Group();

        this.two = two;

        this.x = x;
        this.y = y;
        this.frame_size = frameSize;
        this.length = length;
        this.spaceBetween = SPACE_BETWEEN_FRAMES;
        this.frames = [];

        this.linewidth = THICK_LINE;

        this.sortingStatus = 0;
        this._virtualFrames = Array(length, []);
        this._virtualOutputFrame = [];
        this.frameRefilled = Array(MAX_ELEMENTS_PER_FRAME, false);

        var spaceOutputFrame = 10;
        var totalWidth = length*frameSize + (length - 1 + spaceOutputFrame)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;
        for (var i = 0; i < length-1; i++) {
            //constructor(x, y, width, height, color, max_elements, two)
            var newFrame = new Frame(framePosition, y, frameSize, "white", MAX_ELEMENTS_PER_FRAME, two);
            newFrame.setView(1);
            this.frames.push(newFrame);
            this.group.add(newFrame.group);
            framePosition += frameSize + this.spaceBetween;
        }

        framePosition += spaceOutputFrame*SPACE_BETWEEN_FRAMES;
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


    _findMin() {
        var frameIndx = 0
        var indx = 0
        var min = Infinity

        for (var i = 0; i < this.frames.length; i++) {
            var fMin, fIndx = this.frames[i].findMin()
            if (fMin < min) {
                min = fMin
                indx = fIndx
                frameIndx = i
            }
        }
        return frameIndx, indx
    }


    _virtualFindMin() {
        var frameIndx = 0
        var indx = 0
        var min = Infinity

        for (var i = 0; i < this._virtualFrames.length; i++) {
            var frame = this._virtualFrames[i]
            for (var j = 0; j < frame.length; j++) {
                if (frame[j] < min) {
                    min = frame[j]
                    indx = j
                    frameIndx = i
                }
            }
        }
        return [frameIndx, indx]
    }


    _checkToRefill() {
        for (var i = 0; i < this.frames.length; i++) {
            if (this.frames[i].elements.length == 0) {
                if (this.sortRefilled[i])
                    return true
            }
        }
        return false
    }


    _checkVirtualEmptiness() {
        for (var i = 0; i < this._virtualFrames.length; i++) {
            if (this._virtualFrames[i].length)
                return false
        }
        return true
    }

    _checkVirtualToRefill() {
        for (var i = 0; i < this._virtualFrames.length; i++) {
            if (!this._virtualFrames[i].length && this.frameRefilled[i])
                return i + 1
        }
        return false
    }

    _checkVirtualToEmpty() {
        if (this._virtualOutputFrame.length == MAX_ELEMENTS_PER_FRAME)
            return true
        return false
    }


    read(frames, callback=null) {
        console.log(frames);
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            console.log(frame);
            this.frames[i].copy(frame);
            this._virtualFrames[i] = frame.elements;
            this.frameRefilled[i] = true;
        }

        // Se c'e' una callback chiamala
        if (callback != null) callback();
    }


    getPositionOfFrame(index) {
        if (index >= this.length) return null;
        return [this.frames[index].x, this.frames[index].y];
    }

    /*
    readWithAnimation(frames, callback=null) {
        console.log(frames);
        
        // Per chiamare la callback dobbiamo assicurarci che tutte le animazioni (sono frames.length) sono
        // terminate. Quindi in questa funzione teniamo traccia di quante animazioni terminano
        var callbacksReceived = 0;
        var callbacksCounter = () => {
            callbacksReceived++;
            if (callbacksReceived >= frames.length) {
                if (callback != null) callback();
            }
        }

        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            // Crea animazione
            var animationLength = 2;
            animateOneSquare(frame.x, frame.y, this.frames[i].x, this.frames[i].y, frame.size, frame.color, animationLength, () => {
                // Quando l'animazione e' completa esegui questo:
                this.frames[i].copy(frame);
                this._virtualFrames[i] = frame.elements;
                this.frameRefilled[i] = true;
                callbacksCounter();
            }).bind(this);
        }
    }
    */


    writeFromTo(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = frame.getValue(indx)
        frame.removeElement(indx)
        this.outputFrame.addElement(this.outputFrame.elements.length, value)
    }


    writeFromToAnimation(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = this._virtualFrames[frameIndx][indx]

        const removeTweens = frame.removeElementAnimation(indx, 1000)
        const waitTweens = new TWEEN.Tween(null).to(null, 200)
        const addTweens = this.outputFrame.addElementAnimation(value, 500)
        removeTweens[removeTweens.length - 1].chain(waitTweens)
        waitTweens.chain(addTweens[0])

        return [removeTweens[0], addTweens[addTweens.length - 1]]
    }


    writeFromOutputToMain() {
        this.outputFrame.resetFrame()
        this._virtualOutputFrame = []
    }


    _virtualWriteFromToAnimation(frameIndx, indx) {
        var value = this._virtualFrames[frameIndx][indx]

        this._virtualFrames[frameIndx].splice(indx, 1)
        this._virtualOutputFrame.push(value)
    }


    sort() {
        var tweens = []
        this.sortingStatus = this._checkVirtualEmptiness() + (this._checkVirtualToRefill() << 2) + (this._checkVirtualToEmpty() * 2)
        while (!this.sortingStatus) {
            var ret = this._virtualFindMin()
            var frameIndx = ret[0]
            var indx = ret[1]
            var writeTweens = this.writeFromToAnimation(frameIndx, indx)
            if (tweens.length)
                tweens[tweens.length - 1].chain(writeTweens[0])
            tweens.push(writeTweens[0], writeTweens[1])
            this._virtualWriteFromToAnimation(frameIndx, indx)
            this.sortingStatus = this._checkVirtualEmptiness() + (this._checkVirtualToRefill() << 2) + (this._checkVirtualToEmpty() * 2)
        }
        return tweens
    }



    // TEMPORANEA per testare se la scrittura dal buffer alla relazione funziona.
    // semplicemente ogni volta che la chiami copia il contenuto del primo frame pieno
    // che trova dentro l'output frame
    fakeSort(callback=null) {

        // Prendi la prima pagina vuota che trovi e copiala nell'output frame
        for (var i = 0; i < this.frames.length; i++) {
            if (this.frames[i].elements.length > 0) {
                this.outputFrame.fill(this.frames[i].getValues());
                this.frames[i].resetFrame();
                break;
            }
        }

        if (callback != null) callback();
    }


    // TEMPORANEA: restituisce il contenuto dell'output frame e lo svuota
    flushOutputFrame() {
        var res = {
            x: this.outputFrame.x,
            y: this.outputFrame.y,
            size: this.outputFrame.size,
            color: this.outputFrame.color,
            elements: this.outputFrame.getValues()
        }
        this.outputFrame.resetFrame();
        return res;
    }

    // TEMPORANEA: ti restituisce true se c'e' qualcosa dentro il buffer (escluso output frame), false se e' tutto vuoto
    bufferContainsSomething() {
        var res = false;
        for (var i = 0; i < this.frames.length; i++) {
            if (this.frames[i].elements.length > 0) {
                res = true;
                break;
            }
        }
        return res;
    }
}