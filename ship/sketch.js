let fishs = [];
//鱼群数组
let shipPos,
  shipVel,
  shipSize = 20,shipDir;
let boxDepth = 800;
//draw a spinning octahedron
let obj;
let ship;
let bg;
let mic;
let micLevel = 0;
let voiceThreshold = 0.15
let shipState = true;
let zd=0,xd=0,yd=0
function preload() {
  obj = loadModel("1.obj", true);
  ship = loadModel("ship.obj", true);
  bg = loadImage("bg.jpg");
}
function setup() {
  // createCanvas(windowWidth, windowHeight, WEBGL);
  createCanvas(1500, 1080, WEBGL);
  bg.resize(width, height);
mic = new p5.AudioIn();
  mic.start();
  for (let i = 0; i < 200; i++) {
    fishs[i] = new Fish();
  }
  shipPos = createVector(width / 2, height / 2);
  // 创建鱼群以及飞船初始位置
  shipVel = createVector(0, 0, 0);
  shipDir = createVector(0, 0, 0);
  angleMode(DEGREES)
}

function draw() {
  background(0);
  orbitControl(5, 5);

  background(89, 164, 227, 120);
  imageMode(CENTER)
  push()
  translate(0,0 ,-boxDepth-100 );
  let scl=2
  image(bg, 0,0, width*scl, height*scl);
  pop()
  translate(0,0 ,-boxDepth/2 );

  translate(-width / 2, -height / 2, 0 );
  
  for (let i = 0; i < fishs.length; i++) {
    fishs[i].run();
  }
  // 运行鱼群
  fill(250, 100, 100);
  push();
  translate(shipPos.x, shipPos.y, shipPos.z);
  // rotate(-PI / 2);
  // rotateX(-shipVel.y);
  // rotateY(-shipVel.z);
  // rotateZ(-shipVel.x);
  let zDir=createVector(shipDir.x,shipDir.z)
  let xDir=createVector(shipDir.y,shipDir.z)
  zd=lerp(zd,zDir.heading(),0.08)
  xd=lerp(xd,xDir.heading(),0.08)
  rotateY(zd+100);
  rotateZ(xd+340);

  normalMaterial();

  model(ship);

  pop();
   controlShip() 
}
function controlShip() {
  micLevel = lerp(micLevel, mic.getLevel(), 0.05);
  if (micLevel > voiceThreshold && shipState == false) {
    shipState = true;
    shipVel = p5.Vector.random3D().mult(mic.getLevel()*10);
  }
  shipDir.lerp(shipVel.x,shipVel.y,shipVel.z,0.1)
  
  if (micLevel < voiceThreshold ) {
    shipState = false;
    shipVel.mult(0.98)
  }
  
  shipPos.add(shipVel)
  // print(shipDir.x)
  
    if (shipPos.x > width) {
      shipPos.x = 0;
    } else if (shipPos.x < 0) {
      shipPos.x = width;
    } else if (shipPos.y < 0) {
      shipPos.y = height;
    } else if (shipPos.y > height) {
      shipPos.y = 0;
    } else if (shipPos.z > boxDepth / 2) {
      shipPos.z = -boxDepth / 2;
    } else if (shipPos.z < -boxDepth / 2) {
      shipPos.z = boxDepth / 2;
    }
}

class Fish {
  constructor() {
    this.pos = createVector(
      random(width),
      random(height),
      random(-boxDepth / 2, boxDepth)
    );
    // 位置
    this.acc = createVector(0, 0);
    // 加速度
    this.vel = p5.Vector.random2D();
    // 速度
    this.s = 10;
    // 大小
    this.maxSpd = 5;
    // 最大速度
    this.maxFor = 0.1;
    // 最大受力
    this.noi = random(100);
    // noise函数的参数
    this.col = color(random(200, 250), random(80, 120), random(150, 180));
    // 颜色
  }
  run() {
    // 运行所有函数
    this.separate();
    this.align();
    this.cohesion();
    this.flee(shipPos);
    this.noiFor();
    this.update();
    this.display();
    this.bound();
  }
  seek(tar) {
    // 使鱼朝向目标位置移动的函数
    let dir = p5.Vector.sub(tar, this.pos);
    dir.setMag(this.maxSpd);
    dir.sub(this.vel);
    dir.limit(this.maxFor);
    this.addForce(dir);
  }
  addForce(f) {
    // 施力函数
    this.acc.add(f);
  }
  update() {
    // 物理运算函数
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpd);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }
  noiFor() {
    // 用noise使鱼有随机运动变化的函数
    let noiAng = noise(this.noi) * 2 * TWO_PI;
    this.noi += 0.05;
    let dir = p5.Vector.fromAngle(noiAng);
    dir.limit(this.maxFor);
    this.addForce(dir);
  }
  display() {
    // 绘制鱼的函数
    noStroke();

    fill(this.col);
    push();
    normalMaterial();

    translate(this.pos.x, this.pos.y, this.pos.z);
    // sphere(10);

    scale(0.2);
    // noFill()

    model(obj);
    // box(50);
    pop();
  }
  align() {
    // 使鱼跟其他鱼对齐方向的函数
    let minDist = 60;
    // 设置鱼的感知范围
    let dir = createVector(0, 0);
    let num = 0;
    for (let i = 0; i < fishs.length; i++) {
      if (this != fishs[i]) {
        let dist = p5.Vector.dist(fishs[i].pos, this.pos);
        if (dist < minDist) {
          let diff = fishs[i].vel.copy();
          num++;
          dir.add(diff);
        }
      }
    }

    if (num != 0) {
      dir.div(num);
      dir.setMag(this.maxSpd);
      dir.sub(this.vel);
      dir.limit(this.maxFor);
      this.addForce(dir);
    }
    // 计算并平均感知范围内其他鱼的方向
    // 再用此方向施加给鱼
  }
  separate() {
    // 使鱼跟其他鱼保持距离的函数
    let minDist = 40;
    // 设置鱼的感知范围
    let dir = createVector(0, 0);
    let num = 0;
    for (let i = 0; i < fishs.length; i++) {
      if (this != fishs[i]) {
        let dist = p5.Vector.dist(fishs[i].pos, this.pos);
        if (dist < minDist) {
          let diff = p5.Vector.sub(this.pos, fishs[i].pos);
          diff.setMag(1);
          diff.div(dist);
          num++;
          dir.add(diff);
        }
      }
    }
    if (num != 0) {
      dir.div(num);
      dir.setMag(this.maxSpd);
      dir.sub(this.vel);
      dir.limit(this.maxFor * 2);
      this.addForce(dir);
    }
    // 计算感知范围内其他鱼的距离 计算一个远离其他鱼的方向
    // 再用此方向施加给鱼
  }
  cohesion() {
    // 使鱼靠近其他鱼的函数
    let minDist = 80;
    // 设置鱼的感知范围
    let cen = createVector(0, 0);
    let num = 0;
    for (let i = 0; i < fishs.length; i++) {
      if (this != fishs[i]) {
        let dist = p5.Vector.dist(fishs[i].pos, this.pos);
        if (dist < minDist) {
          cen.add(fishs[i].pos);
          num++;
        }
      }
    }
    if (num != 0) {
      cen.div(num);
      this.seek(cen);
    }
    // 计算鱼的感知范围内其他鱼的平均位置
    // 并使鱼朝向平均点位置移动
  }
  flee(tar) {
    // 使鱼远离目标点的函数
    let minDist =100;
    // 设置鱼的感知范围
    let  v1=createVector(tar.x,tar.y)
    let  v2=createVector( this.pos.x, this.pos.y)
    let dist = p5.Vector.dist(v1, v2);
    if (dist < minDist) {
      let dir = p5.Vector.sub(v1,v2);
      dir.setMag(-1 * this.maxSpd);
      dir.sub(this.vel);
      dir.limit(this.maxFor * 20);
      this.addForce(dir);
    }
    // 当目标点在感知范围内的时候 使鱼远离该目标点
  }
  bound() {
    // 当鱼出界时 让鱼从另一边出现的函数

    if (this.pos.x > width) {
      this.pos.x = 0;
    } else if (this.pos.x < 0) {
      this.pos.x = width;
    } else if (this.pos.y < 0) {
      this.pos.y = height;
    } else if (this.pos.y > height) {
      this.pos.y = 0;
    } else if (this.pos.z > boxDepth / 2) {
      this.pos.z = -boxDepth / 2;
    } else if (this.pos.z < -boxDepth / 2) {
      this.pos.z = boxDepth / 2;
    }
  }
}
