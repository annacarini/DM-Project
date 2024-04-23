var params = {
    fullscreen: true
  };
var elem = document.body;
const two = new Two(params).appendTo(elem);

var buffer = new Buffer(3, 100, 100, 5, two)
buffer.setPosition(400, 200)

var frame = new Frame(100, 100, 'rgb(0, 200, 255)', 5, two)
frame.fill([0, 1, 2, 3, 4])
frame.setView(1)

var frame2 = new Frame(100, 100, 'rgb(0, 200, 255)', 5, two)
frame2.fill([10, 81, 52, 13, 14])
frame2.setView(1)

buffer.read([frame, frame2])
const tween = buffer.writeFromToAnimation(frame, 1)

//two.bind('update', update);
// Finally, start the animation loop
two.update();

// Setup the animation loop.
function animate(time) {
	  tween.update(time)
	  requestAnimationFrame(animate)
    //console.log(frame.rect_search.position.x)
    two.update();
}
requestAnimationFrame(animate)
