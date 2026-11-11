// Interactive Playable Games and Functional Simulators for Abdul Zubair's Portfolio

window.PortfolioSimulators = {
    currentInterval: null,
    
    // 1. RETRO SNAKE GAME
    launchSnake: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <h3 style="color: #4ade80; margin-bottom: 8px;">🐍 Retro Snake Arcade Engine</h3>
                <div style="font-size: 0.95rem; margin-bottom: 12px; color: #94a3b8;">
                    Score: <span id="snake-score" style="color: #38bdf8; font-weight: bold;">0</span> | 
                    High: <span id="snake-high" style="color: #facc15; font-weight: bold;">0</span> | 
                    Controls: Arrow Keys / Swipe
                </div>
                <div style="display: flex; justify-content: center;">
                    <canvas id="snake-canvas" width="400" height="400" style="background: #020617; border: 2px solid #22c55e; border-radius: 12px; box-shadow: 0 0 25px rgba(34, 197, 94, 0.3); max-width: 100%; height: auto;"></canvas>
                </div>
                <div style="margin-top: 14px; display: flex; justify-content: center; gap: 8px;">
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.snakeDir({keyCode: 37})">⬅️</button>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button class="btn-ctrl" onclick="window.PortfolioSimulators.snakeDir({keyCode: 38})">⬆️</button>
                        <button class="btn-ctrl" onclick="window.PortfolioSimulators.snakeDir({keyCode: 40})">⬇️</button>
                    </div>
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.snakeDir({keyCode: 39})">➡️</button>
                    <button id="snake-restart-btn" class="btn-action" style="margin-left: 12px;" onclick="window.PortfolioSimulators.launchSnake(document.getElementById('modal-sim-body'))">🔄 Restart</button>
                </div>
            </div>
        `;
        
        const canvas = document.getElementById('snake-canvas');
        const ctx = canvas.getContext('2d');
        const grid = 20;
        let snake = [{x: 160, y: 160}, {x: 140, y: 160}, {x: 120, y: 160}];
        let dx = grid, dy = 0;
        let food = {x: 240, y: 240};
        let score = 0;
        let highScore = localStorage.getItem('snake_hi') || 0;
        document.getElementById('snake-high').innerText = highScore;
        let changingDirection = false;
        
        function randomFood() {
            food = {
                x: Math.floor(Math.random() * (canvas.width / grid)) * grid,
                y: Math.floor(Math.random() * (canvas.height / grid)) * grid
            };
        }
        
        window.PortfolioSimulators.snakeDir = function(e) {
            if (changingDirection) return;
            const key = e.keyCode;
            const goingUp = dy === -grid, goingDown = dy === grid, goingRight = dx === grid, goingLeft = dx === -grid;
            if (key === 37 && !goingRight) { dx = -grid; dy = 0; changingDirection = true; }
            if (key === 38 && !goingDown) { dx = 0; dy = -grid; changingDirection = true; }
            if (key === 39 && !goingLeft) { dx = grid; dy = 0; changingDirection = true; }
            if (key === 40 && !goingUp) { dx = 0; dy = grid; changingDirection = true; }
        };
        
        window.addEventListener('keydown', window.PortfolioSimulators.snakeDir);
        
        function mainLoop() {
            changingDirection = false;
            // Move
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};
            
            // Wall collision (wrap around)
            if (head.x < 0) head.x = canvas.width - grid;
            if (head.x >= canvas.width) head.x = 0;
            if (head.y < 0) head.y = canvas.height - grid;
            if (head.y >= canvas.height) head.y = 0;
            
            // Self collision
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    ctx.fillStyle = '#ef4444';
                    ctx.font = '24px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
                    clearInterval(window.PortfolioSimulators.currentInterval);
                    return;
                }
            }
            
            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                document.getElementById('snake-score').innerText = score;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('snake_hi', highScore);
                    document.getElementById('snake-high').innerText = highScore;
                }
                randomFood();
            } else {
                snake.pop();
            }
            
            // Draw
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw food
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(food.x + grid/2, food.y + grid/2, grid/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw snake
            snake.forEach((part, index) => {
                ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
                ctx.fillRect(part.x + 1, part.y + 1, grid - 2, grid - 2);
            });
        }
        
        this.currentInterval = setInterval(mainLoop, 90);
    },
    
    // 2. SPACE DODGER ARCADE GAME
    launchSpaceDodger: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <h3 style="color: #38bdf8; margin-bottom: 8px;">🚀 2D Arcade Space Dodger</h3>
                <div style="font-size: 0.95rem; margin-bottom: 12px; color: #94a3b8;">
                    Score: <span id="space-score" style="color: #38bdf8; font-weight: bold;">0</span> | 
                    Lives: <span id="space-lives" style="color: #f43f5e; font-weight: bold;">❤️❤️❤️</span> | 
                    Move: A/D or Left/Right | Shoot: Space / Tap
                </div>
                <div style="display: flex; justify-content: center;">
                    <canvas id="space-canvas" width="400" height="420" style="background: #030712; border: 2px solid #38bdf8; border-radius: 12px; box-shadow: 0 0 25px rgba(56, 189, 248, 0.3); max-width: 100%; height: auto;"></canvas>
                </div>
                <div style="margin-top: 14px; display: flex; justify-content: center; gap: 10px;">
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.spaceLeft()">⬅️ Move Left</button>
                    <button class="btn-ctrl" style="background: #ef4444; color: white;" onclick="window.PortfolioSimulators.spaceShoot()">🔥 FIRE</button>
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.spaceRight()">➡️ Move Right</button>
                    <button class="btn-action" onclick="window.PortfolioSimulators.launchSpaceDodger(document.getElementById('modal-sim-body'))">🔄 Restart</button>
                </div>
            </div>
        `;
        
        const canvas = document.getElementById('space-canvas');
        const ctx = canvas.getContext('2d');
        let player = {x: 180, y: 370, w: 36, h: 28, speed: 18};
        let lasers = [];
        let asteroids = [];
        let stars = Array.from({length: 40}, () => ({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2+1}));
        let score = 0;
        let lives = 3;
        let isGameOver = false;
        
        window.PortfolioSimulators.spaceLeft = () => { if (!isGameOver) player.x = Math.max(10, player.x - player.speed); };
        window.PortfolioSimulators.spaceRight = () => { if (!isGameOver) player.x = Math.min(canvas.width - player.w - 10, player.x + player.speed); };
        window.PortfolioSimulators.spaceShoot = () => {
            if (!isGameOver) {
                lasers.push({x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 12, speed: 8});
            }
        };
        
        function onKey(e) {
            if (e.keyCode === 37 || e.keyCode === 65) window.PortfolioSimulators.spaceLeft();
            if (e.keyCode === 39 || e.keyCode === 68) window.PortfolioSimulators.spaceRight();
            if (e.keyCode === 32) { e.preventDefault(); window.PortfolioSimulators.spaceShoot(); }
        }
        window.addEventListener('keydown', onKey);
        
        let frame = 0;
        function loop() {
            if (isGameOver) return;
            frame++;
            
            // Spawn asteroids
            if (frame % 35 === 0) {
                asteroids.push({
                    x: Math.random() * (canvas.width - 30),
                    y: -30,
                    size: Math.random() * 20 + 16,
                    speed: Math.random() * 2.5 + 2
                });
            }
            
            // Clear & draw stars
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#94a3b8';
            stars.forEach(s => {
                s.y += s.s * 0.8;
                if (s.y > canvas.height) s.y = 0;
                ctx.fillRect(s.x, s.y, s.s, s.s);
            });
            
            // Move lasers
            lasers.forEach((l, li) => {
                l.y -= l.speed;
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 8;
                ctx.fillRect(l.x, l.y, l.w, l.h);
                ctx.shadowBlur = 0;
                if (l.y < 0) lasers.splice(li, 1);
            });
            
            // Move and draw asteroids
            asteroids.forEach((a, ai) => {
                a.y += a.speed;
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.size/2, 0, Math.PI*2);
                ctx.fill();
                
                // Check laser collision
                lasers.forEach((l, li) => {
                    if (l.x > a.x - a.size/2 && l.x < a.x + a.size/2 && l.y > a.y - a.size/2 && l.y < a.y + a.size/2) {
                        asteroids.splice(ai, 1);
                        lasers.splice(li, 1);
                        score += 25;
                        document.getElementById('space-score').innerText = score;
                    }
                });
                
                // Check player collision
                if (a.y + a.size/2 > player.y && a.x > player.x && a.x < player.x + player.w) {
                    asteroids.splice(ai, 1);
                    lives--;
                    let hearts = '';
                    for (let h=0; h<lives; h++) hearts += '❤️';
                    document.getElementById('space-lives').innerText = hearts || '💀';
                    if (lives <= 0) {
                        isGameOver = true;
                        ctx.fillStyle = '#ef4444';
                        ctx.font = '26px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('FLEET DESTROYED!', canvas.width/2, canvas.height/2);
                        clearInterval(window.PortfolioSimulators.currentInterval);
                    }
                }
                
                if (a.y > canvas.height + 30) asteroids.splice(ai, 1);
            });
            
            // Draw player ship
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.moveTo(player.x + player.w/2, player.y);
            ctx.lineTo(player.x + player.w, player.y + player.h);
            ctx.lineTo(player.x, player.y + player.h);
            ctx.closePath();
            ctx.fill();
            
            // Ship engine flame
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(player.x + player.w/2 - 5, player.y + player.h);
            ctx.lineTo(player.x + player.w/2 + 5, player.y + player.h);
            ctx.lineTo(player.x + player.w/2, player.y + player.h + 10 + Math.random()*6);
            ctx.closePath();
            ctx.fill();
        }
        
        this.currentInterval = setInterval(loop, 1000/60);
    },
    
    // 3. FLAPPY BIRD FLIGHT
    launchFlappy: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <h3 style="color: #facc15; margin-bottom: 8px;">🐥 Flappy Flight Mechanics Engine</h3>
                <div style="font-size: 0.95rem; margin-bottom: 12px; color: #94a3b8;">
                    Score: <span id="flappy-score" style="color: #facc15; font-weight: bold;">0</span> | 
                    Controls: Space Bar / Click Canvas to Flap
                </div>
                <div style="display: flex; justify-content: center;">
                    <canvas id="flappy-canvas" width="380" height="420" style="background: #0f172a; border: 2px solid #facc15; border-radius: 12px; cursor: pointer; max-width: 100%; height: auto;"></canvas>
                </div>
                <div style="margin-top: 14px;">
                    <button class="btn-action" onclick="window.PortfolioSimulators.launchFlappy(document.getElementById('modal-sim-body'))">🔄 Restart</button>
                </div>
            </div>
        `;
        
        const canvas = document.getElementById('flappy-canvas');
        const ctx = canvas.getContext('2d');
        let bird = {x: 60, y: 180, vy: 0, gravity: 0.35, jump: -6.5, radius: 14};
        let pipes = [];
        let score = 0;
        let isOver = false;
        let frame = 0;
        
        function flap() {
            if (!isOver) bird.vy = bird.jump;
        }
        canvas.addEventListener('click', flap);
        window.addEventListener('keydown', (e) => { if (e.keyCode === 32) { e.preventDefault(); flap(); } });
        
        function loop() {
            if (isOver) return;
            frame++;
            
            // Physics
            bird.vy += bird.gravity;
            bird.y += bird.vy;
            
            // Spawn pipes
            if (frame % 85 === 0) {
                let gap = 110;
                let topH = Math.random() * (canvas.height - gap - 80) + 30;
                pipes.push({x: canvas.width, top: topH, bottom: topH + gap, w: 46, passed: false});
            }
            
            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Pipes
            for (let i = 0; i < pipes.length; i++) {
                let p = pipes[i];
                p.x -= 2.2;
                
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(p.x, 0, p.w, p.top);
                ctx.fillRect(p.x, p.bottom, p.w, canvas.height - p.bottom);
                
                // Collision
                if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + p.w) {
                    if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.bottom) {
                        gameOver();
                    }
                }
                
                // Score
                if (!p.passed && p.x + p.w < bird.x) {
                    p.passed = true;
                    score++;
                    document.getElementById('flappy-score').innerText = score;
                }
            }
            pipes = pipes.filter(p => p.x + p.w > 0);
            
            // Ground/ceiling collision
            if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
                gameOver();
            }
            
            // Draw Bird
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(bird.x + 6, bird.y - 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function gameOver() {
            isOver = true;
            ctx.fillStyle = '#ef4444';
            ctx.font = '24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CRASHED! FINAL: ' + score, canvas.width / 2, canvas.height / 2);
            clearInterval(window.PortfolioSimulators.currentInterval);
        }
        
        this.currentInterval = setInterval(loop, 1000/60);
    },
    
    // 4. INTERACTIVE WHITEBOARD (Couple Canvas)
    launchWhiteboard: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="text-align: center; color: #fff;">
                <h3 style="color: #ec4899; margin-bottom: 8px;">🎨 Couple Canvas: Live WebRTC Drawing Whiteboard</h3>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px;">Draw gestures, collaborative diagrams, or sketches directly on the canvas!</p>
                <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                    <label>Color: <input type="color" id="wb-color" value="#ec4899" style="cursor: pointer;"></label>
                    <label>Width: <input type="range" id="wb-width" min="1" max="25" value="4"></label>
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.wbClear()">🧹 Clear</button>
                    <button class="btn-action" onclick="window.PortfolioSimulators.wbDownload()">💾 Save Art</button>
                </div>
                <div style="display: flex; justify-content: center;">
                    <canvas id="wb-canvas" width="550" height="380" style="background: #111827; border: 2px solid #ec4899; border-radius: 12px; cursor: crosshair; max-width: 100%; height: auto; touch-action: none;"></canvas>
                </div>
            </div>
        `;
        
        const canvas = document.getElementById('wb-canvas');
        const ctx = canvas.getContext('2d');
        let painting = false;
        
        function startPosition(e) { painting = true; draw(e); }
        function endPosition() { painting = false; ctx.beginPath(); }
        function draw(e) {
            if (!painting) return;
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            ctx.lineWidth = document.getElementById('wb-width').value;
            ctx.lineCap = 'round';
            ctx.strokeStyle = document.getElementById('wb-color').value;
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
        
        canvas.addEventListener('mousedown', startPosition);
        canvas.addEventListener('mouseup', endPosition);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('touchstart', startPosition);
        canvas.addEventListener('touchend', endPosition);
        canvas.addEventListener('touchmove', draw);
        
        window.PortfolioSimulators.wbClear = () => {
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        window.PortfolioSimulators.wbDownload = () => {
            const link = document.createElement('a');
            link.download = 'Abdul_Zubair_CoupleCanvas_Art.png';
            link.href = canvas.toDataURL();
            link.click();
        };
        window.PortfolioSimulators.wbClear();
    },
    
    // 5. SCIENTIFIC CALCULATOR
    launchCalculator: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="max-width: 320px; margin: 0 auto; background: #0f172a; border: 2px solid #6366f1; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);">
                <h4 style="text-align: center; color: #818cf8; margin-bottom: 12px;">🧮 Precision Expression Calculator</h4>
                <input type="text" id="calc-display" readonly value="0" style="width: 100%; height: 50px; background: #020617; border: 1px solid #334155; border-radius: 8px; color: #38bdf8; font-size: 1.5rem; text-align: right; padding: 10px; margin-bottom: 15px; font-family: monospace;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('C')" style="background: #ef4444; color: white;">C</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('(')">(</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress(')')">)</button>
                    <button class="calc-btn op" onclick="window.PortfolioSimulators.calcPress('/')">÷</button>
                    
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('7')">7</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('8')">8</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('9')">9</button>
                    <button class="calc-btn op" onclick="window.PortfolioSimulators.calcPress('*')">×</button>
                    
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('4')">4</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('5')">5</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('6')">6</button>
                    <button class="calc-btn op" onclick="window.PortfolioSimulators.calcPress('-')">-</button>
                    
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('1')">1</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('2')">2</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('3')">3</button>
                    <button class="calc-btn op" onclick="window.PortfolioSimulators.calcPress('+')">+</button>
                    
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('0')" style="grid-column: span 2;">0</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('.')">.</button>
                    <button class="calc-btn" onclick="window.PortfolioSimulators.calcPress('=')" style="background: #22c55e; color: white;">=</button>
                </div>
            </div>
        `;
        
        let expr = '';
        window.PortfolioSimulators.calcPress = (v) => {
            const d = document.getElementById('calc-display');
            if (v === 'C') { expr = ''; d.value = '0'; return; }
            if (v === '=') {
                try {
                    d.value = eval(expr) || 0;
                    expr = d.value;
                } catch(e) {
                    d.value = 'Error';
                    expr = '';
                }
                return;
            }
            expr += v;
            d.value = expr;
        };
    },
    
    // 6. STOPWATCH & PRECISION TIMER
    launchStopwatch: function(container) {
        this.cleanup();
        container.innerHTML = `
            <div style="text-align: center; color: #fff; max-width: 380px; margin: 0 auto; background: #0f172a; padding: 24px; border-radius: 16px; border: 2px solid #10b981;">
                <h3 style="color: #34d399; margin-bottom: 12px;">⏱️ High-Precision Stopwatch</h3>
                <div id="sw-time" style="font-family: monospace; font-size: 2.8rem; color: #38bdf8; margin: 15px 0;">00:00:00.00</div>
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 18px;">
                    <button id="sw-start-btn" class="btn-action" onclick="window.PortfolioSimulators.swStart()">Start</button>
                    <button class="btn-ctrl" onclick="window.PortfolioSimulators.swLap()">Lap</button>
                    <button class="btn-ctrl" style="background: #ef4444;" onclick="window.PortfolioSimulators.swReset()">Reset</button>
                </div>
                <div id="sw-laps" style="max-height: 140px; overflow-y: auto; text-align: left; font-family: monospace; font-size: 0.9rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 8px;"></div>
            </div>
        `;
        
        let startTime = 0, elapsed = 0, swTimer = null, running = false, lapCount = 0;
        function format(ms) {
            let d = new Date(ms);
            let m = String(d.getUTCMinutes()).padStart(2, '0');
            let s = String(d.getUTCSeconds()).padStart(2, '0');
            let mill = String(Math.floor(d.getUTCMilliseconds() / 10)).padStart(2, '0');
            return `${m}:${s}.${mill}`;
        }
        
        window.PortfolioSimulators.swStart = () => {
            const btn = document.getElementById('sw-start-btn');
            if (!running) {
                startTime = Date.now() - elapsed;
                swTimer = setInterval(() => {
                    elapsed = Date.now() - startTime;
                    document.getElementById('sw-time').innerText = format(elapsed);
                }, 20);
                running = true;
                btn.innerText = 'Pause';
                btn.style.background = '#f59e0b';
            } else {
                clearInterval(swTimer);
                running = false;
                btn.innerText = 'Resume';
                btn.style.background = '#22c55e';
            }
        };
        
        window.PortfolioSimulators.swLap = () => {
            if (!running && elapsed === 0) return;
            lapCount++;
            const lDiv = document.getElementById('sw-laps');
            lDiv.innerHTML = `<div>Lap ${lapCount}: ${format(elapsed)}</div>` + lDiv.innerHTML;
        };
        
        window.PortfolioSimulators.swReset = () => {
            clearInterval(swTimer);
            running = false;
            elapsed = 0;
            lapCount = 0;
            document.getElementById('sw-time').innerText = '00:00:00.00';
            document.getElementById('sw-laps').innerHTML = '';
            const btn = document.getElementById('sw-start-btn');
            btn.innerText = 'Start';
            btn.style.background = '#22c55e';
        };
    },
    
    // 7. AI AGENT TERMINAL CONSOLE
    launchAiTerminal: function(container, projTitle) {
        this.cleanup();
        container.innerHTML = `
            <div style="background: #020617; border: 2px solid #8b5cf6; border-radius: 12px; padding: 18px; font-family: 'Fira Code', monospace; color: #a78bfa; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 12px; font-size: 0.85rem; color: #94a3b8;">
                    <span>🤖 [AI Playground]: ${projTitle}</span>
                    <span>Status: ONLINE 🟢</span>
                </div>
                <div id="ai-log" style="height: 240px; overflow-y: auto; font-size: 0.85rem; line-height: 1.6; color: #e2e8f0; margin-bottom: 12px; background: #030712; padding: 10px; border-radius: 8px; border: 1px solid #1e293b;">
                    <div style="color: #38bdf8;">[INIT] Loading autonomous neural weights... Done.</div>
                    <div style="color: #4ade80;">[AGENT] Connected to tool registry: (Playwright, FFMPEG, Local LLM, Arduino).</div>
                    <div style="color: #facc15;">Type 'help', 'run', 'agent status', or any prompt below:</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="ai-input" placeholder="Type prompt (e.g., 'generate video', 'scan mesh')..." style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 8px 12px; color: #fff; font-family: monospace;" onkeydown="if(event.key==='Enter') window.PortfolioSimulators.aiExec()">
                    <button class="btn-action" onclick="window.PortfolioSimulators.aiExec()">Execute</button>
                </div>
            </div>
        `;
        
        window.PortfolioSimulators.aiExec = () => {
            const inp = document.getElementById('ai-input');
            const log = document.getElementById('ai-log');
            const cmd = inp.value.trim();
            if (!cmd) return;
            log.innerHTML += `<div style="color: #f43f5e;">> ${cmd}</div>`;
            inp.value = '';
            
            setTimeout(() => {
                if (cmd.toLowerCase() === 'help') {
                    log.innerHTML += `<div style="color: #94a3b8;">Commands: run, status, scan, mesh, compile, generate, clear</div>`;
                } else if (cmd.toLowerCase() === 'clear') {
                    log.innerHTML = '';
                } else if (cmd.toLowerCase().includes('status')) {
                    log.innerHTML += `<div style="color: #4ade80;">[SYSTEM] All models active: PyTorch 2.4, VOSK Speech Engine, Playwright Driver active. Memory: 128MB.</div>`;
                } else if (cmd.toLowerCase().includes('video') || cmd.toLowerCase().includes('generate')) {
                    log.innerHTML += `<div style="color: #38bdf8;">[PLAN] Generating short video: Topic parsed -> Voice synthesis (EdgeTTS) -> Subtitle alignment -> Headless FFMPEG render: SUCCESS.</div>`;
                } else {
                    log.innerHTML += `<div style="color: #a855f7;">[AI RESPONSE] "${cmd}" processed successfully via ${projTitle} inference pipeline. Output generated with 0 errors.</div>`;
                }
                log.scrollTop = log.scrollHeight;
            }, 300);
        };
    },
    
    // 8. LIVE ENTERPRISE & ANDROID DASHBOARD SIMULATOR
    launchDashboard: function(container, projTitle, projDesc, githubUrl, apkUrl) {
        this.cleanup();
        let apkButtonHtml = apkUrl ? `<a href="${apkUrl}" download class="btn-action" style="background: #22c55e; margin-right: 8px;">📥 Download Verified APK</a>` : '';
        
        container.innerHTML = `
            <div style="background: #0f172a; border: 2px solid #3b82f6; border-radius: 14px; padding: 20px; color: #fff; max-width: 650px; margin: 0 auto; box-shadow: 0 10px 35px rgba(59, 130, 246, 0.25);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px;">
                    <div>
                        <h3 style="color: #60a5fa; margin: 0;">${projTitle}</h3>
                        <span style="font-size: 0.8rem; color: #94a3b8;">Live Architecture Simulation & Production Specs</span>
                    </div>
                    <span style="background: #1e3a8a; color: #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">LIVE SYSTEM</span>
                </div>
                
                <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; margin-bottom: 18px;">${projDesc}</p>
                
                <div style="background: #020617; border-radius: 10px; padding: 14px; margin-bottom: 18px; border: 1px solid #1e293b;">
                    <div style="font-size: 0.85rem; color: #38bdf8; margin-bottom: 8px; font-weight: bold;">⚡ Live System Diagnostics:</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 0.85rem; text-align: center;">
                        <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                            <div style="color: #94a3b8;">Latency</div>
                            <div style="color: #4ade80; font-weight: bold;">12 ms</div>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                            <div style="color: #94a3b8;">Uptime</div>
                            <div style="color: #38bdf8; font-weight: bold;">99.98%</div>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                            <div style="color: #94a3b8;">Encrypted</div>
                            <div style="color: #a855f7; font-weight: bold;">AES-256 GCM</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;">
                    ${apkButtonHtml}
                    <a href="${githubUrl}" target="_blank" class="btn-action">📂 View Full Source Code on GitHub →</a>
                </div>
            </div>
        `;
    },
    
    cleanup: function() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
            this.currentInterval = null;
        }
    }
};
