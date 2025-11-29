class Game {
    constructor() {
        this.container = document.getElementById("keyboard");
        this.levelDisplay = document.getElementById("level-display");
        this.msgDisplay = document.getElementById("message-display");

        this.currentLevelIdx = 0;
        this.playerPos = null;
        this.enemies = []; // {id, pos, type}
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

        if (this.level && this.level.layout === "split") {
            this.renderSplitKB();
        } else {
            this.renderStandardKB();
        }
    }

    renderStandardKB() {
        KEYBOARD_LAYOUT.forEach((rowKeys, rowIndex) => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("row");
            rowKeys.forEach((k, colIndex) => {
                this.createKeyElement(k, rowIndex, colIndex, rowDiv);
            });
            this.container.appendChild(rowDiv);
        });
    }

    renderSplitKB() {
        const world = document.createElement("div");
        world.id = "world";

        this.level.regions.forEach((regionKeys, regi) => {
            const regionDiv = document.createElement("div");
            regionDiv.classList.add("region");

            const kset = new Set(regionKeys);

            KEYBOARD_LAYOUT.forEach((rowKeys, rowIndex) => {
                const rowDiv = document.createElement("div");
                rowDiv.classList.add("row");
                let hasKeys = false;

                rowKeys.forEach((k, colIndex) => {
                    if (kset.has(k)) {
                        this.createKeyElement(k, rowIndex, colIndex, rowDiv, regi);
                        hasKeys = true;
                    }
                });

                if (hasKeys) regionDiv.appendChild(rowDiv);
            });

            const spaceRow = document.createElement("div");
            spaceRow.classList.add("row");
            const spaceKey = document.createElement("div");
            spaceKey.classList.add("key", "space-split");
            spaceKey.dataset.key = "Space";
            spaceKey.innerText = "Space";

            const spaceId = `Space_${regi}`;
            this.keys.set(spaceId, {
                el: spaceKey,
                row: 99, // special row
                col: 0,
                char: "Space",
                region: regi,
                isSpace: true
            });

            spaceRow.appendChild(spaceKey);
            regionDiv.appendChild(spaceRow);

            world.appendChild(regionDiv);
        });

        this.container.appendChild(world);
        this.updateWorldTransform();
    }

    createKeyElement(k, rowIndex, colIndex, parent, regionIndex = -1) {
        const keyEl = document.createElement("div");
        keyEl.classList.add("key");
        keyEl.dataset.key = k;
        keyEl.innerText = KEY_LABELS[k] || k;

        const keyData = {
            el: keyEl,
            row: rowIndex,
            col: colIndex,
            char: k,
            region: regionIndex
        };

        this.keys.set(k, keyData);
        parent.appendChild(keyEl);
        return keyEl;
    }

    updateWorldTransform() {
        const world = document.getElementById("world");
        if (world) {
            const offset = this.currentRegion === 1 ? -50 : 0;
            world.style.transform = `translateX(${offset}%)`;
        }
    }

    loadLevel(levelIdx) {
        const level = LEVELS[levelIdx];
        if (!level) return;

        this.level = level;
        this.playerPos = level.startKey;
        this.enemies = level.enemies.map(e => ({ ...e, pos: e.startKey }));
        this.gameOver = false;
        this.isPlayerTurn = true;
        this.currentRegion = 0; // default left region

        console.log(this.enemies);

        this.msgDisplay.innerText = level.message ?? "";
        this.levelDisplay.innerText = `LEVEL ${level.id}`;

        this.renderKB();

        // reset
        this.keys.forEach(k => {
            k.el.className = "key";
            if (k.isSpace) k.el.classList.add("space-split");
            if (level.blockedKeys.includes(k.char)) {
                k.el.classList.add("blocked");
            }
        });

        const target = this.keys.get(level.targetKey);
        if (target) target.el.classList.add("target");

        this.startTimedEnemies();
        this.updateVisuals();
    }

    startTimedEnemies() {
        if (this.timedInterval) clearInterval(this.timedInterval);

        const hasTimed = this.enemies.some(e => e.type === "timed");
        if (hasTimed) {
            this.timedInterval = setInterval(() => {
                if (this.gameOver) {
                    clearInterval(this.timedInterval);
                    return;
                }
                this.enemies.filter(e => e.type === "timed").forEach(e => {
                    this.moveEnemy(e);
                });
                this.updateVisuals();
            }, 2000);
        }
    }

    updateVisuals() {
        this.keys.forEach(k => {
            const isSpace = k.isSpace;
            k.el.className = "key";
            if (isSpace) k.el.classList.add("space-split");

            if (k.char === this.level.targetKey) k.el.classList.add("target");
            if (this.level.blockedKeys.includes(k.char)) k.el.classList.add("blocked");
        });

        let pKey = this.keys.get(this.playerPos);
        if (this.playerPos === "Space") {
            pKey = this.keys.get(`Space_${this.currentRegion}`);
        }

        if (pKey) pKey.el.classList.add("player");

        this.enemies.forEach(e => {
            const eKey = this.keys.get(e.pos);
            if (eKey) {
                eKey.el.classList.add("enemy");
                if (e.type) eKey.el.classList.add(e.type);
            }
        });

        if (this.isPlayerTurn && !this.gameOver) {
            this.keys.forEach(k => {
                if (this.level.layout === "split" && k.region !== undefined && k.region !== this.currentRegion) return;

                if (k.char !== this.playerPos &&
                    !this.level.blockedKeys.includes(k.char) &&
                    this.isAdjacent(this.playerPos, k.char)) {

                    if (k.isSpace) {
                        if (k.region === this.currentRegion) k.el.classList.add("available");
                    } else {
                        k.el.classList.add("available");
                    }
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

        if (k === "Space" && this.playerPos === "Space") {
            this.switchRegion();
            return;
        }

        if (k === "Space") {
            if (this.isAdjacent(this.playerPos, "Space")) {
                this.tryMove("Space");
                return;
            }
        }

        if (!this.keys.has(k)) return;

        this.tryMove(k);
    }

    switchRegion() {
        if (this.level.layout !== "split") return;

        this.currentRegion = this.currentRegion === 0 ? 1 : 0;
        this.updateWorldTransform();
        this.updateVisuals();
    }

    tryMove(target) {
        // check if blocked
        if (this.level.blockedKeys.includes(target)) {
            this.triggerShake(target);
            return;
        }

        // check adjacency
        if (this.isAdjacent(this.playerPos, target)) {
            if (this.enemies.find(c => c.pos === target)) {
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
        this.enemyTurn = !this.enemyTurn; // enemy moves when player moved two times6

        if (!this.gameOver) {
            this.isPlayerTurn = true;
        }
    }

    processEnemyTurn() {
        this.enemies.forEach(chaser => {
            if (chaser.type === "timed") return;
            this.moveEnemy(chaser);
        });

        this.updateVisuals();
    }

    getRegionFromKey(key) {
        if (this.level.layout !== "split") return 0;
        return this.level.regions[0].includes(key) ? 0 : 1;
    }

    moveEnemy(enemy) {
        const neighbors = this.getNeighbors(enemy.pos);
        let bestMove = enemy.pos;
        let pos = this.playerPos;
        if (pos === "Space") pos = `Space_${this.currentRegion}`;

        if (this.getRegionFromKey(enemy.pos) !== this.getRegionFromKey(pos)) {
            return;
        }

        if (enemy.type === "random") {
            const validMoves = neighbors.filter(n =>
                !this.level.blockedKeys.includes(n) &&
                !this.enemies.find(e => e !== enemy && e.pos === n) &&
                n !== "Space"
            );
            if (validMoves.length > 0) {
                bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            }
        } else { // default chaser
            let minDist = this.getDistance(enemy.pos, pos);
            neighbors.forEach(n => {
                if (this.level.blockedKeys.includes(n)) return;
                if (this.enemies.find(e => e !== enemy && e.pos === n)) return;
                if (n === "Space") return;

                const d = this.getDistance(n, pos);
                
                console.log(n, d);
                if (d < minDist) {
                    minDist = d;
                    bestMove = n;
                }
            });
        }

        enemy.pos = bestMove;
        this.checkCollision();
        this.updateVisuals();
    }

    checkCollision() {
        const caught = this.enemies.some(e => e.pos === this.playerPos);
        if (caught) {
            this.gameOver = true;
            this.msgDisplay.innerText = "GAME OVER PRESS R TO RESTART";

            let pKey = this.keys.get(this.playerPos);
            if (this.playerPos === "Space") pKey = this.keys.get(`Space_${this.currentRegion}`);

            if (pKey) pKey.el.classList.add("shake");

            let tmp = (e) => {
                if (e.key.toLowerCase() === "r") {
                    this.loadLevel(this.currentLevelIdx);
                    window.removeEventListener("keydown", tmp);
                }
            };

            window.addEventListener("keydown", tmp);
        }
    }

    checkWinCondition() {
        if (this.playerPos === this.level.targetKey) {
            this.gameOver = true;
            this.msgDisplay.innerText = "LEVEL COMPLETE";
            setTimeout(() => {
                this.currentLevelIdx++;
                this.loadLevel(this.currentLevelIdx);
            }, 500);
        }
    }

    getNeighbors(keyChar) {
        const neighbors = [];
        this.keys.forEach(k => {
            if (k.char !== keyChar && this.isAdjacent(keyChar, k.char)) {
                neighbors.push(k.char);
            }
        });
        if (this.isAdjacent(keyChar, "Space")) {
            neighbors.push("Space");
        }
        return neighbors;
    }

    isAdjacent(current, target) {
        if (current === "Space" || target === "Space") {
            const other = current === "Space" ? target : current;
            const otherKey = this.keys.get(other);

            if (!otherKey) return false;

            if (otherKey.row === 3) {
                if (this.level.layout === "split") {
                    return otherKey.region === this.currentRegion;
                }
                return true;
            }
            return false;
        }

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
        
        if (k1Char.startsWith("Space")) {
            return Math.abs(4 - k2.row);
        }
        if (k2Char.startsWith("Space")) {
            return Math.abs(4 - k1.row);
        }
        console.log(k1Char, k2Char);

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
    window.game = new Game();
};
