const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

ctx.font = '50px Impact';

let timeToNext = 0;
let ravenInterval = 500;
let lastTime = 0;
let score = 0;
let gameOver = false;

const backgroundLayer1 = new Image();
backgroundLayer1.src = 'assets/layer-1.png';
const backgroundLayer2 = new Image();
backgroundLayer2.src = 'assets/layer-2.png';
const backgroundLayer3 = new Image();
backgroundLayer3.src = 'assets/layer-3.png';
const backgroundLayer4 = new Image();
backgroundLayer4.src = 'assets/layer-4.png';
const backgroundLayer5 = new Image();
backgroundLayer5.src = 'assets/layer-5.png';

let ravens = [];
class Raven{
    constructor(){
        this.image = new Image();
        this.image.src = 'assets/raven.png';
        this.spriteWidth = 271;
        this.spriteHeight = 194;
        this.sizeModifier = Math.random() * 0.6 + 0.4;
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.directionX = Math.random() * 5 + 3;
        this.directionY = Math.random() * 5 - 2.5;
        this.markedForDelete = false;
        this.frame = 0;
        this.maxFrame = 4;
        this.timeSinceFlap = 0;
        this.flapInterval = 70;
        this.randomColours = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
        this.colour = 'rgb(' + this.randomColours[0] + ',' + this.randomColours[1] + ',' + this.randomColours[2] + ')';
        
    }
    update(deltatime){
        if(this.y < 0 || this.y > canvas.height - this.height){
            this.directionY = this.directionY * -1;
        }
        this.x -= this.directionX;
        this.y += this.directionY;
        if(this.x < 0 - this.width) this.markedForDelete = true;
        this.timeSinceFlap += deltatime;
        if(this.timeSinceFlap > this.flapInterval){
            if(this.frame> this.maxFrame) this.frame = 0;
            else this.frame++;
            this.timeSinceFlap = 0;
        }
        if(this.x < 0 - this.width) gameOver = true;
    }

    draw(){
        collisionCtx.fillStyle = this.colour;
        collisionCtx.fillRect(this.x, this.y + (this.sizeModifier * 30), this.width, this.height - (this.sizeModifier * 60));
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

class Layer{
    constructor(image){
        this.x = 0;
        this.y = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.image = image;
    }

    draw(){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

const layer1 = new Layer(backgroundLayer1);
const layer2 = new Layer(backgroundLayer2);
const layer3 = new Layer(backgroundLayer3);
const layer4 = new Layer(backgroundLayer4);
const layer5 = new Layer(backgroundLayer5);

const gameObjects = [layer1, layer2, layer3, layer4, layer5];

let explosions = [];
class Explosion{
    constructor(x, y, size){
        this.image = new Image();
        this.image.src = 'assets/boom.png';
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = 'assets/boom.wav';
        this.timeSinceLast = 0;
        this.frameInterval = 100;
        this.markedForDelete = false;
    }
    update(deltatime){
        if(this.frame === 0) this.sound.play();
        this.timeSinceLast += deltatime;
        if(this.timeSinceLast > this.frameInterval){
            this.frame++;
            this.timeSinceLast = 0;
            if(this.frame > 5) this.markedForDelete = true;
        }
        
    }
    draw(){
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size/4, this.size, this.size);
    }
}

function drawScore(){
    ctx.fillStyle = 'black';
    ctx.fillText('Score: ' + score, 55, 80);
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 50, 75);
}

function drawGameOver(){
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2, canvas.height/2);
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2 - 5, canvas.height/2 - 5);
}

window.addEventListener('click', function(e){
    const detectColour = collisionCtx.getImageData(e.x, e.y, 1, 1);
    console.log(detectColour);
    const pc = detectColour.data;
    ravens.forEach(object =>{
        if(object.randomColours[0] === pc[0] && object.randomColours[1] === pc[1] && object.randomColours[2] === pc[2]){
            object.markedForDelete = true;
            score++;
            explosions.push(new Explosion(object.x, object.y, object.width));
        }
    });
})

function animate(timestamp){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltatime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNext += deltatime;
    if(timeToNext> ravenInterval){
        ravens.push(new Raven());
        timeToNext = 0;
        ravens.sort(function(a,b){
            return a.width - b.width;
        })
    }
    drawScore();
    [...ravens, ...explosions].forEach(object => object.update(deltatime));
    [...gameObjects, ...ravens, ...explosions,].forEach(object => object.draw(deltatime));
    ravens = ravens.filter(object => !object.markedForDelete);
    explosions = explosions.filter(object => !object.markedForDelete);

    if(!gameOver) requestAnimationFrame(animate);
    else drawGameOver();
}
animate(0);