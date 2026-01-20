import { ControlPanel } from './controlPanel.js';
import { UIHandlers } from './handlers.js';

export class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.panel = new ControlPanel();
        this.handlers = new UIHandlers(engine, this.panel.elements);
    }

    init() {
        const updateHoverState = () => {
            this.engine.settings.app.isMouseOverUI = this.panel.isMouseOver();
        };

        this.handlers.setup();
    }
}