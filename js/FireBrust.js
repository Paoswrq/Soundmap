import { startMicrophoneAnalysis, getAudioData, getPitch } from "./core.js";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let hue = getPitch(); 

startMicrophoneAnalysis();

let particles = [];

class Particles {
  constructor(x, y, dx, dy, size, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.size = size;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.opacity -= 0.02; 
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createExplosion(loundness) {
    let numParticles = Math.floor(loundness / 2);

    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;

    for (let i = numParticles * 0.5; i < numParticles; i++) {
        let size = Math.random() * loundness * 4;
        let dx = (Math.random() - 0.5) * 5;
        let dy = (Math.random() - 0.5) * 5;
        //let colors = ["#FF4500", "#FF6347", "#FF8C00", "#FFD700"];
        //let color = colors[Math.floor(Math.random() * colors.length)];
        let color = "hsl(" + hue * 1.00 + ", 70%, 50%)"; 

        let firework = new Particles(x, y, dx, dy, size, color);
        particles.push(firework);
    }
}

let lastTime = 0; 

function animate() {
    hue = getPitch(); 
    ctx.fillStyle = "hsl(" + hue + ", 50%, 30%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
        particle.update();
        particle.draw();
    });
    if(Date.now() - lastTime > 10) {
      particles = particles.filter((particle) => particle.opacity > 0.10); // Remove faded particles
      lastTime = Date.now(); 
    }
}

export function loopFireWork() {
    let dataArray = getAudioData();

    let sum = 0; 
    for(let i = 0; i < dataArray.length; i++) {
        let amplitude = dataArray[i] - 128; 
        sum += amplitude * amplitude;
    }
    let rms = Math.sqrt(sum / dataArray.length);
    let loudness = 6 + 20 * Math.log10(rms); 

    if(loudness > 15) {
      createExplosion(loudness);
    }
    animate();
    
    if(window.activemodule == "firework")
    	requestAnimationFrame(loopFireWork);
}

