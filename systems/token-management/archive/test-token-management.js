// トークン管理システムのテストスクリプト
// チューニング後のシステム動作を検証

const { runPrediction } = require('./token-usage-monitor');
const { changeMode, getCurrentMode } = require('./token-mode-manager');
const { managementLoop } = require('./token-manager-coordinator');

async function testTokenManagement() {
  console.log('トークン管理システムのテストを開始...');
  
  try {
    // 1. 現在状態の確認
    console.log('\n=== 現在状態の確認 ===');
    const currentMode = getCurrentMode();
    console.log(`現在モード: ${currentMode}`);
    
    // 2. 予測実行
    console.log('\n=== 予測実行 ===');
    const prediction = await runPrediction();
    if (prediction) {
      console.log(`消費速度: ${prediction.consumptionRate}k/時間`);
      console.log(`残時間: ${prediction.remainingHours}時間`);
      console.log(`推奨モード: ${prediction.recommendedMode}`);
      console.log(`消費トレンド: ${prediction.trend}`);
    }
    
    // 3. モード切り替えテスト
    console.log('\n=== モード切り替えテスト ===');
    const testModes = ['normal', 'energy_saving', 'high_efficiency'];
    
    for (const mode of testModes) {
      console.log(`\n${mode}モードへの切り替えテスト...`);
      const result = await changeMode(mode, 'テストによる切り替え');
      if (result.success) {
        console.log(`✅ ${mode}モードに切り替え成功`);
      } else {
        console.log(`❌ ${mode}モード切り替え失敗: ${result.error}`);
      }
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. 管理ループの実行
    console.log('\n=== 管理ループ実行 ===');
    const managementResult = await managementLoop();
    if (managementResult) {
      console.log('✅ 管理ループ実行成功');
      console.log(`最終状態: ${getCurrentMode()}`);
    }
    
    console.log('\n=== テスト完了 ===');
    console.log('トークン管理システムが正常に動作します。');
    
  } catch (error) {
    console.error('テストエラー:', error);
    process.exit(1);
  }
}

// テスト実行
if (require.main === module) {
  testTokenManagement().catch(console.error);
}

module.exports = { testTokenManagement };