"use strict";


// PARAMETRI SIMULAZIONE
var bufferSize = 3;
var relationSize = 9;

var buffer = null;
var relation = null;

const States = {
	Start: "Start",
	GroupToSort: "Current group is not sorted",
	GroupInBuffer: "Current group loaded in buffer, waiting to be sorted",
	OutputFrameFullSorting: "Sorting, the output frame is full",
    GroupSorted: "Current group is being sorted",
    GroupToMerge: "Current group has children that must be merge-sorted",
    ChildrenInBuffer: "Children of current group are in the buffer, waiting to be merge-sorted",
    OneEmptyFrameInBuffer: "One empty frame in buffer during merge-sort",
    OutputFrameFullMerging: "Merging, the output frame is full",
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


// PARAMETRI PER GRAFICA
var two;

var textBox = null;     // Casella a sx in cui appaiono messaggi
var showingRelationContent = true; 

// Per fare il redraw quando cambi la dimensione della finestra
var mustRedraw = false;
var lastResizeTime = null;
const timeIntervalForRedraw = 100; // ri-disegna solo se e' passato un secondo dall'ultimo resize

var leftColumn, centerColumn, upperPart, lowerPart;

// Elementi di cui fare redraw:
var bufferText = null;
var bufferFramesText = null;
var relationText = null;
var relationFramesText = null;

// Misure dello schermo
var windowW = window.innerWidth;
var windowH = window.innerHeight;
var centerX = windowW / 2;
var centerY = windowH / 2;

// Costanti
const MAX_ELEMENTS_PER_FRAME = 5;

var MEDIUM_LINE = windowW/550;
var THICK_LINE = windowW/400;
var VERY_THICK_LINE = windowW/320;

var frameSize = windowW/15;
var SPACE_BETWEEN_FRAMES = windowW/200;

var fontSizeBig = windowW/60;
var fontSizeMedium = windowW/80;
var fontSizeSmall = windowW/100;

// Valori I/O
var nRead = 0
var nWrite = 0

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
var newColor


// Lunghezza animazioni e pausa callback
const animTimeMin = 500;
const animTimeMax = 1000;
var animTime = animTimeMax;
const waitingTimeMin = 250;
const waitingTimeMax = 500;
var waitingTime = waitingTimeMax;


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
	currentGroupMustBeSorted: "The current group must be sorted.",
    currentGroupDoesNotFit: "The current group doesn't fit in the buffer, so it must be split.",
    currentGroupFitsInBuffer: "The current group fits in the buffer, so it will be copied there.",
    childrenMustBeMergeSorted: "These sub-groups have been individually sorted, now they must be merged.",
    outputFrameFull: "The output frame is full, so it must be written back in the relation.",
    emptyFrameInBuffer: "The buffer has an empty frame. It must load a new page of the corresponding sub-group.",
    bufferContentBeingSorted: "The content of the buffer must be sorted.",
    currentGroupSorted: "The current group has been sorted.",
    childrenBeingMergeSorted: "A page of each sub-group has been loaded in the buffer. They must be merge-sorted.",
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
    animSlowerButton.disabled = true;
    animFasterButton.onclick = function() {
        console.log("faster");
        animTime = animTimeMin;
        waitingTime = waitingTimeMin;
        animFasterButton.disabled = true;
        animSlowerButton.disabled = false;
    }
    animSlowerButton.onclick = function() {
        console.log("slower");
        animTime = animTimeMax;
        waitingTime = waitingTimeMax;
        animFasterButton.disabled = false;
        animSlowerButton.disabled = true;
    }
}


function openMenu() {
    pause();
    document.getElementById("menu").removeAttribute("hidden");
}


function closeMenu() {
    document.getElementById("menu").setAttribute("hidden", null);
}


function startSimulation() {

    // Nascondi il div del menu
    document.getElementById("menu").setAttribute("hidden", null);

    // Rendo visibile il bottone resume del menu. Cambio il messaggio del bottone start e la sua funzione onclick
    document.getElementById("resume").removeAttribute("hidden");
    document.getElementById("start_simulation").innerHTML = "Restart";
    document.getElementById("start_simulation").onclick = () => {reset(); closeMenu()};
    /*
    document.getElementById("start_simulation").setAttribute("value", "Restart");
    document.getElementById("start_simulation").onclick = () => {reset(); closeMenu()};
    */

    // Mostra il div centrale
    document.getElementById("column_center").removeAttribute("hidden");
    document.getElementById("restart_button").removeAttribute("hidden");

    // Aggiungi controlli da tastiera (va fatto ora se no uno poteva premere la barra spaziatrice prima di avviare la simulazione)
    document.onkeydown = function(e) {
        switch (e.key) {
            case "ArrowLeft":     
                // TODO: fare undo
                e.preventDefault();       
                break;
            case "ArrowRight":
                e.preventDefault();
                playOne(0);
                break;

            case " ":
                e.preventDefault();
                if (paused || !automaticPlay)
                    playAll();
                else
                    pause();
                break;

            case "Enter":
                e.preventDefault();
                playOne();
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
        //fitted: false,
        //width: 0.8*windowW, //centerColumn.width,
        //height: windowH, //centerColumn.height,
        autostart: true,
    }).appendTo(document.getElementById("column_center"));


    // questo non funziona:
    window.onresize = function() {
        mustRedraw = true;
        lastResizeTime = Date.now();    // tempo attuale (precisione millisecondi)
    }


    // Scritta "Buffer" e dimensione buffer
    bufferText = two.makeText("BUFFER", upperPart.bottomLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.25*upperPart.height, fontStyleMediumBlack);
    bufferFramesText = two.makeText("M = " + bufferSize, upperPart.topLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.15*upperPart.height, fontStyleMediumGray); 
    
    // Scritta "Relation" e dimensione relazione
    relationText = two.makeText("RELATION", lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.15*upperPart.height, fontStyleMediumBlack); 
    relationFramesText = two.makeText("B(R) = " + relationSize, lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.25*upperPart.height, fontStyleMediumGray); 
    
    // CREA BUFFER         constructor(x, y, length, frameSize, two)
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);

    // CREA RELAZIONE
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);

    // updates the drawing area and actually renders the content
    two.update();
}


function reset() {
    console.log("Resettiamo!")
    textBox.innerHTML = "";
    nRead = 0;
    nWrite = 0;
    document.getElementById('read-count').textContent = 0;
    document.getElementById('write-count').textContent = 0;
    automaticPlay = true;
    paused = true;
    playing = false;
    playOneStepButton.disabled = false;
    playButton.disabled = false;
    pauseButton.disabled = true;
    playJumpButton.disabled = false;
    applicationState = States.Start; 

    var upperPart = new Section(document.getElementById("column_center_upper_part"));
    var lowerPart = new Section(document.getElementById("column_center_lower_part"));
    buffer.group.remove();
    relation.group.remove();    
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);
    bufferFramesText.value = 'M = ' + bufferSize;
    relationFramesText.value = 'B(R) = ' + relationSize;
    two.update();
}


function showMessage(text) {
    textBox.innerHTML = text;
}



function playOne(time = animTime) {
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

    // leva i messaggi
    showMessage("");

    play(animTime);
}

function pause() {
    // disattiva pulsante pausa
    pauseButton.disabled = true;

    // attiva pulsanti play e back
    playButton.disabled = false;
    playOneStepButton.disabled = false;
    playJumpButton.disabled = false;
    undoButton.disabled = false;

    // metti in pausa
    paused = true;
}



// FUNZIONE PLAY
function play(time = animTime) {
    if (relation == null || buffer == null || playButton == null) return;

    // Se stava gia' riproducendo qualcosa non fare nulla
    if (playing) return;

    playing = true;

    switch (applicationState) {
        
        case States.Start:
            // Questo controllo e' per mostrare il messaggio giusto
            if (!automaticPlay) {
                if (relation.getCurrentGroup().value.length > bufferSize - 1) {
                    showMessage(Messages.currentGroupDoesNotFit);
                }
                else {
                    showMessage(Messages.currentGroupFitsInBuffer);
                }
            }

            relation.highlightGroup(relation.getCurrentGroup(), "highlighters", () => {
                applicationState = States.GroupToSort;
                callback();
            });
            break;

        case States.GroupToSort:
            var currentGroup = relation.getCurrentGroup();
            // Se il gruppo non entra nel buffer, splittalo e rimani in questo stato
            if (currentGroup.value.length > bufferSize - 1) {
                relation.splitGroup(bufferSize - 1);

                // Questo controllo e' per mostrare il messaggio giusto
                if (!automaticPlay) {
                    if (relation.getCurrentGroup().value.length > bufferSize - 1) {
                        showMessage(Messages.currentGroupDoesNotFit);
                    }
                    else {
                        showMessage(Messages.currentGroupFitsInBuffer);
                    }
                }

                callback();
            }
            // Altrimenti, leggi il contenuto del primo gruppo e scrivilo nel buffer
            else {
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
                animateMultipleSquares(start_x, start_y, end_x, end_y, start_size, end_size, color, animationLength, () => {
                    // Quando terminano le animazioni, scrivi i dati nel buffer
                    buffer.writeOnBuffer(frames, () => {
                        // Aggiorno il numero di read
                        nRead += frames.length
                        document.getElementById('read-count').textContent = nRead;

                        applicationState = States.GroupInBuffer;
                        if (!automaticPlay) showMessage(Messages.bufferContentBeingSorted);
                        callback();
                    });
                });
            }
            break;

        case States.GroupInBuffer:
            // Avvia il sort
            buffer.sortAnimation(time / 5, () => {
                applicationState = States.OutputFrameFullSorting;
                if (!automaticPlay) showMessage(Messages.outputFrameFull);
                callback();
            });
            break;
    
        case States.OutputFrameFullSorting:
            // Prendi l'output frame
            var frame = buffer.flushOutputFrame();

            // Copia l'output frame nella relazione
            relation.writeWithAnimation(frame, false, time, () => {
                // Aggiorno il valore del numero di write
                nWrite += 1
                document.getElementById('write-count').textContent = nWrite;

                // Se c'e' ancora qualcosa nel buffer torni allo stato GroupInBuffer, altrimenti vai a GroupSorted
                if (buffer.bufferContainsSomething()) {
                    //console.log("buffer still contains something");
                    applicationState = States.GroupInBuffer;
                    if (!automaticPlay) showMessage(Messages.bufferContentBeingSorted);
                }
                else {
                    //console.log("buffer is empty");
                    applicationState = States.GroupSorted;
                    if (!automaticPlay) showMessage(Messages.currentGroupSorted);
                }
                callback();
            });
            break;

        
        case States.GroupSorted:
            // Controlla se questo gruppo e' la radice (significa che hai finito tutto)
            var currentGroup = relation.getCurrentGroup();
            if (currentGroup.parent == null) {
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
                var next_sibling = relation.getNextSibling();
                // Se non ha fratelli (quindi e' l'ultimo dei suoi fratelli), passa alla fase di merge-sort
                if (next_sibling == null) {
                    console.log("current group has no siblings left");
                    relation.setCurrentGroup(currentGroup.parent);
                    relation.highlightGroup(null, "highlightersSort");
                    applicationState = States.GroupToMerge;
                    if (!automaticPlay) showMessage(Messages.childrenMustBeMergeSorted);
                }
                else {
                    console.log("current group has siblings left");
                    if (currentGroup.value.length > buffer.length - 1)
                        relation.setCurrentGroup(next_sibling);
                    else
                        relation.setCurrentGroupToSort(next_sibling);
                    applicationState = States.GroupToSort;
                    // Questo controllo e' per mostrare il messaggio giusto
                    if (!automaticPlay) {
                        if (relation.getCurrentGroup().value.length > bufferSize - 1) {
                            showMessage(Messages.currentGroupDoesNotFit);
                        }
                        else {
                            showMessage(Messages.currentGroupFitsInBuffer);
                        }
                    }
                }
                callback();
            }
            break;
        
        case States.GroupToMerge:
            var currentGroup = relation.getCurrentGroup();
            
                // Prendi tutti i siblings
                var siblings = currentGroup.children;
        
                var framesToWrite = [];

                // Ottieni le posizioni nel buffer dei vari frame (servono per l'animazione)
                start_x = [];
                start_y = [];
                end_x = [];
                end_y = [];
                start_size = [];
                end_size = [];
                color = [];
                var animationLength = time;

                // Genero un nuovo colore che verrà utilizzato quando i frames verranno scritti nella relazioni
                newColor = relation.generateNewColor()

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

                // Crea animazione
                animateMultipleSquares(start_x, start_y, end_x, end_y, start_size, end_size, color, animationLength, () => {
                    // Shifta i frame in modo da riportare gli spazi vuoti all'inizio
                    
                    for (let i = 0; i < framesToWrite.length; i++) {
                        console.log("sto shiftando");
                        relation.shiftFramesByOne(framesToWrite[i]);
                    }
                    
                    // Scrivi i dati nel buffer
                    buffer.writeOnBuffer(framesToWrite, () => {
                        // Aggiorno il numero di read
                        nRead += framesToWrite.length
                        document.getElementById('read-count').textContent = nRead;

                        applicationState = States.ChildrenInBuffer;
                        if (!automaticPlay) showMessage(Messages.childrenBeingMergeSorted);
                        callback();
                    });
                });

            break;


        case States.ChildrenInBuffer:
            // Se alla fine dell'animazione l'output è pieno va svuotato (caso 1),
            // se invece c'è un frame che è stato svuotato allora va riempito (caso 2)
            buffer.sortAnimation(
                time / 5,
                () => {
                    applicationState = States.OutputFrameFullMerging;
                    if (!automaticPlay) showMessage(Messages.outputFrameFull);
                    callback();},
                () => {
                    applicationState = States.OneEmptyFrameInBuffer;
                    if (!automaticPlay) showMessage(Messages.emptyFrameInBuffer);
                    callback();},
                true    // merge
            )
            break;
            
        
        case States.OneEmptyFrameInBuffer:       

            var frameEmptyIndx = buffer.frameToRefill;

            var fr = relation.readOnePageOfChild(frameEmptyIndx);
            if (fr) {
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

                        // Se l'output è pieno
                        if (buffer.checkFullOutput()) {
                            applicationState = States.OutputFrameFullMerging;
                            if (!automaticPlay) showMessage(Messages.outputFrameFull);
                        }
                        else {
                            applicationState = States.ChildrenInBuffer;
                            if (!automaticPlay) showMessage(Messages.childrenBeingMergeSorted);
                        }
                        callback();
                    });
                });
            }
            else {
                 // L'output è pieno
                if (buffer.checkFullOutput()) {
                    applicationState = States.OutputFrameFullMerging;
                    if (!automaticPlay) showMessage(Messages.outputFrameFull);
                }
                // Il buffer non è vuoto
                else if (buffer.bufferContainsSomething()) {
                    applicationState = States.ChildrenInBuffer;
                    if (!automaticPlay) showMessage(Messages.childrenBeingMergeSorted);
                }
                else {
                    applicationState = States.OutputFrameFullMerging;
                    if (!automaticPlay) showMessage(Messages.outputFrameFull);
                }
                callback();
            }
            break;

        
        case States.OutputFrameFullMerging:
            // Prendi l'output frame
            var frame = buffer.flushOutputFrame();

            // Imposta il suo colore pari al colore dell'ultimo figlio
            //frame.color = relation.getColorOfLastChild();
            frame.color = newColor

            // Copia l'output frame nella relazione
            relation.writeWithAnimation(frame, frame.color, time, () => {
                // Aggiorno il valore del numero di write
                nWrite += 1
                document.getElementById('write-count').textContent = nWrite;

                // Se c'e' ancora qualcosa nel buffer torni allo stato GroupInBuffer, altrimenti vai a GroupSorted
                if (buffer.bufferContainsSomething()) {
                    console.log("buffer still contains something");
                    applicationState = States.ChildrenInBuffer;
                    if (!automaticPlay) showMessage(Messages.bufferContentBeingSorted);
                }
                else {
                    relation.mergeChildren();
                    applicationState = States.GroupSorted;
                    if (!automaticPlay) showMessage(Messages.currentGroupSorted);
                }
                callback();
            });
            break;

        case States.Finish:
            playing = false;
            automaticPlay = false;
            pauseButton.disabled = true;
            playJumpButton.disabled = true;
            playButton.disabled = true;
            undoButton.disabled = false;
            break;

        default:
            break;
    }

    console.log("I'm in state: " + applicationState);
}

async function callback() {
    playing = false;    // per dire che l'esecuzione attuale e' terminata
    if (!paused) {
        if (!automaticPlay) {
            // attiva pulsante play
            playButton.disabled = false;
        }
        else {
            await new Promise(r => setTimeout(r, waitingTime));
            play(animTime);
        }
    }
    // per assicurarsi che i pulsanti non si sono incasinati nel frattempo?
    else {
        playButton.disabled = false;
        playOneStepButton.disabled = false;
        playJumpButton.disabled = false;
        pauseButton.disabled = true;
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
    //two.update();
	requestAnimationFrame(animate);
    //console.log(frame.rect_search.position.x)
}
requestAnimationFrame(animate)



function redrawEverything() {

    // Aggiorna misure
    updateSizes();

    // Rimuovi scritte
    bufferText.remove();
    bufferFramesText.remove();
    relationText.remove();
    relationFramesText.remove();

    // Scritta "Buffer" e dimensione buffer
    bufferText = two.makeText("BUFFER", upperPart.bottomLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.25*upperPart.height, fontStyleMediumBlack);
    bufferFramesText = two.makeText("M = " + bufferSize, upperPart.topLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.15*upperPart.height, fontStyleMediumGray); 
    
    // Scritta "Relation" e dimensione relazione
    relationText = two.makeText("RELATION", lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.15*upperPart.height, fontStyleMediumBlack); 
    relationFramesText = two.makeText("B(R) = " + relationSize, lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.25*upperPart.height, fontStyleMediumGray); 

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
    THICK_LINE = windowW/400;
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
}





