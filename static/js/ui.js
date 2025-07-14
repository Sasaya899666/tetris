// UI管理模組
class UIManager {
    constructor() {
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.statsModal = document.getElementById('statsModal');
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadLeaderboard();
    }
    
    bindEvents() {
        // 排行榜按鈕
        document.getElementById('showLeaderboard').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        // 統計按鈕
        document.getElementById('showStats').addEventListener('click', () => {
            this.showStats();
        });
        
        // 關閉模態框
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });
        
        // 點擊模態框外部關閉
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target);
            }
        });
        
        // 統計查詢
        document.getElementById('searchStats').addEventListener('click', () => {
            this.searchPlayerStats();
        });
        
        // 統計輸入框回車
        document.getElementById('statsPlayerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPlayerStats();
            }
        });
    }
    
    showModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    async showLeaderboard() {
        this.showModal(this.leaderboardModal);
        await this.loadLeaderboard();
    }
    
    async showStats() {
        this.showModal(this.statsModal);
        this.clearStatsResult();
    }
    
    async loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '<div class="loading">載入中...</div>';
        
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div class="message">暫無排行榜數據</div>';
                return;
            }
            
            leaderboardList.innerHTML = '';
            
            leaderboard.forEach((player, index) => {
                const rank = index + 1;
                const item = document.createElement('div');
                item.className = `leaderboard-item rank-${rank}`;
                
                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                
                item.innerHTML = `
                    <div class="rank-info">
                        <div class="rank-number">${rank}</div>
                        <div class="player-name">${this.escapeHtml(player.name)}</div>
                    </div>
                    <div class="score-info">
                        <div class="score-value">${player.score.toLocaleString()}</div>
                        <div class="score-details">
                            等級: ${player.level} | 行數: ${player.lines_cleared}
                        </div>
                    </div>
                `;
                
                leaderboardList.appendChild(item);
            });
            
        } catch (error) {
            console.error('載入排行榜失敗:', error);
            leaderboardList.innerHTML = '<div class="message error">載入排行榜失敗</div>';
        }
    }
    
    async searchPlayerStats() {
        const playerName = document.getElementById('statsPlayerName').value.trim();
        const statsResult = document.getElementById('statsResult');
        
        if (!playerName) {
            statsResult.innerHTML = '<div class="message error">請輸入玩家姓名</div>';
            return;
        }
        
        statsResult.innerHTML = '<div class="loading">查詢中...</div>';
        
        try {
            const response = await fetch(`/api/players/stats?name=${encodeURIComponent(playerName)}`);
            const result = await response.json();
            
            if (response.ok) {
                this.displayPlayerStats(result);
            } else {
                statsResult.innerHTML = `<div class="message error">${result.error}</div>`;
            }
        } catch (error) {
            console.error('查詢統計失敗:', error);
            statsResult.innerHTML = '<div class="message error">查詢失敗，請檢查網路連接</div>';
        }
    }
    
    displayPlayerStats(stats) {
        const statsResult = document.getElementById('statsResult');
        
        statsResult.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_games}</div>
                    <div class="stat-label">總遊戲次數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highest_score.toLocaleString()}</div>
                    <div class="stat-label">最高分數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.average_score.toLocaleString()}</div>
                    <div class="stat-label">平均分數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.total_lines.toLocaleString()}</div>
                    <div class="stat-label">總消除行數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highest_level}</div>
                    <div class="stat-label">最高等級</div>
                </div>
            </div>
        `;
    }
    
    clearStatsResult() {
        document.getElementById('statsResult').innerHTML = '';
        document.getElementById('statsPlayerName').value = '';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// 初始化UI管理器
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();
    
    // 導出UI管理器供其他模組使用
    window.uiManager = uiManager;
    
    // 導出刷新排行榜函數供遊戲使用
    window.refreshLeaderboard = () => {
        uiManager.loadLeaderboard();
    };
});