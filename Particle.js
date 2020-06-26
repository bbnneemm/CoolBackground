(function(global, factory){
    /*
     * '?'和'：'相当于if和else  
     * CommonJS 有三个全局变量 module、exports 和 require
     * AMD 规范中，define 函数同样有一个公有属性 define.amd
     * 打开任何一个网页，浏览器会首先创建一个窗口，这个窗口就是一个window对象，也是js运行所依附的全局环境对象和全局作用域对象。
     * self 指窗口本身，它返回的对象跟window对象是一模一样的。也正因为如此，window对象的常用方法和函数都可以用self代替window
     */
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.Particle = factory());
}(this, function() {
    var canvas = {}; //创建画布
    var context = {}; // 画布工作区
    var collisionline = []; // 粒子触碰到这些线会反弹
    var choose = {
        divWrapper: '', // 外部div
        divInner: [], // 内部div 粒子移动区域为外部div内 内部div外
        maxRadius: 0, // 最大粒子半径
        minRadisu: 0, // 最小粒子半径
        amount: 0, // 粒子数量
        collision: false, // 粒子之间是否会碰撞
        color: []
    }
    var particles = []; // 每一个粒子对象都会存在该数组中
    var frames = 0; // 帧数
    function Formula() {} // 相关物理公式
    Formula.prototype.distance = function(x0,y0,obj) { // 计算点到直线的距离
        var A = obj.endY - obj.beginY;
        var B = obj.endX - obj.beginX;
        var C = obj.endX*obj.beginY - obj.beginX*obj.endY;
        var dis = Math.abs(A * x0 + B * y0 + C) / Math.sqrt(A*A + B*B);
        return dis;
    }
    var formula = new Formula();
    function usrChooseHandle(obj) { // 处理用户选择
        choose.amount = obj.amount || 25; // obj.amount不存在 执行默认值
        choose.radius = obj.radius || 15;
        choose.divInner = obj.divInner || [];
        choose.color = obj.color || ['#E08031','#C7CEB2','#199475','#0B6E48','#044D22']
        choose.divWrapper = document.getElementById(obj.divWrapper);
        choose.divWrapper.style.zIndex = '998';
        canvas = document.createElement("canvas");
        canvas.style.zIndex = '999';
        canvas.style.width =  choose.divWrapper.offsetWidth+ 'px';
        canvas.style.height =  choose.divWrapper.offsetHeight + 'px';
        for(i=0;i<choose.divInner.length;i++) {
            document.getElementById(choose.divInner[i]).zIndex = '1000';
        }
        canvas.width = choose.divWrapper.offsetWidth;
        canvas.height = choose.divWrapper.offsetHeight;
        context = canvas.getContext("2d");
        context.font = '20px bold'
        canvas.style.backgroundColor = "#f1f3f4";
        choose.divWrapper.appendChild(canvas);
        // location.reload();
    }
    function surroundinginit() { // 粒子环境初始化
        collisionline.push({
            beginX: 0,
            beginY: 0,
            endX: canvas.width,
            endY: 0,
            direct: 0
        });
        collisionline.push({
            beginX: canvas.width,
            beginY: 0,
            endX: canvas.width,
            endY: canvas.height,
            direct: 90

        });
        collisionline.push({
            beginX: canvas.width,
            beginY: -canvas.height,
            endX: 0,
            endY: -canvas.height,
            direct: 0
        });
        collisionline.push({
            beginX: 0,
            beginY: canvas.height,
            endX: 0,
            endY: 0,
            direct: 90
        });
        for(i=0;i<choose.divInner.length;i++) {
            var doc = document.getElementById(choose.divInner[i]);
            var t = doc.offsetTop;
            var l = doc.offsetLeft;
            var w = doc.offsetWidth;
            var h = doc.offsetHeight;
            collisionline.push({
                beginX: l,
                beginY: -t,
                endX: l+w,
                endY: -t,
                direct: 0
            });
            collisionline.push({
                beginX: l+w,
                beginY: -t,
                endX: l+w,
                endY: -t-h,
                direct: 90
            });
            collisionline.push({
                beginX: l,
                beginY: -t-h,
                endX: l+w,
                endY: -t-h,
                direct: 0
            });
            collisionline.push({
                beginX: l,
                beginY: -t,
                endX: l,
                endY: -t-h,
                direct: 90
            });
        }  
    }
    function particleinit() { // 粒子初始化
        for (i=0; i<choose.amount; i++){
            while(true){
            var Issuccess = true;
            var x = Math.ceil(Math.random() * (canvas.width-choose.radius*4))+choose.radius*2;
            var y = Math.ceil(Math.random() * (canvas.height-choose.radius*4))+choose.radius*2;
            for(k=0;k<choose.divInner.length;k++){
                var doc = document.getElementById(choose.divInner[k]);
                var t = doc.offsetTop;
                var l = doc.offsetLeft;
                var w = doc.offsetWidth;
                var h = doc.offsetHeight;
                if(((l-choose.radius)<x&&x<(l+w+choose.radius))&&((-t+choose.radius)>-y&&-y>(-t-h-choose.radius))){
                   Issuccess = false;
                }
            }
            // if(i!=0){
            //     for(j=0;j<particles.length;j++){
            //         if(Math.sqrt(Math.pow(x-particles[j].x,2) + Math.pow(y-particles[j].y,2)) < 2*particles[j].radius){
            //             Issuccess=false;
            //         } 
            //     }}    
            if(Issuccess === true){
                break;  
            }
            }

            particles.push({ // push最好这样推入对象
                filling: true, // 是否填充
                radius: choose.radius, // 半径
                color: choose.color[Math.floor(Math.random()*choose.color.length)], // 颜色
                x: x, // x轴坐标
                y: y, // y轴坐标       x y决定当前位置
                vx: (Math.ceil(Math.random() * 6) / 10) + 1, // x轴速度
                vy: (Math.ceil(Math.random() * 6) / 10) + 1.5 // y轴速度      vx vy决定下一帧位置
            });
        }
    }
    function particleUpdate() { // 更新每一帧的粒子物理相关属性
        for(i=0; i<particles.length; i++) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            for(j=0; j<4; j++) {
                if( formula.distance(particles[i].x, particles[i].y, collisionline[j]) < particles[i].radius){
                    if(collisionline[j].direct === 0) {
                        particles[i].vy = -particles[i].vy;
                    }
                    if(collisionline[j].direct === 90) {
                        particles[i].vx = -particles[i].vx;
                    }
                }
            }
            for(j=4; j<collisionline.length; j++) {
                if( formula.distance(particles[i].x, particles[i].y, collisionline[j]) < particles[i].radius){
                    if(collisionline[j].direct === 0&&collisionline[j].beginX<particles[i].x+particles[i].radius&&particles[i].x-particles[i].radius<collisionline[j].endX) {
                        particles[i].vy = -particles[i].vy;
                    }
                    if(collisionline[j].direct === 90&&collisionline[j].beginY>-particles[i].y-particles[i].radius&&-particles[i].y+particles[i].radius>collisionline[j].endY) {
                        particles[i].vx = -particles[i].vx;
                    }
                }
            }
            // for(j=0; j<particles.length; j++){
            //     if(j!=i&&(Math.sqrt(Math.pow(particles[i].x-particles[j].x,2) + Math.pow(particles[i].y-particles[j].y,2)) < 2*particles[j].radius)){
            //         var a = particles[i].vx;
            //         var b = particles[i].vy;
            //         particles[i].vx = particles[j].vx;
            //         particles[i].vy = particles[j].vy;
            //         particles[j].vx = a;
            //         particles[j].vy = b;
            //     }
            // }
        }
    }
    function render() {
        context.clearRect(0, 0, canvas.width, canvas.height)
        // context.fillStyle = "black"; //设置文字颜色
        // context.fillText('帧 数:' + frames, 0, 20);
        for(i=0; i<particles.length; i++) {
        context.beginPath();
        context.arc(particles[i].x, particles[i].y, particles[i].radius, 0, 2 * Math.PI, false);
        context.fillStyle = particles[i].color;
        context.fill();
        context.closePath();
    }
    }
    function update() { // 每一帧要执行的函数
        frames++;
        particleUpdate();
        render();
        requestAnimationFrame(update);
    }
    function movestart() { // 当在html页面调用此方法时 粒子系统开始
        surroundinginit();
        particleinit();
        update();
    }
    var Particle = function(obj) {
        usrChooseHandle(obj);
        return {
            movestart
        }
    }
    return Particle;
}));