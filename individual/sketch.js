let noiseMax = 1;
let phase = 0;
let scaleValue = 1;
let scaleDirection = 1;
let foamOffset = 0;
let movingBubbles = [];
let particles = [];
let currentSong = null; // To keep track of the currently playing song

function preload() {
  // Preload all audio files
  let audioFiles = ["assets/sad.mp3", "assets/love.mp3", "assets/joy.mp3", "assets/peace.mp3", "assets/anxious.mp3", "assets/lonely.mp3", "assets/helpless.mp3", "assets/powerful.mp3", "assets/angry.mp3"];
  for (let i = 0; i < audioFiles.length; i++) {
    let song = loadSound(audioFiles[i]);
    movingBubbles.push(new MovingBubble(getBubbleText(i), getColor1(i), getColor2(i), song));
  }
}

function getBubbleText(index) {
  let texts = ["sad", "love", "joy", "peace", "anxious", "lonely", "helpless", "powerful", "angry"];
  return texts[index];
}

function getColor1(index) {
  let colors = [
    color(0, 0, 139, 150), color(173, 216, 230, 150), color(255, 127, 80, 150),
    color(173, 216, 230, 150), color(227, 218, 201, 150), color(25, 25, 112, 150),
    color(192, 192, 192, 150), color(255, 223, 0, 150), color(16, 12, 8, 150)
  ];
  return colors[index];
}

function getColor2(index) {
  let colors = [
    color(221, 160, 221, 150), color(255, 182, 193, 150), color(255, 223, 0, 150),
    color(143, 188, 143), color(145, 129, 81, 150), color(65, 105, 225, 150),
    color(220, 220, 220, 150), color(255, 37, 0, 150), color(194, 0, 0, 150)
  ];
  return colors[index];
}

class MovingBubble {
  constructor(text, col1, col2, song) {
    this.x = random(width);
    this.y = random(height);
    this.size = random(100, 190);
    this.col1 = col1;
    this.col2 = col2;
    this.noiseOffset = random(1000); // Noise offset for each bubble
    this.phase = 0;
    this.scaleValue = 1;
    this.scaleDirection = 1;
    this.text = text; // Add an attribute to store text
    this.song = song;
    this.speedX = random(-0.2, 0.9); // horizontal speed
    this.speedY = random(-0.2, 0.9); // vertical speed
  }

  move() {
    // Allowing the bubbles to move slowly on the screen
    this.x += this.speedX;
    this.y += this.speedY;

    // Ensuring they remain within the screen boundaries
    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;

    // Maintain the breathing effect
    this.phase += 0.01; // Achieve the animation

    // Ensure the breathing effect slows down
    if (this.scaleDirection === 1) {
      this.scaleValue += 0.002;
      if (this.scaleValue >= 1.2) {
        this.scaleDirection = -1;
      }
    } else {
      this.scaleValue -= 0.002;
      if (this.scaleValue <= 1) {
        this.scaleDirection = 1;
      }
    }
  }

  display() {
    noStroke();
    let gradientSteps = 10; // Number of steps in the gradient
    for (let i = gradientSteps; i > 0; i--) {
      let t = i / gradientSteps;
      let col = lerpColor(this.col1, this.col2, t);
      fill(col);
      beginShape();
      let angleStep = TWO_PI / 100;
      for (let angle = 0; angle < TWO_PI; angle += angleStep) {
        let r = (this.size / 2) * t + 20 * noise(cos(angle) + 1, sin(angle) + 1, frameCount * 0.02 + this.noiseOffset);
        let x = this.x + r * cos(angle);
        let y = this.y + r * sin(angle);
        vertex(x, y);
      }
      endShape(CLOSE);
    }
    // Add text in the center of the bubbles and make it scale and create a ripple effect along with the bubbles.
    fill(255, 255, 255); // Text color
    textSize(26 * this.scaleValue); // Scale the text size based by scaleValue
    push();
    translate(this.x, this.y);
    for (let i = 0; i < this.text.length; i++) {
      let letter = this.text[i];
      let xOff = map(cos(this.phase + i), -1, 1, 0, noiseMax);
      let yOff = map(sin(this.phase + i), -1, 1, 0, noiseMax);
      let x = map(noise(xOff, yOff), 0, 1, -10, 10); // Adjust the position offset of each letter
      let y = map(noise(xOff + 10, yOff + 10), 0, 1, -10, 10);
      text(letter, i * 20 - (this.text.length * 10) + x, y); // Position each letter accordingly.
    }
    pop();
  }

  reactToSound(level) {
    this.size = map(level, 0, 1, 100, 190); // Adjust the size based on sound level
  }

  clicked() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    return d < this.size / 2;
  }
}

class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(3, 8);
    this.speedX = random(-1, 1);
    this.speedY = random(-1, 1);
    this.alpha = random(100, 255);
  }

  move() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // Initialize FFT and amplitude analysis
  fft = new p5.FFT(0.75, 1024);
  amp = new p5.Amplitude();

  // Create button to play music
  let button = createButton('Play/Stop');
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause);
}

function draw() {
  // Create Background
  let topColor = color(153, 186, 221);
  let bottomColor = color(102, 153, 204);
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(topColor, bottomColor, inter);
    stroke(c);
    line(0, y, width, y);
  }

  // Simulate background waves using Perlin noise
  noStroke();
  fill(231, 254, 255, 100);
  let foamXoff = foamOffset;
  for (let x = 0; x < width; x += 10) {
    let foamYoff = 0;
    for (let y = height * 0; y < height; y += 10) {
      let foamSize = map(noise(foamXoff, foamYoff, frameCount * 0.01), 0, 1, 2, 25);
      ellipse(x + noise(foamXoff * 0.01, frameCount * 0.01) * 20, y, foamSize);
      foamYoff += 0.1;
    }
    foamXoff += 0.1;
  }

  // Get the current sound level
  let level = amp.getLevel();
  let spectrum = fft.analyze();

  // Display bubbles
  for (let bubble of movingBubbles) {
    bubble.move();
    bubble.reactToSound(level);
    bubble.display();
  }

  // Display particles
  for (let particle of particles) {
    particle.move();
    particle.display();
  }
}

function mousePressed() {
  for (let bubble of movingBubbles) {
    if (bubble.clicked()) {
      playSong(bubble.song);
      break;
    }
  }
}

function playSong(song) {
  if (currentSong && currentSong.isPlaying()) {
    currentSong.stop();
  }
  currentSong = song;
  currentSong.loop();
}

function play_pause() {
  if (currentSong && currentSong.isPlaying()) {
    currentSong.stop();
  } else if (currentSong) {
    currentSong.loop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Ensure the button is correctly positioned after resizing
  let button = select('button');
  if (button) {
    button.position((width - button.width) / 2, height - button.height - 2);
  }
}