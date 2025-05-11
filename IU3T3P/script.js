//játéktér div változója, méretei
let game_area;
let ga_width, ga_height;

//hátterek változói, kettő van hogy szimuláljuk azok mozgását
let bg1, bg2;
let bg_width = 1376;

//header
let header;

//canvas ami a bg felett van
let canvas;
let canvas_width, canvas_height;
let ctx;

//akadályok, objektumok amikkel ütközve megáll a játék
let obstacle;
let obstacle_array = [];
let pictures = [];

//vörös panda, a hős, a megmentő, az úgráló szörmók, (a google chrome no internet access T-rex running game dinója lenne)
let red_panda = {x: 50, y: 480}; //alap pozíciója lent lesz, ezek a koordináták a left és up css attribútumok beállítására lesz
let is_jumping = false;
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
let current_frame = 0;
let frame_timer = 50;
const frame_duration = 100;

//background divek mozgatására használt positionök (left)
let bg1_pos = 0;
let bg2_pos = bg_width;

//egyéb játékhoz és játék menethez kellő változók
let score;
let score_value = 0;
let highscore;
let highscore_value = 0;
let highscore_shown = false;

//az játékot vezénylő interval változó
let frame_count = 0; //ez a játék során menő framek, nincs köze a spritéhoz
let game_interval;





$(document).ready(function () {
    //ga inicializálás
    game_area = $('#gamearea')

    //hátterek inicializálás
    bg1 = $(".bg").eq(0);
    bg2 = $(".bg").eq(1);

    //header inicializálás
    header = $("#header")
    score = $("#score")
    highscore = $("#highscore")
    highscore.hide()

    //canvas és contextmanager inicializálás
    canvas = $("#canvas");
    canvas_width = canvas.width();
    canvas_height = canvas.height();
    canvas.css({left: red_panda.x, top: red_panda.y});
    ctx = document.getElementById("canvas").getContext("2d");

    //akadályokhoz inicializálás
    obstacle = $("<img alt=\"enemy\">"); //srct majd jquery beállítja mert több féle akadály van
    pictures.push({src: "assets/sleepy1.png",w: 200, h: 200});


    //megakadályozza az alapértelmezett jobbklikk menüt, így lehet a mouse_moveban a jobb klikkel leesni
    $(document).on("contextmenu", function(e) {
        e.preventDefault();
    });

    //event handlerek a vörös panda mozgásának lekezelésére
    $(document).on("keydown", red_panda_move);
    $(document).on("mousedown", red_panda_mouse_move);


    //játék inditása
    $(window).on("load", () => {
        game_interval = setInterval(animate, 16);
    });

})



//a játék menetet / animációt végző függvény
function animate(){
    frame_count++;
    score_value = frame_count / 10;
    window.requestAnimationFrame(draw);
    //console.log(obstacle_spawn)
}


//minden mozgó elemet megrajzol / frissit, ez van animatebe meganimálva
function draw(){
    size_update();
    header_update();

    moving_background(5);
    draw_moving_red_panda(16);
    draw_obstacles();
}


//oldal újra méretezésekor (ctrl+görgő) változhatnak változók értéke, ez frissíti azokat (legalábbis ami szembetűnt hogy fontos lenne)
function size_update(){
    //változhat a ga ha változik az ablak méret mert %-os a width
    ga_width = parseInt(game_area.css("width"));
    ga_height = parseInt(game_area.css("height"));
}


//a fejlécen a score stb értékek updatelése
function header_update(){
    score.html("<p>SCORE: "+parseInt(score_value)+"</p>")
    if(!highscore_shown && highscore_value !== 0){
        highscore.show();
        highscore_shown = true;
    }
    if(highscore_value>score_value){
        highscore.html("<p>HIGHSCORE: "+highscore_value+"</p>")
    } else{
        highscore.html("<p>HIGHSCORE: "+parseInt(score_value)+"</p>");
    }
}


//mozgó háttér a futás szimulálására
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


//a vörös panda idle sprite animációja
function draw_moving_red_panda(deltaTime){ //deltatime elnevezést aitól loptam, igazából arra van itt hogy a frame_timer (framek között mennyi idő teljen el) értékét növelje
    frame_timer += deltaTime;
    if (frame_timer >= frame_duration) {
        frame_timer = 0;
        current_frame = (current_frame + 1) % MovementFrames.length;
    }

    const frame = MovementFrames[current_frame];

    //törölni kell a canvast, mert ott marad az előző sprite frame :P
    ctx.clearRect(0, 0, canvas.width(), canvas.height());

    ctx.drawImage(
        spriteImg,
        frame.x, frame.y+1, frame.w, frame.h, // sprite pngn frame helye, az y framehez azért kellett +1, mert rossz volt a spritesheetes érték valahol és a fölötte levő sprite talpa belógott
        0, 0, frame.w*4, frame.h*4 // canvason a helye és mérete, 6-os szorzó egy pixel arton nem a legjobb de it is what it is
    );
}


//event handler függvények az vörös panda az ugráshoz és gyors leeséshez
function red_panda_move(e) { //mivel a sprite egy canvasra van rajzolva, ezért a canvast kell mozgatni
    //code-ot használok key helyett, mert akkor billentyűzet, nyelv független, a tényleges fizikai billentyükre szabható, elvileg ai szerint :)
    if(e.code === "KeyS" || e.code === "ArrowDown"){
        $(canvas).stop(true, false).animate({top: red_panda.y}, 100, () => {is_jumping = false});
    }

    if(!is_jumping && parseInt(canvas.css("top")) >= red_panda.y-20){ //"kicsit hamarabb lehet ugrani minthogy leér", ez inkább ilyen bhop érzetet ad, hogy nincs túl nagy input lag, ha pont akkor nyomjuk meg a gombot, mikor még nem ért le csak majdnem
        if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
            is_jumping = true;
            $(canvas).stop(true, false).animate({top: red_panda.y-220}, 300).delay(200).animate({top: red_panda.y}, 400, () => {is_jumping = false});
        }
    }
}

function red_panda_mouse_move(e) {
    if(e.button === 2){
        $(canvas).stop(true, false).animate({top: red_panda.y}, 100, () => {is_jumping = false});
    }

    if(!is_jumping && parseInt(canvas.css("top")) >= red_panda.y-20){
        if (e.button === 0) {
            is_jumping = true;
            $(canvas).stop(true, false).animate({top: red_panda.y-220}, 300).delay(200).animate({top: red_panda.y}, 400, () => {is_jumping = false});
        }

    }
}


// függvény az akadályok definiálására
function spawn_obstacle() {
    //minden 70. framen lesz 50% esély spawnoljon egy obstaclet, ami mindegyik a képernyőn kívülről kúszik majd be

    let r = Math.random();
    let pic = "";
    if(frame_count%70 === 0 && r > 0.5){
        if(r <= 1){ //az akadályok közül random valamelyik
            pic = pictures[0];
        }

        obstacle_array.push(
            {
                imgObj: obstacle.clone(),
                img: pic.src,
                x: ga_width+pic.w, //spawn x
                y: red_panda.y-40, // spawn y
                w: pic.w, //div beállítására szélesség és magasság
                h: pic.h,
                just_spawned: true
            });
        return true;
    }

    return false;
}


// függvény az akadályok kirajzolasara
function draw_obstacles() {
    if(spawn_obstacle()){
        let act_obst = obstacle_array[obstacle_array.length-1];
        let imgObj = act_obst.imgObj;

        // hozzaadjuk az új akadály képét a játékterülethez
        $("#background").append(imgObj);
        // beállitjuk az akadály (x, y) koordinátáját és a kép szélességét
        imgObj.css({
            left: act_obst.x,
            top: act_obst.y,
            width: act_obst.w,
            height: act_obst.h,
        });
        imgObj.attr("src", act_obst.img);
        // hozzaadjuk az obstacle class-t
        imgObj.addClass('obstacle');
    }

    move_obstacles();

    if(frame_count%100===0){
        remove_obstacles();
    }
}


//az akadályok mozgásáért felelő függvény
function move_obstacles() {
    $('.obstacle').each(function (index) {
        if (obstacle_array[index].just_spawned) {
            obstacle_array[index].just_spawned = false;
            return; // ne mozgassuk az első frame-ben
        }
        let currentLeft = parseInt($(this).css("left"));
        $(this).css("left", currentLeft - 8 + "px");
    });
}


//a gamearearól kiment akadályokat töröljük
function remove_obstacles(){
    for (let i = obstacle_array.length - 1; i >= 0; i--) {
        if (parseInt(obstacle_array[i].imgObj.css("left")) < -500) {
            obstacle_array[i].imgObj.remove();
            obstacle_array.splice(i, 1);
        }
    }
}


