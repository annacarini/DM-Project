"use strict";


// PARAMETRI SIMULAZIONE
var bufferSize = 3;
var relationSize = 9;

var buffer = null;
var relation = null;

const States = {
	Start: "Start",
	RunToSort: "Current run is not sorted",
	RunInBuffer: "Current run loaded in buffer, waiting to be sorted",
    BufferSorted: "The buffer is sorted",
    RunSorted: "Current run is being sorted",
    RunsToMerge: "Current run has children that must be merge-sorted",
    ChildrenInBuffer: "Children of current group are in the buffer, waiting to be merge-sorted",
    OneEmptyFrameInBuffer: "One empty frame in buffer during merge-sort",
    OutputFrameFullMerging: "Merging, the output frame is full",
    RunsMerged: "Merged",
    Finish: "Finished"
}

var applicationState = States.Start;    // Tiene lo stato attuale dell'applicazione

// PER GESTIRE L'ANIMAZIONE
var playOneStepButton = null;
var playButton = null;
var pauseButton = null;
var playJumpButton = null;
var undoButton = null;

var automaticPlay = true;
var paused = true;
var playing = false;    // per evitare di chiamare di nuovo play() fino a che la callback non e' stata chiamata

var simulationStopped = false;  // per bloccare le animazioni e i tasti quando apri il menu


// PARAMETRI PER GRAFICA
var two;

var textBox = null;     // Casella a sx in cui appaiono messaggi
var showingRelationContent = true; 

// Per fare il redraw quando cambi la dimensione della finestra
var mustRedraw = false;
var lastResizeTime = null;
const timeIntervalForRedraw = 100; // ri-disegna solo se e' passato un po' dall'ultimo resize

var leftColumn, centerColumn, upperPart, lowerPart;

// Misure dello schermo
var windowW = window.innerWidth;
var windowH = window.innerHeight;
var centerX = windowW / 2;
var centerY = windowH / 2;

// Costanti
const MAX_ELEMENTS_PER_FRAME = 5;

var MEDIUM_LINE = windowW/550;
var THICK_LINE = windowW/420;
var VERY_THICK_LINE = windowW/320;

var frameSize = windowW/15;
var SPACE_BETWEEN_FRAMES = windowW/200;

var fontSizeBig = windowW/60;
var fontSizeMedium = windowW/80;
var fontSizeSmall = windowW/100;

// Valori I/O
var nRead = 0;
var nWrite = 0;

// Rollback
var rollback = []

// Stili testo
const fontStyleMediumBlack = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeMedium,
    weight: 650,
    fill: "rgb(0,0,0)"
}
const fontStyleMediumGray = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeMedium,
    weight: 600,
    fill: "rgb(79,79,79)"
}
const fontStyleSmallBlack = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeSmall,
    weight: 500,
    fill: "rgb(0,0,0)"
}
const fontStyleSmallBlackCentered = {
    alignment: "center",
    family: "Calibri",
    size: fontSizeSmall,
    weight: 500,
    fill: "rgb(0,0,0)"
}


// Per gestire il cambio dei colori nella relation al merge
var newColor;


// Lunghezza animazioni e pausa callback
const animTimeVeryFast = 300;
const animTimeFast = 500;
const animTimeSlow = 900;
const animTimeVerySlow = 1150;
var animTime = animTimeSlow;
const waitingTimeVeryFast = 150;
const waitingTimeFast = 250;
const waitingTimeSlow = 500;
const waitingTimeVerySlow = 600;
var waitingTime = waitingTimeSlow;
const Speeds = {VeryFast:0, Fast:1, Slow:2, VerySlow:3};
var currentSpeed = Speeds.Slow;
var makeSpeedFaster, makeSpeedSlower;   // funzioni definite sotto

// Animazioni
var tween = null


// Crea la una texture con delle righe
function createCustomTexture(width, height, backgroundColor, barColor, barWidth, barGap) {
    // Crea un nuovo canvas
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    
    // Disegna il colore di sfondo
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    
    // Disegna le barre nere sopra al colore di sfondo
    context.fillStyle = barColor;
    var x = 0;
    while (x < width) {
      context.fillRect(x, 0, barWidth, height);
      x += barWidth + barGap;
    }
    
    // Crea una nuova texture utilizzando il canvas
    var texture = new Two.Texture(canvas);
    return texture;
}

// MESSAGGI
const Messages = {
	currentGroupMustBeSorted: 'This run must be sorted.<br/>It will be written in the buffer.',
    childrenMustBeMergeSorted: "These runs have been individually sorted, now they must be merged.",
    bufferSorted: "The buffer is sorted, its frames must be written back in the relation.",
    outputFrameFull: "The output frame is full, so it must be written back in the relation.",
    emptyFrameInBuffer: "The buffer has an empty frame. It must load a new page of the corresponding run.",
    bufferContentBeingSorted: "The content of the buffer must be sorted.",
    currentGroupSorted: "This run has been sorted.",
    currentGroupMerged: "These runs have been merged.",
    runNotToBeMerged: "This run doesn't have other runs to merge with for now.",
    childrenBeingMergeSorted: "A page of each run has been loaded in the buffer. They must be merge-sorted.",
    finished: "Done! The whole relation has been sorted."
}


function onBodyLoad() {

    // Resetta gli slider
    document.menu_form.reset();
    document.getElementById("show_relation_content").checked = true;

    // Slider menu iniziale
    document.getElementById("buffer_size").onchange = function(event) {
        bufferSize = event.target.value;
        document.getElementById("buffer_size_value").innerHTML = bufferSize;
    };
    document.getElementById("relation_size").onchange = function(event) {
        relationSize = event.target.value;
        document.getElementById("relation_size_value").innerHTML = relationSize;
    };

    // Casella di testo
    textBox = document.getElementById("text_box"); 
    
    // Pulsanti controllo animazione
    playOneStepButton = document.getElementById("step_button"); 
    playButton = document.getElementById("play_button");
    pauseButton = document.getElementById("pause_button");
    playJumpButton = document.getElementById("jump_button");
    pauseButton.disabled = true;    // parte disattivato
    undoButton = document.getElementById("undo_button");
    undoButton.disabled = true;    // parte disattivato

    // Pulsanti velocita' animazione
    var animFasterButton = document.getElementById("anim_faster");
    var animSlowerButton = document.getElementById("anim_slower");
    
    // handler pulsante faster
    makeSpeedFaster = function () {
        switch (currentSpeed) {
            case Speeds.VeryFast:
                break;
            case Speeds.Fast:
                animTime = animTimeVeryFast;
                waitingTime = waitingTimeVeryFast;
                currentSpeed = Speeds.VeryFast;
                animFasterButton.disabled = true;   // disabilita perche' non puoi andare piu' veloce di cosi'
                break;
            case Speeds.Slow:
                animTime = animTimeFast;
                waitingTime = waitingTimeFast;
                currentSpeed = Speeds.Fast;
                break;
            case Speeds.VerySlow:
                animTime = animTimeSlow;
                waitingTime = waitingTimeSlow;
                currentSpeed = Speeds.Slow;
                break;
            default: break;
        }
        animSlowerButton.disabled = false;
    }
    animFasterButton.onclick = makeSpeedFaster;

    // handler pulsante slower
    makeSpeedSlower = function () {
        switch (currentSpeed) {
            case Speeds.VeryFast:
                animTime = animTimeFast;
                waitingTime = waitingTimeFast;
                currentSpeed = Speeds.Fast;
                break;
            case Speeds.Fast:
                animTime = animTimeSlow;
                waitingTime = waitingTimeSlow;
                currentSpeed = Speeds.Slow;
                break;
            case Speeds.Slow:
                animTime = animTimeVerySlow;
                waitingTime = waitingTimeVerySlow;
                currentSpeed = Speeds.VerySlow;
                animSlowerButton.disabled = true;   // disabilita perche' non puoi andare piu' lento di cosi'
                break;
            case Speeds.VerySlow:
                break;
            default: break;
        }
        animFasterButton.disabled = false;
    }
    animSlowerButton.onclick = makeSpeedSlower;
}


function openMenu() {
    pause();
    simulationStopped = true;
    document.getElementById("menu").removeAttribute("hidden");
    pause();
}


function closeMenu() {
    simulationStopped = false;
    //animate(); // riprendi l'animazione visto che l'avevi fermata
    document.getElementById("menu").setAttribute("hidden", null);
}


function startSimulation() {

    // Nascondi il div del menu
    document.getElementById("menu").setAttribute("hidden", null);

    // Rendo visibile il bottone resume del menu. Cambio il messaggio del bottone start e la sua funzione onclick
    document.getElementById("resume").removeAttribute("hidden");
    document.getElementById("start_simulation").innerHTML = "Restart";
    document.getElementById("start_simulation").onclick = () => {reset(); closeMenu()};

    // Mostra il div centrale
    document.getElementById("column_center").removeAttribute("hidden");
    document.getElementById("restart_button").removeAttribute("hidden");

    // Aggiungi controlli da tastiera (va fatto ora se no uno poteva premere la barra spaziatrice prima di avviare la simulazione)
    document.onkeydown = function(e) {
        if (simulationStopped) return;
        switch (e.key) {
            // FRECCETTA SX: undo
            case "ArrowLeft":
                e.preventDefault();   
                undo();    
                break;
            // FRECCETTA DX: jump
            case "ArrowRight":
                e.preventDefault();
                playOne(0);
                break;
            // SPAZIO: play/pause
            case " ":
                e.preventDefault();
                if (paused || !automaticPlay)
                    playAll();
                else
                    pause();
                break;
            // INVIO: play one
            case "Enter":
                e.preventDefault();
                playOne();
                break;
            // TASTO +: aumenta velocita'
            case "+":
                e.preventDefault();
                makeSpeedFaster();
                break;
            // TASTO -: diminuisci velocita'
            case "-":
                e.preventDefault();
                makeSpeedSlower();
                break;

            default: break;
        }
    }

    // Aggiungi handler allo slider che mostra/nasconde i numeri della relazione
    document.getElementById("show_relation_content").onchange = function() {
        showingRelationContent = !showingRelationContent;
        if (relation == null) return;
        else {
            relation.showContent(showingRelationContent);
        }
    };

    // AGGIORNA MISURE (e CREA SEZIONI - lo fa dentro la funzione)
    updateSizes();
    
    // Avvia Two
    two = new Two({
        type: Two.Types.svg,
        fullscreen: true,
        autostart: true,
    }).appendTo(document.getElementById("column_center"));


    // questo non funziona:
    window.onresize = function() {
        mustRedraw = true;
        lastResizeTime = Date.now();    // tempo attuale (precisione millisecondi)
    }


    // Imposta scritte misura buffer e relazione
    document.getElementById("buffer_size_text").innerHTML = "M = " + bufferSize;
    document.getElementById("relation_size_text").innerHTML = "B(R) = " + relationSize;


    // CREA BUFFER         constructor(x, y, length, frameSize, two)
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);

    // CREA RELAZIONE
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);
    // Creaimo l'albero e selezioniamo il primo padre di una foglia come gruppo corrente
    relation.createTree(bufferSize);
    const notLeaf = relation.getFirstLeaf();
    relation.currentGroup = notLeaf;

    // updates the drawing area and actually renders the content
    two.update();
}


function reset() {
    console.log("Resettiamo!")
    textBox.innerHTML = "Waiting to start.";
    nRead = 0;
    nWrite = 0;
    document.getElementById('read-count').textContent = 0;
    document.getElementById('write-count').textContent = 0;
    automaticPlay = true;
    paused = true;
    playing = false;

    // Attiva pulsanti play
    playOneStepButton.disabled = false;
    playButton.disabled = false;
    playJumpButton.disabled = false;

    // Disattiva pulsanti pausa e undo
    pauseButton.disabled = true;
    undoButton.disabled = true;

    applicationState = States.Start; 

    // Aggiorna sezioni
    updateSizes();

    // Rimuovi buffer e relazione, crea quelli nuovi
    buffer.group.remove();
    relation.group.remove();    
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);
    // Creaimo l'albero e selezioniamo il primo padre di una foglia come gruppo corrente
    relation.createTree(bufferSize);
    const notLeaf = relation.getFirstLeaf();
    relation.currentGroup = notLeaf;

    // Imposta scritte misura buffer e relazione
    document.getElementById("buffer_size_text").innerHTML = "M = " + bufferSize;
    document.getElementById("relation_size_text").innerHTML = "B(R) = " + relationSize;
    two.update();
}


function showMessage(text) {
    textBox.innerHTML = text;
}
function showMessageBoxContent(show) {
    if (show) {
        textBox.removeAttribute("hidden");
    }
    else {
        textBox.setAttribute("hidden", null);
    }
}


function playOne(time = animTime) {
    if (applicationState == States.Finish || playing) return;

    // esci dalla pausa
    paused = false;

    // disattiva riproduzione automatica
    automaticPlay = false;

    // disattiva pulsante pausa
    pauseButton.disabled = true;

    // attiva pulsanti play e back
    playButton.disabled = false;
    playOneStepButton.disabled = false;
    playJumpButton.disabled = false;
    undoButton.disabled = false;
    
    play(time);
}

function playAll() {
    if (applicationState == States.Finish) return;

    // esci dalla pausa
    paused = false;

    // attiva riproduzione automatica
    automaticPlay = true;

    // disattiva pulsanti step, jump e play
    playOneStepButton.disabled = true;
    playJumpButton.disabled = true;
    playButton.disabled = true;
    undoButton.disabled = true;

    // attiva pulsante pausa
    pauseButton.disabled = false;

    showMessageBoxContent(false);

    play(animTime);
}

function pause() {

    // disattiva pulsante pausa
    pauseButton.disabled = true;

    // metti in pausa
    paused = true;

    automaticPlay = false;

    if (applicationState == States.Finish) return;

    // attiva pulsanti play e back
    playButton.disabled = false;
    playOneStepButton.disabled = false;
    playJumpButton.disabled = false;
    undoButton.disabled = false;
    
    //endTween(tween);
}


function undo() {

    // se e' attiva la riproduzione automatica, metti in pausa invece di fare undo?
    if (automaticPlay) {
        pause();
        return;
    }

    //endTween(tween);
    if (rollback.length) {
        var lastAction = rollback[rollback.length -  1];
        lastAction[0]();
        applicationState = lastAction[1];
        showMessage(lastAction[2]);
        rollback.pop();

        // attiva pulsanti play e back
        playButton.disabled = false;
        playOneStepButton.disabled = false;
        playJumpButton.disabled = false;
    }

    if (applicationState == States.Start) {
        undoButton.disabled = true;
    }

    showMessageBoxContent(true);
    console.log("text box content: ", textBox.innerHTML);
    console.log("Il nuovo stato è: ", applicationState);
    console.log("La relazione è: ", relation);
}


// FUNZIONE PLAY
function play(time = animTime) {
    if (relation == null || buffer == null || playButton == null) return;

    // Se stava gia' riproducendo qualcosa non fare nulla
    if (playing) return;

    playing = true;

    switch (applicationState) {
        
        case States.Start:
            showMessage(Messages.currentGroupMustBeSorted);
            
            // UNDO
            const frameOldColor = relation.getCurrentGroup().value[0].color;
            rollback.push([() => {
                    relation.undoHighlightGroup("highlighters");
                    relation.changeGroupColor(relation.getCurrentGroup(), frameOldColor);
                }, States.Start, "Waiting to start."]);

            // MOVE TO NEXT STATE
            newColor = relation.generateNewColor();
            relation.changeGroupColor(relation.getCurrentGroup(), newColor);
            relation.highlightGroup(relation.getCurrentGroup(), "highlighters", () => {
                applicationState = States.RunToSort;
                callback();
            });

            break;

        case States.RunToSort:
            // Leggi il contenuto del primo gruppo e scrivilo nel buffer
            var frames = relation.readCurrentGroup();

            // Ottieni le posizioni nel buffer dei vari frame (servono per l'animazione)
            var start_x = [];
            var start_y = [];
            var end_x = [];
            var end_y = [];
            var start_size = [];
            var end_size = [];
            var color = [];
            var animationLength = time;
            for (var i = 0; i < frames.length; i++) {
                start_x.push(frames[i].x);
                start_y.push(frames[i].y);
                let endPos = buffer.getPositionOfFrame(i);
                end_x.push(endPos[0]);
                end_y.push(endPos[1]);
                start_size.push(frames[i].size);
                end_size.push(frameSize);
                color.push(frames[i].color);
            }

            // UNDO
            rollback.push([() => {
                relation.undoReadCurrentGroup(frames);
                buffer.undoWriteOnBuffer();
                nRead -= frames.length;                    
                document.getElementById('read-count').textContent = nRead;
            },
            States.RunToSort, textBox.innerHTML]);

            // MOVE TO NEXT STATE
            tween = animateMultipleSquares(start_x, start_y, end_x, end_y, start_size, end_size, color, animationLength, () => {
                // Quando terminano le animazioni, scrivi i dati nel buffer
                buffer.writeOnBuffer(frames);
                // Aggiorno il numero di read
                nRead += frames.length;
                document.getElementById('read-count').textContent = nRead;

                applicationState = States.RunInBuffer;
                showMessage(Messages.bufferContentBeingSorted);
                callback();
            });

            break;

        case States.RunInBuffer:
            // UNDO
            var oldFramesValues = [];
            for (frame of buffer.frames) {
                oldFramesValues.push(frame.getValues());
            }
            rollback.push([() => buffer.undoSortAnimation(oldFramesValues), States.RunInBuffer, textBox.innerHTML]);

            // MOVE TO NEXT STATE
            // Avvia il sort
            tween = buffer.sortAnimation(time / 5, () => {
                applicationState = States.BufferSorted;
                showMessage(Messages.bufferSorted);
                callback();
            });
            break;
    
        case States.BufferSorted:
            // Prendi i frame non vuoti del buffer
            var frames = buffer.clear();

            // UNDO
            rollback.push([() => {
                var oldValues = relation.readCurrentGroup();
                buffer.writeOnBuffer(oldValues);
                for (var frame of buffer.frames)
                    frame.setSorted(true);
                nWrite -= frames.length;
                document.getElementById('write-count').textContent = nWrite;
            }, States.BufferSorted, textBox.innerHTML]);
            
            // MOVE TO NEXT STATE
            // Copia tutto il buffer nella relazione
            tween = relation.writeGroupAnimation(frames, time, () => {
                // Aggiorno il valore del numero di write
                nWrite += frames.length;
                document.getElementById('write-count').textContent = nWrite;

                applicationState = States.RunSorted;
                showMessage(Messages.currentGroupSorted);
                callback();
            });

            break;

        
        case States.RunSorted:
            // Controlla se questo gruppo e' la radice (significa che hai finito tutto)
            var currentGroup = relation.getCurrentGroup();
            if (currentGroup.parent == null) {
                rollback.push([() =>  relation.highlightGroup(currentGroup, "highlighters"), States.RunSorted, textBox.innerHTML]);
                applicationState = States.Finish;
                relation.highlightGroup(null, "highlighters");      // de-evidenzia la relazione
                showMessage(Messages.finished);
                // disabilita i pulsanti tanto hai finito
                playButton.disabled = true;
                playOneStepButton.disabled = true;
                playJumpButton.disabled = true;
                pauseButton.disabled = true;
                callback();
            }
            // Altrimenti vedi se ha un fratello
            else {
                var next_sibling = relation.getNextLeaf(relation.getCurrentGroup());
                // Se non ci sono altre foglie da ordinare (quindi e' l'ultima foglia), passa alla fase di merge-sort
                if (next_sibling == null) {
                    // UNDO
                    rollback.push([() => {relation.undoSetCurrentGroup(); buffer.setMode('sort')}, States.RunSorted, textBox.innerHTML]);
                    // MOVE TO NEXT STATE
                    relation.setCurrentGroup(relation.getFirstNotLeaf());
                    applicationState = States.RunsToMerge;
                    buffer.setMode('merge');
                    showMessage(Messages.childrenMustBeMergeSorted);
                }
                // Altrimenti se c'e' un'altra foglia da ordinare
                else {
                    relation.setCurrentGroup(next_sibling);
                    // UNDO
                    const frameOldColor = relation.getCurrentGroup().value[0].color;
                    rollback.push([() => {
                            relation.changeGroupColor(relation.getCurrentGroup(), frameOldColor);
                            relation.undoSetCurrentGroup();
                        }, States.RunSorted, textBox.innerHTML]
                    );
                    // MOVE TO NEXT STATE
                    newColor = relation.generateNewColor();
                    relation.changeGroupColor(relation.getCurrentGroup(), newColor);
                    applicationState = States.RunToSort;

                    // Mostra il messaggio
                    showMessage(Messages.currentGroupMustBeSorted);
                    
                }
                callback();
            }
            break;

        case States.RunsToMerge:
            var currentGroup = relation.getCurrentGroup();

            // Prendi tutti i siblings
            var siblings = currentGroup.children;
        
            var framesToWrite = [];

            // Ottieni le posizioni nel buffer dei vari frame (servono per l'animazione)
            var start_x = [];
            var start_y = [];
            var end_x = [];
            var end_y = [];
            var start_size = [];
            var end_size = [];
            var color = [];
            var animationLength = time;

            // Preparo il nuovo colore che verra' utilizzato quando i frames verranno scritti nella relazione
            newColor = relation.generateNewColor();

            // Carica una pagina di ogni child dentro framesToWrite
            for (let i = 0; i < siblings.length; i++) {
                var fr = relation.readOnePageOfChild(i);
                framesToWrite.push(fr);
                start_x.push(fr.x);
                start_y.push(fr.y);
                let endPos = buffer.getPositionOfFrame(i);
                end_x.push(endPos[0]);
                end_y.push(endPos[1]);
                start_size.push(fr.size);
                end_size.push(frameSize);
                color.push(fr.color);
            }

            // UNDO
            var startingIndx = relation.getIndx(currentGroup.children[0].value[0]);
            var emptyFramesSwap = [];
            var dec = 0;
            for (var i = framesToWrite.length; i > 0; i--) {
                var emptyFrame = relation.availableFrames[relation.availableFrames.length - i];
                var emptyIndx = relation.getIndx(emptyFrame);
                var diff = emptyIndx - startingIndx;
                emptyFramesSwap.push(diff - dec);
                if (diff >= 0)
                    dec += 1;
            }

            rollback.push([() => {
                buffer.undoWriteOnBuffer();
                for (var i = framesToWrite.length - 1; i >= 0; i--)
                    relation.undoShiftFramesByOne(startingIndx, emptyFramesSwap[i]);
                console.log("LA RELATION", relation.relationArray);
                for (var i = framesToWrite.length - 1; i >= 0; i--)
                    relation.undoReadOnePageOfChild(framesToWrite[i]);
                console.log("IL VALORE DI CURRENT group", relation.currentGroup)
                nRead -= framesToWrite.length;
                document.getElementById('read-count').textContent = nRead;
            }, States.GroupToMerge, textBox.innerHTML]);

            // MOVE TO NEXT STATE
            // Crea animazione
            tween = animateMultipleSquares(start_x, start_y, end_x, end_y, start_size, end_size, color, animationLength, () => {
                // Shifta i frame in modo da riportare gli spazi vuoti all'inizio 
                for (let i = 0; i < framesToWrite.length; i++) {
                    relation.shiftFramesByOne(framesToWrite[i]);
                }
                // Scrivi i dati nel buffer
                buffer.writeOnBuffer(framesToWrite);
                // Aggiorno il numero di read
                nRead += framesToWrite.length
                document.getElementById('read-count').textContent = nRead;

                applicationState = States.ChildrenInBuffer;
                showMessage(Messages.childrenBeingMergeSorted);
                callback();
            });

            break;


        case States.ChildrenInBuffer:
            // UNDO
            var oldFramesValues = [];
            for (frame of buffer.frames)
                oldFramesValues.push(frame.getValues());
            oldFramesValues.push(buffer.outputFrame.getValues());
            rollback.push([() => {
                buffer.undoMergeAnimation(oldFramesValues);
            }, States.ChildrenInBuffer, textBox.innerHTML])
            
            // MOVE TO NEXT STATE
            // Se alla fine dell'animazione l'output è pieno va svuotato (caso 1),
            // se invece c'è un frame che è stato svuotato allora va riempito (caso 2)
            tween = buffer.mergeAnimation(
                time / 5,
                () => {
                    applicationState = States.OutputFrameFullMerging;
                    showMessage(Messages.outputFrameFull);
                    callback();},
                () => {
                    applicationState = States.OneEmptyFrameInBuffer;
                    showMessage(Messages.emptyFrameInBuffer);
                    callback();},
                true    // merge
            )
            break;
            
        
        case States.OneEmptyFrameInBuffer:       

            var frameEmptyIndx = buffer.framesToRefill.pop();

            var fr = relation.readOnePageOfChild(frameEmptyIndx);
            if (!fr) {
                alert("Error! Trying to load a non-existing new page from a sub-run.");
            }

            // UNDO
            var startingIndx = relation.getIndx(relation.currentGroup.children[0].value[0]);
            var emptyFrame = relation.availableFrames[relation.availableFrames.length - 1];
            var emptyIndx = relation.getIndx(emptyFrame);
            var swap = emptyIndx - startingIndx - relation.availableFrames.length + 1;
            rollback.push([() => {
                buffer.undoWriteOnBufferFrame(frameEmptyIndx);
                relation.undoShiftFramesByOne(startingIndx, swap);
                relation.undoReadOnePageOfChild(fr);
                buffer.framesToRefill.push(frameEmptyIndx);
                nRead -= 1;
                document.getElementById('read-count').textContent = nRead;
            }, States.OneEmptyFrameInBuffer, textBox.innerHTML]);

            // MOVE TO NEXT STATE
            // Ottieni le posizioni nel buffer dei vari frame (servono per l'animazione)
            let endPos = buffer.getPositionOfFrame(frameEmptyIndx);
            end_x = endPos[0];
            end_y = endPos[1];

            animateOneSquare(fr.x, fr.y, end_x, end_y, fr.size, frameSize, fr.color, time, () => {
                // Shifta i frame in modo da riportare gli spazi vuoti all'inizio
                relation.shiftFramesByOne(fr);
                // Scrivi i dati nel buffer
                buffer.writeOnBufferFrame(fr, frameEmptyIndx, () => {
                    // Aggiorno il valore del numero di read
                    nRead += 1
                    document.getElementById('read-count').textContent = nRead;

                    // Se c'e' un altro frame vuoto
                    if (buffer.framesToRefill.length) {
                        applicationState = States.OneEmptyFrameInBuffer;
                        showMessage(Messages.emptyFrameInBuffer);
                    }
                    // Se l'output frame e' pieno
                    else if (buffer.checkFullOutput()) {
                        applicationState = States.OutputFrameFullMerging;
                        showMessage(Messages.outputFrameFull);
                    }
                    // Altrimenti riprendi il merge dei frame del buffer
                    else {
                        applicationState = States.ChildrenInBuffer;
                        showMessage(Messages.childrenBeingMergeSorted);
                    }
                    callback();
                });
            });
            
            break;

        
        case States.OutputFrameFullMerging:

            // UNDO
            var currentGroup = relation.getCurrentGroup();

            var freeAvailableFrame = relation.getFreeAvailableFrame();
            const oldBufferValues = buffer.outputFrame.getValues();
            const oldIndices = [];
            for (var i = 0; i < currentGroup.children.length; i++) {
                for (var j = 0; j < currentGroup.children[i].value.length; j++) {
                    var frame = currentGroup.children[i].value[j];
                    oldIndices.push([frame, i, j, relation.getAvailableFrameIndx(frame)]);
                }
            }
            oldIndices.sort(compareFramesByPosition);
            for (var i = 0; i < oldIndices.length; i++) {
                oldIndices[i].shift()
            }
            rollback.push([() => {
                buffer.undoFlushOutputFrame(oldBufferValues);
                if (!buffer.bufferContainsSomething()) {
                    relation.undoMergeChildren(oldIndices);
                }
                relation.undoWriteWithAnimation(freeAvailableFrame, oldIndices);
                nWrite -= 1;
                document.getElementById('write-count').textContent = nWrite;
            }, States.OutputFrameFullMerging, textBox.innerHTML]);


            // MOVE TO NEXT STATE

            // Prendi l'output frame
            var frame = buffer.flushOutputFrame();

            // Imposta il suo colore pari al colore nuovo che stiamo dando al gruppo mergiato
            frame.color = newColor;

            // Copia l'output frame nella relazione
            tween = relation.writeWithAnimation(frame, frame.color, time, () => {
                // Aggiorno il valore del numero di write
                nWrite += 1;
                document.getElementById('write-count').textContent = nWrite;

                // Se c'e' ancora qualcosa nel buffer torni allo stato ChildrenInBuffer, altrimenti mergia i children
                if (buffer.bufferContainsSomething()) {
                    applicationState = States.ChildrenInBuffer;
                    showMessage(Messages.bufferContentBeingSorted);
                }
                else {
                    // Se non c'è il padre terminiamo. Se c'e' allora prendiamo il prossimo nodo alla stessa profondita'
                    relation.mergeChildren();
                    applicationState = States.RunsMerged;
                    showMessage(Messages.currentGroupMerged);
                }
                callback();
            });
            break;

        case States.RunsMerged:

            currentGroup = relation.getCurrentGroup();
            // Se non c'è il padre abbiamo finito
            if (!currentGroup.parent) {
                rollback.push([() => relation.setCurrentGroup(currentGroup), States.RunsMerged, textBox.innerHTML]);
                applicationState = States.Finish;
                showMessage(Messages.finished);
                relation.setCurrentGroup(null);
                callback();
                break;
            }

            // Cerco il prossimo nodo da mergiare. Se è nullo quello a destra
            // questo significa che devo prendere il primo nodo all'estrema sinistra. Cioè sto iniziando una nuova ****
            var nextNode = relation.getNextLeaf(relation.getCurrentGroup());
            if (!nextNode) {
                nextNode = relation.relation;
                while (nextNode.children.length)
                    nextNode = nextNode.children[0];
            }
            nextNode = nextNode.parent;

            // UNDO
            const nChildren = nextNode.children.length;
            rollback.push([() => {
                // Se il nuovo gruppo corrente ha un numero di valori uguali a quello del buffer size significa che prima non c'è stato alcun merge
                // grafico, ma logico (lato codice).
                if (nChildren == 1) {
                    const oldIndex = [];
                    for (var i = 0; i < relation.getCurrentGroup().value.length; i++)
                        oldIndex.push([0, i, i]);
                    relation.undoMergeChildren(oldIndex);
                }
                var currentGroup = relation.getCurrentGroup();
                // Se il gruppo corrente è anche il primo singifica che siamo passati al layer superiore. Dobbiamo ritornare a quello inferiore
                // e quindi prendere come nodo l'ultimo a destra che sia una foglia.
                // In caso contrario prendiamo il parente a sinistra.
                if (currentGroup == relation.getFirstNotLeaf())
                    relation.setCurrentGroup(relation.getLastLeaf());
                else
                    relation.setCurrentGroup(relation.getPreviousLeafParent(currentGroup));
            }, States.RunsMerged, textBox.innerHTML]);

            // MOVE TO NEXT STATE
            relation.setCurrentGroup(nextNode);
            // Se il prossimo nodo ha un singolo figlio sinfica che non deve fare merge, è gia mergiato!
            if (nextNode.children.length == 1) {
                relation.mergeChildren();
                applicationState = States.RunsMerged;
                showMessage(Messages.runNotToBeMerged);
            }
            else {
                applicationState = States.RunsToMerge;
                showMessage(Messages.childrenMustBeMergeSorted);
            }
            callback();

            break;

        case States.Finish:
            playing = false;
            automaticPlay = false;
            pauseButton.disabled = true;
            playJumpButton.disabled = true;
            playButton.disabled = true;
            undoButton.disabled = false;
            showMessageBoxContent(true);
            break;

        default:
            break;
    }
}


// Funzione per terminare un tween
function endTween(tween) {
    if (tween == null)
        return ;
    console.log("Il tween: ", tween)
    // Il tween viene stoppato
    tween.stop();
    // I valori modificati dal tween vengono impostati al loro valore finale
    for (var obj in tween._valuesEnd) {
        for (var key in tween._valuesEnd[obj])
            tween._object[obj][key] = tween._valuesEnd[obj][key];
    }
    // E' richiamata la funzione di completamento
    if (tween._onCompleteCallback)
        tween._onCompleteCallback();
    // Tutti i tween concatenati a questo sono fatti terminare, richiamandone anche la funzione di start
    var chainedTweens = tween._chainedTweens;
    for (var i = 0; i < chainedTweens.length; i++) {
        if (chainedTweens[i]._onStartCallback)
            chainedTweens[i]._onStartCallback();
        endTween(chainedTweens[i]);
    }
}


async function callback() {

    console.log("Lo stato dell'applicazione: ", applicationState)

    playing = false;    // per dire che l'esecuzione attuale e' terminata

    // Se non e' attiva la riproduzione automatica, mostra la message box, altrimenti nascondila
    showMessageBoxContent(!automaticPlay);

    if (!paused && automaticPlay) {
        await new Promise(r => setTimeout(r, waitingTime));
        play(animTime);
    }
}


// ANIMAZIONI
function animate() {

    // PER IL REDRAW
    if (mustRedraw && !playing) {
        if (Date.now() - lastResizeTime > timeIntervalForRedraw) {
            mustRedraw = false;
            // ri-disegna tutto
            console.log("redrawing");
            redrawEverything();
        }
    }

    TWEEN.update();
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate)




function redrawEverything() {

    // Aggiorna misure
    updateSizes();

    // Ri disegna buffer
    buffer.redrawBuffer(upperPart.center.x, upperPart.center.y - 15);

    // Ri disegna la relazione
    relation.redrawRelation(lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, 15);
}


function updateSizes() {
    windowW = window.innerWidth;
    windowH = window.innerHeight;
    centerX = windowW / 2;
    centerY = windowH / 2;

    MEDIUM_LINE = windowW/550;
    THICK_LINE = windowW/420;
    VERY_THICK_LINE = windowW/320;

    frameSize = windowW/15;
    SPACE_BETWEEN_FRAMES = windowW/200;

    fontSizeBig = windowW/60;
    fontSizeMedium = windowW/80;
    fontSizeSmall = windowW/100;
    
    fontStyleMediumBlack.size = fontSizeMedium;
    fontStyleMediumGray.size = fontSizeMedium;
    fontStyleSmallBlack.size = fontSizeSmall;
    fontStyleSmallBlackCentered.size = fontSizeSmall;
    
    // Aggiorna sezioni
    leftColumn = new Section(document.getElementById("column_sx"));
    centerColumn = new Section(document.getElementById("column_center"));
    upperPart = new Section(document.getElementById("column_center_upper_part"));
    lowerPart = new Section(document.getElementById("column_center_lower_part"));
}



// Funzione che fa apparire un quadrato che si sposta da una pos iniziale a una finale, poi
// quando l'animazione termina elimina il quadrato e chiama la callback che gli viene passata
function animateOneSquare(start_x, start_y, end_x, end_y, start_size, end_size, color, time, animationCompleteCallback = null) {

    // Crea il quadrato
    var square = two.makeRectangle(start_x, start_y, start_size, start_size);
    square.fill = color;
    square.noStroke();
    
    var values = { x: start_x, y: start_y, size: start_size };
    const tween = new TWEEN.Tween(values)
        .to({ x: end_x, y: end_y, size: end_size }, time)
        .onUpdate(function() {
            square.translation.set(values.x, values.y);
            square.scale = values.size/start_size;
        })
        .onComplete(() => {
            // elimina il quadrato
            square.remove();
            // se c'e', chiama la callback
            if (animationCompleteCallback != null) animationCompleteCallback();
        });

    tween.start();

    return tween;
}

function compareFramesByPosition( frame1, frame2 ) {
    frame1 = frame1[0];
    frame2 = frame2[0];
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

// Come animateOneSquare, solo che start_x, start_y, end_x, end_y, size, e color ora
// sono degli array (devono essere tutti della stessa lunghezza)
function animateMultipleSquares(start_x, start_y, end_x, end_y, start_size, end_size, color, time, animationCompleteCallback = null) {

    var numberOfSquares = start_x.length;

    // Crea i quadrati e l'array con le posizioni attuali
    var squares = [];
    var currentValues = [];     // array di dizionari contenenti: x, y, size
    var endValues = [];
    for (var i = 0; i < numberOfSquares; i++) {
        var sq = two.makeRectangle(start_x[i], start_y[i], start_size[i], start_size[i]);
        sq.fill = color[i];
        sq.noStroke();
        squares.push(sq);
        currentValues.push({ x: start_x[i], y: start_y[i], size:start_size[i] });
        endValues.push({ x: end_x[i], y: end_y[i], size:end_size[i] });
    }
    const tween = new TWEEN.Tween(currentValues)
        .to(endValues, time)
        .onUpdate(function() {
            for (var i = 0; i < numberOfSquares; i++) {
                squares[i].translation.set(currentValues[i].x, currentValues[i].y);
                squares[i].scale = currentValues[i].size/start_size[i];
            }
            
        })
        .onComplete(() => {
            // elimina i quadrati
            for (var i = 0; i < numberOfSquares; i++) {
                squares[i].remove();
            }
            // se c'e', chiama la callback
            if (animationCompleteCallback != null) animationCompleteCallback();
        });

    tween.start();

    return tween;
}





