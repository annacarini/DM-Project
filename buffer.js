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
        this.mode = 'sort';

        this.linewidth = THICK_LINE;
        this.outputFrameColor = "rgb(210, 210, 210)";

        this.sortingStatus = 0;
        this._virtualFrames = Array(length, []);
        this._virtualOutputFrame = [];
        this.frameRefilled = Array(MAX_ELEMENTS_PER_FRAME, false);
        this.framesToRefill = [];

        var spaceOutputFrame = 6;
        var totalWidth = length*frameSize + (length - 1 + spaceOutputFrame)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;

        // Crea i primi M-1 frame
        for (var i = 0; i < length; i++) {
            var newFrame = new Frame(framePosition, y, frameSize, "white", MAX_ELEMENTS_PER_FRAME, two);
            newFrame.setView(1);
            this.frames.push(newFrame);
            this.group.add(newFrame.group);
            framePosition += frameSize + this.spaceBetween;
        }

        // Crea output frame
        //framePosition += spaceOutputFrame*SPACE_BETWEEN_FRAMES;
        //this.outputFrame = new Frame(framePosition, y, frameSize, this.outputFrameColor, MAX_ELEMENTS_PER_FRAME, two)
        //this.outputFrame.setSorted(true)
        this.outputFrame = this.frames[this.frames.length - 1];

        // Aggiungi scritta "output frame"
        var textStyle = fontStyleSmallBlackCentered;
        textStyle.weight = 600;
        this.outputFrameTxt = two.makeText("Output frame", framePosition - (frameSize) + this.spaceBetween, y - frameSize * 0.6, textStyle);
        this.outputFrameTxt.visible = false

        this.group.add(this.outputFrame.group)
        this.group.add(this.outputFrameTxt)

        two.add(this.group)
    }


    getSorting() {
        return this.sorting
    }


    setPosition(x, y) {
        this.group.translation.set(x, y)
    }


    setMode(mode) {
        if (mode == 'sort') {
            this.mode = 'sort';
            this.outputFrameTxt.visible = false;
            this.outputFrame.setSorted(false);
            if (this.frames.length < this.length)
                this.frames.push(this.outputFrame);
                this.outputFrame.setPosition(this.outputFrame.x - this.spaceBetween, this.outputFrame.y);
        }
        else {
            this.mode = 'merge';
            this.outputFrameTxt.visible = true;
            this.frames.pop();
            this.outputFrame.setSorted(true);
            this.outputFrame.setPosition(this.outputFrame.x + this.spaceBetween, this.outputFrame.y);
        }
    }


    // Ritorna l'indice del frame dove è contenuto il valore più basso in tutto il buffer(output escluso)
    // Ritorna anche l'indice del valore all'interno del frame
    _findMin() {
        var frameIndx = 0
        var indx = 0
        var min = Infinity

        for (var i = 0; i < this.frames.length; i++) {
            var ret = this.frames[i].findMin()
            var fMin = ret[0]
            var fIndx = ret[1]
            if (fMin < min) {
                min = fMin
                indx = fIndx
                frameIndx = i
            }
        }
        return [frameIndx, indx]
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


    /***************** OPERAZIONI DI CHECK ***************************/

    // Controlla se non ci sono più elementi nel buffer (output escluso)
    // True: il buffer non contiene più elementi
    // False: il buffer contiene elementi
    checkEmptiness() {
        for (var i = 0; i < this.frames.length; i++) {
            if (this.frames[i].getValues().length)
                return false
        }
        return true
    }


    // Controlla se c'è un frame senza valori. Ritorna un numero > 0 se le due condizioni sono vere:
    // 1) Esiste un frame vuoto
    // 2) Il frame non ha mai chiesto un refill -- oppure --
    //      l'ultima volta che il frame ha chiesto il refill è stato ricaricato
    checkToRefill() {
        var toRefill = [];

        for (var i = 0; i < this.frames.length; i++) {
            if (!this.frames[i].getValues().length && this.frameRefilled[i])
                toRefill.push(i);
        }
        return toRefill;
    }


    // Ritorna true se l'output è pineo
    checkFullOutput() {
        if (this.outputFrame.getValues().length == MAX_ELEMENTS_PER_FRAME)
            return true
        return false
    }

    /***********************************************************/


    writeOnBuffer(frames, callback=null) {
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            this.frames[i].copy(frame);
            this._virtualFrames[i] = frame.elements;
            this.frameRefilled[i] = frame.toRefill;
        }

        // Se c'e' una callback chiamala
        if (callback != null) callback();
    }


    writeOnBufferFrame(frame, indx, callback = null) {
        this.frames[indx].copy(frame)
        console.log("Il frame: ", indx, " da refillare?: ", frame.toRefill)
        this.frameRefilled[indx] = frame.toRefill;
        if (callback != null) callback();
    }


    // Rimuove un elemento all'indice indx dal frame con indice FrameIndx.
    // Poi scrive tale elemento nell'output.
    writeFromTo(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = frame.getValue(indx)
        frame.removeElement(indx)
        this.outputFrame.addElement(value)
    }


    // Crea e ritorna una catena di animazioni che rimuove un elemento e poi lo scrive nel buffer
    writeFromToAnimation(frameIndx, indx) {
        var frame = this.frames[frameIndx]
        var value = this.frames[frameIndx].getValue(indx)

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


    _findLastValues(n) {
        var values = []
        for (var i = 0; i < this.frames.length; i++) {
            var newValues = this.frames[i].getValues()
            for (var j = 0; j < newValues.length; j++) {
                var newValue = newValues[j]
                var m = 0
                while (m < values.length && newValue >= values[m][0] && m < n)
                    m++;
                values.splice(m, 0, [newValue, j, i])
            }
        }

        return values.slice(0, n)
    }


    sort() {
        // Inserisco in list tutti valori presenti nei frames e nel frattempo resetto i frames
        var list = [];
        for (var frame of this.frames) {
            var frameValues = frame.getValues();
            for (var i = 0; i < frameValues.length; i++)
                list.push(frameValues[i]);
            frame.resetFrame();
            frame.setSorted(true);
        }
        console.log("LA LISTA E'", list);
        list.sort((a, b) => a - b);
        console.log("LA LISTA E'", list);

        // Inserisco nei frames i nuovi valori ordinati
        for (var i = 0; i < list.length; i++) {
            this.frames[Math.floor(i / MAX_ELEMENTS_PER_FRAME)].addElement(list[i]);
        }
        
    }


    merge() {
        // Ottengo un array contenente gli n valori più piccoli prensenti nel buffer, dove n sono gli elementi mancanti nell'output
        var lastValues = this._findLastValues(MAX_ELEMENTS_PER_FRAME - this.outputFrame.getValues().length)
        
        // Creo un array di un numero di array pari ai frames. Setto tutto a zero
        var deleted = Array(this.length - 1)
        for (var i = 0; i < deleted.length; i++)
            deleted[i] = Array(this.frames[i].getValues().length).fill(0)

        // Fino a che non scorro tutti i valori chiamo la writeFromTo sull'attuale valore.
        // Quando un frame diventa vuoto e va ricaricato mi fermo.
        for (var i = 0; i < lastValues.length; i++) {
            var frameIndx = lastValues[i][2]
            var indx = lastValues[i][1]
            var toShift = indx ? deleted[frameIndx][indx - 1] : 0 // Shifto indx se alcuni numeri prima dell'indx sono stati eliminati
            this.writeFromTo(frameIndx, indx - toShift)
            for (var j = indx; j < deleted[frameIndx].length; j++)
                deleted[frameIndx][j] += 1
            // Se un frame è da refillare blocco
            if (deleted[frameIndx][deleted[frameIndx].length -1] == deleted[frameIndx].length && this.frameRefilled[frameIndx])
                break
        }
    }


    sortStepAnimation(callback = () => {}) {
        this.sortingStatus = this.checkEmptiness() + (this.checkFullOutput() * 2)
        if (this.sortingStatus == 0) {
            var ret = this._findMin()
            var frameIndx = ret[0]
            var indx = ret[1]

            var tweens = this.writeFromToAnimation(frameIndx, indx)
            var onComplete = tweens[1]._onCompleteCallback
            tweens[1].onComplete(() => {onComplete(); callback})
            tweens[0].start()
        }
        else
            callback()
    }

    
    sortAnimation(time = 200, callback = () => {}) {
        this.sort();
        var tween = new TWEEN.Tween(null).to(null, time).onComplete(() => {callback()})
        tween.start();
        return tween;
    }


    mergeAnimation(time = 200, sortCallback = () => {}, mergeCallback = () => {}) {
        this.merge();
        var tween = new TWEEN.Tween(null).to(null, time).onComplete( () => {
                this.sortingStatus = this.checkEmptiness() + (this.checkFullOutput() * 2);
                this.framesToRefill = this.checkToRefill();
                if (this.framesToRefill.length) {
                    for (var i = 0; i < this.framesToRefill.length; i++)
                        this.frameRefilled[this.framesToRefill[i]] = false;
                    mergeCallback();
                }
                else
                    sortCallback();
            }
        )
        tween.start();

        return tween;
    }


    getPositionOfFrame(index) {
        if (index >= this.length) return null;
        return [this.frames[index].x, this.frames[index].y];
    }


    // Restituisce il contenuto dell'output frame e lo svuota
    flushOutputFrame() {
        var res = {
            x: this.outputFrame.x,
            y: this.outputFrame.y,
            size: this.outputFrame.realSize(),
            color: this.outputFrame.color,
            elements: this.outputFrame.getValues(),
            sorted: this.outputFrame.sorted
        }
        this.outputFrame.resetFrame();
        return res;
    }

    // Restituisce il contenuto di tutto il buffer e lo svuota
    clear() {
        var res = [];
        for (var frame of this.frames) {
            var frameInfo = {
                x: frame.x,
                y: frame.y,
                size: frame.realSize(),
                color: frame.color,
                elements: frame.getValues(),
                sorted: frame.sorted
            }
            if (frameInfo.elements.length)
                res.push(frameInfo);
            frame.resetFrame();
        }
        return res;
    }

    // Restituisce true se c'e' qualcosa dentro il buffer (escluso output frame), false se e' tutto vuoto
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



    // Da chiamare quando cambia la dimensione della finestra
    redrawBuffer(x, y) {

        var spaceOutputFrame = 6;
        var totalWidth = this.frames.length*frameSize + (this.frames.length - 1 + spaceOutputFrame)*SPACE_BETWEEN_FRAMES;
        var framePosition = x - totalWidth/2 + frameSize/2;

        // Ridimensiona e riposiziona i frame
        for (var i = 0; i < this.frames.length; i++) {
            /*
            var newFrame = new Frame(framePosition, y, frameSize, "white", MAX_ELEMENTS_PER_FRAME, two);
            newFrame.setView(1);
            this.frames.push(newFrame);
            this.group.add(newFrame.group);
            */

            this.frames[i].resizeFrame(frameSize);
            this.frames[i].setPosition(framePosition, y);
            framePosition += frameSize + this.spaceBetween;
        }

        // Ridimensiona output frame
        this.outputFrame.resizeFrame(frameSize);

        // Riposiziona output frame
        framePosition += spaceOutputFrame*SPACE_BETWEEN_FRAMES;
        this.outputFrame.setPosition(framePosition, y);

        // Leva e ri-aggiungi scritta "output frame"
        this.outputFrameTxt.remove();
        var textStyle = fontStyleSmallBlackCentered;
        textStyle.weight = 600;
        this.outputFrameTxt = two.makeText("Output frame", framePosition, y - frameSize * 0.6, textStyle);
        this.group.add(this.outputFrameTxt);
    }
    
    /****************** UNDO *****************/
    undoWriteOnBuffer() {
        for (var i = 0; i < this.frames.length; i++) {
            this.frames[i].resetFrame();
            this.frameRefilled[i] = false;
        }
    }


    undoSortAnimation(oldFramesValues) {
        for (var i = 0; i < oldFramesValues.length; i++) {
            this.frames[i].resetFrame();
            this.frames[i].fill(oldFramesValues[i]);
            this.frames[i].setSorted(false);
        }
    }


    undoMergeAnimation(oldFramesValues) {
        for (var i = 0; i < oldFramesValues.length - 1; i++) {
            this.frames[i].resetFrame();
            this.frames[i].fill(oldFramesValues[i]);
        }
        this.outputFrame.resetFrame();
        this.outputFrame.fill(oldFramesValues[oldFramesValues.length - 1]);
        for (var i = 0; i < this.framesToRefill.length; i++)
            this.frameRefilled[this.framesToRefill[i]] = true;
        this.framesToRefill = [];
    }

    undoFlushOutputFrame(oldValues) {
        this.outputFrame.resetFrame();
        this.outputFrame.fill(oldValues);
    }


    undoWriteOnBufferFrame(indx) {
        this.frames[indx].resetFrame();
        this.frameRefilled[indx] = false;
    }
}