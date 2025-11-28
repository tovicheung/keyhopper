class Game {
    constructor() {
        this.container = document.getElementById("keyboard");
        this.levelDisplay = document.getElementById("level-display");
        this.msgDisplay = document.getElementById("message-display");

        this.currentLevelIdx = 0;
        this.playerPos = null;
        this.chasers = []; // {id, pos, type}
        this.keys = new Map();
        this.isPlayerTurn = true;
        this.gameOver = false;
        this.enemyTurn = true;

        this.init();
    }

    init() {
        this.renderKB();
        this.loadLevel(this.currentLevelIdx);

        window.addEventListener("keydown", (e) => this.handleInput(e));
    }

    renderKB() {
        this.container.innerHTML = "";

        KEYBOARD_LAYOUT.forEach((rowKeys, rowIndex) => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("row");
            rowKeys.forEach((k, colIndex) => {
                const keyEl = document.createElement("div");
                keyEl.classList.add("key");
                keyEl.dataset.key = k;
                keyEl.innerText = KEY_LABELS[k] || k;
                this.keys.set(k, {
                    el: keyEl,
                    row: rowIndex,
                    col: colIndex,
                    char: k,
                });
                rowDiv.appendChild(keyEl);
            });
            this.container.appendChild(rowDiv);
        });
    }

    loadLevel(levelIdx) {
        const level = LEVELS[levelIdx];
        if (!level) return;

        this.level = level;
        this.playerPos = level.startKey;
        this.chasers = level.enemies.map(e => ({ ...e, pos: e.startKey }));
        this.gameOver = false;
        this.isPlayerTurn = true;

        this.msgDisplay.innerText = level.message;
        this.levelDisplay.innerText = `LEVEL ${level.id}`;

        // reset
        this.keys.forEach(k => {
            k.el.className = "key";
            if (level.blockedKeys.includes(k.char)) {
                k.el.classList.add("blocked");
            }
        });

        const target = this.keys.get(level.targetKey);
        if (target) target.el.classList.add("target");

        this.updateVisuals();
    }

    updateVisuals() {
        this.keys.forEach(k => {
            k.el.classList.remove("player", "enemy", "visited", "available");
            if (k.char === this.level.targetKey) k.el.classList.add("target");
        });

        const pKey = this.keys.get(this.playerPos);
        if (pKey) pKey.el.classList.add("player");

        this.chasers.forEach(e => {
            const eKey = this.keys.get(e.pos);
            if (eKey) eKey.el.classList.add("enemy");
        });

        if (this.isPlayerTurn && !this.gameOver) {
            this.keys.forEach(k => {
                if (k.char !== this.playerPos &&
                    !this.level.blockedKeys.includes(k.char) &&
                    this.isAdjacent(this.playerPos, k.char)) {
                    k.el.classList.add("available");
                }
            });
        }
    }

    handleInput(e) {
        if (this.gameOver || !this.isPlayerTurn) return;
        let k = e.key.toUpperCase();
        if (e.code === "Space") k = "Space";
        if (e.key === "Enter") k = "Enter";
        if (e.key === "Backspace") k = "Backspace";
        if (e.key === "Tab") {
            k = "Tab";
            e.preventDefault();
        }
        if (e.key === "CapsLock") k = "CapsLock";
        if (e.key === "Shift") k = e.code; // ShiftLeft or ShiftRight

        if (!this.keys.has(k)) return;

        this.tryMove(k);
    }

    tryMove(target) {
        // check if blocked
        if (this.level.blockedKeys.includes(target)) {
            this.triggerShake(target);
            return;
        }

        // check adjacency
        if (this.isAdjacent(this.playerPos, target)) {
            if (this.chasers.find(c => c.pos === target)) {
                this.triggerShake(target);
                return;
            }
            this.playerPos = target;
            this.checkWinCondition();
            this.endPlayerTurn();
        } else if (this.playerPos !== target) {
            this.triggerShake(target);
        }
    }

    endPlayerTurn() {
        this.updateVisuals();
        
        if (this.gameOver) {
            return;
        }

        if (this.enemyTurn) {
            this.isPlayerTurn = false;
            setTimeout(() => {
                this.processEnemyTurn();
            }, 100);
        }
        this.enemyTurn = !this.enemyTurn; // enemy moves when player moved two times

        if (!this.gameOver) {
            this.isPlayerTurn = true;
        }
    }

    processEnemyTurn() {
        this.chasers.forEach(chaser => {
            const neighbors = this.getNeighbors(chaser.pos);
            let bestMove = chaser.pos;
            let minDist = this.getDistance(chaser.pos, this.playerPos);

            neighbors.forEach(n => {
                if (this.level.blockedKeys.includes(n)) return;
                if (this.chasers.find(e => e !== chaser && e.pos === n)) return;

                const d = this.getDistance(n, this.playerPos);
                if (d < minDist) {
                    minDist = d;
                    bestMove = n;
                }
            });

            chaser.pos = bestMove;
        });

        this.checkCollision();
        this.updateVisuals();
    }

    checkCollision() {
        const caught = this.chasers.some(e => e.pos === this.playerPos);
        if (caught) {
            this.gameOver = true;
            this.msgDisplay.innerText = "GAME OVER PRESS R TO RESTART";
            this.keys.get(this.playerPos).el.classList.add("shake");

            window.addEventListener("keydown", (e) => {
                if (e.key.toLowerCase() === "r") location.reload();
            }, { once: true });
        }
    }

    checkWinCondition() {
        if (this.playerPos === this.level.targetKey) {
            this.gameOver = true;
            this.msgDisplay.innerText = "LEVEL COMPLETE";
            // TODO: next level
        }
    }

    getNeighbors(keyChar) {
        const neighbors = [];
        this.keys.forEach(k => {
            if (k.char !== keyChar && this.isAdjacent(keyChar, k.char)) {
                neighbors.push(k.char);
            }
        });
        return neighbors;
    }

    isAdjacent(current, target) {
        const k1 = this.keys.get(current);
        const k2 = this.keys.get(target);
        if (!k1 || !k2) return false;

        if (k1.row == k2.row && Math.abs(k1.col - k2.col) == 1) return true;
        if (Math.abs(k1.row - k2.row) == 1) {
            if (k1.row < k2.row) {
                return 0 <= k1.col - k2.col && k1.col - k2.col <= 1;
            } else {
                return 0 <= k2.col - k1.col && k2.col - k1.col <= 1;
            }
        }
        return false;
    }

    getDistance(k1Char, k2Char) {
        const k1 = this.keys.get(k1Char);
        const k2 = this.keys.get(k2Char);
        if (!k1 || !k2) return 999999;

        const getVisualX = (k) => {
            const rowOffsets = [0, 1.5, 1.8, 2.3, 3.5];
            return k.col + rowOffsets[k.row];
        };

        const x1 = getVisualX(k1);
        const x2 = getVisualX(k2);

        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(k1.row - k2.row, 2));
    }

    triggerShake(keyChar) {
        const k = this.keys.get(keyChar);
        if (k) {
            k.el.classList.add("shake");
            setTimeout(() => k.el.classList.remove("shake"), 400);
        }
    }
}

window.onload = () => {
    new Game();
};
