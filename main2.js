let startX, startY;
let prevX, prevY;
let drawing = false;
let pg;
let layer0;
let currentShape;
let mode = "free";
let backgroundColor = 300;
let currentColor = 0;
let drawingHistory = [];
let redoHistory = [];
let lastCanvasState;
let thisFrame;
let frameList = [];
let currentIndex=1;
let totalIndex=1;

function setup() {
    let canvasWidth = canvasContainer.offsetWidth;
    let canvasHeight = canvasContainer.offsetHeight;
    let myCanvas = createCanvas(canvasWidth, canvasHeight);
    myCanvas.parent("canvasContainer");
    pg = createGraphics(canvasWidth, canvasHeight);
    layer0 = createGraphics(canvasWidth, canvasHeight);
    currentShape = new Shape(mode);
}

function draw() {
    background(backgroundColor);
    image(pg, 0, 0);
    image(layer0, 0, 0);

    if (drawing) {
        currentShape.draw(clientX, clientY);
    }
    if (mode === "eraser") {
        cursor(ellipse(clientX, clientY, (lineWeight.value) / (100), (lineWeight.value) / (100)));
        return;
    }
    if (mode === "line" || mode === "triangle" || mode === "rectangle" || mode === "ellipse") {
        cursor(ellipse(clientX, clientY, (lineWeight.value) / (100), (lineWeight.value) / (100)));
        return;
    }
    if (mode === "free") {
        cursor(ellipse(clientX, clientY, (lineWeight.value) / (100), (lineWeight.value) / (100)));
        return;
    }
    if (mode === "fill") {
        cursor("paint.png");
        return;
    }
    cursor("default");
}

function touchStarted() {
    startX = clientX;
    startY = clientY;
    prevX = clientX;
    prevY = clientY;
    drawing = true;
    lastCanvasState = pg.get();
    if (mode === "fill") {
        pg.loadPixels();
        let targetColor = pg.get(clientX, clientY);
        floodFill(clientX, clientY, targetColor);
        pg.updatePixels();
    }
}

function touchEnded() {
    drawing = false;
    currentShape.finalize(clientX, clientY);
    drawingHistory.push(lastCanvasState);
    lastCanvasState = null;
}

function Shape(type) {
    this.type = type;
    this.draw = function(x, y) {
        let w = x - startX;
        let h = y - startY;
        if (fillShape.checked) {
            fill(currentColor);
        }
        if (!fillShape.checked) {
            noFill();
        }
        stroke(currentColor);
        strokeWeight(lineWeight.value);
        if (this.type === "ellipse") {
            ellipse(startX + w / 2, startY + h / 2, abs(w), abs(h));
            return
        }
        if (this.type === "rectangle") {
            rect(startX, startY, w, h);
            return
        }
        if (this.type === "triangle") {
            triangle(startX + w / 2, startY, startX, startY + h, startX + w, startY + h);
            return
        }
        if (this.type === "line") {
            line(startX, startY, x, y);
            return
        }
        if (this.type === "free") {
            pg.line(clientX, clientY, prevX, prevY);
            prevX = x;
            prevY = y;
            return
        }
        if (this.type === "eraser") {
            pg.erase();
            pg.stroke(backgroundColor);
            pg.line(clientX, clientY, prevX, prevY);
            pg.strokeWeight(lineWeight.value);
            pg.stroke(currentColor);
            pg.noErase();
            prevX = x;
            prevY = y;
            return
        }
    }
    this.finalize = function(x, y) {
        if (fillShape.checked) {
            pg.fill(currentColor);
        }
        if (!fillShape.checked) {
            pg.noFill();
        }
        if (this.type === "ellipse") {
            let w = x - startX;
            let h = y - startY;
            pg.ellipse(startX + w / 2, startY + h / 2, abs(w), abs(h));
            return;
        }
        if (this.type === "rectangle") {
            pg.rect(startX, startY, x - startX, y - startY);
            return;
        }
        if (this.type === "triangle") {
            pg.triangle(startX + (x - startX) / 2, startY, startX, startY + (y - startY), x, y);
            return;
        }
        if (this.type === "line") {
            pg.line(startX, startY, x, y);
            return;
        }
    }
}

save.addEventListener("click", function() {
    saveCanvas("myCanvas", "png");
});
clearCanvas.addEventListener("click", function() {
    clear();
    pg.clear();
});
ellipse.addEventListener("click", function() {
    mode = "ellipse";
    currentShape = new Shape("ellipse");
});
rectangle.addEventListener("click", function() {
    mode = "rectangle";
    currentShape = new Shape("rectangle");
});

triangle.addEventListener("click", function() {
    mode = "triangle";
    currentShape = new Shape("triangle");
});
line.addEventListener("click", function() {
    mode = "line";
    currentShape = new Shape("line");
});
pen.addEventListener("click", function() {
    mode = "free";
    currentShape = new Shape("free");
});
eraser.addEventListener("click", function() {
    mode = "eraser";
    currentShape = new Shape("eraser");
});
changeColor.addEventListener("click", function() {
    colorPicker.click();
});

colorPicker.addEventListener("input", function() {
    selectedColor.style.backgroundColor = colorPicker.value;
    let c = color(colorPicker.value);
    let r = red(c);
    let g = green(c);
    let b = blue(c);
    currentColor = color(r, g, b);
});
bucket.addEventListener("click", function() {
    mode = "fill";
    currentShape = new Shape("fill");
});
lineWeight.addEventListener("change", function() {
    pg.strokeWeight(lineWeight.value);
});

let elements = document.querySelectorAll(".interactiveToolIcon");
elements.forEach((element) => {
    element.addEventListener("click", function() {
        elements.forEach((el) => {
            el.classList.remove("active");
        });
        this.classList.add("active");
    });
});

let directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
];


function floodFill(x, y, colour) {
    let stack = [{ x: Math.round(x), y: Math.round(y), colour }];
    pg.set(Math.round(x), Math.round(y), currentColor);
    let checked = Array(width).fill().map(() => Array(height).fill(false));

    while (stack.length > 0) {
        let current = stack.pop();
        if (current.x < 0 || current.x >= width || current.y < 0 || current.y >= height)
            continue;
        if (checked[current.x][current.y]) continue;
        checked[current.x][current.y] = true;

        for (let i = 0; i < directions.length; i++) {
            let child = {
                x: Math.round(current.x + directions[i][0]),
                y: Math.round(current.y + directions[i][1]),
                colour
            };
            if (isValidPixel(child.x, child.y, child.colour) && !checked[child.x][child.y]) {
                pg.set(child.x, child.y, currentColor);
                pg.set(child.x + 1, child.y, currentColor);
                pg.set(child.x, child.y + 1, currentColor);
                pg.set(child.x - 1, child.y, currentColor);
                pg.set(child.x, child.y - 1, currentColor);
                pg.set(child.x + 1, child.y + 1, currentColor);
                pg.set(child.x - 1, child.y - 1, currentColor);
                pg.set(child.x + 1, child.y - 1, currentColor);
                pg.set(child.x - 1, child.y + 1, currentColor);
                stack.push(child);
            }
        }
    }
}

function isValidPixel(x, y, colour) {
    return (x >= 0 && y >= 0 && x < width && y < height && colorsMatch(pg.get(x, y), colour));
}

function colorsMatch(c1, c2) {
    return (
        c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3]
    );
}




function undo() {
  if (drawingHistory.length > 1) {
      redoHistory.push(drawingHistory.pop());
      redrawCanvas();
      drawingHistory.pop()
  }
}


function redrawCanvas() {
  if (drawingHistory.length > 0) {
      pg.clear();
      pg.image(drawingHistory[drawingHistory.length - 1], 0, 0);
  } else {
      pg.clear();
  }
}





function addFrame() {
    thisFrame = pg.get();
    frameList[currentIndex-1]=thisFrame;
    thisFrame = null;
    pg.clear();
    frameList.splice(currentIndex,0,pg);
    currentIndex++;
    totalIndex++;
    pg.image(frameList[currentIndex-1], 0, 0);
    updateFrameNumber();
}

function preFrame() {
    if(currentIndex!=1){
    thisFrame = pg.get();
    frameList[currentIndex-1]=thisFrame;
    thisFrame = null;
    pg.clear();
    currentIndex--;
    pg.image(frameList[currentIndex-1], 0, 0);}
    updateFrameNumber();
}

function nextFrame() {
    if(currentIndex!=totalIndex){
    thisFrame = pg.get();
    frameList[currentIndex-1]=thisFrame;
    thisFrame = null;
    pg.clear();
    currentIndex++;
    pg.image(frameList[currentIndex-1], 0, 0);}
    updateFrameNumber();

}


function updateFrameNumber() {
    document.getElementById('frameNumber').textContent = currentIndex;
    document.getElementById('totalFrames').textContent = totalIndex;
}







function download()
{
let capture;

function setup() {
  createCanvas(canvasContainer.offsetWidth,canvasContainer.offsetHeight);
  capture = new CCapture({
    format: 'webm', // Specify the video format
    framerate: 12, // Specify the frame rate of the video
  });
  capture.start();
}

function drawvid() {
  background(220);
  ellipse(width / 2, height / 2, 100, 100);
  pg.image(frameList[currentIndex-1], 0, 0);
  currentIndex++;


  // Stop capturing frames after a certain number of frames
  if (frameCount === 24) {
    capture.stop();
    capture.save('my_animation.webm'); // Save the captured frames as a video
    noLoop(); // Stop the draw loop
  }
}
}




function onionMode() {
    // Get the checkbox
    var checkBox = document.getElementById("myCheck");
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true){
        if (totalIndex > 1) {
            layer0.tint(250, 127);
            layer0.image(frameList[currentIndex - 2], 0, 0);
            layer0.tint(255, 250); // Reset opacity
        };
    } else {
      layer0.clear();
    }
  }

function playAnimation() {
    let fps = 8; // Frames per second
    let frameDuration = 1000 / fps; // Duration of each frame in milliseconds
    
    thisFrame = pg.get();
    frameList[currentIndex-1]=thisFrame;
    thisFrame = null;
    pg.clear();
    layer0.clear(); 
    let aniIndex=0
    animationInterval = setInterval(() => {
        layer0.clear();
        pg.clear();
        aniIndex++;
        if(aniIndex==totalIndex){aniIndex=0;}
        pg.image(frameList[aniIndex], 0, 0);
    }, frameDuration);
}
function stopAnimation() {
    clearInterval(animationInterval);
    pg.clear(); // Clear the animation interval
    pg.image(frameList[currentIndex-1], 0, 0);
    
}