class Relation {

    spaceBetweenFrames = 10;
    frames = [];
    highlighters = [];  // rettangoli (solo bordo) che servono ad evidenziare il gruppo preso in considerazione


    // PARAMETRI PER GRAFICA
    frameColor = "#6fdcff";
    highlighterColor = "#2546cc";
    


    constructor(two, relationSize, x, y, width, height, preferredFrameSize, minimumFrameSize) {

        this.two = two;
        this.frameSize = this.findOptimalSize(width, height, relationSize, preferredFrameSize, minimumFrameSize);

        // Calcola quanti frame disegnare in ogni riga "piena"
        var framesPerRow = Math.floor((width + this.spaceBetweenFrames) / (this.frameSize + this.spaceBetweenFrames));
        console.log("frames per row: " + framesPerRow);

        // Posizione del primo frame: nell'angolo in alto a sx
        var initialFramePositionX = x - width/2 + this.frameSize/2;
        var initialFramePositionY = y - height/2 + this.frameSize/2;
        var framePositionX = initialFramePositionX;
        var framePositionY = initialFramePositionY;
        
        for (var i = 0; i < relationSize; i++) {
            
            // Crea il frame
            var newFrame = new Frame(two, framePositionX, framePositionY, this.frameSize, this.frameColor, null)

            // Aggiungi il frame alla lista
            this.frames.push(newFrame);


            // Prepara posizione per il prossimo frame:

            // Se il frame e' l'ultimo della riga, aumenta la Y e resetta la X
            if ((i+1) % (framesPerRow) == 0) {
                framePositionY += (this.frameSize + this.spaceBetweenFrames);
                framePositionX = initialFramePositionX;
            }
            // Altrimenti aumenta solo la X
            else {
                framePositionX += this.frameSize + this.spaceBetweenFrames;
            }
        }


        // Evidenzia tutta la relazione
        this.highlightGroup(this.frames);
    }



    // RICORSIVA, non e' la soluzione ideale ma per ora funziona.
    // Tenta di inserire i frame della misura corrente, se non c'entrano riduce la misura di 5px e ri-tenta
    findOptimalSize(width, height, relationSize, frameSize, minimumFrameSize) {
        
        console.log("Testing frame size: " + frameSize);

        // Se la misura e' piu' piccola di quella minima
        if (frameSize < minimumFrameSize) {
            return frameSize;
        }

        // Calcolati quante righe e colonne riesci a mettere nell'area
        var rowsAvailable = Math.floor((height + this.spaceBetweenFrames) / (frameSize + this.spaceBetweenFrames));
        var columnsAvailable = Math.floor((width + this.spaceBetweenFrames) / (frameSize + this.spaceBetweenFrames));

        // Calcola quanti frame puoi disegnare con questa dimensione
        var cellsAvailable = rowsAvailable * columnsAvailable;

        // Se i frame c'entrano
        if (cellsAvailable >= relationSize) {
            return frameSize;
        }
        
        // Altrimenti, ri-tenta con una misura di frame piu' piccola
        else {
            return this.findOptimalSize(width, height, relationSize, frameSize-5, minimumFrameSize);
        }
    }




    // Disegna rettangoli intorno ai frame (CONSECUTIVI!) contenuti nella lista "group". Salva i rettangoli dentro "highlighters"
    highlightGroup(group) {
        // elimina gli highlighter gia' esistenti
        for (var i = this.highlighters.length - 1; i >= 0; i--) {
            this.highlighters[i].remove();
        }

        var firstFrameOfRow = group[0];
        var lastFrameOfRow = group[0];

        for (var i = 0; i < group.length; i++) {
            var currentFrame = group[i];

            // Se questo frame e' su una nuova riga rispetto al precedente, disegna l'highlighter per la riga precedente
            if (currentFrame.y != lastFrameOfRow.y) {
                this.highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, lastFrameOfRow));
                
                // metti questo come first frame of row
                firstFrameOfRow = currentFrame;
            }
            // Se e' l'ultimo elemento del gruppo, disegna l'highlighter
            if (i == group.length - 1) {
                this.highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, currentFrame));
            }

            // metti questo come last frame of row       
            lastFrameOfRow = currentFrame;
        } 
    }

    makeRectangleAroundFrames(firstFrame, lastFrame) {
        var centerX = (firstFrame.x + lastFrame.x)/2;
        var centerY = firstFrame.y;
        var width = lastFrame.x - firstFrame.x + firstFrame.size;
        var height = firstFrame.size;
        var rect = this.two.makeRectangle(centerX, centerY, width, height);
        rect.stroke = this.highlighterColor;
        rect.linewidth = 5;
        rect.noFill();
        
        return rect;
    }



    // TEMPORANEO per testare l'highlighting
    divideIntoSubgroups(number) {
        var groups = [];
        var framesPerGroup = Math.floor(this.frames.length / number);       // per esempio, Math.floor(8/3) = 2
        var groupsWithOneExtraFrame = this.frames.length % number;         // per esempio, 8 % 3 = 2, quindi due dei tre gruppi avranno un frame in piu'
        
        // in questi gruppi metti framesPerGroup + 1 frame
        for (var i = 0; i < groupsWithOneExtraFrame; i++) {
            groups.push(this.frames.slice(i*(framesPerGroup+1), i*(framesPerGroup+1) + framesPerGroup+1));
        }

        // in questi gruppi metti framesPerGroup frame
        var newStartingIndex = groupsWithOneExtraFrame*(framesPerGroup+1);
        var remainingFrames = this.frames.slice(newStartingIndex);
        for (var i = 0; i < number - groupsWithOneExtraFrame; i++) {
            groups.push(remainingFrames.slice(i*(framesPerGroup), i*(framesPerGroup) + framesPerGroup));
        }

        console.log(groups);

        // Cambia il colore a tutti i gruppi (tranne l'ultimo?)
        var color = this.randomColor();
        for (var i = 0; i < groups.length; i++) {
            this.changeGroupColor(groups[i], this.stringifyColor(color));
            // assicurati che il nuovo colore non sia troppo simile a quello precedente
            var newColor = this.randomColor();
            while (this.differenceBetweenColors(newColor, color) < 55 ) {
                newColor = this.randomColor();
            }
            console.log("difference: " + this.differenceBetweenColors(newColor, color));
            color = newColor;
        }
        this.highlightGroup(groups[0]);
    }


    changeGroupColor(group, color) {
        for (var i = 0; i < group.length; i++) {
            group[i].setColor(color);
        }
    }

    differenceBetweenColors(color1, color2) {
        //return Math.abs(color1[0] - color2[0]) + Math.abs(color1[1] - color2[1]) + Math.abs(color1[2] - color2[2]);
        //return Math.max(Math.abs(color1[0] - color2[0]), Math.abs(color1[1] - color2[1]), Math.abs(color1[2] - color2[2]));
        return Math.abs(color1[0] - color2[0]);     // consideriamo solo la HUE
    }


    randomColor() {
        var h = Math.round(360 * Math.random());
        var s = Math.round(60 + 45 * Math.random());
        var l = Math.round(65 + 10 * Math.random());
        return [h, s, l];
    }

    stringifyColor(col) {
        return "hsl(" + col[0] + ',' + col[1] + '%,' + col[2] + '%)';
    }
}