

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
    GroupSorted: "Current group is sorted",
    GroupToMerge: "Current group has children that must be merge-sorted",
    ChildrenInBuffer: "Children of current group are in the buffer, waiting to be merge-sorted",
    OneEmptyFrameInBuffer: "One empty frame in buffer during merge-sort",
    OutputFrameFullMerging: "Merging, the output frame is full",
    Finish: "Finished"
}

var applicationState = States.Start;    // Tiene lo stato attuale dell'applicazione
var playButton = null;



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
var fontStyleMediumBlack = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeMedium,
    weight: 650,
    fill: "rgb(0,0,0)"
}
var fontStyleMediumGray = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeMedium,
    weight: 600,
    fill: "rgb(79,79,79)"
}
var fontStyleSmallBlack = {
    alignment: "left",
    family: "Calibri",
    size: fontSizeSmall,
    weight: 650,
    fill: "rgb(0,0,0)"
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

    playButton = document.getElementById("play_button");
}


function startSimulation() {

    // Nascondi il div del menu
    document.getElementById("menu").setAttribute("hidden", null);

    // Mostra il div simulation
    var simulation = document.getElementById("simulation");
    simulation.removeAttribute("hidden");



    /* COLONNA A SINISTRA */
    var left_column_width = windowW / 5;
    var left_column_height = windowH;
    var left_column_center_x = left_column_width / 2;
    var left_column_center_y = centerY;
    var leftColumn = new Section(left_column_center_x, left_column_center_y, left_column_width, left_column_height);

    /* COLONNA CENTRALE */
    var center_column_width = windowW - left_column_width;
    var center_column_height = windowH;
    var center_column_center_x = left_column_width + center_column_width / 2;
    var center_column_center_y = centerY;
    var centerColumn = new Section(center_column_center_x, center_column_center_y, center_column_width, center_column_height);

    /* PARTE AL CENTRO SOPRA (dove mettiamo il buffer) */
    var upper_part_width = center_column_width;
    var upper_part_height = windowH / 2.8;
    var upper_part_center_x = center_column_center_x;
    var upper_part_center_y = upper_part_height / 2;
    var upperPart = new Section(upper_part_center_x, upper_part_center_y, upper_part_width, upper_part_height);

    /* PARTE AL CENTRO SOTTO (dove mettiamo la relation) */
    var lower_part_width = center_column_width;
    var lower_part_height = windowH - upper_part_height;
    var lower_part_center_x = center_column_center_x;
    var lower_part_center_y = upper_part_height + lower_part_height / 2;
    var lowerPart = new Section(lower_part_center_x, lower_part_center_y, lower_part_width, lower_part_height);



    // Avvia Two
    two = new Two({
        type: Two.Types.svg,
        fullscreen: true,
        //fitted: true,
        autostart: true
    }).appendTo(simulation);


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

    // Linee che separano le sezioni
    // verticale tra colonna sx e colonna centrale:
    var line1 = two.makeLine(leftColumn.topRightCorner.x, leftColumn.topRightCorner.y, leftColumn.bottomRightCorner.x, leftColumn.bottomRightCorner.y);
    line1.linewidth = MEDIUM_LINE;
    // orizzontale tra upper e lower
    var line2 = two.makeLine(upperPart.bottomLeftCorner.x, upperPart.bottomLeftCorner.y, upperPart.bottomRightCorner.x, upperPart.bottomRightCorner.y);
    line2.linewidth = MEDIUM_LINE;



    // Scritta "Buffer"   makeText(message, x, y, style)
    two.makeText("BUFFER", upperPart.bottomLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.25*upperPart.height, fontStyleMediumBlack); 
    // Scritta con la dimensione del buffer
    two.makeText("M = " + bufferSize, upperPart.topLeftCorner.x + 0.05*upperPart.width, upperPart.bottomLeftCorner.y - 0.15*upperPart.height, fontStyleMediumGray); 
    
    // Scritta "Relation"
    two.makeText("RELATION", lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.15*upperPart.height, fontStyleMediumBlack); 
    // Scritta con la dimensione della relazione
    two.makeText("B(R) = " + relationSize, lowerPart.topLeftCorner.x + 0.05*lowerPart.width, lowerPart.topLeftCorner.y + 0.25*upperPart.height, fontStyleMediumGray); 
    

    // PROVA BUFFER         constructor(x, y, length, frameSize, two)
    buffer = new Buffer(upperPart.center.x, upperPart.center.y - 15, bufferSize, frameSize, two);

    // PROVA RELAZIONE
    relation = new Relation(two, relationSize, lowerPart.center.x, lowerPart.center.y + 40, lowerPart.width*0.9, lowerPart.height*0.75, frameSize, 15);






    // updates the drawing area and actually renders the content
    two.update();
}



/*

ALGORITMO RICORSIVO:

1)  Inizio: crea un solo nodo che è tutta la relazione
2)  Prendi un nodo
3)  Se entra nel buffer:
4) 	    Mettilo nel buffer e ordinalo
5) 	    Se ha un nodo "fratello":
6) 		    Ripeti da 2), con questo nuovo nodo
7) 	    Altrimenti:
8)		    Prendi tutti i nodi fratelli, se stesso incluso, e avvia il merge
9)  Altrimenti:
10) 	Dividi il nodo in due sotto-nodi
11)	Prendi il primo di questi due sotto-nodi e ripeti da 2)

*/


function elaborateNode() {

}



// FUNZIONE PLAY
function play() {
    if (relation == null || buffer == null || playButton == null) return;

    // disattiva pulsante play
    playButton.disabled = true; 

    switch (applicationState) {
        
        case States.Start:
            relation.highlightGroup(relation.getCurrentGroup(), () => {
                applicationState = States.GroupToSort;
                callback();
            });
            break;

        case States.GroupToSort:
            var currentGroup = relation.getCurrentGroup();
            // Se il gruppo non entra nel buffer, splittalo e rimani in questo stato
            if (currentGroup.value.length > bufferSize - 1) {
                console.log("current group doesn't fit buffer, splitting it");
                relation.splitGroup(bufferSize - 1, () => {
                    callback();
                });
            }
            // Altrimenti, leggi il contenuto del primo gruppo e scrivilo nel buffer
            else {
                var frames = relation.readCurrentGroup();
                // Ottieni le posizioni nel buffer dei vari frame (servono per l'animazione)
                start_x = [];
                start_y = [];
                end_x = [];
                end_y = [];
                start_size = [];
                end_size = [];
                color = [];
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
                        callback();
                    });
                });
            }
            break;

        case States.GroupInBuffer:
            // Avvia il sort
            buffer.sortAnimation(() => {
                applicationState = States.OutputFrameFullSorting;
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
                    console.log("buffer still contains something");
                    applicationState = States.GroupInBuffer;
                }
                else {
                    console.log("buffer is empty");
                    applicationState = States.GroupSorted;
                }
                callback();
            });
            break;

        
        case States.GroupSorted:
            // Controlla se questo gruppo e' la radice (significa che hai finito tutto)
            var currentGroup = relation.getCurrentGroup();
            if (currentGroup.parent == null) {
                applicationState = States.Finish;
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
                }
                else {
                    console.log("current group has a sibling");
                    relation.setCurrentGroup(next_sibling);
                    applicationState = States.GroupToSort;
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
                    callback();},
                () => {
                    applicationState = States.OneEmptyFrameInBuffer;
                    callback();},
                merge = true
            )
            break;
            
        
        case States.OneEmptyFrameInBuffer:
            var frameEmptyIndx = buffer.frameToRefill

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
                        applicationState = States.ChildrenInBuffer;
                        callback();
                    });
                });
            }
            else {
                if (buffer.checkFullOutput()) // L'output è pieno
                    applicationState = States.OutputFrameFullMerging;
                else if (buffer.bufferContainsSomething()) // Il buffer non è vuoto
                    applicationState = States.ChildrenInBuffer;
                else
                    applicationState = States.OutputFrameFullMerging;
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
                }
                else {
                    relation.mergeChildren();
                    applicationState = States.GroupSorted;
                }
                callback();
            });
            break;


        default:
            break;
    }

    console.log("I'm in state: " + applicationState);
}

var automaticPlay = true;

async function callback() {
    if (! automaticPlay) {
        // attiva pulsante play
        playButton.disabled = false; 
    }
    else {
        await new Promise(r => setTimeout(r, 500));
        play();
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






// TEMPORANEI per test
function divideRelation() {
    if (relation == null) return;
    relation.splitGroup(bufferSize - 1);
}
function mergeRelation() {
    if (relation == null) return;
    relation.mergeSiblings();
}
function removeFirst() {
    if (relation == null) return;
    relation.removeTheFirstFraneOfEachSibling();
}
function readCurrentGroup() {
    if (relation == null) return;
    var res = relation.readCurrentGroup();
    console.log(res);
}
function readNextOfCurrentGroup() {
    if (relation == null) return;
    var res = relation.readOnePageOfGroup(1);
    console.log(res);
}
function writeSomething() {
    if (relation == null) return;
    var frameToWrite = new Frame(0,0,frameSize,"gray",MAX_ELEMENTS_PER_FRAME,new Two());       // (x, y, size, color, max_elements, two)
    frameToWrite.elements.push("PROVA");
    console.log(relation.writeWithAnimation(frameToWrite));
}

