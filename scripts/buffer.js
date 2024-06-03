class Buffer {
    constructor(x, y, length, frameSize, two) {

        this.group = new Two.Group();

        this.two = two;

        this.x = x;
        this.y = y;
        this.frame_size = frameSize;
        this.length = length;
        this.spaceBetween = SPACE_BETWEEN_FRAMES;
        this.spaceOutputFrame = 3;
        this.frames = [];
        this.mode = 'sort';

        this.linewidth = THICK_LINE;
        this.outputFrameColor = "rgb(210, 210, 210)";

        this.frameRefilled = Array(MAX_ELEMENTS_PER_FRAME, false);
        this.framesToRefill = [];

        this.mode = "sort"; // serve salvarlo per il redraw

        var totalWidth = length*frameSize + (length - 1)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;

        // Crea i frame
        for (var i = 0; i < length; i++) {
            var newFrame = new Frame(framePosition, y, frameSize, "hsl(0,0%,100%)", MAX_ELEMENTS_PER_FRAME, two);
            newFrame.setView(1);
            this.frames.push(newFrame);
            this.group.add(newFrame.group);
            framePosition += frameSize + this.spaceBetween;
        }

        // Assegna output frame
        this.outputFrame = this.frames[this.frames.length - 1];

        // Aggiungi scritta "output frame"
        var textStyle = fontStyleSmallBlackCentered;
        textStyle.weight = 600;
        this.outputFrameTxt = two.makeText("Output frame", framePosition - frameSize - this.spaceBetween + (this.spaceBetween*this.spaceOutputFrame)/2, y - (frameSize * 0.6), textStyle);
        this.outputFrameTxt.visible = false;

        this.group.add(this.outputFrame.group)
        this.group.add(this.outputFrameTxt)

        two.add(this.group)
    }


    /******************************* GET-SET **********************/

    getPositionOfFrame(index) {
        if (index >= this.length) return null;
        return [this.frames[index].x, this.frames[index].y];
    }


    setPosition(x, y) {
        this.group.translation.set(x, y)
    }


    setMode(mode) {
        this.mode = mode;

        if (mode == 'sort') {
            this.mode = 'sort';
            this.outputFrameTxt.visible = false;
            this.outputFrame.setSorted(false);

            // sposta tutti i frame a destra di (this.spaceBetween*this.spaceOutputFrame)/2
            var transl = (this.spaceBetween*this.spaceOutputFrame)/2;
            for (var i = 0; i < this.frames.length; i++) {
                this.frames[i].setPosition(this.frames[i].x + transl, this.frames[i].y);
            }
            // sposta output frame a sinistra di (this.spaceBetween*this.spaceOutputFrame)/2
            this.outputFrame.setPosition(this.outputFrame.x - transl, this.outputFrame.y);

            // aggiungi output frame alla lista di frame
            if (this.frames.length < this.length)
                this.frames.push(this.outputFrame);
        }
        else {
            this.mode = 'merge';
            this.outputFrameTxt.visible = true;
            this.frames.pop();
            this.outputFrame.setSorted(true);
            this.outputFrame.setColor(this.outputFrameColor);

            // sposta tutti i frame a sinistra di (this.spaceBetween*this.spaceOutputFrame)/2
            var transl = (this.spaceBetween*this.spaceOutputFrame)/2;
            for (var i = 0; i < this.frames.length; i++) {
                this.frames[i].setPosition(this.frames[i].x - transl, this.frames[i].y);
            }
            // sposta output frame a destra di (this.spaceBetween*this.spaceOutputFrame)/2
            this.outputFrame.setPosition(this.outputFrame.x + transl, this.outputFrame.y);
        }
    }

    getFramesColors() {
        var cols = [];
        for (var i = 0; i < this.frames.length; i++) {
            cols.push(this.frames[i].color);
        }
        return cols;
    }

    setColorLines(show, numberOfChildren=this.frames.length) {
        for (var i = 0; i < numberOfChildren; i++) {
            this.frames[i].showColorLine(show);
        }
    }


    /***************** OPERAZIONI DI CHECK ***************************/

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


    /******************************** WRITE-READ *************************/

    writeOnBuffer(frames, callback=null, showColorLines=false) {
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            this.frames[i].copy(frame);
            if (showColorLines) this.frames[i].showColorLine(true); 
            this.frameRefilled[i] = frame.toRefill;
        }

        // Se c'e' una callback chiamala
        if (callback != null) callback();
    }


    writeOnBufferFrame(frame, indx, callback = null) {
        this.frames[indx].copy(frame)
        this.frameRefilled[indx] = frame.toRefill;
        if (callback != null) callback();
    }


    // Rimuove un elemento all'indice indx dal frame con indice FrameIndx.
    // Poi scrive tale elemento nell'output.
    writeFromTo(frameIndx, indx) {
        var frame = this.frames[frameIndx];
        var value = frame.getValue(indx);
        frame.removeElement(indx);
        this.outputFrame.addElement(value);
    }


    // Restituisce il contenuto dell'output frame e lo svuota
    flushOutputFrame() {
        var res = {
            x: this.outputFrame.x,
            y: this.outputFrame.y,
            size: this.outputFrame.getRealSize(),
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
                size: frame.getRealSize(),
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


    /*********************** SORT-MERGE********************/

    // Da commentare
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
        list.sort((a, b) => a - b);

        // Inserisco nei frames i nuovi valori ordinati
        for (var i = 0; i < list.length; i++) {
            this.frames[Math.floor(i / MAX_ELEMENTS_PER_FRAME)].addElement(list[i]);
        }
        
    }


    sortAnimation(time = 200, callback = () => {}) {
        this.sort();
        var tween = new TWEEN.Tween(null).to(null, time).onComplete(() => {callback()})
        tween.start();
        return tween;
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


    mergeAnimation(time = 200, outputFullCallback = () => {}, emptyFrameCallback = () => {}) {
        this.merge();
        var tween = new TWEEN.Tween(null).to(null, time).onComplete( () => {
                this.framesToRefill = this.checkToRefill();
                if (this.framesToRefill.length) {
                    for (var i = 0; i < this.framesToRefill.length; i++)
                        this.frameRefilled[this.framesToRefill[i]] = false;
                    emptyFrameCallback();
                }
                else
                    outputFullCallback();
            }
        )
        tween.start();

        return tween;
    }


    /****************** REDRAW per quando cambia la dimensione della finestra *****************/

    redrawBuffer(x, y) {

        var totalWidth = this.length*frameSize + (this.length - 1)*this.spaceBetween;
        var framePosition = x - totalWidth/2 + frameSize/2;

        // Ridimensiona e riposiziona i frame (incluso output frame se siamo in fase sort)
        for (var i = 0; i < this.frames.length; i++) {
            this.frames[i].resizeFrame(frameSize);
            this.frames[i].setPosition(framePosition, y);
            framePosition += frameSize + this.spaceBetween;
        }

        // Leva e ri-aggiungi scritta "output frame"
        this.outputFrameTxt.remove();
        var textStyle = fontStyleSmallBlackCentered;
        textStyle.weight = 600;

        if (this.mode == 'sort') {
            this.outputFrameTxt = two.makeText("Output frame", framePosition - frameSize - this.spaceBetween + (this.spaceBetween*this.spaceOutputFrame)/2, y - (frameSize * 0.6), textStyle);
            this.group.add(this.outputFrameTxt);
            this.outputFrameTxt.visible = false;

        }
        else {
            this.outputFrameTxt = two.makeText("Output frame", framePosition + (this.spaceBetween*this.spaceOutputFrame)/2, y - frameSize * 0.6, textStyle);
            this.group.add(this.outputFrameTxt);
            this.outputFrameTxt.visible = true;

            // Ridimensiona output frame (perche' non e' stato ridimensionato prima insieme agli altri)
            this.outputFrame.resizeFrame(frameSize);

            // sposta tutti i frame a sinistra di (this.spaceBetween*this.spaceOutputFrame)/2
            var transl = (this.spaceBetween*this.spaceOutputFrame)/2;
            for (var i = 0; i < this.frames.length; i++) {
                this.frames[i].setPosition(this.frames[i].x - transl, this.frames[i].y);
            }
            // sposta output frame a destra di (frameSize + this.spaceBetween*(this.spaceOutputFrame + 1)) rispetto all'ultimo frame
            var lastFrame = this.frames[this.frames.length - 1];
            var translOutput = frameSize + this.spaceBetween*(this.spaceOutputFrame + 1);
            this.outputFrame.setPosition(lastFrame.x + translOutput, lastFrame.y);
        }
        
    }
    

    /****************** UNDO *****************/

    undoWriteOnBuffer(oldBufferColors) {
        if (oldBufferColors.length < this.frames.length) {
            console.log("L'ARRAY COLORI E' PIU' CORTOOOO");
        }
        for (var i = 0; i < this.frames.length; i++) {
            this.frames[i].resetFrame();
            this.frameRefilled[i] = false;
            this.frames[i].setColor(oldBufferColors[i]);
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
