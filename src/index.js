import { Engine } from './core/engine.js';
import { UIManager } from './ui/UIManager.js';

async function main() {
    console.log("Iniciando Aplicação...");

    try {
        const engine = new Engine();
        const ui = new UIManager(engine);

        ui.init();
        await engine.init();

        console.log("Aplicação rodando!");
    } catch (err) {
        console.error("Erro fatal na inicialização:", err);
    }
}

window.addEventListener('DOMContentLoaded', main);