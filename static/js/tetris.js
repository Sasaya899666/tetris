// 俄羅斯方塊遊戲核心邏輯
class TetrisGame {
    constructor() {
        console.log('開始初始化遊戲...');
        
        this.canvas = document.getElementById('tetris');
        if (!this.canvas) {
            throw new Error('找不到遊戲畫布元素');
        }
        this.context = this.canvas.getContext('2d');
        
        this.previewCanvas = document.getElementById('preview');
        if (!this.previewCanvas) {
            throw new Error('找不到預覽畫布元素');
        }
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        console.log('畫布元素找到，設置縮放...');
        
        // 設置畫布縮放
        this.context.scale(15, 15);
        this.previewCtx.scale(20, 20);
        
        // 遊戲狀態
        this.arena = this.createMatrix(20, 10);
        this.player = {
            pos: {x: 0, y: 0},
            matrix: null,
            next: null
        };
        
        // 遊戲變數
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.highscore = localStorage.getItem('tetrisHighscore') || 0;
        this.gameStartTime = 0;
        this.gameDuration = 0;
        
        // 方塊顏色
        this.colors = [
            null,
            '#ff0d72', '#0dc2ff', '#0dff72', '#f538ff', '#ff8e0d', '#ffe138', '#3877ff'
        ];
        
        // 方塊類型
        this.pieces = 'TJLOSZI';
        
        // 初始化遊戲
        this.init();
    }
    
    init() {
        console.log('初始化遊戲狀態...');
        this.updateScore();
        this.playerReset();
        this.drawPreview();
        console.log('遊戲初始化完成');
    }
    
    createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }
    
    createPiece(type) {
        const pieces = {
            'T': [[0,1,0],[1,1,1],[0,0,0]],
            'O': [[2,2],[2,2]],
            'L': [[0,0,3],[3,3,3],[0,0,0]],
            'J': [[4,0,0],[4,4,4],[0,0,0]],
            'I': [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]],
            'S': [[0,6,6],[6,6,0],[0,0,0]],
            'Z': [[7,7,0],[0,7,7],[0,0,0]]
        };
        return pieces[type];
    }
    
    drawMatrix(matrix, offset, ctx) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = this.colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // 添加邊框效果
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }
    
    draw() {
        try {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 繪製網格背景
            this.drawGrid();
            
            // 繪製遊戲區域
            this.drawMatrix(this.arena, {x: 0, y: 0}, this.context);
            this.drawMatrix(this.player.matrix, this.player.pos, this.context);
        } catch (error) {
            console.error('繪製遊戲時發生錯誤:', error);
        }
    }
    
    drawGrid() {
        this.context.strokeStyle = '#333';
        this.context.lineWidth = 0.1;
        
        // 繪製垂直線
        for (let x = 0; x <= 10; x++) {
            this.context.beginPath();
            this.context.moveTo(x, 0);
            this.context.lineTo(x, 20);
            this.context.stroke();
        }
        
        // 繪製水平線
        for (let y = 0; y <= 20; y++) {
            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(10, y);
            this.context.stroke();
        }
    }
    
    drawPreview() {
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        if (this.player.next) {
            this.drawMatrix(this.player.next, {x: 1, y: 1}, this.previewCtx);
        }
    }
    
    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && 
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    playerDrop() {
        this.player.pos.y++;
        if (this.collide(this.arena, this.player)) {
            this.player.pos.y--;
            this.merge(this.arena, this.player);
            this.playerReset();
            this.arenaSweep();
            this.updateScore();
        }
        this.dropCounter = 0;
    }
    
    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.arena, this.player)) {
            this.player.pos.x -= dir;
        }
    }
    
    playerReset() {
        console.log('重置玩家狀態...');
        this.player.matrix = this.player.next || this.createPiece(this.pieces[Math.floor(Math.random() * this.pieces.length)]);
        this.player.next = this.createPiece(this.pieces[Math.floor(Math.random() * this.pieces.length)]);
        this.player.pos.y = 0;
        this.player.pos.x = (this.arena[0].length / 2 | 0) - (this.player.matrix[0].length / 2 | 0);
        
        console.log('玩家位置:', this.player.pos);
        console.log('玩家方塊:', this.player.matrix);
        
        if (this.collide(this.arena, this.player)) {
            console.log('遊戲結束！');
            this.gameOver = true;
            this.endGame();
        }
        this.drawPreview();
    }
    
    playerRotate() {
        const m = this.player.matrix;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
            }
        }
        m.forEach(row => row.reverse());
        
        if (this.collide(this.arena, this.player)) {
            m.forEach(row => row.reverse());
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
                }
            }
        }
    }
    
    arenaSweep() {
        let rowCount = 1;
        let linesCleared = 0;
        
        outer: for (let y = this.arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < this.arena[y].length; ++x) {
                if (this.arena[y][x] === 0) continue outer;
            }
            
            const row = this.arena.splice(y, 1)[0].fill(0);
            this.arena.unshift(row);
            ++y;
            linesCleared++;
            
            // 分數計算：基礎分數 * 等級 * 連鎖倍數
            this.score += rowCount * 100 * this.level;
            rowCount *= 2;
        }
        
        this.lines += linesCleared;
        
        // 等級提升
        if (this.lines >= this.level * 10) {
            this.level++;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
    }
    
    update(time = 0) {
        if (this.paused || this.gameOver) {
            console.log('遊戲暫停或結束，停止更新');
            return;
        }
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.playerDrop();
        }
        
        this.draw();
        requestAnimationFrame((time) => this.update(time));
    }
    
    updateScore() {
        document.getElementById('score').innerText = this.score.toLocaleString();
        document.getElementById('level').innerText = this.level;
        document.getElementById('lines').innerText = this.lines;
        
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('tetrisHighscore', this.highscore);
            document.getElementById('highscore').innerText = this.highscore.toLocaleString();
        }
    }
    
    startGame() {
        console.log('開始遊戲...');
        if (this.gameOver) {
            console.log('遊戲結束狀態，重置遊戲');
            this.resetGame();
        }
        this.paused = false;
        this.gameStartTime = Date.now();
        this.lastTime = 0; // 重置時間
        console.log('開始遊戲循環');
        this.update();
    }
    
    pauseGame() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.update();
        }
    }
    
    resetGame() {
        this.arena = this.createMatrix(20, 10);
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.gameOver = false;
        this.paused = false;
        this.gameStartTime = 0;
        this.gameDuration = 0;
        
        this.playerReset();
        this.updateScore();
        this.update();
    }
    
    endGame() {
        this.gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        // 檢查是否為前10名
        this.checkLeaderboard();
        
        // 顯示遊戲結束畫面
        this.showGameOver();
    }
    
    showGameOver() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const finalScore = document.getElementById('finalScore');
        const nameInputSection = document.getElementById('nameInputSection');
        
        title.innerText = '遊戲結束！';
        finalScore.innerText = this.score.toLocaleString();
        
        // 檢查是否需要輸入姓名
        if (this.score > 0) {
            nameInputSection.style.display = 'block';
            message.innerText = `您的分數: ${this.score.toLocaleString()}`;
        } else {
            nameInputSection.style.display = 'none';
            message.innerText = '遊戲結束！';
        }
        
        overlay.style.display = 'flex';
    }
    
    async checkLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            
            // 檢查是否為前10名
            const isTop10 = leaderboard.length < 10 || this.score > leaderboard[leaderboard.length - 1].score;
            
            if (isTop10) {
                // 顯示姓名輸入
                document.getElementById('nameInputSection').style.display = 'block';
            }
        } catch (error) {
            console.error('檢查排行榜失敗:', error);
        }
    }
    
    async submitScore(playerName) {
        try {
            const response = await fetch('/api/leaderboard/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    score: this.score,
                    level: this.level,
                    lines_cleared: this.lines,
                    game_duration: this.gameDuration
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                // 刷新排行榜
                if (window.refreshLeaderboard) {
                    window.refreshLeaderboard();
                }
            } else {
                alert('提交分數失敗: ' + result.error);
            }
        } catch (error) {
            console.error('提交分數失敗:', error);
            alert('提交分數失敗，請檢查網路連接');
        }
    }
    
    // 鍵盤控制
    handleKeydown(event) {
        if (this.gameOver) return;
        
        switch(event.key) {
            case 'ArrowLeft':
                this.playerMove(-1);
                break;
            case 'ArrowRight':
                this.playerMove(1);
                break;
            case 'ArrowDown':
                this.playerDrop();
                break;
            case 'ArrowUp':
                this.playerRotate();
                break;
            case ' ':
                // 硬降
                while (!this.collide(this.arena, this.player)) {
                    this.player.pos.y++;
                }
                this.player.pos.y--;
                this.merge(this.arena, this.player);
                this.playerReset();
                this.arenaSweep();
                this.updateScore();
                break;
            case 'p':
            case 'P':
                this.pauseGame();
                break;
        }
    }
}

// 初始化遊戲
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM載入完成，初始化遊戲...');
    
    try {
        game = new TetrisGame();
        console.log('遊戲初始化成功');
        
        // 導出遊戲實例供其他模組使用
        window.game = game;
        
        // 鍵盤事件監聽
        document.addEventListener('keydown', (event) => {
            game.handleKeydown(event);
        });
        
        // 按鈕事件
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('開始遊戲按鈕被點擊');
                game.startGame();
            });
        } else {
            console.error('找不到開始遊戲按鈕');
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log('暫停按鈕被點擊');
                game.pauseGame();
            });
        } else {
            console.error('找不到暫停按鈕');
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('重新開始按鈕被點擊');
                game.resetGame();
            });
        } else {
            console.error('找不到重新開始按鈕');
        }
        
        // 提交分數
        const submitScoreBtn = document.getElementById('submitScore');
        if (submitScoreBtn) {
            submitScoreBtn.addEventListener('click', () => {
                const playerName = document.getElementById('playerName').value.trim();
                if (playerName.length >= 2 && playerName.length <= 20) {
                    game.submitScore(playerName);
                    document.getElementById('gameOverlay').style.display = 'none';
                } else {
                    alert('請輸入2-20字元的姓名');
                }
            });
        }
        
        // 重新開始遊戲
        const restartGameBtn = document.getElementById('restartGame');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                document.getElementById('gameOverlay').style.display = 'none';
                game.resetGame();
            });
        }
        
        // 姓名輸入框回車提交
        const playerNameInput = document.getElementById('playerName');
        if (playerNameInput) {
            playerNameInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    document.getElementById('submitScore').click();
                }
            });
        }
        
        console.log('所有事件監聽器設置完成');
        
    } catch (error) {
        console.error('遊戲初始化失敗:', error);
    }
});