//játéktér div változója, méretei
let game_area;
let ga_width, ga_height;

//menu div változója, ua mint a background csak egy div
let menu;
let start_button;
let leaderboard_button;
let back_to_menu_button;

//deathscreen változója
let death_screen;
let retry_button;
let deathscreen_highscore;
let deathscreen_score;


//leaderboard div változója
let leaderboard;

//hátterek változói, kettő van hogy szimuláljuk azok mozgását, meg azok containere
let background;
let bg1, bg2;
let bg_width = 1376;

//header, a score és highscore változók lentebb (dont know why)
let header;

//canvas ami a bg felett van
let canvas; //a jquerys selector, ezzel van kirajzoltatva a vörös panda, szóval lehetne vörös panda a neve, de azt meghagytam a pozícióknak
let canvas_width, canvas_height;
let ctx; //contextManager, amivel canvasra rajzolhatok

//akadályok, objektumok amikkel ütközve megáll a játék
let obstacle;
let obstacle_array = [];
let pictures = [];

//vörös panda, az úgráló szörmók, (a google chrome no internet T-rex running game dinója lenne)
let red_panda_spawn = {x: 50, y: 480}; //alap pozíciója
let red_panda_curr = {x: 50, y: 480}; //jelenlegi pozíciója
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
let score_shown = false;
let highscore;
let highscore_value = -1;
let highscore_shown = false;

//az játékot vezénylő interval változó
let frame_count = 0; //ez a játék során menő framek, nincs köze a spritéhoz
let game_interval;
let collision_interval;

//nehézség beállítására változók (mode kimaradhatna, de my game)
let mode = 'normal';
let speed = 0;

//változók az eventhandlerek "aktivitására", így nem kell őket offolni, lazi but logical for me
let game_running = false; //ha true, akkor jók a mozgató eh-k
let notinmenu = false; //ha true, akkor lehet csak restartolni
let is_jumping = false; //ha false, akkor tud csak ugrani a vörös panda, amúgy double/tripla jumpolna és kiugrik a képernyőről


$(document).ready(function () {
    //ga inicializálás
    game_area = $('#gamearea')

    //menu
    menu = $("#menu");
    start_button = $("#start_button");
    start_button.button().click(function () {
        game_start();
    })
    $("#difficulty input[type=radio]").checkboxradio();

    back_to_menu_button = $(".back_to_menu_button");
    back_to_menu_button.button().click(function () {
        //headerről leveszi a scoret, csak highscoret mutatja ha van
        score_shown = false;
        $(".header_item").each(function () {
            let pId = $(this).find("p").attr("id"); //adott header_itemben lévő <p> id-ja
            if (pId === "score") {
                $(this).remove();
            }
        })

        notinmenu = false;
        leaderboard.hide();
        death_screen.hide();
        menu.show();
    })

    retry_button = $("#retry_button");
    retry_button.button().click(function () {
        death_screen.hide();
        background.show();
        game_start();
    })

    ///TODO megcsinálni az adatbázisból lekérdezést stb és kiiratni a leaderboard divbe táblázatba maybe
    leaderboard_button = $("#leaderboard_button");
    leaderboard_button.button().click(function () {
        menu.hide();
        leaderboard.show();
    })

    //deathscreen
    death_screen = $("#death_screen");
    deathscreen_highscore = $("#deathscreen_highscore");
    deathscreen_score = $("#deathscreen_score");

    //leaderboard
    leaderboard = $("#leaderboard");

    //hátterek inicializálás
    background = $("#background");
    bg1 = $(".bg").eq(0);
    bg2 = $(".bg").eq(1);

    //header inicializálás
    header = $("#header")
    $("#tooltip").tooltip({
        content: `
        <strong>Gameplay:</strong><br>
        Avoid the sleeping pandas and birds.
        Jump across pandas and fall fast so you don't hit the incoming birds.<br> 
        <strong>Controls:</strong><br>
        Jump: <strong>Space / W / Left Click</strong><br>
        Fall: <strong>S / Right Click</strong> (while airborne)<br>
        Restart: <strong>R</strong> (on death screen)<br>
        `,
        show: { effect: "scale", duration: 200 },
        hide: { effect: "fade", duration: 100 },
        position: {
            my: "right top", //tooltip box ami lenyilik melyik pontját
            at: "left bottom" //hova illesztem a i spanes cuccnak, tehát most a jobb teteje a boxnak lesz a i-s kör bal aljához igazítva
        }
    });


    score = $("<p id='score'></p>")
    highscore = $("<p id='highscore'></p>")

    //canvas és contextmanager inicializálás
    canvas = $("#canvas");
    canvas_width = canvas.width();
    canvas_height = canvas.height();
    canvas.css({left: red_panda_spawn.x, top: red_panda_spawn.y});
    ctx = document.getElementById("canvas").getContext("2d");

    //akadályokhoz inicializálás
    obstacle = $("<img alt=\"obstacle\">"); //srct majd jquery beállítja mert több féle akadály van
    pictures.push({src: "assets/sleepy1.png",w: 200, h: 200});
    pictures.push({src: "assets/sleepy2.png",w: 200, h: 200});
    pictures.push({src: "assets/sleepy_trio.png",w: 174, h: 190});
    pictures.push({src: "assets/bird_frame1.png",w: 67, h: 75});

    //megakadályozza az alapértelmezett jobbklikk menüt, így lehet a mouse_moveban a jobb klikkel leesni
    $(document).on("contextmenu", function(e) {
        e.preventDefault();
    });
    //event handlerek a vörös panda mozgásának lekezelésére
    $(document).on("keydown", red_panda_move);
    $(document).on("mousedown", red_panda_mouse_move);
    //event handler játék újra inditáshoz
    $(document).on('keydown', restart)

    //jump túl hangos volt szóval hang lejebb vétele
    const jump = document.getElementById("jump");
    jump.volume = jump.volume/5;

    background.hide();
    leaderboard.hide();
    death_screen.hide();
})

//a játékot elindító / újrainditó függvény
function game_start(){
    //menü és deathscreen elrejtés, background (tényleges játéktér megjelenítése)
    menu.hide()
    death_screen.hide();
    background.show();

    //alapértelmezett adatok beállítása / resetelése
    is_jumping = false; //ha ugrásba hal meg akkor resetelni kell, vagy nem lesz jó
    game_running = true;
    notinmenu = false;
    score_value = 0;
    frame_count = 0;
    red_panda_curr.x = red_panda_spawn.x;
    red_panda_curr.y = red_panda_spawn.y;
    $(canvas).css("left", red_panda_spawn.x + "px");
    $(canvas).css("top", red_panda_spawn.y + "px");

    //mód alapján speed beállítás
    mode = $("#difficulty input[name=\"diff\"]:checked").val()
    if(mode === 'easy') {
        speed = 5;
    } else if(mode === 'normal') {
        speed = 10;
    } else if(mode === 'hard') {
        speed = 15;
    }

    //zene start
    $("#ariamath")[0].play();

    collision_interval = setInterval(check_collisoin, 1);
    game_interval = setInterval(animate, 16);
}



//a játék menetet / animációt végző függvény
function animate(){
    frame_count++;
    //a score a nehézségi szinteknek megfelelően gyorsabban / lassabban növekszik, ez lehet maradhatott volna default érték minden nehézségre,
    //de ha így számolom, akkor egyszerűbb a leaderboard, mert nem kell nehézséget is eltárolni, vagy hát lehetne de nem fogok :)
    score_value = frame_count / (10 / (speed / 15));
    window.requestAnimationFrame(draw);
    //console.log(red_panda_curr.x, red_panda_curr.y);
}


//minden mozgó elemet megrajzol / frissit, ez van animatebe meganimálva
function draw(){
    size_update();
    header_update();

    moving_background(speed);
    draw_moving_red_panda(16);
    draw_moving_bird();

    //kis downtime az első akadály előtt
    if(frame_count>=200){
        draw_obstacles();
    }
}


//oldal újra méretezésekor (ctrl+görgő) változhatnak változók értéke, ez frissíti azokat (legalábbis ami szembetűnt hogy fontos lenne)
function size_update(){
    //változhat a ga ha változik az ablak méret mert %-os a width
    ga_width = parseInt(game_area.css("width"));
    ga_height = parseInt(game_area.css("height"));
}


//a fejlécen a score stb értékek updatelése
function header_update(){ //a score / highscore text lehetne külön hogy csak a számot kelljen updatelni, de most ez legyen a legkisebb bajom
    //score
    if(!score_shown){
        let uj_header_item = $("<div class='header_item'></div>").append(score)
        $('.header_item').has('#author').before(uj_header_item);
        score_shown = true;
    }
    score.text("SCORE: "+parseInt(score_value))

    //highscore
    if(!highscore_shown && highscore_value >= 0){
        $("<div class='header_item'></div>").prependTo(header).append(highscore)
        highscore_shown = true;
    }
    if(highscore_value>score_value && highscore_value !== -1){
        highscore.text("HIGHSCORE: "+highscore_value)
    } else{
        highscore.text("HIGHSCORE: "+parseInt(score_value));
    }
}


//mozgó háttér a futás szimulálására
function moving_background(speed){
    bg1_pos -= speed/2+3;
    bg2_pos -= speed/2+3;

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
        0, 0, frame.w*4, frame.h*4 // canvason a helye és mérete, 4-os szorzó egy pixel arton lehet nem a legjobb de it is what it is 32px túl pici mást meg nem találtam
    );
}


//a madár idle sprite animációja, csak a kép váltást vezényli
function draw_moving_bird(){
    $(".obstacle").each(function() {
        let $obst = $(this);
        let src = $obst.attr("src");

        if (src === "assets/bird_frame1.png" && frame_count % 8 === 0) {
            $obst.attr("src", "assets/bird_frame2.png");
        } else if (src === "assets/bird_frame2.png" && frame_count % 8 === 0) {
            $obst.attr("src", "assets/bird_frame1.png");
        }
    });

}


//event handler függvények az vörös panda az ugráshoz és gyors leeséshez
function red_panda_move(e) { //mivel a sprite egy canvasra van rajzolva, ezért a canvast kell mozgatni
    //code-ot használok key helyett, mert akkor billentyűzet, nyelv független, a tényleges fizikai billentyükre szabható, elvileg ai szerint :)
    if(game_running && (e.code === "KeyS" || e.code === "ArrowDown")){
        $(canvas).stop(true, false).animate({top: red_panda_spawn.y}, 100-2*speed, () => {is_jumping = false});
    }

    if(game_running && !is_jumping && parseInt(canvas.css("top")) >= red_panda_spawn.y-20){ //"kicsit hamarabb lehet ugrani minthogy leér", ez inkább ilyen bhop érzetet ad, hogy nincs túl nagy input lag, ha pont akkor nyomjuk meg a gombot, mikor még nem ért le csak majdnem
        if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
            is_jumping = true;
            $("#jump")[0].play();
            $(canvas).stop(true, false).animate({top: red_panda_spawn.y-220}, 300-2*speed).delay(200).animate({top: red_panda_spawn.y}, 400-3*speed, () => {is_jumping = false});
        }
    }
}

function red_panda_mouse_move(e) {
    if(game_running && e.button === 2){
        $(canvas).stop(true, false).animate({top: red_panda_spawn.y}, 100-2*speed, () => {is_jumping = false});
    }

    if(game_running && !is_jumping && parseInt(canvas.css("top")) >= red_panda_spawn.y-20){
        if (e.button === 0) {
            is_jumping = true;
            $("#jump")[0].play();
            $(canvas).stop(true, false).animate({top: red_panda_spawn.y-220}, 300-2*speed).delay(200).animate({top: red_panda_spawn.y}, 400-3*speed, () => {is_jumping = false});
        }

    }
}


// függvény az akadályok definiálására
function spawn_obstacle() {
    //minden (60- speed*2). framen lesz 40% esély, hogy spawnoljon egy obstaclet, ami mindegyik a képernyőn kívülről kúszik majd be

    let r = Math.random();
    let pic = "";
    let spawn_x;
    let spawn_y;

    if(frame_count % (60 - speed * 2) === 0 && r > 0.6){
        if(r <= 0.7){ //az akadályok közül random valamelyik, 10-10% eséllyel kb
            pic = pictures[0]; //alvo1
            spawn_y = red_panda_spawn.y-40;

        } else if(r <= 0.8){ //alvo2
            pic = pictures[1];
            spawn_y = red_panda_spawn.y-40;

        } else if(r <= 0.9){ //trio
            pic = pictures[2];
            spawn_y = red_panda_spawn.y-40;

        } else if(r <= 1){ //madár
            pic = pictures[3];
            spawn_y = red_panda_spawn.y-115;
        }

        spawn_x = ga_width+pic.w;

        obstacle_array.push(
            {
                imgObj: obstacle.clone(),
                img: pic.src,
                x: spawn_x, //spawn x
                y: spawn_y //spawn y
            });
        return true;
    }

    return false;
}


// függvény az akadályok kirajzolasara / DOM-ba rakására, itt hivódik meg a spawn, a mozgás és eltávolítás is
function draw_obstacles() {
    if(spawn_obstacle()){
        let act_obst = obstacle_array[obstacle_array.length-1];
        let imgObj = act_obst.imgObj;

        // hozzaadjuk az új akadály képét a játékterülethez
        background.append(imgObj);
        // beállitjuk az akadály (x, y) koordinátáját és a kép szélességét
        imgObj.css({
            left: act_obst.x,
            top: act_obst.y,
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
    $('.obstacle').each(function () {
        let currentLeft = parseInt($(this).css("left"));
        $(this).css("left", currentLeft - (speed+3) + "px");
    });
}


//a gamearearól kiment akadályokat töröljük (változóból és DOM-ból is)
function remove_obstacles(){
    for (let i = obstacle_array.length - 1; i >= 0; i--) { //vissza felé kell menni hogy az indexek ne zavarjanak be ha törlünk
        if (parseInt(obstacle_array[i].imgObj.css("left")) < -500) {
            obstacle_array[i].imgObj.remove();
            obstacle_array.splice(i, 1);
        }
    }
}


//bemenet 2 obj, visszaadja a vörös panda és 1 akadály euklidészi távolságát, collisionbe ezt checkoljuk folyamat
function distance(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy)
}


//függvény amit 1mses intervallal futtatunk hogy nézzünk ütközést
function check_collisoin() {
    $('.obstacle').each(function () {
        let act_obstacle = $(this);

        //távolság aminél collideol a kép alapján
        let coll_dist;

        //jelenlegi obstacle súlypontja
        let act_x;
        let act_y;

        if(act_obstacle.attr("src") === "assets/sleepy_trio.png"){ // a 3-as panda stacknél máshol van a súlypont
            act_x = act_obstacle.position().left + act_obstacle.width()/2 - 10;
            act_y = act_obstacle.position().top + act_obstacle.height()/2 ;
            coll_dist = 100;
        } else if(act_obstacle.attr("src") === "assets/bird_frame1.png" || act_obstacle.attr("src") === "assets/bird_frame2.png"){
            act_x = act_obstacle.position().left + act_obstacle.width()/2 - 15; //inkább a csőre fele legyen a hitbox
            act_y = act_obstacle.position().top + act_obstacle.height()/2;
            coll_dist = 60;
        } else{ //többi 2 egyedül alvó nagy alvó
            act_x = act_obstacle.position().left + act_obstacle.width()/2 - 10; //-10 kompenzál a nagy fejére
            act_y = act_obstacle.position().top + act_obstacle.height()/2 + 25; //+20 kompenzálni a felső üres pixelekért
            coll_dist = 80;
        }

        //folyamat updatelődik a panda jelenlegi left és top x y koordinátája
        red_panda_curr.x = canvas.position().left;
        red_panda_curr.y = canvas.position().top;

        //körülbelüli súlypontja a pandának
        let panda_sulypont_X = red_panda_curr.x + canvas_width/2;
        let panda_sulypont_Y = red_panda_curr.y + canvas_height*2/3;

        //console.log(act_x, act_y)
        //console.log(distance({x: act_x, y: act_y}, {x: panda_sulypont_X, y: panda_sulypont_Y}));
        if (distance({x: act_x, y: act_y}, {x: panda_sulypont_X, y: panda_sulypont_Y}) <= coll_dist) { // a -20 kompenzálás a láthatatlan pixelekért minden irányból
            //súlypontok vizualizálására kép XD
            /*
            let asd = $("<img src='assets/icon.png' class='obstacle'>").appendTo($("#background"))
            asd.css("position", "absolute");
            asd.css("left", act_x+"px")
            asd.css("top", act_y+"px")
            asd.css("width", 50+"px")
            asd.css("height", 50+"px")
            asd.css("z-index",5)*/


            $(canvas).stop(true, false); //megáll a panda ott ahol ütközött
            game_running = false;
            notinmenu = true; //deathscreen lesz tehát működjön a restart r-rel is
            //zene restart
            $("#ariamath")[0].currentTime = 0;

            //minden akadály törlése restartnál
            $(".obstacle").remove();

            if(score_value>highscore_value){
                highscore_value = parseInt(score_value);
            }
            deathscreen_highscore.text("Highscore: "+highscore_value)
            deathscreen_score.html("Score: "+parseInt(score_value))

            death_screen.show()
            background.hide()

            //játék intervaljainak törlése
            clearInterval(collision_interval);
            clearInterval(game_interval);

            //zene stop
            $("#ariamath")[0].pause();


        }
    });
}

function restart(e){
    if(notinmenu && e.code === "KeyR"){
        death_screen.hide();
        background.show();
        game_start();
    }
}

