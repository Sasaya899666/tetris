from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# 資料庫初始化
def init_db():
    conn = sqlite3.connect('tetris.db')
    cursor = conn.cursor()
    
    # 創建玩家表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 創建分數記錄表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL,
            lines_cleared INTEGER NOT NULL,
            game_duration INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players(id)
        )
    ''')
    
    # 創建排行榜表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            score INTEGER NOT NULL,
            rank_position INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# 初始化資料庫
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    conn = sqlite3.connect('tetris.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.name, s.score, s.level, s.lines_cleared, s.created_at
        FROM scores s
        JOIN players p ON s.player_id = p.id
        ORDER BY s.score DESC
        LIMIT 10
    ''')
    
    leaderboard = []
    for row in cursor.fetchall():
        leaderboard.append({
            'name': row[0],
            'score': row[1],
            'level': row[2],
            'lines_cleared': row[3],
            'created_at': row[4]
        })
    
    conn.close()
    return jsonify(leaderboard)

@app.route('/api/leaderboard/submit', methods=['POST'])
def submit_score():
    data = request.json
    player_name = data.get('player_name', '').strip()
    score = data.get('score', 0)
    level = data.get('level', 1)
    lines_cleared = data.get('lines_cleared', 0)
    game_duration = data.get('game_duration', 0)
    
    if not player_name or len(player_name) < 2 or len(player_name) > 20:
        return jsonify({'error': '玩家姓名必須在2-20字元之間'}), 400
    
    if score <= 0:
        return jsonify({'error': '分數必須大於0'}), 400
    
    conn = sqlite3.connect('tetris.db')
    cursor = conn.cursor()
    
    try:
        # 檢查是否為前10名
        cursor.execute('''
            SELECT COUNT(*) FROM scores 
            WHERE score >= ?
        ''', (score,))
        
        rank = cursor.fetchone()[0] + 1
        
        if rank <= 10:
            # 創建或獲取玩家
            cursor.execute('''
                INSERT OR IGNORE INTO players (name) VALUES (?)
            ''', (player_name,))
            
            cursor.execute('''
                SELECT id FROM players WHERE name = ?
            ''', (player_name,))
            
            player_id = cursor.fetchone()[0]
            
            # 插入分數記錄
            cursor.execute('''
                INSERT INTO scores (player_id, score, level, lines_cleared, game_duration)
                VALUES (?, ?, ?, ?, ?)
            ''', (player_id, score, level, lines_cleared, game_duration))
            
            # 更新排行榜
            cursor.execute('''
                INSERT INTO leaderboard (player_id, score, rank_position)
                VALUES (?, ?, ?)
            ''', (player_id, score, rank))
            
            # 重新排序排行榜
            cursor.execute('''
                DELETE FROM leaderboard
            ''')
            
            cursor.execute('''
                INSERT INTO leaderboard (player_id, score, rank_position)
                SELECT s.player_id, s.score, ROW_NUMBER() OVER (ORDER BY s.score DESC)
                FROM scores s
                ORDER BY s.score DESC
                LIMIT 10
            ''')
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': f'恭喜！您的分數排名第{rank}名！',
                'rank': rank
            })
        else:
            return jsonify({
                'success': True,
                'message': '分數未進入前10名，但已記錄您的遊戲記錄',
                'rank': rank
            })
            
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'提交分數失敗: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/players/stats', methods=['GET'])
def get_player_stats():
    player_name = request.args.get('name', '').strip()
    
    if not player_name:
        return jsonify({'error': '請提供玩家姓名'}), 400
    
    conn = sqlite3.connect('tetris.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total_games,
            MAX(score) as highest_score,
            AVG(score) as average_score,
            SUM(lines_cleared) as total_lines,
            MAX(level) as highest_level
        FROM scores s
        JOIN players p ON s.player_id = p.id
        WHERE p.name = ?
    ''', (player_name,))
    
    row = cursor.fetchone()
    
    if row[0] == 0:
        conn.close()
        return jsonify({'error': '找不到該玩家的記錄'}), 404
    
    stats = {
        'total_games': row[0],
        'highest_score': row[1],
        'average_score': round(row[2], 2),
        'total_lines': row[3],
        'highest_level': row[4]
    }
    
    conn.close()
    return jsonify(stats)

if __name__ == '__main__':
    print("🚀 俄羅斯方塊遊戲啟動中...")
    print("📱 請在瀏覽器中訪問以下地址：")
    print("   - 本地訪問: http://localhost:5000")
    print("   - 網路訪問: http://172.30.0.2:5000")
    print("   - 或嘗試: http://172.17.0.1:5000")
    print("🎮 遊戲已準備就緒！")
    app.run(debug=True, host='0.0.0.0', port=5000)