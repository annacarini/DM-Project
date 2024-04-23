// PARAMETRI SIMULAZIONE
var bufferSize = 3;
var relationSize = 9;

var buffer = null;
var relation = null;


// PARAMETRI PER GRAFICA

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


var params = {
    fullscreen: true
  };
var elem = document.body;
const two = new Two(params).appendTo(elem);

var buffer = new Buffer(300, 300, 4, 100, two)

var frame = new Frame(100, 100, 100, 'rgb(0, 200, 255)', 5, two)
frame.fill([0, 1, 2, 3, 4])
frame.removeElement(2)
frame.addElement(4, 8)
frame.setView(0)

buffer.read([frame, frame, frame])
var tweens = buffer.writeFromToAnimation(1, 0)
var tweens2 = buffer.writeFromToAnimation(2, 2)
tweens[1].chain(tweens2[0])
tweens[0].start()
//var frame2 = new Frame(100, 100, 'rgb(0, 200, 255)', 5, two)
//frame2.fill([10, 81, 52, 13, 14])
//frame2.setView(1)

//buffer.read([frame, frame2])
//const tween = buffer.writeFromToAnimation(frame, 1)

//two.bind('update', update);
// Finally, start the animation loop
two.update();

// Setup the animation loop.
function animate(time) {
    TWEEN.update(time)
	  requestAnimationFrame(animate)
    //console.log(frame.rect_search.position.x)
    two.update();
}
requestAnimationFrame(animate)
