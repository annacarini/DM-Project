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
        this.outputFrameColor = "rgb(210, 210, 210)";

        this.sortingStatus = 0;
        this._virtualFrames = Array(length, []);
        this._virtualOutputFrame = [];
        this.frameRefilled = Array(MAX_ELEMENTS_PER_FRAME, false);
        this.frameToRefill = -1

        var spaceOutputFrame = 6;
        var totalWidth = length*frameSize + (length - 1 + spaceOutputFrame)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;

        // Crea i primi M-1 frame
        for (var i = 0; i < length-1; i++) {
            var newFrame = new Frame(framePosition, y, frameSize, "white", MAX_ELEMENTS_PER_FRAME, two);
            newFrame.setView(1);
            this.frames.push(newFrame);
            this.group.add(newFrame.group);
            framePosition += frameSize + this.spaceBetween;
        }

        // Crea output frame
        framePosition += spaceOutputFrame*SPACE_BETWEEN_FRAMES;
        this.outputFrame = new Frame(framePosition, y, frameSize, this.outputFrameColor, MAX_ELEMENTS_PER_FRAME, two)
        this.outputFrame.setSorted(true)

        // Aggiungi scritta "output frame"
        var textStyle = fontStyleSmallBlackCentered;
        textStyle.weight = 600;
        var txt = two.makeText("Output frame", framePosition, y - frameSize * 0.6, textStyle);
        
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
        for (var i = 0; i < this.frames.length; i++) {
            if (!this.frames[i].getValues().length && this.frameRefilled[i])
                return i
        }
        return -1
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
            this.frameRefilled[i] = true;
        }

        // Se c'e' una callback chiamala
        if (callback != null) callback();
    }


    writeOnBufferFrame(frame, indx, callback = null) {
        this.frames[indx].copy(frame)
        this.frameRefilled[indx] = true;
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


    sort(merge = false) {
        // Ottengo un array contenente gli n valori più piccoli prensenti nel buffer, dove n sono gli elementi mancanti nell'output
        var lastValues = this._findLastValues(MAX_ELEMENTS_PER_FRAME - this.outputFrame.getValues().length)
        
        // Creo un array di un numero di array pari ai frames. Setto tutto a zero
        var deleted = Array(this.length - 1)
        for (var i = 0; i < deleted.length; i++)
            deleted[i] = Array(this.frames[i].getValues().length).fill(0)

        // Fino a che non scorro tutti i valori chiamo la writeFromTo sull'attuale valore.
        // Se merge è true mi fermo prima, cioè quando un frame diventa vuoto.
        for (var i = 0; i < lastValues.length; i++) {
            var frameIndx = lastValues[i][2]
            var indx = lastValues[i][1]
            var toShift = indx ? deleted[frameIndx][indx - 1] : 0 // Shifto indx se alcuni numeri prima dell'indx sono stati eliminati
            this.writeFromTo(frameIndx, indx - toShift)
            for (var j = indx; j < deleted[frameIndx].length; j++)
                deleted[frameIndx][j] += 1
            // Se un frame è da refillare blocco
            if (merge && deleted[frameIndx][deleted[frameIndx].length -1] == deleted[frameIndx].length && this.frameRefilled[frameIndx])
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


    sortAnimation(sortCallback = () => {}, mergeCallback = () => {}, merge = false) {
        this.sort(merge)
        console.log("Prima del tween quando merge", merge)
        var tween = new TWEEN.Tween(null).to(null, 200).onComplete( () => {
                this.sortingStatus = this.checkEmptiness() + (this.checkFullOutput() * 2);
                this.frameToRefill = this.checkToRefill();
                if (merge && this.frameToRefill != -1) {
                    this.frameRefilled[this.frameToRefill] = false;
                    mergeCallback();}
                else
                    sortCallback();}
        )
        tween.start()
    }


    getPositionOfFrame(index) {
        if (index >= this.length) return null;
        return [this.frames[index].x, this.frames[index].y];
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
            elements: this.outputFrame.getValues(),
            sorted: this.outputFrame.sorted
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