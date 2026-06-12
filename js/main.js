/**
 * MR. MECH — INTERFACE TELEMETRY & UI LOGIC
 * Manages scroll-linked header states, tab selectors, mobile drawers, and ambient hero particles.
 */

class AmbientHeroEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 25; // Keep low for fast mobile performance
        this.width = 0;
        this.height = 0;
        this.visible = false;
        this.animating = false;

        this.init();
        this.setupIntersectionObserver();
        window.addEventListener('resize', () => this.init());
    }

    init() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4 - 0.1, // Floating upwards slightly
                color: Math.random() > 0.85 ? '#d11a2a' : 'rgba(255, 255, 255, 0.15)'
            });
        }
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.visible = entry.isIntersecting;
                if (this.visible && !this.animating) {
                    this.animating = true;
                    this.animate();
                } else if (!this.visible) {
                    this.animating = false;
                }
            });
        }, { threshold: 0.1 });
        observer.observe(this.canvas);
    }

    animate() {
        if (!this.visible || !this.animating) {
            this.animating = false;
            return;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Ambient floating indicators
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounces or recycles at boundaries
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0) {
                p.y = this.height;
                p.x = Math.random() * this.width;
            }

            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 0. Preloader Core Logic
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.querySelector('.preloader-bar');
    const body = document.body;

    if (preloader && preloaderBar) {
        // Soft entrance of progress bar
        setTimeout(() => {
            preloaderBar.style.width = '100%';
        }, 100);

        // Hide preloader and trigger home entrance animations after load completes
        setTimeout(() => {
            preloader.classList.add('fade-out');
            body.classList.add('loaded');
        }, 2200);
    } else {
        body.classList.add('loaded');
    }

    // 1. Initialize Hero Ambient particles
    new AmbientHeroEngine('hero-ambient-particles');

    // 2. Glassmorphism Navigation Scroll State
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Mobile Navigation Drawer Switcher
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isActive = nav.classList.toggle('active');
            
            // Toggle body scrolling when nav drawer is active
            if (isActive) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
            
            // Toggle hamburger icon between list and close state
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        
        // Close menu on navigation click
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                body.style.overflow = '';
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });
    }

    // 4. Science Lab Workspace Tab Selection
    const labTabButtons = document.querySelectorAll('.lab-tab-btn');
    const labContentPanes = document.querySelectorAll('.lab-content-pane');
    labTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPaneId = btn.dataset.targetPane;
            
            // Set buttons active
            labTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Swap visible pane
            labContentPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetPaneId) {
                    pane.classList.add('active');
                    
                    // Re-init canvas visualizer when its pane becomes visible, only if not yet fully initialized
                    if (targetPaneId === 'pane-scent-shield' && window.ScentShield && window.ScentShield.width === 0) {
                        window.ScentShield.init();
                    } else if (targetPaneId === 'pane-micro-foam' && window.FoamScrubber && window.FoamScrubber.width === 0) {
                        window.FoamScrubber.init();
                    } else if (targetPaneId === 'pane-chain-solvent' && window.ChainScrubber && window.ChainScrubber.width === 0) {
                        window.ChainScrubber.init();
                    }
                }
            });
        });
    });

    // 5. Technical Data Sheets Specs Panel Selectors
    const specsNavButtons = document.querySelectorAll('.specs-nav-btn');
    const specsPanes = document.querySelectorAll('.specs-pane');
    specsNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSpecsId = btn.dataset.targetSpecs;

            specsNavButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            specsPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetSpecsId) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // 6. Preservation Circle Community Form Submission
    const communityForm = document.getElementById('community-registration-form');
    const successMsg = document.querySelector('.form-success-msg');
    if (communityForm) {
        communityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = communityForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim() !== '') {
                successMsg.textContent = `TRANSMISSION SECURED. ACCESS KEY DISPATCHED TO: ${emailInput.value.toUpperCase()}`;
                successMsg.style.display = 'block';
                emailInput.value = '';
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 5000);
            }
        });
    }

    // 7. Dynamic Navigation Active Indicator on Scroll
    const sections = document.querySelectorAll('section, .hero');
    const navLinks = document.querySelectorAll('nav a');
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        sections.forEach(sec => {
            const sectionTop = sec.offsetTop;
            const sectionHeight = sec.clientHeight;
            if (window.scrollY >= sectionTop - 120) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // 8. Logo Click Soft Reveal Transition
    const logoLinks = document.querySelectorAll('.logo, #logo-top');
    logoLinks.forEach(logoLink => {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (preloader && preloaderBar) {
                // Reset preloader bar width silently
                preloaderBar.style.transition = 'none';
                preloaderBar.style.width = '0%';
                
                // Reset Netflix logo reveal animation triggers
                const logoWrapper = preloader.querySelector('.preloader-logo-wrapper');
                if (logoWrapper) {
                    logoWrapper.style.animation = 'none';
                    void logoWrapper.offsetWidth; // Force a CSS reflow
                    logoWrapper.style.animation = 'netflixLogoReveal 1.8s cubic-bezier(0.77, 0, 0.175, 1) forwards';
                }
                
                // Show preloader overlay
                preloader.classList.remove('fade-out');
                body.classList.remove('loaded');
                
                setTimeout(() => {
                    // Scroll instantly to top
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    
                    // Activate loading animation bar
                    preloaderBar.style.transition = 'width 1.2s cubic-bezier(0.19, 1, 0.22, 1)';
                    preloaderBar.style.width = '100%';
                    
                    // Reveal homepage with soft popup
                    setTimeout(() => {
                        preloader.classList.add('fade-out');
                        body.classList.add('loaded');
                    }, 1400);
                }, 300);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 9. D2C Explore Product Overlay Controller
    const exploreButtons = document.querySelectorAll('.btn-explore-product');
    exploreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const overlay = document.getElementById(`overlay-${productId}`);
            if (overlay) {
                overlay.classList.add('active');
                body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        });
    });

    // Close overlays
    const closeButtons = document.querySelectorAll('.overlay-close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('.product-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                // Only unlock scroll if no other overlays are active
                const activeOverlays = document.querySelectorAll('.product-overlay.active');
                if (activeOverlays.length === 0) {
                    body.style.overflow = '';
                }
            }
        });
    });

    // 10. FAQ Accordion Toggles inside Product overlays
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const faqItem = trigger.closest('.faq-item');
            const panel = faqItem.querySelector('.faq-panel');
            const isActive = faqItem.classList.contains('active');
            
            // Toggle active class on trigger parent
            faqItem.classList.toggle('active');
            
            if (isActive) {
                // If collapse
                panel.style.display = 'none';
            } else {
                // If expand
                panel.style.display = 'block';
            }
        });
    });

    // 11. About Brand sliding drawer Controller
    const aboutTriggers = document.querySelectorAll('.about-trigger');
    const aboutOverlay = document.querySelector('.about-drawer-overlay');
    const aboutCloseBtn = document.querySelector('.about-close-btn');

    if (aboutTriggers && aboutOverlay) {
        aboutTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                aboutOverlay.classList.add('active');
                body.style.overflow = 'hidden';
            });
        });
    }

    if (aboutCloseBtn && aboutOverlay) {
        aboutCloseBtn.addEventListener('click', () => {
            aboutOverlay.classList.remove('active');
            body.style.overflow = '';
        });
        
        aboutOverlay.addEventListener('click', (e) => {
            if (e.target === aboutOverlay) {
                aboutOverlay.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
});
