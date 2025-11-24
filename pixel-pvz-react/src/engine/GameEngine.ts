import { Plant, Zombie, Projectile, Sun, PlantType, GameCallbacks } from './types';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private callbacks: GameCallbacks;
    
    // Constants
    private CELL_SIZE = 80;
    private GRID_ROWS = 5;
    private GRID_COLS = 9;
    
    // State
    private isRunning = false;
    private frame = 0;
    private sun = 0;
    private selectedPlant: PlantType | null = null;
    private spawnInterval = 1200;
    private spawnTimer = 0;
    private waveTriggered = false; // Flag for wave 1
    
    // Entities
    private plants: Plant[] = [];
    private zombies: Zombie[] = [];
    private projectiles: Projectile[] = [];
    private suns: Sun[] = [];

    // Inputs
    private mouse = { x: 0, y: 0 };

    constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.callbacks = callbacks;

        // Setup Canvas
        this.canvas.width = this.GRID_COLS * this.CELL_SIZE;
        this.canvas.height = this.GRID_ROWS * this.CELL_SIZE;

        this.attachListeners();
    }

    private attachListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Handle scaling if canvas size != client size
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });
        this.canvas.addEventListener('mousedown', () => {
            this.handleInput();
        });
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.resetState();
        this.animate();
    }

    public stop() {
        this.isRunning = false;
    }

    public setSelectedPlant(type: PlantType | null) {
        this.selectedPlant = type;
    }
    
    public getPlantCost(type: PlantType): number {
         switch(type) {
             case 'sunflower': return 50;
             case 'peashooter': return 100;
             case 'wallnut': return 50;
             case 'chomper': return 150;
             case 'shovel': return 0;
             default: return 0;
         }
    }

    private resetState() {
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.sun = 0;
        this.frame = 0;
        this.spawnInterval = 1200;
        this.spawnTimer = 0;
        this.waveTriggered = false;
        this.callbacks.onSunChange(this.sun);
    }

    private handleInput() {
        if (!this.isRunning) return;

        // 1. Collect Sun
        for (let i = this.suns.length - 1; i >= 0; i--) {
            const s = this.suns[i];
            // Simple circle collision approximation for click
            const dx = this.mouse.x - (s.x + 15);
            const dy = this.mouse.y - (s.y + 15);
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                this.sun += s.value;
                this.callbacks.onSunChange(this.sun);
                this.suns.splice(i, 1);
                return; // Click consumed
            }
        }

        // 2. Place Plant or Use Tool
        if (this.selectedPlant) {
            const gX = this.mouse.x - (this.mouse.x % this.CELL_SIZE);
            const gY = this.mouse.y - (this.mouse.y % this.CELL_SIZE);
            
            // Check bounds
            if (gX < 0 || gX >= this.canvas.width || gY < 0 || gY >= this.canvas.height) return;

            // Check occupancy
            const plantIndex = this.plants.findIndex(p => p.x === gX && p.y === gY);
            const occupied = plantIndex !== -1;
            
            // Shovel Logic
            if (this.selectedPlant === 'shovel') {
                if (occupied) {
                    // Dig up plant
                    this.plants.splice(plantIndex, 1);
                    this.selectedPlant = null;
                    this.callbacks.onPlantPlaced(); // Reset selection UI
                }
                return;
            }

            // Planting Logic
            if (!occupied) {
                const cost = this.getPlantCost(this.selectedPlant);
                if (this.sun >= cost) {
                    this.sun -= cost;
                    this.callbacks.onSunChange(this.sun);
                    this.spawnPlant(gX, gY, this.selectedPlant);
                    
                    // Important: Clear selection in React
                    this.selectedPlant = null; 
                    this.callbacks.onPlantPlaced();
                }
            }
        }
    }

    private spawnPlant(x: number, y: number, type: PlantType) {
        if (type === 'shovel') return;
        let health = 100;
        if (type === 'sunflower') health = 50;
        if (type === 'wallnut') health = 400;
        if (type === 'chomper') health = 100;

        this.plants.push({
            x, y, type, health, maxHealth: health,
            width: this.CELL_SIZE, height: this.CELL_SIZE,
            timer: 0,
            state: type === 'chomper' ? 'idle' : undefined
        });
    }

    private spawnZombie(isWave: boolean) {
        const rowY = Math.floor(Math.random() * this.GRID_ROWS) * this.CELL_SIZE;
        // Normal chance: 30% Conehead
        // Wave chance: 50% Conehead
        const threshold = isWave ? 0.5 : 0.7;
        const isCone = Math.random() > threshold;
        
        this.zombies.push({
            x: this.canvas.width, y: rowY,
            width: this.CELL_SIZE, height: this.CELL_SIZE,
            health: isCone ? 125 : 100, 
            speed: Math.random() * 0.05 + 0.1, 
            movement: 0,
            type: isCone ? 'conehead' : 'normal'
        });
    }

    private update() {
        if (!this.isRunning) return;

        this.frame++;

        // Spawners
        // Zombies
        
        // WAVE LOGIC: 2 Minutes (7200 frames)
        const isWave = this.frame >= 7200;

        // Trigger Massive Wave Once
        if (isWave && !this.waveTriggered) {
             this.waveTriggered = true;
             this.callbacks.onWaveStart(); // Notify UI
             // Spawn 5 zombies instantly
             for(let i=0; i<5; i++) {
                 this.spawnZombie(true); // Force Conehead chance
             }
        }

        // Calculate spawn interval based on time
        // Initial: 1200 frames (20s)
        // Min: 180 frames (3s)
        // Decrease by 5 frames every second (approx 300 frames per minute)
        // Reach max difficulty in about 3.5 - 4 minutes
        let currentInterval = Math.max(180, 1200 - Math.floor((this.frame / 60) * 5));
        
        // Wave Multiplier: 2x Speed (Interval Halved)
        if (isWave) {
            currentInterval = Math.max(90, Math.floor(currentInterval / 2));
        }

        // Better Spawning Logic with Timer
        this.spawnTimer++;
        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.spawnZombie(isWave);
        }

        // Sky Suns
        if (this.frame % 300 === 0) {
            this.suns.push({
                x: Math.random() * (this.canvas.width - 50), y: -50,
                width: 30, height: 30, value: 25, lifeTimer: 0, targetY: Math.random() * (this.canvas.height - 100) + 50
            });
        }

        // Update Entities
        
        // Plants
        this.plants.forEach(p => {
            p.timer++;
            // Sunflower production
            if (p.type === 'sunflower' && p.timer % 1000 === 0) {
                this.suns.push({
                    x: p.x, y: p.y,
                    width: 30, height: 30, value: 25, lifeTimer: 0, targetY: p.y + 20 // Sun stays near
                });
            }
            // Peashooter shooting
            if (p.type === 'peashooter' && p.timer % 100 === 0) {
                // Check lane
                const hasTarget = this.zombies.some(z => z.y === p.y && z.x > p.x);
                if (hasTarget) {
                    this.projectiles.push({
                        x: p.x + 50, y: p.y + 35,
                        width: 10, height: 10, speed: 6, power: 20
                    });
                }
            }
            // Chomper Logic
            if (p.type === 'chomper') {
                if (p.state === 'idle') {
                    // Check for zombies in front (approx 1 cell distance)
                    // Range: [p.x, p.x + 1.5 * CELL_SIZE]
                    const targetZombie = this.zombies.find(z => 
                        z.y === p.y && // Same lane
                        z.x > p.x && // In front
                        z.x < p.x + this.CELL_SIZE * 1.5 // Close enough
                    );

                    if (targetZombie) {
                        targetZombie.health = 0; // Eat (Instant Kill)
                        p.state = 'digesting';
                        p.timer = 0; // Reset timer for digestion
                    }
                } else if (p.state === 'digesting') {
                    // Digesting for 30 seconds (1800 frames approx)
                    // Using timer which increments every frame
                    if (p.timer > 1800) {
                        p.state = 'idle';
                        p.timer = 0;
                    }
                }
            }
        });

        // Zombies
        this.zombies.forEach(z => {
            z.movement = z.speed;
            // Collision with Plants (Eat)
            for (const p of this.plants) {
                // Simple AABB collision for eating logic (when zombie reaches plant)
                if (z.y === p.y && (z.x < p.x + p.width) && (z.x + z.width > p.x)) {
                    z.movement = 0;
                    p.health -= 0.2; // Eating speed
                }
            }
            z.x -= z.movement;
            
            if (z.x < 0) {
                this.isRunning = false;
                this.callbacks.onGameOver();
            }
        });

        // Projectiles
        this.projectiles.forEach(p => {
            p.x += p.speed;
            // Collision Zombie
            for (const z of this.zombies) {
                if (p.x < z.x + z.width && p.x + p.width > z.x && 
                    p.y > z.y && p.y < z.y + z.height) {
                    z.health -= p.power;
                    p.markedForDeletion = true;
                }
            }
            if (p.x > this.canvas.width) p.markedForDeletion = true;
        });

        // Sun
        this.suns.forEach(s => {
            if (s.y < s.targetY) s.y += 1.5;
            s.lifeTimer++;
        });
        this.suns = this.suns.filter(s => s.lifeTimer < 900);

        // Cleanup
        this.plants = this.plants.filter(p => p.health > 0);
        this.zombies = this.zombies.filter(z => z.health > 0);
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid
        for (let y = 0; y < this.GRID_ROWS; y++) {
            for (let x = 0; x < this.GRID_COLS; x++) {
                const isEven = (x + y) % 2 === 0;
                this.ctx.fillStyle = isEven ? '#5D9F46' : '#53933e';
                const px = x * this.CELL_SIZE;
                const py = y * this.CELL_SIZE;
                this.ctx.fillRect(px, py, this.CELL_SIZE, this.CELL_SIZE);
                
                // Hover Highlight (if plant selected)
                if (this.selectedPlant) {
                   const gX = this.mouse.x - (this.mouse.x % this.CELL_SIZE);
                   const gY = this.mouse.y - (this.mouse.y % this.CELL_SIZE);
                   if (px === gX && py === gY) {
                      if (this.selectedPlant === 'shovel') {
                           // Shovel highlight (Red if plant exists, else normal)
                           const hasPlant = this.plants.some(p => p.x === gX && p.y === gY);
                           this.ctx.fillStyle = hasPlant ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                      } else {
                           this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                      }
                      this.ctx.fillRect(gX, gY, this.CELL_SIZE, this.CELL_SIZE);
                   }
                }
            }
        }

        // Draw Plants
        this.plants.forEach(p => {
             const { x, y } = p;
             if (p.type === 'sunflower') {
                this.ctx.fillStyle = '#f6c206'; this.ctx.fillRect(x + 20, y + 20, 40, 40);
                this.ctx.fillStyle = '#6b4e08'; this.ctx.fillRect(x + 30, y + 30, 20, 20);
             } else if (p.type === 'peashooter') {
                this.ctx.fillStyle = '#75d336'; this.ctx.fillRect(x + 20, y + 20, 30, 30);
                this.ctx.fillStyle = '#50a020'; this.ctx.fillRect(x + 50, y + 25, 20, 10);
             } else if (p.type === 'wallnut') {
                this.ctx.fillStyle = '#a0522d'; this.ctx.fillRect(x + 15, y + 15, 50, 50);
             } else if (p.type === 'chomper') {
                // Head
                this.ctx.fillStyle = p.state === 'digesting' ? '#4a148c' : '#7b1fa2'; 
                this.ctx.fillRect(x + 15, y + 10, 50, 50);
                // Mouth/Teeth visual
                this.ctx.fillStyle = '#fff';
                if (p.state === 'idle') {
                    // Open mouth
                     this.ctx.beginPath();
                     this.ctx.moveTo(x + 65, y + 20);
                     this.ctx.lineTo(x + 45, y + 35);
                     this.ctx.lineTo(x + 65, y + 50);
                     this.ctx.fill();
                } else {
                    // Closed mouth (digesting)
                     this.ctx.fillRect(x + 55, y + 30, 10, 10);
                }
             }
             // Health
             if (p.health < p.maxHealth) {
                 this.ctx.fillStyle = 'red';
                 this.ctx.fillRect(x + 10, y + 70, 60 * (p.health / p.maxHealth), 5);
             }
        });

        // Draw Zombies
        this.zombies.forEach(z => {
            this.ctx.fillStyle = z.health > 50 ? '#2e7d32' : '#1b5e20';
            this.ctx.fillRect(z.x + 20, z.y + 10, 40, 60);
            this.ctx.fillStyle = '#000'; // Eyes
            this.ctx.fillRect(z.x + 30, z.y + 20, 5, 5); 
            this.ctx.fillRect(z.x + 45, z.y + 20, 5, 5);
            
            if (z.type === 'conehead') {
                 this.ctx.fillStyle = '#ff9800';
                 this.ctx.beginPath();
                 this.ctx.moveTo(z.x + 25, z.y + 10);
                 this.ctx.lineTo(z.x + 55, z.y + 10);
                 this.ctx.lineTo(z.x + 40, z.y - 20);
                 this.ctx.fill();
            }
        });

        // Draw Projectiles
        this.ctx.fillStyle = '#00ff00';
        this.projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw Suns
        this.suns.forEach(s => {
            this.ctx.save();
            let alpha = 1;
            if (s.lifeTimer > 600) {
                 alpha = 0.5 + 0.5 * Math.sin((s.lifeTimer - 600) * 0.2);
            }
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.arc(s.x + 15, s.y + 15, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'orange';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
        });
    }

    private animate = () => {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(this.animate);
    }
}
