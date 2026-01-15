import { CONSTANTS } from '../config/constants.js';

export class Camera {
    constructor(canvas, settings) {
        this.canvas = canvas;
        
        this.theta  = settings.theta || 0;
        this.phi    = settings.phi || Math.PI / 4;
        this.radius = settings.radius || 10;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initEvents();
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== CONSTANTS.LEFT_BUTTON) return;
            
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.theta  += deltaX * CONSTANTS.MOUSE_ROTATION_SPEED;
            this.phi    -= deltaY * CONSTANTS.MOUSE_ROTATION_SPEED;

            this.phi    = Math.max(CONSTANTS.MIN_PHI, Math.min(CONSTANTS.MAX_PHI, this.phi));
            this.theta  = this.theta % (2 * Math.PI);

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        // Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            const zoomStep = 0.35;
            this.radius += delta * zoomStep;
            this.radius = Math.max(2.0, Math.min(50.0, this.radius));
        }, { passive: false });
    }

    getPosition() {
        const x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.radius * Math.cos(this.phi);
        const z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        return { x, y, z };
    }
}