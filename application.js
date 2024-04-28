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

var textBox = null;     // Casella a sx in cui appaiono messaggi


// PER GESTIRE L'ANIMAZIONE
var playOneStepButton = null;
var playButton = null;
var pauseButton = null;

var automaticPlay = true;
var paused = true;
var playing = false;    // per evitare di chiamare di nuovo play() fino a che la callback non e' stata chiamata



// PARAMETRI PER GRAFICA

var two;

// Misure dello schermo
var windowW = window.innerWidth;
var windowH = window.innerHeight;
var centerX = windowW / 2;
var centerY = windowH / 2;

// Costanti
const MAX_ELEMENTS_PER_FRAME = 5;

const MEDIUM_LINE = windowW/550;
const THICK_LINE = windowW/400;
const VERY_THICK_LINE = windowW/320;

const frameSize = windowW/15;
const SPACE_BETWEEN_FRAMES = windowW/200;

const fontSizeBig = windowW/60;
const fontSizeMedium = windowW/80;
const fontSizeSmall = windowW/100;

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



// MESSAGGI
const Messages = {
	currentGroupMustBeSorted: "The current group must be sorted.",
    currentGroupDoesNotFit: "The current group doesn't fit in the buffer, so must be split.",
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

    // Handler slider
    document.getElementById("buffer_size").onchange = function(event) {
        bufferSize = event.target.value;
        document.getElementById("buffer_size_value").innerHTML = bufferSize;
    };
    document.getElementById("relation_size").onchange = function(event) {
        relationSize = event.target.value;
        document.getElementById("relation_size_value").innerHTML = relationSize;
    };

    textBox = document.getElementById("text_box"); 
    
    playOneStepButton = document.getElementById("step_button"); 
    playButton = document.getElementById("play_button");
    pauseButton = document.getElementById("pause_button");
    pauseButton.disabled = true;    // parte disattivato
}


function startSimulation() {

    // Nascondi il div del menu
    document.getElementById("menu").setAttribute("hidden", null);

    // Mostra il div simulation
    var simulation = document.getElementById("simulation");
    simulation.removeAttribute("hidden");


    
    // Aggiungi controlli da tastiera (va fatto ora se no uno poteva premere la barra spaziatrice prima di avviare la simulazione)
    
    document.onkeydown = function(e) {
        switch (e.key) {
            /*
            case "ArrowLeft":     
                e.preventDefault();       
                break;
            */
            case "ArrowRight":
                e.preventDefault();
                playOne();
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


    var leftColumn = new Section(document.getElementById("column_sx"));
    var centerColumn = new Section(document.getElementById("column_center"));
    var upperPart = new Section(document.getElementById("column_center_upper_part"));
    var lowerPart = new Section(document.getElementById("column_center_lower_part"));
    
    
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
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;
        //two.renderer.setSize(window.innerWidth, window.innerHeight);
        //two.scene.translation.set(two.width / 2, two.height / 2);
        two.scene.translation.set(0, 0);
        two.update();
    }

    // Sfondo
    //two.renderer.domElement.style.background = '#fcb215';


    // Scritta "Buffer"   makeText(message, x, y, style)
    two.makeText("BUFFER", upperPart.bottomLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.25*upperPart.height, fontStyleMediumBlack); 
    // Scritta con la dimensione del buffer
    two.makeText("M = " + bufferSize, upperPart.topLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.15*upperPart.height, fontStyleMediumGray); 
    
    // Scritta "Relation"
    two.makeText("RELATION", lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.15*upperPart.height, fontStyleMediumBlack); 
    // Scritta con la dimensione della relazione
    two.makeText("B(R) = " + relationSize, lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.25*upperPart.height, fontStyleMediumGray); 
    

    // CREA BUFFER         constructor(x, y, length, frameSize, two)
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);

    // CREA RELAZIONE
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);



    // updates the drawing area and actually renders the content
    two.update();
}



function showMessage(text) {
    textBox.innerHTML = text;
}



function playOne() {
    // esci dalla pausa
    paused = false;

    // disattiva riproduzione automatica
    automaticPlay = false;

    // disattiva pulsante pausa
    pauseButton.disabled = true;

    play();
}

function playAll() {
    // esci dalla pausa
    paused = false;

    // attiva riproduzione automatica
    automaticPlay = true;

    // disattiva pulsante step
    playOneStepButton.disabled = true;

    // attiva pulsante pausa
    pauseButton.disabled = false;

    // leva i messaggi
    showMessage("");

    play();
}

function pause() {
    // disattiva pulsante pausa
    pauseButton.disabled = true;

    // attiva pulsante play one
    playOneStepButton.disabled = false;

    // attiva pulsante play
    playButton.disabled = false;

    // metti in pausa
    paused = true;
}




// FUNZIONE PLAY
function play() {
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

            relation.highlightGroup(relation.getCurrentGroup(), () => {
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
                var animationLength = 1000;
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
                        applicationState = States.GroupInBuffer;
                        if (!automaticPlay) showMessage(Messages.bufferContentBeingSorted);
                        callback();
                    });
                });
            }
            break;

        case States.GroupInBuffer:
            // Avvia il sort
            buffer.sortAnimation(() => {
                applicationState = States.OutputFrameFullSorting;
                if (!automaticPlay) showMessage(Messages.outputFrameFull);
                callback();
            });
            break;
    
        case States.OutputFrameFullSorting:
            // Prendi l'output frame
            var frame = buffer.flushOutputFrame();
            // Copia l'output frame nella relazione
            relation.writeWithAnimation(frame, false, () => {
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
                relation.highlightGroup(null);      // de-evidenzia la relazione
                showMessage(Messages.finished);
                callback();
            }
            // Altrimenti vedi se ha un fratello
            else {
                var next_sibling = relation.getNextSibling();
                // Se non ha fratelli (quindi e' l'ultimo dei suoi fratelli), passa alla fase di merge-sort
                if (next_sibling == null) {
                    console.log("current group has no siblings left");
                    relation.setCurrentGroup(currentGroup.parent);
                    applicationState = States.GroupToMerge;
                    if (!automaticPlay) showMessage(Messages.childrenMustBeMergeSorted);
                }
                else {
                    console.log("current group has a sibling");
                    relation.setCurrentGroup(next_sibling);
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
                var animationLength = 1000;

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

                animateOneSquare(fr.x, fr.y, end_x, end_y, fr.size, frameSize, fr.color, 1000, () => {
                    // Shifta i frame in modo da riportare gli spazi vuoti all'inizio
                    relation.shiftFramesByOne(fr);
                    // Scrivi i dati nel buffer
                    buffer.writeOnBufferFrame(fr, frameEmptyIndx, () => {
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
            frame.color = relation.getColorOfLastChild();
            // Copia l'output frame nella relazione
            relation.writeWithAnimation(frame, true, () => {
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
            await new Promise(r => setTimeout(r, 500));
            play();
        }
    }
    // per assicurarsi che i pulsanti non si sono incasinati nel frattempo?
    else {
        playButton.disabled = false;
        playOneStepButton.disabled = false;
        pauseButton.disabled = true;
    }
}


// ANIMAZIONI
function animate() {
    TWEEN.update();
    //two.update();
	requestAnimationFrame(animate);
    //console.log(frame.rect_search.position.x)
}
requestAnimationFrame(animate)



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





