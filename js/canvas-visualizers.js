/**
 * MR. MECH — HIGH-PERFORMANCE PHYSICAL CANVAS VISUALIZERS
 * Engineered to demonstrate product science interactively at 60 FPS.
 */

class ScentShieldVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.particles = [];
        this.mouse = { x: null, y: null, active: false };
        this.visible = false;
        this.animating = false;
        
        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width > 0) {
            this.init();
        }
        this.setupIntersectionObserver();
        this.setupListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.visible = entry.isIntersecting;
                if (this.visible) {
                    const rect = this.canvas.parentNode.getBoundingClientRect();
                    if (this.width !== rect.width || this.height !== rect.height) {
                        this.init();
                    }
                    if (!this.animating) {
                        this.animating = true;
                        this.animate();
                    }
                } else {
                    this.animating = false;
                }
            });
        }, { threshold: 0.1 });
        observer.observe(this.canvas);
    }

    init() {
        if (!this.resize()) return;
        this.particles = [];
        // Generate static harness nodes
        this.nodes = [];
        const padding = 60;
        const segmentCount = 6;
        for (let i = 0; i <= segmentCount; i++) {
            const progress = i / segmentCount;
            this.nodes.push({
                x: padding + progress * (this.width - padding * 2),
                y: this.height / 2 + Math.sin(progress * Math.PI * 2) * 40,
                radius: 12,
                shieldLevel: 0
            });
        }
    }

    resize() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        return true;
    }

    setupListeners() {
        const getMousePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
            const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const onStart = (e) => {
            this.mouse.active = true;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        };

        const onMove = (e) => {
            if (!this.mouse.active) return;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
            this.spawnShieldParticles(this.mouse.x, this.mouse.y);
        };

        const onEnd = () => {
            this.mouse.active = false;
            this.mouse.x = null;
            this.mouse.y = null;
        };

        this.canvas.addEventListener('mousedown', onStart);
        this.canvas.addEventListener('mousemove', onMove);
        this.canvas.addEventListener('mouseup', onEnd);
        this.canvas.addEventListener('mouseleave', onEnd);

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(e); }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
        this.canvas.addEventListener('touchend', onEnd);

        window.addEventListener('resize', () => this.init());
    }

    spawnShieldParticles(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                alpha: 1.0,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.4 ? '#d11a2a' : '#ff2b3d'
            });
        }
    }

    animate() {
        if (!this.visible || !this.animating) {
            this.animating = false;
            return;
        }
        if (this.width === 0 || this.height === 0) {
            this.animating = false;
            return;
        }

        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Grid Background
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw Wire Harness segments
        this.ctx.lineWidth = 14;
        this.ctx.strokeStyle = '#1b1b1b';
        this.ctx.beginPath();
        this.ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
        for (let i = 1; i < this.nodes.length; i++) {
            this.ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
        }
        this.ctx.stroke();

        // Inner Core wire (copper color indicator)
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#d47a2a';
        this.ctx.beginPath();
        this.ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
        for (let i = 1; i < this.nodes.length; i++) {
            this.ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
        }
        this.ctx.stroke();

        // Update active shield level on nodes based on mouse proximity
        this.nodes.forEach(node => {
            if (this.mouse.active && this.mouse.x !== null) {
                const dist = Math.hypot(node.x - this.mouse.x, node.y - this.mouse.y);
                if (dist < 80) {
                    node.shieldLevel = Math.min(100, node.shieldLevel + 2.5);
                }
            }
            // Decays slowly over time
            node.shieldLevel = Math.max(0, node.shieldLevel - 0.2);

            // Draw Active Shield Heatmap Glow
            if (node.shieldLevel > 0) {
                const grad = this.ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, 35 + (node.shieldLevel * 0.45));
                grad.addColorStop(0, `rgba(209, 26, 42, ${node.shieldLevel * 0.006})`);
                grad.addColorStop(0.5, `rgba(209, 26, 42, ${node.shieldLevel * 0.002})`);
                grad.addColorStop(1, 'rgba(209, 26, 42, 0)');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, 35 + (node.shieldLevel * 0.45), 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw shield active bounds
        this.ctx.lineWidth = 20;
        this.ctx.strokeStyle = 'rgba(209, 26, 42, 0.03)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
        for (let i = 1; i < this.nodes.length; i++) {
            this.ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
        }
        this.ctx.stroke();

        // Update & Render particles
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.015;
            if (p.alpha <= 0) {
                this.particles.splice(idx, 1);
                return;
            }
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Calculate average shield level
        const avgShield = Math.round(this.nodes.reduce((acc, n) => acc + n.shieldLevel, 0) / this.nodes.length);

        // Technical Telemetry Overlay
        this.ctx.font = "10px 'JetBrains Mono'";
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText("TEST STATUS: WIRE HARNESS PROTECTION ANALYSIS", 20, 30);
        this.ctx.fillText(`PROTECTION LEVEL: ${avgShield}%`, 20, 48);
        this.ctx.fillText(`COATED SURFACE AREA: ${avgShield}%`, 20, 66);
        this.ctx.fillText(`BARRIER AGENT: NATURAL EUCALYPTUS & PEPPERMINT COATING`, 20, 84);

        // Interactive Red Indicator Dot
        if (avgShield > 10) {
            this.ctx.fillStyle = '#ff2b3d';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fillText("PROTECTED", this.width - 105, 30);
        } else {
            this.ctx.fillStyle = '#6e6e73';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillText("UNPROTECTED", this.width - 110, 30);
        }

        requestAnimationFrame(() => this.animate());
    }
}

class FoamVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.grime = [];
        this.foam = [];
        this.mouse = { x: null, y: null, active: false };
        this.visible = false;
        this.animating = false;

        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width > 0) {
            this.init();
        }
        this.setupIntersectionObserver();
        this.setupListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.visible = entry.isIntersecting;
                if (this.visible) {
                    const rect = this.canvas.parentNode.getBoundingClientRect();
                    if (this.width !== rect.width || this.height !== rect.height) {
                        this.init();
                    }
                    if (!this.animating) {
                        this.animating = true;
                        this.animate();
                    }
                } else {
                    this.animating = false;
                }
            });
        }, { threshold: 0.1 });
        observer.observe(this.canvas);
    }

    init() {
        if (!this.resize()) return;
        this.grime = [];
        this.foam = [];
        // Generate uniform dirt patches
        const rows = 12;
        const cols = 15;
        const cellW = this.width / cols;
        const cellH = this.height / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.grime.push({
                    x: c * cellW + Math.random() * 20,
                    y: r * cellH + Math.random() * 20,
                    size: Math.random() * 5 + 3,
                    alpha: Math.random() * 0.4 + 0.3,
                    cleaned: 0 // Progress of being dissolved
                });
            }
        }
    }

    resize() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        return true;
    }

    setupListeners() {
        const getMousePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
            const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const onStart = (e) => {
            this.mouse.active = true;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        };

        const onMove = (e) => {
            if (!this.mouse.active) return;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
            this.spawnFoam(this.mouse.x, this.mouse.y);
            this.cleanGrime(this.mouse.x, this.mouse.y);
        };

        const onEnd = () => {
            this.mouse.active = false;
            this.mouse.x = null;
            this.mouse.y = null;
        };

        this.canvas.addEventListener('mousedown', onStart);
        this.canvas.addEventListener('mousemove', onMove);
        this.canvas.addEventListener('mouseup', onEnd);
        this.canvas.addEventListener('mouseleave', onEnd);

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(e); }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
        this.canvas.addEventListener('touchend', onEnd);

        window.addEventListener('resize', () => this.init());
    }

    spawnFoam(x, y) {
        for (let i = 0; i < 4; i++) {
            this.foam.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                radius: Math.random() * 4 + 2,
                maxRadius: Math.random() * 15 + 8,
                alpha: 1.0,
                growthSpeed: Math.random() * 0.3 + 0.2,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8
            });
        }
    }

    cleanGrime(mx, my) {
        this.grime.forEach(g => {
            const dist = Math.hypot(g.x - mx, g.y - my);
            if (dist < 45) {
                g.cleaned = Math.min(1.0, g.cleaned + 0.08);
            }
        });
    }    animate() {
        if (!this.visible || !this.animating) {
            this.animating = false;
            return;
        }
        if (this.width === 0 || this.height === 0) {
            this.animating = false;
            return;
        }

        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Leather Texture (simulated luxury stitched lines)
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#1b1b1b';
        this.ctx.beginPath();
        this.ctx.moveTo(35, 0);
        this.ctx.lineTo(35, this.height);
        this.ctx.moveTo(this.width - 35, 0);
        this.ctx.lineTo(this.width - 35, this.height);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#222';
        this.ctx.setLineDash([4, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(35, 0);
        this.ctx.lineTo(35, this.height);
        this.ctx.moveTo(this.width - 35, 0);
        this.ctx.lineTo(this.width - 35, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Render Grime Particles
        this.grime.forEach(g => {
            if (g.cleaned < 1.0) {
                this.ctx.fillStyle = `rgba(87, 72, 60, ${g.alpha * (1.0 - g.cleaned)})`;
                this.ctx.beginPath();
                this.ctx.arc(g.x, g.y, g.size * (1.0 - g.cleaned * 0.6), 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Shiny spot indicators for clean areas
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
                this.ctx.beginPath();
                this.ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Update & Render Foam bubbles
        this.foam.forEach((f, idx) => {
            f.x += f.vx;
            f.y += f.vy;
            f.radius += f.growthSpeed;
            if (f.radius >= f.maxRadius) {
                f.alpha -= 0.025;
            }
            if (f.alpha <= 0) {
                this.foam.splice(idx, 1);
                return;
            }

            this.ctx.save();
            this.ctx.globalAlpha = f.alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = '#e5e5e5';
            this.ctx.lineWidth = 1;
            
            // Render beautiful soft cellular foam spheres
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Bubble highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(f.x - f.radius * 0.3, f.y - f.radius * 0.3, f.radius * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Telemetry
        const cleanedCount = this.grime.filter(g => g.cleaned >= 1.0).length;
        const percentCleaned = Math.round((cleanedCount / this.grime.length) * 100);

        this.ctx.font = "10px 'JetBrains Mono'";
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText("TEST STATUS: CELLULAR FOAM LIFT ANALYSIS", 20, 30);
        this.ctx.fillText(`SURFACE RESTORATION: ${percentCleaned}%`, 20, 48);
        this.ctx.fillText(`STAIN REMOVAL LEVEL: ${percentCleaned > 90 ? 'OPTIMAL' : 'SCRUBBING'}`, 20, 66);
        this.ctx.fillText(`MOISTURE RATING: SAFE (QUICK-DRY ACTION)`, 20, 84);

        if (percentCleaned > 90) {
            this.ctx.fillStyle = '#2e7d32';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fillText("RESTORED", this.width - 100, 30);
        } else {
            this.ctx.fillStyle = '#d11a2a';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillText("STAINED", this.width - 85, 30);
        }

        requestAnimationFrame(() => this.animate());
    }
}

class ChainVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.grime = [];
        this.sparks = [];
        this.mouse = { x: null, y: null, active: false };
        this.chainOffset = 0;
        this.solventActive = false;
        this.visible = false;
        this.animating = false;

        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width > 0) {
            this.init();
        }
        this.setupIntersectionObserver();
        this.setupListeners();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.visible = entry.isIntersecting;
                if (this.visible) {
                    const rect = this.canvas.parentNode.getBoundingClientRect();
                    if (this.width !== rect.width || this.height !== rect.height) {
                        this.init();
                    }
                    if (!this.animating) {
                        this.animating = true;
                        this.animate();
                    }
                } else {
                    this.animating = false;
                }
            });
        }, { threshold: 0.1 });
        observer.observe(this.canvas);
    }

    init() {
        if (!this.resize()) return;
        this.grime = [];
        this.sparks = [];
        // Generate chain links along the path
        this.links = [];
        const linkCount = 8;
        const linkWidth = 70;
        for (let i = 0; i < linkCount; i++) {
            this.links.push({
                x: i * linkWidth - 30,
                grimeLevel: 100
            });
        }
    }

    resize() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        return true;
    }

    setupListeners() {
        const getMousePos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
            const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const onStart = (e) => {
            this.mouse.active = true;
            this.solventActive = true;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        };

        const onMove = (e) => {
            if (!this.mouse.active) return;
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        };

        const onEnd = () => {
            this.mouse.active = false;
            this.solventActive = false;
            this.mouse.x = null;
            this.mouse.y = null;
        };

        this.canvas.addEventListener('mousedown', onStart);
        this.canvas.addEventListener('mousemove', onMove);
        this.canvas.addEventListener('mouseup', onEnd);
        this.canvas.addEventListener('mouseleave', onEnd);

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(e); }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
        this.canvas.addEventListener('touchend', onEnd);

        window.addEventListener('resize', () => this.init());
    }

    spawnSolventSparks(x, y) {
        for (let i = 0; i < 4; i++) {
            this.sparks.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.2) * 5 + 2,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.4 ? '#ffffff' : '#d11a2a',
                alpha: 1.0,
                gravity: 0.15
            });
        }
    }

    animate() {
        if (!this.visible || !this.animating) {
            this.animating = false;
            return;
        }
        if (this.width === 0 || this.height === 0) {
            this.animating = false;
            return;
        }

        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
        this.ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Draw Chain Sprocket (blurred silhouette on the left)
        this.ctx.strokeStyle = '#151515';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.arc(-20, this.height / 2, 90, 0, Math.PI * 2);
        this.ctx.stroke();

        // Increment chain motion when solvent is active
        if (this.solventActive) {
            this.chainOffset = (this.chainOffset + 2) % 70;
            if (this.mouse.x !== null) {
                this.spawnSolventSparks(this.mouse.x, this.mouse.y);
            }
        }

        // Render links
        const linkWidth = 70;
        this.links.forEach(l => {
            let cx = l.x + this.chainOffset;
            if (cx > this.width) {
                l.x = -linkWidth;
                cx = l.x + this.chainOffset;
                l.grimeLevel = 100; // Recycled links are dirty again
            }

            const cy = this.height / 2;

            // Dissolve grime under mouse solvent spray
            if (this.solventActive && this.mouse.x !== null) {
                const dist = Math.hypot(cx - this.mouse.x, cy - this.mouse.y);
                if (dist < 55) {
                    l.grimeLevel = Math.max(0, l.grimeLevel - 4);
                }
            }

            // Draw chain roller pin
            this.ctx.fillStyle = '#222';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            this.ctx.fill();

            // Link steel plate render
            this.ctx.save();
            const grad = this.ctx.createLinearGradient(cx - 30, cy, cx + 30, cy);
            if (l.grimeLevel > 20) {
                grad.addColorStop(0, '#1a1817');
                grad.addColorStop(1, '#0e0e0d');
            } else {
                grad.addColorStop(0, '#8e8e93');
                grad.addColorStop(0.5, '#e5e5e5');
                grad.addColorStop(1, '#48484a');
            }

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.roundRect(cx - 30, cy - 8, 60, 16, 8);
            this.ctx.fill();

            // Draw link pin core
            this.ctx.fillStyle = l.grimeLevel > 20 ? '#111' : '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(cx - 16, cy, 5, 0, Math.PI * 2);
            this.ctx.arc(cx + 16, cy, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            // Draw O-ring seal highlight (Performance red element showing safety)
            this.ctx.strokeStyle = l.grimeLevel > 20 ? '#3a1111' : 'rgba(209, 26, 42, 0.85)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(cx - 16, cy, 9, 0, Math.PI * 2);
            this.ctx.arc(cx + 16, cy, 9, 0, Math.PI * 2);
            this.ctx.stroke();

            // Overlay grime layer
            if (l.grimeLevel > 5) {
                this.ctx.fillStyle = `rgba(18, 14, 11, ${l.grimeLevel * 0.0085})`;
                this.ctx.beginPath();
                this.ctx.roundRect(cx - 28, cy - 7, 56, 14, 7);
                this.ctx.fill();
            }
        });

        // Draw solvent spray nozzle stream
        if (this.solventActive && this.mouse.x !== null && this.mouse.y !== null) {
            // Nozzle stream gradient
            const streamGrad = this.ctx.createLinearGradient(this.mouse.x, this.mouse.y - 120, this.mouse.x, this.mouse.y);
            streamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            streamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            streamGrad.addColorStop(1, 'rgba(209, 26, 42, 0.8)');

            this.ctx.strokeStyle = streamGrad;
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y - 120);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.stroke();

            // Draw direct pressure hit impact splash
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Render sparks/droplet splashes
        this.sparks.forEach((s, idx) => {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += s.gravity;
            s.alpha -= 0.03;
            if (s.alpha <= 0) {
                this.sparks.splice(idx, 1);
                return;
            }
            this.ctx.save();
            this.ctx.globalAlpha = s.alpha;
            this.ctx.fillStyle = s.color;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Calculate average link grime level
        const avgGrime = Math.round(this.links.reduce((acc, l) => acc + l.grimeLevel, 0) / this.links.length);

        // Monospace telemetry overlay
        this.ctx.font = "10px 'JetBrains Mono'";
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText("TEST STATUS: DRIVECHAIN DEGREASING ANALYSIS", 20, 30);
        this.ctx.fillText(`GRIME REMOVAL: ${100 - avgGrime}%`, 20, 48);
        this.ctx.fillText(`O-RING INTEGRITY: 100% (SAFE MODE)`, 20, 66);
        this.ctx.fillText(`SOLVENT DENSITY: ${this.solventActive ? 'HIGH-PRESSURE SPRAY' : 'STANDBY'}`, 20, 84);

        if (this.solventActive) {
            this.ctx.fillStyle = '#ff2b3d';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fillText("CLEANING", this.width - 110, 30);
        } else {
            this.ctx.fillStyle = '#6e6e73';
            this.ctx.beginPath();
            this.ctx.arc(this.width - 30, 26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillText("STANDBY", this.width - 90, 30);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Global visualizer handles
document.addEventListener('DOMContentLoaded', () => {
    window.ScentShield = new ScentShieldVisualizer('canvas-scent-shield');
    window.FoamScrubber = new FoamVisualizer('canvas-micro-foam');
    window.ChainScrubber = new ChainVisualizer('canvas-chain-cleaner');
    
    // Tab switching support to redraw/re-initialize canvas to prevent dimensional distortions
    const tabButtons = document.querySelectorAll('.lab-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                if (window.ScentShield) window.ScentShield.init();
                if (window.FoamScrubber) window.FoamScrubber.init();
                if (window.ChainScrubber) window.ChainScrubber.init();
            }, 100);
        });
    });
});
