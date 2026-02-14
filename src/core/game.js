export class Game {
    constructor(state) {
        this.state = state;
        this.gameState = 'idle'; // idle, playing, won, lost
        this.timeRemaining = 60;
        this.targetRings = 10;
        this.updateInterval = null;
    }

    startGame(physics, plane, ringManager) {
        this.gameState = 'playing';
        this.timeRemaining = 60;
        this.state.game.score = 0;
        
        if (!this.state.app.topDownMode) {
            this.state.app.topDownMode = true;
            physics.toggleTopDownMode(plane, this.state.app.topDownMode);
            
            const tooltip = document.getElementById('controls-tooltip');
            if (tooltip) tooltip.classList.add('hidden');
        }

        // Limpar e adicionar anéis
        if (window.clearAllRings) {
            window.clearAllRings();
        }
        
        for (let i = 0; i < this.targetRings; i++) {
            if (window.addRingToScene) {
                window.addRingToScene();
            }
        }

        // Iniciar timer
        this.startTimer();
        this.updateUI();
    }

    startTimer() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(this.updateInterval);
                return;
            }

            this.timeRemaining -= 0.1;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame('lost');
            }

            this.updateUI();
        }, 100);
    }

    checkWinCondition(ringManager) {
        if (this.gameState !== 'playing') return;

        const collectedRings = this.targetRings - ringManager.getActiveCount();
        
        if (collectedRings >= this.targetRings) {
            this.endGame('won');
        }
    }

    endGame(result) {
        this.gameState = result;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.updateUI();
    }

    updateUI() {
        const timerElement = document.getElementById('game-timer');
        const scoreElement = document.getElementById('game-score');
        const targetElement = document.getElementById('game-target');
        const statusElement = document.getElementById('game-status');
        const startBtn = document.getElementById('game-start-btn');
        const restartBtn = document.getElementById('game-restart-btn');

        if (timerElement) {
            timerElement.textContent = `${this.timeRemaining.toFixed(1)}s`;
            
            if (this.timeRemaining <= 10 && this.gameState === 'playing') {
                timerElement.style.color = '#ff4444';
            } else {
                timerElement.style.color = '#4fd1c7';
            }
        }

        if (scoreElement) {
            scoreElement.textContent = `${this.state.game.score}`;
        }

        if (targetElement) {
            targetElement.textContent = `${this.targetRings}`;
        }

        if (statusElement) {
            if (this.gameState === 'won') {
                statusElement.textContent = '🎉 VOCÊ VENCEU!';
                statusElement.style.color = '#00ff00';
                statusElement.style.display = 'block';
            } else if (this.gameState === 'lost') {
                statusElement.textContent = '❌ TEMPO ESGOTADO!';
                statusElement.style.color = '#ff4444';
                statusElement.style.display = 'block';
            } else {
                statusElement.style.display = 'none';
            }
        }

        if (startBtn && restartBtn) {
            if (this.gameState === 'idle') {
                startBtn.style.display = 'block';
                restartBtn.style.display = 'none';
            } else if (this.gameState === 'playing') {
                startBtn.style.display = 'none';
                restartBtn.style.display = 'none';
            } else {
                startBtn.style.display = 'none';
                restartBtn.style.display = 'block';
            }
        }
    }

    reset() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.gameState = 'idle';
        this.timeRemaining = 60;
        this.state.game.score = 0;
        this.updateUI();
    }
}