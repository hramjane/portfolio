// Space Collector - ULTRA EDITION
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.touchState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resizeCanvas(), 100));
        window.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.particles = [];
        this.combo = 0;
        this.comboTimer = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.slowMotionActive = false;
        this.slowMotionTimer = 0;
        this.multiplier = 1;
        this.screenShakeIntensity = 0;
        this.floatingTexts = [];
        this.invulnerabilityTimer = 0;
        
        // Player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            speed: 6,
            vx: 0,
            vy: 0,
            rotation: 0
        };
        
        this.stars = [];
        this.asteroids = [];
        this.powerups = [];
        
        this.keys = {};
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.setupTouchControls();
        
        this.spawnStars();
        this.spawnAsteroids();
        this.gameLoop();
    }
    
    resizeCanvas() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const availableWidth = Math.max(280, viewportWidth - 24);
        const availableHeight = Math.max(320, viewportHeight - 260);
        const targetAspect = 4 / 3;
        let width = availableWidth;
        let height = Math.floor(width / targetAspect);

        if (height > availableHeight) {
            height = availableHeight;
            width = Math.floor(height * targetAspect);
        }

        width = Math.min(width, 800);
        height = Math.min(height, 600);

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.player) {
            this.player.x = Math.min(this.player.x, this.canvas.width - 20);
            this.player.y = Math.min(this.player.y, this.canvas.height - 20);
        }
    }

    setupTouchControls() {
        document.querySelectorAll('.touch-btn').forEach(button => {
            const key = button.dataset.key;
            const press = (event) => {
                event.preventDefault();
                button.classList.add('active');
                this.keys[key] = true;
                if (key === 'Space') {
                    this.paused = !this.paused;
                }
            };

            const release = (event) => {
                event.preventDefault();
                button.classList.remove('active');
                if (key !== 'Space') {
                    this.keys[key] = false;
                }
            };

            button.addEventListener('pointerdown', press);
            button.addEventListener('pointerup', release);
            button.addEventListener('pointercancel', release);
            button.addEventListener('pointerleave', release);
        });
    }
    
    handleKeyDown(e) {
        if (e.key.startsWith('Arrow') || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
        this.keys[e.key] = true;
        if (e.key === 'Spacebar') {
            this.keys.Space = true;
        }
        if (e.key === ' ') {
            this.paused = !this.paused;
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
        if (e.key === 'Spacebar') {
            this.keys.Space = false;
        }
    }
    
    spawnStars() {
        const starCount = 3 + this.level;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: Math.random() * (this.canvas.height / 2 - 40) + 20,
                radius: 10,
                collected: false,
                rotation: 0
            });
        }
    }
    
    spawnAsteroids() {
        const asteroidCount = 3 + Math.floor(this.level * 1.5);
        for (let i = 0; i < asteroidCount; i++) {
            this.asteroids.push({
                x: Math.random() * this.canvas.width,
                y: -50,
                radius: 15 + Math.random() * 10,
                speed: 2 + (this.level * 0.5),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                vx: (Math.random() - 0.5) * 2
            });
        }
    }
    
    spawnPowerup(x, y) {
        const types = ['shield', 'slowmo', 'multiplier'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
            x: x,
            y: y,
            type: type,
            radius: 12,
            vx: (Math.random() - 0.5) * 4,
            vy: 2,
            rotation: 0
        });
    }
    
    updatePlayer() {
        const upPressed = this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.touchState.ArrowUp;
        const downPressed = this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'] || this.touchState.ArrowDown;
        const leftPressed = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'] || this.touchState.ArrowLeft;
        const rightPressed = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'] || this.touchState.ArrowRight;

        if (upPressed) {
            this.player.vy = -this.player.speed;
        } else if (downPressed) {
            this.player.vy = this.player.speed;
        } else {
            this.player.vy = 0;
        }
        
        if (leftPressed) {
            this.player.vx = -this.player.speed;
            this.player.rotation = -0.3;
        } else if (rightPressed) {
            this.player.vx = this.player.speed;
            this.player.rotation = 0.3;
        } else {
            this.player.vx = 0;
            this.player.rotation *= 0.9;
        }
        
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        if (this.player.x < 20) this.player.x = 20;
        if (this.player.x + 20 > this.canvas.width) this.player.x = this.canvas.width - 20;
        if (this.player.y < 20) this.player.y = 20;
        if (this.player.y + 20 > this.canvas.height) this.player.y = this.canvas.height - 20;
    }
    
    updateStars() {
        this.stars.forEach(star => star.rotation += 0.05);
        
        this.stars = this.stars.filter(star => {
            if (this.checkCollisionCircles(this.player, star)) {
                this.score += Math.floor(10 * this.level * this.multiplier);
                this.combo++;
                this.comboTimer = 120;
                this.createParticles(star.x, star.y, 'gold', 20);
                this.addFloatingText(star.x, star.y, `+${Math.floor(10 * this.level * this.multiplier)}`, '#ffdd00');
                
                if (Math.random() < 0.2) {
                    this.spawnPowerup(star.x, star.y);
                }
                
                return false;
            }
            return true;
        });
        
        if (this.stars.length === 0) {
            this.levelUp();
        }
    }
    
    updateAsteroids() {
        this.asteroids.forEach(ast => {
            ast.y += ast.speed;
            ast.x += ast.vx;
            ast.rotation += ast.rotationSpeed;
        });
        
        this.asteroids = this.asteroids.filter(asteroid => {
            const distance = Math.hypot(
                this.player.x - asteroid.x,
                this.player.y - asteroid.y
            );
            
            const minDistance = 30 + asteroid.radius;
            
            if (distance < minDistance && this.invulnerabilityTimer <= 0) {
                if (this.shieldActive) {
                    this.shieldActive = false;
                    this.createParticles(this.player.x, this.player.y, 'cyan', 30);
                    this.addFloatingText(this.player.x, this.player.y, 'SHIELD!', '#00ffff');
                } else {
                    this.lives--;
                    this.createParticles(this.player.x, this.player.y, 'red', 40);
                    this.screenShakeIntensity = 15;
                    this.invulnerabilityTimer = 120;
                    this.addFloatingText(this.player.x, this.player.y, '-1 LIFE', '#ff4444');
                }
                return false;
            }
            return asteroid.y < this.canvas.height;
        });
        
        if (this.asteroids.length < 3 + Math.floor(this.level * 1.5)) {
            this.spawnAsteroids();
        }
    }
    
    updatePowerups() {
        this.powerups.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.rotation += 0.1;
            p.vy += 0.1;
        });
        
        this.powerups = this.powerups.filter(powerup => {
            const distance = Math.hypot(
                this.player.x - powerup.x,
                this.player.y - powerup.y
            );
            
            if (distance < 40) {
                this.activatePowerup(powerup.type);
                this.createParticles(powerup.x, powerup.y, 'cyan', 25);
                return false;
            }
            return powerup.y < this.canvas.height;
        });
    }
    
    activatePowerup(type) {
        switch(type) {
            case 'shield':
                this.shieldActive = true;
                this.shieldTimer = 300;
                this.addFloatingText(this.player.x, this.player.y - 40, 'SHIELD!', '#00ffff');
                break;
            case 'slowmo':
                this.slowMotionActive = true;
                this.slowMotionTimer = 180;
                this.addFloatingText(this.player.x, this.player.y - 40, 'SLOW MOTION!', '#ffff00');
                break;
            case 'multiplier':
                this.multiplier = Math.min(this.multiplier + 0.5, 5);
                this.addFloatingText(this.player.x, this.player.y - 40, `x${this.multiplier.toFixed(1)}`, '#ff00ff');
                break;
        }
    }
    
    checkCollisionCircles(rect, circle) {
        const closest = {
            x: Math.max(rect.x - rect.width/2, Math.min(circle.x, rect.x + rect.width/2)),
            y: Math.max(rect.y - rect.height/2, Math.min(circle.y, rect.y + rect.height/2))
        };
        
        const distance = Math.hypot(circle.x - closest.x, circle.y - closest.y);
        return distance < circle.radius + 15;
    }
    
    createParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color
            });
        }
    }
    
    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1,
            vy: -2
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.02;
        });
    }
    
    updateFloatingTexts() {
        this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
        this.floatingTexts.forEach(t => {
            t.y += t.vy;
            t.life -= 0.02;
        });
    }
    
    updateTimers() {
        this.comboTimer--;
        if (this.comboTimer <= 0) this.combo = 0;
        
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
        
        if (this.slowMotionActive) {
            this.slowMotionTimer--;
            if (this.slowMotionTimer <= 0) this.slowMotionActive = false;
        }
        
        if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer--;
        if (this.screenShakeIntensity > 0) this.screenShakeIntensity *= 0.9;
        if (this.multiplier > 1) this.multiplier *= 0.995;
    }
    
    levelUp() {
        this.level++;
        this.multiplier = Math.max(1, this.multiplier - 0.2);
        this.spawnStars();
    }
    
    update() {
        if (this.gameOver || this.paused) return;
        
        this.updatePlayer();
        this.updateStars();
        this.updateAsteroids();
        this.updatePowerups();
        this.updateParticles();
        this.updateFloatingTexts();
        this.updateTimers();
        
        if (this.lives <= 0) {
            this.endGame();
        }
        
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, this.lives));
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        const shakeX = this.screenShakeIntensity * (Math.random() - 0.5);
        const shakeY = this.screenShakeIntensity * (Math.random() - 0.5);
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        
        this.ctx.fillStyle = 'rgba(15, 26, 46, 0.15)';
        this.ctx.fillRect(-shakeX, -shakeY, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 80; i++) {
            const x = (i * 73 + this.level * 10) % this.canvas.width;
            const y = (i * 97) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        this.drawPlayer();
        this.stars.forEach(star => this.drawStar(star));
        this.asteroids.forEach(asteroid => this.drawAsteroid(asteroid));
        this.powerups.forEach(p => this.drawPowerup(p));
        this.particles.forEach(p => this.drawParticle(p));
        this.floatingTexts.forEach(t => this.drawFloatingText(t));
        this.drawUIOverlay();
        
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(-shakeX, -shakeY, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e94560';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        if (this.slowMotionActive) {
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(-shakeX, -shakeY, this.canvas.width, this.canvas.height);
        }

        if (window.innerWidth <= 768) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText('Touch arrows below the game', this.canvas.width / 2, this.canvas.height - 12);
        }
        
        this.ctx.restore();
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.rotation);
        
        if (this.shieldActive) {
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        if (this.invulnerabilityTimer > 0 && this.invulnerabilityTimer % 20 < 10) {
            this.ctx.globalAlpha = 0.5;
        }
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -18);
        this.ctx.lineTo(15, 15);
        this.ctx.lineTo(0, 8);
        this.ctx.lineTo(-15, 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(0, -8, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawStar(star) {
        this.ctx.save();
        this.ctx.translate(star.x, star.y);
        this.ctx.rotate(star.rotation);
        
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.shadowColor = '#ffdd00';
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * star.radius;
            const py = Math.sin(angle) * star.radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawAsteroid(asteroid) {
        this.ctx.save();
        this.ctx.translate(asteroid.x, asteroid.y);
        this.ctx.rotate(asteroid.rotation);
        
        this.ctx.fillStyle = '#666666';
        this.ctx.shadowColor = '#ff6666';
        this.ctx.shadowBlur = 12;
        
        this.ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const r = asteroid.radius + (Math.sin(i * 0.5) * 5);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawPowerup(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        
        const colors = { shield: '#00ffff', slowmo: '#ffff00', multiplier: '#ff00ff' };
        this.ctx.fillStyle = colors[p.type];
        this.ctx.shadowColor = colors[p.type];
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawParticle(p) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        this.ctx.globalAlpha = 1;
    }
    
    drawFloatingText(t) {
        this.ctx.fillStyle = t.color;
        this.ctx.globalAlpha = t.life;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(t.text, t.x, t.y);
        this.ctx.globalAlpha = 1;
    }
    
    drawUIOverlay() {
        if (this.combo > 0) {
            this.ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
            this.ctx.font = `bold ${20 + this.combo * 2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`COMBO x${this.combo}`, this.canvas.width / 2, 20);
        }
        
        if (this.multiplier > 1) {
            this.ctx.fillStyle = `rgba(255, 0, 255, 0.8)`;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`Multiplier: x${this.multiplier.toFixed(1)}`, this.canvas.width - 20, 20);
        }
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('levelReached').textContent = this.level;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new Game();
});
