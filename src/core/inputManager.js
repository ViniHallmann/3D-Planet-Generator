export class InputManager {
    constructor() {
        this.keys = { 
            w: false, 
            s: false, 
            a: false, 
            d: false,
            c: false
        };
        
        this.observers = [];
        
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                this.notifyObservers(key, true);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });
    }

    isKeyDown(key) {
        return this.keys[key.toLowerCase()];
    }

    onKeyPress(callback) {
        this.observers.push(callback);
    }

    notifyObservers(key, isPressed) {
        this.observers.forEach(cb => cb(key, isPressed));
    }
}