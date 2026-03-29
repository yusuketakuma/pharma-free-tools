// トークン管理スナップショット取得スクリプト v3
// OpenClawのsession_statusツールから実際のトークンデータを取得

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CONFIG = {
  snapshotFile: '/Users/yusuke/.openclaw/workspace/systems/token-management/token-snapshot.json',
};

// session_statusツールを実行してデータを取得
async function fetchSessionStatus() {
  return new Promise((resolve, reject) => {
    // OpenClawコマンドでsession_statusを実行
    exec('openclaw session_status', (error, stdout, stderr) => {
      if (error) {
        console.error('session_status取得エラー:', stderr);
        reject(error);
        return;
      }

      try {
        // 出力からJSONを解析
        const lines = stdout.split('\n');
        let sessionData = null;
        
        for (const line of lines) {
          if (line.includes('tokensIn') || line.includes('contextSize')) {
            // JSONっぽいデータを抽出
            const jsonMatch = line.match(/\{.*\}/);
            if (jsonMatch) {
              sessionData = JSON.parse(jsonMatch[0]);
              break;
            }
          }
        }

        if (!sessionData) {
          // 出力から数値を抽出
          sessionData = {
            tokensIn: parseInt(stdout.match(/tokensIn:\s*(\d+)/)?.[1] || 0),
            tokensOut: parseInt(stdout.match(/tokensOut:\s*(\d+)/)?.[1] || 0),
            contextSize: parseInt(stdout.match(/contextSize:\s*(\d+)/)?.[1] || 0),
            contextLimit: parseInt(stdout.match(/contextLimit:\s*(\d+)/)?.[1] || 203000),
            cacheHitRate: parseFloat(stdout.match(/cacheHitRate:\s*(\d+\.?\d*)/)?.[1] || 0),
            monthlyUsagePercent: parseFloat(stdout.match(/monthlyUsagePercent:\s*(\d+\.?\d*)/)?.[1] || 0),
            fiveHourRemainingPercent: parseFloat(stdout.match(/fiveHourRemainingPercent:\s*(\d+\.?\d*)/)?.[1] || 100),
          };
        }

        // タイムスタンプを追加
        sessionData.timestamp = new Date().toISOString();
        
        resolve(sessionData);
      } catch (e) {
        console.error('session_status解析エラー:', e);
        reject(e);
      }
    });
  });
}

// スナップショットを保存
async function saveSnapshot() {
  try {
    console.log('session_statusデータを取得中...');
    const sessionData = await fetchSessionStatus();
    
    console.log('取得したデータ:', {
      tokensIn: sessionData.tokensIn,
      tokensOut: sessionData.tokensOut,
      contextSize: sessionData.contextSize,
      contextLimit: sessionData.contextLimit,
      usagePercent: Math.round(sessionData.tokensIn / sessionData.contextLimit * 100),
      remaining: Math.round(sessionData.fiveHourRemainingPercent / 100 * 5 * 10) / 10,
    });
    
    // ファイルに保存
    fs.writeFileSync(CONFIG.snapshotFile, JSON.stringify(sessionData, null, 2));
    console.log(`スナップショットを保存しました: ${CONFIG.snapshotFile}`);
    
    return sessionData;
  } catch (error) {
    console.error('スナップショット保存エラー:', error);
    throw error;
  }
}

// 直接実行
if (require.main === module) {
  saveSnapshot().catch(console.error);
}

module.exports = { saveSnapshot, fetchSessionStatus };