//játéktér div változója, méretei
let game_area;
let ga_width, ga_height;

//hátterek változói, kettő van hogy szimuláljuk azok mozgását
let bg1, bg2;
let bg_width = 1376;

//canvas ami a bg felett van
let canvas;
let ctx;

//akadályok, objektumok amikkel ütközve megáll a játék
let obstacle_array = [];

//vöröspanda, a hős, a megmentő, az úgráló szörmók, (a google chrome no internet access T-rex running game dinója lenne)
let panda_X;
let panda_Y;
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





$(document).ready(function () {
    //ga inicializálás
    game_area = $('#gamearea')

    //hátterek inicializálás
    bg1 = $(".bg").eq(0);
    bg2 = $(".bg").eq(1);

    //canvas és contextmanager inicializálás
    canvas = $("#canvas");
    ctx = document.getElementById("canvas").getContext("2d");


    //vöröspanda alap pozíciója a lenti vonalon lesz
    panda_X = 30;
    panda_Y = 420;



    $(window).on('load', function () {
        setInterval(animate, 16);
    })
})



function animate(){
    window.requestAnimationFrame(draw);
    //console.log(bg1.css("left"),bg2.css("left"),bg_width);
    console.log(canvas.height())
}


function draw(){
    size_update();

    moving_background(5);

    draw_moving_red_panda(16);

    /*
    draw_obstacles();*/
}


function size_update(){ //oldal újra méretezésekor (ctrl+görgő) változhatnak értékek
    //változhat a ga
    ga_width = parseInt(game_area.css("width"));
    ga_height = parseInt(game_area.css("height"));

    //canvas változhat ga miatt
    canvas.width(ga_width); //bg1 widthel ugye ez is kilógna a gameareáról, annak itt nincs értelme
    canvas.height(parseInt(bg1.css("height"))); //ez ugyan fölösleges mert a magasság elvileg sose változik, just to be safe

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

    bg1.css("left", bg1_pos + "px");
    bg2.css("left", bg2_pos + "px");
}


function draw_moving_red_panda(deltaTime){ //deltatime elnevezést aitól loptam,
    frameTimer += deltaTime;
    if (frameTimer >= frameDuration) {
        frameTimer = 0;
        currentFrame = (currentFrame + 1) % MovementFrames.length;
    }

    const frame = MovementFrames[currentFrame];

    //törölni kell a canvast
    ctx.clearRect(0, 0, canvas.width(), canvas.height());

    ctx.drawImage(
        spriteImg,
        frame.x, frame.y+1, frame.w, frame.h, // sprite pngn frame helye, az y framehez azért kellett +1 mert rossz volt a spritesheetes érték valahol és a fölötte levő sprite talpha belógott
        panda_X, panda_Y, frame.w*6, frame.h*6 // canvason a helye és mérete
    );

}
