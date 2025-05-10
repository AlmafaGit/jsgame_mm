//játéktér div változója, méretei
let game_area;
let ga_width, ga_height;

//hátterek változói, kettő van hogy szimuláljuk azok mozgását
let bg1, bg2;
let bg_width = 1376;

//canvas ami a bg felett van
let canvas;
let canvas_width, canvas_height;
let ctx;

//akadályok, objektumok amikkel ütközve megáll a játék
let obstacle_array = [];

//vöröspanda, a hős, a megmentő, az úgráló szörmók, (a google chrome no internet access T-rex running game dinója lenne)
let red_panda = {x: 50, y: 420}; //alap pozíciója lent lesz, ezek a koordináták a left és up css attribútumok beállítására lesz
let spriteData;
const MovementFrames = [];
$.getJSON("Red Panda Sprite Sheet.json", function (data) {
    spriteData = data;
    //console.log("SpriteData betöltve", spriteData);

    for (const key in spriteData.frames) {
        if (key.includes("Movement")) {
            MovementFrames.push(spriteData.frames[key].frame);
        }
    }
});

//a futó animációhoz adatok
let spriteImg = new Image();
spriteImg.src = "Red Panda Sprite Sheet.png"
let currentFrame = 0;
let frameTimer = 50;
const frameDuration = 100;

//background divek mozgatására használt positionök (left)
let bg1_pos = 0;
let bg2_pos = bg_width;

//egyéb játék menethez kellő változók
let score;
let highscore;

//az játékot vezénylő interval változó
let game_interval;





$(document).ready(function () {
    //ga inicializálás
    game_area = $('#gamearea')

    //hátterek inicializálás
    bg1 = $(".bg").eq(0);
    bg2 = $(".bg").eq(1);

    //canvas és contextmanager inicializálás
    canvas = $("#canvas");
    canvas_width = canvas.width();
    canvas_height = canvas.height();
    canvas.css({left: red_panda.x, top: red_panda.y});
    ctx = document.getElementById("canvas").getContext("2d");



    //event handler a vöröspanda ugrásának lekezelésére
    $(document).on("keydown", red_panda_move);

    game_interval = setInterval(animate, 16);
})




function animate(){
    window.requestAnimationFrame(draw);
    //console.log(red_panda.y, canvas.css("top"))
}


function draw(){
    size_update();

    moving_background(5);

    draw_moving_red_panda(16);

    /*
    draw_obstacles();*/
}


function size_update(){ //oldal újra méretezésekor (ctrl+görgő) változhatnak értékek
    //változhat a ga ha változik az ablak méret mert %-os a width
    ga_width = parseInt(game_area.css("width"));
    ga_height = parseInt(game_area.css("height"));
}


function moving_background(speed){
    bg1_pos -= speed;
    bg2_pos -= speed;

    // ha teljesen kiment a kép, visszaugrik jobbra
    if (bg1_pos <= -bg_width) {
        bg1_pos = bg2_pos+bg_width;
    }
    if (bg2_pos <= -bg_width) {
        bg2_pos = bg1_pos+bg_width;
    }

    bg1.css("left", bg1_pos);
    bg2.css("left", bg2_pos);
}


function draw_moving_red_panda(deltaTime){ //deltatime elnevezést aitól loptam, igazából arra van itt hogy a frameTimer (framek között mennyi idő teljen el) értékét növelje
    frameTimer += deltaTime;
    if (frameTimer >= frameDuration) {
        frameTimer = 0;
        currentFrame = (currentFrame + 1) % MovementFrames.length;
    }

    const frame = MovementFrames[currentFrame];

    //törölni kell a canvast, mert ott marad az előző sprite frame :P
    ctx.clearRect(0, 0, canvas.width(), canvas.height());

    ctx.drawImage(
        spriteImg,
        frame.x, frame.y+1, frame.w, frame.h, // sprite pngn frame helye, az y framehez azért kellett +1, mert rossz volt a spritesheetes érték valahol és a fölötte levő sprite talpha belógott
        0, 0, frame.w*6, frame.h*6 // canvason a helye és mérete, 6-os szorzó egy pixel arton nem a legjobb de it is what it is
    );
}

function red_panda_move(e) { //mivel a sprite egy canvasra van rajzolva, ezért a canvast kell mozgatni
    //code-ot használok key helyett, mert akkor billentyűzet, nyelv független, a tényleges fizikai billentyükre szabható, elvileg ai szerint :)
    if(e.code === "KeyS" || e.code === "ArrowDown"){
        $(canvas).stop().animate({top: red_panda.y}, 100)
    }

    if(parseInt(canvas.css("top")) === red_panda.y){
        if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
            $(canvas).stop().animate({top: red_panda.y-200}, 300).animate({top: red_panda.y}, 500);
        }
    }
}




