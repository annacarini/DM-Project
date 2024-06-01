class Relation {

    // Relazione, espressa come albero
    relation = new TreeNode([]);                // l'array vuoto passato come parametro e' il campo "value" del nodo

    // Relazione espressa come array (serve comunque)
    relationArray = [];

    // Nodo attuale, all'inizio e' tutta la relazione
    currentGroup;

    // per il redraw degli highlighters
    groupHighlighted = null;

    // Frame liberi in cui andare a scrivere l'output
    availableFrames = [];

    // Rettangoli (solo bordo) che servono ad evidenziare il gruppo preso in considerazione
    highlighters = [];

    // PARAMETRI PER GRAFICA
    spaceBetweenFrames = SPACE_BETWEEN_FRAMES;
    frameColor = " 	hsl(188, 74%, 72%)";
    highlightersColor = "black";
    highlightersMargin = 6;
    highlighterThickness = VERY_THICK_LINE;

    // Valore random massimo per la relazione
    maxRandomValue = 99;


    constructor(two, relationSize, x, y, width, height, preferredFrameSize, minimumFrameSize) {

        this.two = two;
        this.group = new Two.Group();
        this.frameSize = this.findOptimalSize(width, height, relationSize, preferredFrameSize, minimumFrameSize);

        // Calcola quanti frame disegnare in ogni riga "piena"
        var framesPerRow = Math.floor((width + this.spaceBetweenFrames) / (this.frameSize + this.spaceBetweenFrames));

        // Posizione del primo frame: nell'angolo in alto a sx
        var initialFramePositionX = x - width/2 + this.frameSize/2;
        var initialFramePositionY = y - height/2 + this.frameSize/2;
        var framePositionX = initialFramePositionX;
        var framePositionY = initialFramePositionY;
        

        for (var i = 0; i < relationSize; i++) {

            // Genera valori da inserire nel frame
            var howManyValues = MAX_ELEMENTS_PER_FRAME;
            if (i == relationSize - 1) {
                howManyValues = Math.round(Math.random() * (MAX_ELEMENTS_PER_FRAME - 1) + 1);   // L'ultima pagina ha tra 1 e MAX_ELEMENTS_PER_FRAME valori
            }
            var vals = this.generateRandomValues(howManyValues);
            
            // Crea il frame        constructor(x, y, size, color, max_elements, two)
            var newFrame = new Frame(framePositionX, framePositionY, this.frameSize, this.frameColor, MAX_ELEMENTS_PER_FRAME, two);
            newFrame.fill(vals);    // Scrivi i valori nel frame
            this.group.add(newFrame.group);
            //newFrame.setView(false);    // Fai in modo che i valori non si vedono

            // Aggiungi il frame all'albero e alla lista
            this.relation.value.push(newFrame);
            this.relationArray.push(newFrame);


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

        this.two.add(this.group)

        // Poni il nodo attuale uguale a tutta la relazione
        this.currentGroup = this.relation;
    }


    // Tenta di inserire i frame della misura corrente, se non c'entrano riduce la misura di 10px e ri-tenta
    findOptimalSize(width, height, relationSize, frameSize, minimumFrameSize) {
        
        //console.log("Testing frame size: " + frameSize);

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
            return this.findOptimalSize(width, height, relationSize, frameSize-10, minimumFrameSize);
        }
    }


    // Per generare valori random per riempire la relazione
    generateRandomValues(quantity) {
        var vals = [];
        for (let i = 0; i < quantity; i++) {
            vals.push(Math.round(Math.random() * this.maxRandomValue));
        }
        return vals;
    }


    /****************** SET-GET *******************/

    setCurrentGroup(group) {
        this.currentGroup = group;

        // Evidenzia il gruppo
        this.highlightGroup(this.currentGroup);
    }


    setAvailableFrames(newAvailableFrames) {
        this.availableFrames = newAvailableFrames;
    }


    getCurrentGroup() {
        return this.currentGroup;
    }


    getIndx(frame) {
        for (var i = 0; i < this.relationArray.length; i++) {
            if (frame == this.relationArray[i])
                return i;
        }
        return -1;
    }


    getFreeAvailableFrame() {
        for (var i = 0; i < this.availableFrames.length; i++) {
            if (this.availableFrames[i].elements.length < 1)
                return i;
        }
        return -1;
    }


    getAvailableFrameIndx(frame) {
        for (var i = 0; i < this.availableFrames.length; i++) {
            if (this.availableFrames[i] == frame)
                return i;
        }
        return -1;
    }


    /*******************  TREE MANAGER **************************/

    // Trasforma la relation in una struttura ad albero in cui ogni foglia ha la stessa profondità.
    // Parte dividendo i frame in NFrames / M run. Ogni run è un nodo avente M figli (i frames).
    // Prendiamo tutte le run e raggruppiamole in NRuns / M - 1 new_runs. Ogni new_run è un nodo avente
    // come figli le run. Procedere fino a quando non si abbia una sola new_run
    createTree(bufferSize) {
        var treeDemo = [];

        treeDemo.push([]);
        var node = null;
        // Sort fase - Raggruppiamo i frame in run da lunghezza di bufferSize 
        for (var i = 0; i < this.relation.value.length; i++) {
            if (i % bufferSize == 0) {
                node = new TreeNode([]);
                treeDemo[0].push(node);
            }
            node.value.push(this.relation.value[i]);
            this.relation.value[i].parent = node;
        }

        // Merge fase - Raggruppiamo le run in gruppi da M - 1 runs
        var lastLayer = treeDemo[treeDemo.length - 1];
        while(lastLayer.length != 1) {
            treeDemo.push([]);
            for (var i = 0; i < lastLayer.length; i++) { // Leggo tutti i nodi nel lastLayer
                if (i % (bufferSize - 1) == 0)  // Se i è un multiplo di bufferSize - 1 allora devo creare un nuovo gruppo a cui apparterrano i nodi seguenti
                    node = new TreeNode([]);
                node.children.push(lastLayer[i]);
                lastLayer[i].parent = node;
                if ((i + 1) % (bufferSize - 1) == 0 || (i + 1) ==  lastLayer.length) // Alla prossima iterazione creo un nuovo node. Allora pusho quello attuale
                    treeDemo[treeDemo.length - 1].push(node);
            }
            lastLayer = treeDemo[treeDemo.length - 1];
        }
        // Creiamo l'ultimo nodo che sarà l'origine dell'albero. Aggiungiamo i figli e cambiamo il padre a questi figli
        this.relation = new TreeNode([]);
        if (!lastLayer[0].children.length)
            this.relation.children = [lastLayer[0]];
        else
            this.relation.children = lastLayer[0].children;
        for (var i = 0; i < lastLayer[0].children.length; i++)
            lastLayer[0].children[i].parent = this.relation;
    }


    // Cerca nell'albero la foglia più a sinistra
    getFirstLeaf() {
        var group = this.relation;
        while (group.children.length > 0) {
            group = group.children[0];
        }
        return group;
    }


    // Cerca nell'albero la foglia più a destra
    getLastLeaf() {
        var group = this.relation;
        while (group.children.length > 0) {
            group = group.children[group.children.length - 1];
        }
        return group;
    }


    // Cerca nell'albero il nodo più a sinistra che sia padre di una foglia
    getFirstNotLeaf() {
        var group = this.relation;
        while (group.children.length > 0) {
            if (group.children[0].children.length > 0)
                group = group.children[0];
            else
                return group;
        }
        return group;
    }


    // Cerca nell'albero il nodo più a destra che sia padre di una foglia
    getLastNotLeaf() {
        var group = this.relation;
        while (group.children.length > 0) {
            if (group.children[group.children.length - 1].children.length > 0)
                group = group.children[group.children.length - 1];
            else
                return group;
        }
        return group;
    }


    // Trova l'indice di currentGroup tra i suoi sibling. Se c'e' un altro sibling dopo lui lo restituisce, se no ritorna null
    getNextSibling() {
        if (this.currentGroup.parent == null) return null;

        var siblings = this.currentGroup.parent.children;

        for (var i = 0; i < siblings.length; i++) {
            // se trovi currentGroup e non e' l'ultimo sibling
            if (siblings[i] == this.currentGroup && i < siblings.length - 1) {
                return siblings[i+1];
            }
        }
        return null;
    }


    getNextLeaf(node) {
        if (node.parent == null) return null;

        var siblings = node.parent.children;
        for (var i = 0; i < siblings.length; i++) {
            // se trovi currentGroup e non e' l'ultimo sibling
            if (siblings[i] == node && i < siblings.length - 1) {
                var next = siblings[i + 1];
                while (next.children.length)
                    next = next.children[0];
                return next;
            }
        }

        return this.getNextLeaf(node.parent);
    }


    getPreviousLeafParent(node) {
        if (node.parent == null) return null;

        var siblings = node.parent.children;
        for (var i = siblings.length - 1; i >= 0; i--) {
            // se trovi currentGroup e non e' l'ultimo sibling
            if (siblings[i] == node && i > 0) {
                var prev = siblings[i - 1];
                while (prev.children.length)
                    prev = prev.children[prev.children.length - 1];
                return prev;
            }
        }

        return this.getPreviousLeafParent(node.parent);
    }


    /******************************* ART **********************/

    // Disegna rettangoli intorno ai frame (CONSECUTIVI!) contenuti nel campo values del nodo "groupNode". Salva i rettangoli dentro "highlighters"
    highlightGroup(groupNode, callback=null) {

        // elimina gli highlighter gia' esistenti
        for (var i = this.highlighters.length - 1; i >= 0; i--) {
            this.highlighters[i].remove();
        }
        this.highlighters = [];

        // salvati il fatto che hai evidenziato questo gruppo
        this.groupHighlighted = groupNode;

        if (groupNode == null) {    // cosi' chiamiamo la funzione con parametro null per de-evidenziare
            return;
        }

        // prendi tutti i valori di questo nodo e di tutti i suoi discendenti
        var group = groupNode.getValueOfAllChildren();
        group.sort( this.compareFramesByPosition );

        var firstFrameOfRow = group[0];
        var lastFrameOfRow = group[0];

        for (var i = 0; i < group.length; i++) {
            var currentFrame = group[i];

            // Se questo frame e' su una nuova riga rispetto al precedente, disegna l'highlighter per la riga precedente
            if (currentFrame.y != lastFrameOfRow.y) {
                this.highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, lastFrameOfRow, this.highlightersColor, this.highlightersMargin));
                
                // metti questo come first frame of row
                firstFrameOfRow = currentFrame;
                this.group.add(this.highlighters[this.highlighters.length - 1]);
            }
            // Se e' l'ultimo elemento del gruppo, disegna l'highlighter
            if (i == group.length - 1) {
                this.highlighters.push(this.makeRectangleAroundFrames(firstFrameOfRow, currentFrame, this.highlightersColor, this.highlightersMargin));
                this.group.add(this.highlighters[this.highlighters.length - 1]);
            }

            // metti questo come last frame of row       
            lastFrameOfRow = currentFrame;
        } 

        // Se c'e' una callback eseguila
        if (callback != null) callback();
    }


    makeRectangleAroundFrames(firstFrame, lastFrame, color, marginDistance) {
        var centerX = (firstFrame.x + lastFrame.x)/2;
        var centerY = firstFrame.y;
        var width = lastFrame.x - firstFrame.x + firstFrame.realSize() + marginDistance;
        var height = firstFrame.realSize() + marginDistance;
        var rect = this.two.makeRectangle(centerX, centerY, width, height);
        rect.stroke = color;
        rect.linewidth = this.highlighterThickness;
        rect.noFill();
        
        return rect;
    }


    showContent(show) {
        for (var i = 0; i < this.relationArray.length; i++) {
            this.relationArray[i].setView(show);
        }
    }


    /********************* SPLIT E MERGE DEI NODI *********************/

    // Unisce tutti i figli del gruppo attuale, mettendo i loro frame come "value" del gruppo attuale. Poi elimina i figli
    mergeChildren() {
        // Prendi tutti i figli
        var children = this.currentGroup.children;

        // Unisci tutti i frame di tutti i children
        var frames = [];
        for (let i = 0; i < children.length; i++) {
            frames = frames.concat(children[i].value);
        }

        // Ri-ordina i frame rispetto alla y e rispetto alla x, in modo da averli nello stesso
        // ordine in cui appaiono graficamente (perche' la funzione shiftFramesByOne incasina
        // tutto, ma servono ordinati per disegnare l'highlighter bene)
        frames.sort( this._compareFramesByPosition );

        // Metti questi frame come "value" del nodo attuale
        this.currentGroup.value = frames;

        // Elimina i figli
        this.currentGroup.children = [];

        // Assegna il colore dell'ultimo frame a tutti i frame della lista (l'ultimo perche' cosi' e' sicuramente diverso da quello del gruppo dopo)
        //var color = frames[frames.length - 1].color;
        //this.changeGroupColor(this.currentGroup, color);
    }


    // Serve per ordinare i frame in base alla loro posizione
    _compareFramesByPosition( frame1, frame2 ) {
        if (frame1.y < frame2.y) {  // frame 1 e' su una riga sopra, quindi va messo prima
            return -1;
        }
        else if (frame1.y > frame2.y) {  // frame 1 e' su una riga dopo, quindi va messo dopo
            return 1;
        }
        else {                             // sono sulla stessa riga
            if (frame1.x < frame2.x) {      // frame 1 e' su una colonna piu' a sx, quindi va messo prima
                return -1;
            }
            else if (frame1.x > frame2.x) {      // frame 1 e' su una colonna piu' a dx, quindi va messo dopo
                return 1;
            }
        }
        return 0;
    }

    
    /**************** PER GESTIRE IL CAMBIO DEI COLORI ****************/

    changeGroupColor(group, color) {
        for (var i = 0; i < group.value.length; i++) {
            group.value[i].setColor(color);
        }
    }


    // E' una funzione ricorsiva che esplora tutto l'albero e ritorna i colori
    // di tutti i gruppi
    retrieveColors() {
        return this._retrieveColorsAux(this.relation);
    }
    _retrieveColorsAux(tree) {
        var colors = []

        for (var i = 0; i < tree.children.length; i++) {
            if (tree.children[i] instanceof TreeNode) {
                var newColors = this._retrieveColorsAux(tree.children[i])
                for (var j = 0; j < newColors.length; j++)
                    colors.push(newColors[j])
            }
        }
        if (tree.value.length)
            colors.push(tree.value[0].color)
        return colors
    }





    /**************** OPERAZIONI DI SCRITTURA E LETTURA ****************/


    /*
        IDEA:

        readCurrentGroup()
            La funzione readCurrentGroup() viene usata quando bisogna ordinare un singolo gruppo, mettendolo
            tutto dentro il buffer. Questa funzione restituisce tutto il gruppo, poi svuota i suoi frame, e li
            inserisce dentro l'array availableFrames (che ha prima svuotato?).

        readOnePageOfChild(index)
            La funzione readOnePageOfGroup(index) viene usata durante la fase di merge-sort dei children.
            Ti restituisce il contenuto della prima pagina non vuota del child "index". Se il child e' gia'
            tutto vuoto, ti restituisce null. Poi svuota questa pagina e la inserisce dentro availableFrames.
            Poi shifta tutti i children in modo da riportare "all'inizio" il frame vuoto.


        write(frame)
            Questa funzione copia il frame passato in input nel primo frame vuoto che trova dentro availableFrame.
            Copia sia il contenuto (elements) che il colore (changeColor).
            Se ci riesce restituisce true, altrimenti (se per esempio non ci sono frame disponibili) restituisce
            false.


        NOTA: E' importante che un frame non venga tolto dall'array availableFrames fino a quando l'operazione
        su quel determinato gruppo (o gruppo di siblings) non e' conclusa!!

            Esempi:

            -   Quando ordini un gruppo svuoti tutti i suoi frame, metti i frame svuotati dentro availableFrames,
                poi copi i frame originali nel buffer e li ordini. Poi li scrivi uno per uno dentro i frame di
                availableFrames (prendendo ogni volta il primo frame libero che trovi). Solo quando hai finito di
                scriverli tutti puoi "svuotare" l'array availableFrames (il motivo si capisce col secondo esempio).

            -   Quando stai facendo il merge-sort, devi prendere un frame da uno dei sibling. Questo frame deve
                essere un frame PIENO, ma NON DEVE essere un frame su cui hai gia' scritto l'output! Quindi quello
                che fai e': scorri tutti i frame di quel sibling, e appena trovi un frame che NON E' anche nell'
                array availableFrames, allora sai che quel frame ha un contenuto ancora da ordinare. Lo restituisci,
                poi svuoti il frame e lo aggiungi ad availableFrames. Intanto scrivi gli output nei frame liberi di
                availableFrames, e quando hai finito puoi svuotare availableFrames e fare il merge dei siblings.

    */

    readCurrentGroup() {
        var framesToReturn = [];

        // svuota availableFrames
        this.availableFrames = [];
        
        for (let i = 0; i < this.currentGroup.value.length; i++) {
            // copia il frame dentro framesToReturn
            var elems = this.currentGroup.value[i].getValues();
            framesToReturn.push({
                x: this.currentGroup.value[i].x,
                y: this.currentGroup.value[i].y,
                size: this.currentGroup.value[i].realSize(),
                color: this.currentGroup.value[i].color,
                elements: elems
            });
            // svuota il frame
            this.currentGroup.value[i].resetFrame();
            // metti il frame vuoto dentro availableFrames cosi' sai che puoi scriverci dentro
            this.availableFrames.push(this.currentGroup.value[i]);
        }
        return framesToReturn;
    }


    // restituisce (e svuota) la prima pagina non gia' caricata dentro availableFrames del figlio di indice index
    readOnePageOfChild(index) {
        if (index >= this.currentGroup.children.length) return null;

        var child = this.currentGroup.children[index];

        var frameToReturn = null;   // se hai gia' letto tutto il child, restituisce null

        for (let i = 0; i < child.value.length; i++) {

            // se trovi un frame di questo sibling che non e' dentro availableFrames
            if (!this.availableFrames.includes(child.value[i])) {

                // copia il frame
                frameToReturn = {
                    x: child.value[i].x,
                    y: child.value[i].y,
                    size: child.value[i].realSize(),
                    color: child.value[i].color,
                    elements: child.value[i].getValues(),
                    toRefill: (i < child.value.length-1)
                };

                // svuota il frame
                child.value[i].resetFrame();

                // metti il frame vuoto dentro availableFrames cosi' sai che puoi scriverci dentro
                this.availableFrames.push(child.value[i]);

                break;
            }
        }
        return frameToReturn;
    }


    writeGroupAnimation(frames, time = 1000, callback=null) {
        var res = [];
        for (let i = 0; i < frames.length; i++) {
            let frame = frames[i];
            let final_color = this.availableFrames[i].color;
            var end_x = this.availableFrames[i].x;
            var end_y = this.availableFrames[i].y;
            var end_size = this.availableFrames[i].realSize();
            var tween = animateOneSquare(frame.x, frame.y, end_x, end_y, frame.size, end_size, final_color, time, () => {
                // scrivi gli elementi
                this.availableFrames[i].fill(frame.elements);
                // cambia il colore (serve farlo a prescindere per reimpostare l'opacita' ad 1)
                this.availableFrames[i].setColor(final_color);
                this.availableFrames[i].setSorted(frame.sorted);
                // se questo era l'ultimo availableFrame (ed ora e' stato riempito), svuota l'array
                if (i == this.availableFrames.length - 1) {
                    this.setAvailableFrames([]);
                    if (callback != null) callback();
                }
            });

            //res = true;
            res.push(tween);
        }
        return res;
    }


    writeWithAnimation(frame, newColor, time = 1000, callback=null) {
        //var res = false;
        var res = null;
        for (let i = 0; i < this.availableFrames.length; i++) {
            if (this.availableFrames[i].elements.length < 1) {    // se trovi un frame vuoto

                var final_color = this.availableFrames[i].color;
                if (newColor) {
                    final_color = newColor;
                }

                // ANIMAZIONE
                var end_x = this.availableFrames[i].x;
                var end_y = this.availableFrames[i].y;
                var end_size = this.availableFrames[i].realSize();
                var tween = animateOneSquare(frame.x, frame.y, end_x, end_y, frame.size, end_size, final_color, time, () => {
                    // scrivi gli elementi
                    this.availableFrames[i].fill(frame.elements);
                    // cambia il colore (serve farlo a prescindere per reimpostare l'opacita' ad 1)
                    this.availableFrames[i].setColor(final_color);
                    this.availableFrames[i].setSorted(frame.sorted);
                    // se questo era l'ultimo availableFrame (ed ora e' stato riempito), svuota l'array
                    if (i == this.availableFrames.length - 1) {
                        this.setAvailableFrames([]);
                    }

                    if (callback != null) callback();
                });

                //res = true;
                res = tween;
                break;
            }
        }
        return res;
    }


    shiftFramesByOne(emptyFrame) {

        // Shifta solo i sibling attuali, quindi parti dal primo frame del primo sibling
        var startingFrame = this.currentGroup.children[0].value[0];

        // Se emptyFrame e' proprio lo startingFrame, non fare nulla
        if (emptyFrame.x == startingFrame.x && emptyFrame.y == startingFrame.y) {
            return;
        }

        // Itera tutti i frame in ordine inverso. Quando incontri emptyFrame inizia a shiftare
        // tutti di una posizione in avanti. Quando arrivi a startingFrame, shifta anche lui
        // e poi fermati. Se prima di arrivare a startingFrame trovi un frame appartenente ad
        // availableFrames, fermati e basta senza shiftarlo.

        var shifting = false;
        var currentFrame;
        for (var i = this.relationArray.length-1; i > 0; i--) {

            //console.log(i);
            currentFrame = this.relationArray[i];

            if (!shifting) {
                if (currentFrame.x == emptyFrame.x && currentFrame.y == emptyFrame.y && currentFrame != startingFrame) {
                    shifting = true;
                }
            }
            if (shifting) {
                // se il frame prima non e' vuoto e non e' in availableFrames, scambialo con l'empty frame
                if (this.relationArray[i-1].elements.length > 0 && !this.availableFrames.includes(this.relationArray[i-1])) {
                    this._swapFrames(i-1, i);

                    // se il frame con cui hai scambiato era lo starting frame, fermati
                    if (this.relationArray[i] == startingFrame) {
                        console.log("trovato starting frame, posizione: " + i);
                        break;
                    }
                }
                else {
                    break;
                }


            }

        }
    }


    // Questa scambia due frame, sia cambiando il loro indice dentro relationArray, sia
    // scambiando le loro posizioni
    _swapFrames(i, j) {
        //console.log("swapping " + i + " and " + j);
        var pos_i = [this.relationArray[i].x, this.relationArray[i].y];
        var pos_j = [this.relationArray[j].x, this.relationArray[j].y];
        var frame_i = this.relationArray[i];
        var frame_j = this.relationArray[j];

        // scambia le posizioni
        this.relationArray[i].setPosition(pos_j[0], pos_j[1]);
        this.relationArray[j].setPosition(pos_i[0], pos_i[1]);

        // scambiali nell'array
        this.relationArray[i] = frame_j;
        this.relationArray[j] = frame_i;
    }


    /************************ REDRAW ************************/

    // Da chiamare quando cambia la dimensione della finestra
    redrawRelation(x, y, width, height, minimumFrameSize, applicationState) {

        this.spaceBetweenFrames = SPACE_BETWEEN_FRAMES;

        this.frameSize = this.findOptimalSize(width, height, this.relationArray.length, frameSize, minimumFrameSize);

        // Calcola quanti frame disegnare in ogni riga "piena"
        var framesPerRow = Math.floor((width + this.spaceBetweenFrames) / (this.frameSize + this.spaceBetweenFrames));

        // Posizione del primo frame: nell'angolo in alto a sx
        var initialFramePositionX = x - width/2 + this.frameSize/2;
        var initialFramePositionY = y - height/2 + this.frameSize/2;
        var framePositionX = initialFramePositionX;
        var framePositionY = initialFramePositionY;



        for (var i = 0; i < this.relationArray.length; i++) {

            // Ridimensiona il frame
            this.relationArray[i].resizeFrame(this.frameSize);

            // Riposizionalo
            this.relationArray[i].setPosition(framePositionX, framePositionY);

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

        this.highlighterThickness = VERY_THICK_LINE;

        // Controlla se gli highlighter c'erano
        if (this.highlighters.length < 1) this.groupHighlighted = null;

        // Elimina tutti gli highlighters
        for (var i = this.highlighters.length - 1; i >= 0; i--) {
            this.highlighters[i].remove();
        }
        this.highlighters = [];

        // Ri disegna gli highlighers     
        this.highlightGroup(this.groupHighlighted);
    }


    /************************ UNDO ************************/

    undoReadCurrentGroup(frames) {
        this.availableFrames = [];

        for (let i = 0; i < this.currentGroup.value.length; i++) {
            this.currentGroup.value[i].copy(frames[i]);
        }
    }


    // Se ci sono degli availableFrames cerco il primo vuoto. Quello riempito per ultimo
    // è quello prima.
    // Se this.availableframes è vuoto significa che l'ultimo frame ad essere stato scritto è l'ultimo
    // del gruppo. Quindi prendo i frames del gruppo e li metto dentro available frames e resetto l'ultimo
    // frame.
    undoWriteWithAnimation(indx, oldAvailableIndx = []) {
        if (this.availableFrames.length) {
            this.availableFrames[indx].resetFrame();
        }
        else {
            if (this.currentGroup.value.length) {
                for (var i = 0; i < this.currentGroup.value.length; i++) {
                    this.availableFrames.push(this.currentGroup.value[i]);
                }
            }
            else {
                for (var i = 0; i < oldAvailableIndx.length; i++) {
                    while (this.availableFrames.length <= oldAvailableIndx[i][2]) {
                        this.availableFrames.push(null);
                    }
                    this.availableFrames[oldAvailableIndx[i][2]] = this.currentGroup.children[oldAvailableIndx[i][0]].value[oldAvailableIndx[i][1]];
                }
            }
            this.availableFrames[indx].resetFrame();
        }
    }


    // Se il gruppo corrente non ha un padre significa che non c'è nessun altro gruppo oltre a quello attuale, quindi quello precedente è null
    // In caso contrario cerco il primo nodo che si trovi a sinistra del mio che non abbia un figlio, quello era il nodo selezionato
    // Se getPrevoiusLeafParent è null significa che il nodo è l'ultimo a destra nell'albero (else)
    undoSetCurrentGroup() {
        const currGroup = this.getCurrentGroup();
        
        if (!currGroup.parent) {
            this.setCurrentGroup(null);
            return;
        }

        var prev = this.getPreviousLeafParent(currGroup);
        if (prev != null)
            this.setCurrentGroup(prev);
        else {
            prev = this.relation;
            while (prev.children.length) {
                prev = prev.children[prev.children.length - 1];
            }
            this.setCurrentGroup(prev);
        }   
    }


    undoShiftFramesByOne(startingIndx, swap) {
        var lastEmpty = startingIndx;
        for (var i = startingIndx; i < this.relationArray.length - 1; i++) {
            if (!this.relationArray[i].elements.length && this.relationArray[i + 1].elements.length) {
                lastEmpty = i;
                break;
            }
        }
        for (var j = 0; j < swap; j++) {
            this._swapFrames(lastEmpty + j, lastEmpty + j + 1)
        }
    }


    undoReadOnePageOfChild(oldFrame = null) {
        var frame = this.availableFrames.pop();
        if (oldFrame) {
            frame.fill(oldFrame.elements);
            frame.setColor(oldFrame.color);
        }
    }


    undoMergeChildren(oldGroups) {
        var frames = this.currentGroup.value;
        this.currentGroup.value = [];

        for (var i = 0; i < oldGroups.length; i++) {
            while (oldGroups[i][0] >= this.currentGroup.children.length)
                this.currentGroup.children.push(new TreeNode([], this.currentGroup));
            while (oldGroups[i][1] >= this.currentGroup.children[oldGroups[i][0]].value.length)
                this.currentGroup.children[oldGroups[i][0]].value.push(null);
            this.currentGroup.children[oldGroups[i][0]].value[oldGroups[i][1]] = frames[i];
        }
    }
}
