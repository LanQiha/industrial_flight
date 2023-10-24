// Initialisation du canvas et du contexte
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

canvas.width =  5 * screenWidth / 6;
canvas.height = 5 * screenHeight / 6;

// Chargement des images
const imageFarBuildings = new Image();
imageFarBuildings.src = "graphics/background/skill-desc_0002_far-buildings.png";

const imageBuildings = new Image();
imageBuildings.src = "graphics/background/skill-desc_0001_buildings.png";

const imageForeground = new Image();
imageForeground.src = "graphics/background/skill-desc_0000_foreground.png";

const healthUi = new Image();
healthUi.src = "graphics/gui/HealthUI.png";

const idleGhostsImagesPath = [
    "graphics/round_ghost_idle/sprite_0.png",
    "graphics/round_ghost_idle/sprite_1.png",
    "graphics/round_ghost_idle/sprite_2.png",
    "graphics/round_ghost_idle/sprite_3.png",
    "graphics/round_ghost_idle/sprite_4.png",
    "graphics/round_ghost_idle/sprite_5.png",
    "graphics/round_ghost_idle/sprite_6.png",
    "graphics/round_ghost_idle/sprite_7.png",
    "graphics/round_ghost_idle/sprite_8.png",
];

const playerImagesPath = [
    "graphics/super_flying_cat/0.png",
    "graphics/super_flying_cat/1.png",
];

// Lancement du jeu et de la musique lorsque l'utilisateur clique sur le bouton "Play Game"
document.addEventListener('DOMContentLoaded', function() {
    const audio = new Audio("musics/they_think_they_are_humans.mp3");
    audio.loop = true;
    
    const playButton = document.getElementById("playGame"); 
    playButton.addEventListener("click", function() {
        audio.play();
        isRunning = true; 
        playButton.style.display = "none"; 
        requestAnimationFrame(gameLoop);
    });
});

ctx.fillStyle = "white";

class Vector {
    constructor(X, Y) {
        this.X = X;
        this.Y = Y;
    }
}

const START_POSITION_X = canvas.width/6;
const START_POSITION_Y = canvas.height/4;
const NULL = new Vector(0, 0);
const PLAYER_HEARTS = 6;
const PLAYER_WIDTH = 47;
const PLAYER_HEIGHT = 36;

const GRAVITY_Y = 9.81;
const JUMP_FORCE = 50;
const COOLDOWN = 1000;

// Le joueur n'est pas soumis à la force de gravité tant qu'il n'appuie pas une première fois sur la touche "z"
let pressKeyToMakePlayerMove = false; 
document.addEventListener("keydown", function(event){if(event.key == "z" || event.key == "Z"){pressKeyToMakePlayerMove = true;}})

class Player {
    constructor() {
        this.state = true;
        this.heart = PLAYER_HEARTS;
        this.position = new Vector(START_POSITION_X, START_POSITION_Y);
        this.velocity = NULL
        this.lastCollisionTime = 0;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
    }

    centerX() {
        return this.position.X + this.width / 2;
    }

    centerY() {
        return this.position.Y + this.height / 2;
    }

    distance(centerX, centerY) {
        const delta = new Vector(centerX - this.centerX(), centerY - this.centerY());
        return Math.sqrt(delta.X * delta.X + delta.Y * delta.Y);
    }

    gravityAndJump(dt) {   
        if(pressKeyToMakePlayerMove) {
            this.velocity.Y += GRAVITY_Y * dt * 2;
            this.position.Y += this.velocity.Y * dt;

            const playerInstance = this;

            document.addEventListener("keydown", function(event) {
                if(event.key == "z" || event.key == "Z") {
                    playerInstance.velocity.Y = -JUMP_FORCE;
                }
            })
        }
    }

    collisions(centerX, centerY) {
        const currentTime = Date.now();
        const timeSinceLastCollision = currentTime - this.lastCollisionTime;

        if(timeSinceLastCollision >= COOLDOWN) {
            const distance = this.distance(centerX, centerY);

            if(distance < this.width) {
                this.heart--;
                this.lastCollisionTime = currentTime;
            }
        }
    }

    playerState() {
        if(this.position.Y < -this.height || this.position.Y > canvas.height + this.height || this.heart == 0) {
            this.state = false;
        }
    }

    updatePlayer(dt, centerX, centerY) {
        this.gravityAndJump(dt);
        this.collisions(centerX, centerY);
        this.playerState();
    }
}

const player = new Player();

const GHOST_WIDTH = 65;
const GHOST_HEIGHT = 65;
const SPEED_RATIO = 0.0005;

class Ghost {
    constructor(speed, position) {
        this.speed = speed;
        this.position = position || new Vector(0, 0);

        this.state = true;
        this.width = GHOST_WIDTH;
        this.height = GHOST_HEIGHT;
    }

    centerX() {
        return this.position.X + this.width / 2;
    }

    centerY() {
        return this.position.Y + this.height / 2;
    }

    distance(centerX, centerY) {
        const delta = new Vector(centerX - this.centerX(), centerY - this.centerY());
        return Math.sqrt(delta.X * delta.X + delta.Y * delta.Y);
    }

    collisions(centerX, centerY) {
        if(this.distance(centerX, centerY) < (PLAYER_WIDTH - 1)) {
            this.state = false;
        }
    }

    outOfMap() {
        if(this.position.X < -this.width) {
            this.state = false;
        }
    }

    ghostState(centerX, centerY) {
        this.collisions(centerX, centerY);
        this.outOfMap();
    }

    spawn(speed) {
        if(!this.state) {
            this.position.X = canvas.width + this.width;
            this.position.Y = Math.random() * (canvas.height - this.width);
            this.speed = (Math.random() * 5) + (speed * SPEED_RATIO);
            this.state = true;
        }
    }

    updateGhost(centerX, centerY, speed) {
        this.ghostState(centerX, centerY);
        this.spawn(speed);

        this.position.X -= this.speed;
    }
}

const MAX_GHOSTS = 10;
const ghosts = [];

for(let i = 0; i < MAX_GHOSTS; ++i) {
    ghosts[i] = new Ghost((Math.random() * 5), new Vector(canvas.width + GHOST_WIDTH, Math.random() * (canvas.height - GHOST_HEIGHT)));
}

class movingImage {
    constructor(speed, position) {
        this.state = true;

        this.speed = speed;
        this.position = position || new Vector(0, 0);
    }

    imageState() {   
        if(this.position.X < -canvas.width) {
            this.state = false;
        }
        else {
            this.state = true;
        }
    }

    spawn() {
        if(!this.state) {
            this.position.X = this.position.X + 2 * canvas.width;
        }
    }

    imageUpdate()
    {
        this.imageState();
        this.spawn();

        this.position.X = this.position.X - this.speed;
    }
}

// Initialisation du comportement des images de fond
let displayImageFarBuildings1 = new movingImage(0.5, new Vector(0, 0));
let displayImageFarBuildings2 = new movingImage(0.5, new Vector(canvas.width, 0));
let displayImageFarBuildings3 = new movingImage(0.5, new Vector(canvas.width * 2, 0));

let displayImageBuildings1 = new movingImage(1, new Vector(0, 0));
let displayImageBuildings2 = new movingImage(1, new Vector(canvas.width, 0));
let displayImageBuildings3 = new movingImage(1, new Vector(canvas.width * 2, 0));

let displayImageForeground = new movingImage(1.5, new Vector(0, 0));

let idleGhostsImages = [];

class GhostsAnimation
{
    constructor(frameCount, targetFrameRate) {
        this.frameCount = frameCount;
        this.targetFrameRate = targetFrameRate;

        this.currentFrame = 0;
        this.frameDuration = 1000 / targetFrameRate;
        this.lastFrameTime = performance.now();
    }

    loadGhostsAnimation() {
        for(let i = 0; i < this.frameCount; ++i) {
            let img = new Image();
            img.src = idleGhostsImagesPath[i];
            idleGhostsImages.push(img);
        }
    }

    animateGhosts(positionX, positionY) {
        const currentTime = performance.now();
        const dt = (currentTime - this.lastFrameTime) / 1000;

        ctx.drawImage(idleGhostsImages[this.currentFrame], positionX, positionY, GHOST_WIDTH, GHOST_HEIGHT);

        if (dt >= this.frameDuration / 1000) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.lastFrameTime = currentTime;
        }
    }
}

const idleGhostsAnimation = new GhostsAnimation(9, 10);
idleGhostsAnimation.loadGhostsAnimation(idleGhostsImagesPath, idleGhostsImages);

let playerImages = [];

class PlayerAnimation
{
    constructor(frameCount, targetFrameRate) {
        this.frameCount = frameCount;
        this.targetFrameRate = targetFrameRate;

        this.currentFrame = 0;
        this.frameDuration = 1000 / targetFrameRate;
        this.lastFrameTime = performance.now();
    }

    loadPlayerAnimation() {
        for(let i = 0; i < this.frameCount; ++i) {
            const playerImg = new Image();
            playerImg.src = playerImagesPath[i];
            playerImages.push(playerImg);
        }
    }

    animatePlayer(positionX, positionY) {
        const currentTime = performance.now();
        const dt = (currentTime - this.lastFrameTime) / 1000;

        ctx.drawImage(playerImages[this.currentFrame], positionX, positionY, PLAYER_WIDTH, PLAYER_HEIGHT);

        if (dt >= this.frameDuration / 1000) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.lastFrameTime = currentTime;
        }
    }
}

const playerAnimation = new PlayerAnimation(2, 10);
playerAnimation.loadPlayerAnimation();

const DISTANCE_BEFORE_NEW_GHOST = 2000;

let distanceTraveled = 0;
let nbGhosts = 5;
let enterGhostsManagmentLoop = true;

function playerAndGhostsUpdate(dt) {
    if(player.state) {
        distanceTraveled++;

        if(nbGhosts < 10){
            if(enterGhostsManagmentLoop) {
                if(distanceTraveled % DISTANCE_BEFORE_NEW_GHOST == 0) {
                    nbGhosts++;
                    enterGhostsManagmentLoop = false;
                }
            } 
        }

        enterGhostsManagmentLoop = true;

        for(let i = 0; i < nbGhosts; ++i) {
            player.updatePlayer(dt, ghosts[i].centerX(), ghosts[i].centerY());
            ghosts[i].updateGhost(player.centerX(), player.centerY(), distanceTraveled);
        }
    }
}

function backgroundImagesUpdate() {
    displayImageForeground.position.X = displayImageForeground.position.X - 1.5;

    displayImageFarBuildings1.imageUpdate();
    displayImageFarBuildings2.imageUpdate();
    displayImageFarBuildings3.imageUpdate();

    displayImageBuildings1.imageUpdate();
    displayImageBuildings2.imageUpdate();
    displayImageBuildings3.imageUpdate();
}

function update(dt) {   
    playerAndGhostsUpdate(dt)
    backgroundImagesUpdate();
}

function playerAndGhostsDraw() {
    for(let i = 0; i < nbGhosts; ++i) {
        if(ghosts[i].state) {
            idleGhostsAnimation.animateGhosts(ghosts[i].position.X, ghosts[i].position.Y);
        }
    }
    playerAnimation.animatePlayer(player.position.X, player.position.Y);
}

function backgroundImagesDraw() {
    ctx.drawImage(imageFarBuildings, displayImageFarBuildings1.position.X, 0, canvas.width, canvas.height);
    ctx.drawImage(imageFarBuildings, displayImageFarBuildings2.position.X, 0, canvas.width, canvas.height);
    ctx.drawImage(imageFarBuildings, displayImageFarBuildings3.position.X, 0, canvas.width, canvas.height);

    ctx.drawImage(imageBuildings, displayImageBuildings1.position.X, 0, canvas.width, canvas.height);
    ctx.drawImage(imageBuildings, displayImageBuildings2.position.X, 0, canvas.width, canvas.height);
    ctx.drawImage(imageBuildings, displayImageBuildings3.position.X, 0, canvas.width, canvas.height);

    for(let i = 0; i < 3; ++i) {
        ctx.drawImage(imageForeground, displayImageForeground.position.X + canvas.width * i, 0, canvas.width, canvas.height); 
    }
}

const HEARTS_STATES = 7;
const HEARTS_WIDTH = 33;
const HEARTS_HEIGHT = 77;
const HEARTS_POSITION_X = 35 * canvas.width/40;
const HEARTS_POSITION_Y = canvas.height/20;

function heartsDraw() {
    if(player.heart == 6) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 0, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 5) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 1, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 4) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 2, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 3) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 3, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 2) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 4, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 1) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 5, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }
    if(player.heart == 0) {
        ctx.drawImage(healthUi, 0, HEARTS_HEIGHT/HEARTS_STATES * 6, HEARTS_WIDTH, HEARTS_HEIGHT/HEARTS_STATES, HEARTS_POSITION_X, HEARTS_POSITION_Y, HEARTS_WIDTH * 2, (HEARTS_HEIGHT/HEARTS_STATES)*2);
    }   
}

function guiDraw() {
    heartsDraw();

    ctx.font = "bold 15px arial";
    ctx.fillText("distance traveled : " + distanceTraveled/1000 + "km" , canvas.width/40, canvas.height/20);

    if(!pressKeyToMakePlayerMove) {
        ctx.fillText("Press the 'z' key to fly", canvas.width/2 - 100, canvas.height/2);
    }
    if(!player.state) {
        ctx.fillText("Game Over", canvas.width/2 - 50, canvas.height/2);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    backgroundImagesDraw();
    playerAndGhostsDraw();
    guiDraw();   
}

let currentTime = 0;
let lastFrameTime = performance.now();
let isRunning = false;

function gameLoop(currentTime) {
    if(isRunning) {
        const dt = (currentTime - lastFrameTime) / 1000;

        update(dt);
        draw();

        lastFrameTime = currentTime;

        requestAnimationFrame(gameLoop);
    }
}
