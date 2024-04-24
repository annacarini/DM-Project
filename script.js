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
frame.fill([0, 2, 4, 6, 4])
var frame2 = new Frame(100, 100, 100, 'rgb(0, 200, 255)', 5, two)
frame2.fill([9, 1, 7, 9, 4])
var frame3 = new Frame(100, 100, 100, 'rgb(0, 200, 255)', 5, two)
frame3.fill([12, 21, 2, 8])


buffer.read([frame, frame2, frame3])

two.update();
sort()

function sort() {
  if (buffer.sortingStatus & 2)
    buffer.writeFromOutputToMain()
  else if ((buffer.sortingStatus >> 2) > 0)
    buffer.frameRefilled[(buffer.sortingStatus >> 2) - 1] = false
  else if (buffer.sortingStatus & 1)
    return
  var tweens = buffer.sort()
  if (tweens.length) {
    tweens[tweens.length - 1].onComplete(() => {buffer.outputFrame._resetRectSearch(); ;sort()})
    tweens[0].start()
  }
  else
    sort()
}

// Setup the animation loop.
function animate(time) {
    TWEEN.update(time)
	  requestAnimationFrame(animate)
    //console.log(frame.rect_search.position.x)
    two.update();
}
requestAnimationFrame(animate)
