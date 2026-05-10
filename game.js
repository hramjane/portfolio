// Space Collector Game
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.particles = [];
        
        // Player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 5,
            vx: 0,
            vy: 0
        };
        
        // Game objects
        this.stars = [];
        this.asteroids = [];
        
        // Input handling
        this.keys = {};
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Spawn initial objects
        this.spawnStars();
        this.spawnAsteroids();
        
        // Game loop
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = Math.min(800, window.innerWidth - 40);
        this.canvas.height = 600;
    }
    
    handleKeyDown(e) {
        this.keys[e.key] = true;
        if (e.key === ' ') {
            e.preventDefault();
            this.paused = !this.paused;
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    spawnStars() {
        for (let i = 0; i < 2 + this.level; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                radius: 8,
                collected: false
            });
        }
    }
    
    spawnAsteroids() {
        for (let i = 0; i < 3 + Math.floor(this.level / 2); i++) {
            this.asteroids.push({
                x: Math.random() * this.canvas.width,
                y: -30,
                width: 25,
                height: 25,
                speed: 2 + (this.level * 0.5),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }
    
    updatePlayer() {
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.vy = -this.player.speed;
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.vy = this.player.speed;
        } else {
            this.player.vy = 0;
        }
        
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.vx = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.vx = this.player.speed;
        } else {
            this.player.vx = 0;
        }
        
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Boundary collision
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) 
            this.player.x = this.canvas.width - this.player.width;
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) 
            this.player.y = this.canvas.height - this.player.height;
    }
    
    updateStars() {
        this.stars = this.stars.filter(star => {
            if (this.checkCollision(this.player, star)) {
                this.score += 10 * this.level;
                this.createParticles(star.x, star.y, 'gold');
                return false;
            }
            return true;
        });
        
        if (this.stars.length === 0) {
            this.levelUp();
        }
    }
    
    updateAsteroids() {
        this.asteroids.forEach(asteroid => {
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
        });
        
        this.asteroids = this.asteroids.filter(asteroid => {
            if (this.checkCollision(this.player, asteroid)) {
                this.lives--;
                this.createParticles(this.player.x + 15, this.player.y + 15, 'red');
                this.player.x = this.canvas.width / 2;
                this.player.y = this.canvas.height - 50;
                return false;
            }
            return asteroid.y < this.canvas.height;
        });
        
        if (this.asteroids.length < 3 + Math.floor(this.level / 2)) {
            this.spawnAsteroids();
        }
    }
    
    checkCollision(rect, circle) {
        const closest = {
            x: Math.max(rect.x, Math.min(circle.x, rect.x + rect.width)),
            y: Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))
        };
        
        const distance = Math.sqrt(
            Math.pow(circle.x - closest.x, 2) + Math.pow(circle.y - closest.y, 2)
        );
        
        return distance < circle.radius + 10;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                color: color
            });
        }
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
    
    levelUp() {
        this.level++;
        this.spawnStars();
    }
    
    update() {
        if (this.gameOver || this.paused) return;
        
        this.updatePlayer();
        this.updateStars();
        this.updateAsteroids();
        this.updateParticles();
        
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
        // Clear canvas with stars background
        this.ctx.fillStyle = 'rgba(15, 26, 46, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background stars
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = (i * 97) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw player
        this.ctx.save();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.restore();
        
        // Draw stars
        this.stars.forEach(star => {
            this.drawStar(star.x, star.y, star.radius);
        });
        
        // Draw asteroids
        this.asteroids.forEach(asteroid => {
            this.drawAsteroid(asteroid);
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, 3, 3);
            this.ctx.globalAlpha = 1;
        });
        
        // Draw pause text
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#e94560';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE to continue', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    drawStar(x, y, radius) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.shadowColor = '#ffdd00';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawAsteroid(asteroid) {
        this.ctx.save();
        this.ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        this.ctx.rotate(asteroid.rotation);
        
        this.ctx.fillStyle = '#808080';
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 8;
        
        this.ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const r = asteroid.width / 2 + (Math.random() - 0.5) * 5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
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

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
