/**
 * Google Apps Script - 予約データ自動同期
 * 予約完了時にGoogle Sheetsに自動書き込み
 */

// スプレッドシートIDを設定
const SPREADSHEET_ID = '1fE2aimUZu7yGyswe5rGau27ehxuYnY85pI37x13b0Q4';

/**
 * GET リクエスト処理（デバッグ用）
 */
function doGet(e) {
  console.log('📋 GET リクエスト受信:', e);
  return createResponse(true, 'GAS Webhook は正常に動作しています', {
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

/**
 * 予約データWebhook受信処理
 * 予約完了時にNext.jsアプリから呼び出される
 */
function doPost(e) {
  try {
    console.log('📝 予約データWebhook受信:', e);
    
    // リクエストデータの取得方法を改善
    let data;
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('リクエストデータが取得できません');
    }
    
    console.log('解析済みデータ:', data);
    const { reservationData } = data;
    
    console.log('📊 予約データ詳細:', JSON.stringify(reservationData));
    
    if (!reservationData) {
      return createResponse(false, '予約データが見つかりません');
    }
    
    // Google Sheetsに書き込み
    const result = writeToSheet(reservationData);
    
    return createResponse(result.success, result.message, result.data);
    
  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    return createResponse(false, `エラー: ${error.message}`);
  }
}

/**
 * Google Sheetsに予約データを書き込み
 */
function writeToSheet(reservationData) {
  try {
    console.log('📊 Google Sheets書き込み開始:', reservationData);
    
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // 書き込みデータを準備（B列から開始）
    // スプレッドシートの列構成:
    // B: 体験日, C: 体験プログラム, D: 名前（漢字）, E: 名前（カタカナ）, F: 電話番号
    const { 
      experienceDate, 
      programName, 
      timeSlot,
      customerNameKanji,
      customerNameKatakana,
      phone,
      start_time,
      end_time
    } = reservationData;
    
    // プログラム名と時間を結合してC列に記録
    // timeSlotが無効な場合はstart_timeとend_timeから生成を試行
    let finalTimeSlot = timeSlot;
    if (!timeSlot || timeSlot.includes('undefined')) {
      if (start_time && end_time) {
        finalTimeSlot = `${start_time.slice(0, 5)}-${end_time.slice(0, 5)}`;
      }
    }
    
    const programWithTime = finalTimeSlot ? `${programName} (${finalTimeSlot})` : programName;
    
    // スプレッドシートの列に合わせたデータ配列
    const rowData = [
      experienceDate,      // B列: 体験日
      programWithTime,     // C列: 体験プログラム（時間付き）
      customerNameKanji || reservationData.customerName || '', // D列: 名前（漢字）
      customerNameKatakana || '',  // E列: 名前（カタカナ）
      phone || ''          // F列: 電話番号
    ];
    
    // 書き込み成功後のLINE通知用データを準備
    const writeResultData = {
      reservationDateTime: new Date().toLocaleString('ja-JP'),
      experienceDate: experienceDate,
      start_time: start_time,
      end_time: end_time,
      experienceProgram: programName,
      nameKanji: customerNameKanji || reservationData.customerName || '',
      nameKatakana: customerNameKatakana || '',
      phoneNumber: phone || ''
    };
    
    console.log('書き込みデータ:', rowData);
    console.log('📊 時間情報確認:', {
      originalTimeSlot: timeSlot,
      start_time: start_time,
      end_time: end_time,
      finalTimeSlot: finalTimeSlot,
      programWithTime: programWithTime
    });
    
    // 最後の行の次に追加
    const lastRow = sheet.getLastRow();
    const targetRow = Math.max(lastRow + 1, 5); // 最低でも5行目から開始
    
    // B列からF列に書き込み
    const range = sheet.getRange(targetRow, 2, 1, 5); // B列(2)から5列分
    range.setValues([rowData]);
    
    console.log('✅ Google Sheets書き込み完了:', `行${targetRow}に追加`);
    
    return {
      success: true,
      message: `Google Sheetsに書き込み完了（行${targetRow}）`,
      rowNumber: targetRow,
      recordId: `R${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
      sheetName: sheet.getName(),
      data: writeResultData
    };
    
  } catch (error) {
    console.error('❌ Google Sheets書き込みエラー:', error);
    return {
      success: false,
      message: `書き込みエラー: ${error.message}`
    };
  }
}

/**
 * テスト用関数（手動実行用）
 */
function testSheetWrite() {
  const testData = {
    experienceDate: '2025/7/6',
    programName: 'ピラティス',
    timeSlot: '10:00-11:00',
    customerNameKanji: 'テスト太郎',
    customerNameKatakana: 'テストタロウ',
    phone: '090-1234-5678',
    start_time: '10:00:00',
    end_time: '11:00:00'
  };
  
  const result = writeToSheet(testData);
  console.log('テスト結果:', result);
  return result;
}

/**
 * APIからの定期同期処理（1時間毎実行用）
 */
function syncPendingReservations() {
  try {
    console.log('🔄 定期同期処理開始');
    
    // Next.jsアプリの未同期データ取得API呼び出し
    const apiUrl = 'https://fitness2-rho.vercel.app/api/reservations/pending-sync';
    
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`API呼び出し失敗: ${response.getResponseCode()}`);
    }
    
    const pendingData = JSON.parse(response.getContentText());
    console.log('未同期データ:', pendingData);
    
    if (!pendingData.success || !pendingData.reservations || pendingData.reservations.length === 0) {
      console.log('同期対象データなし');
      return { success: true, message: '同期対象データなし' };
    }
    
    // 各予約データをGoogle Sheetsに書き込み
    let successCount = 0;
    for (const reservation of pendingData.reservations) {
      const result = writeToSheet(reservation);
      if (result.success) {
        successCount++;
        
        // 同期完了をAPIに通知
        markAsSynced(reservation.id);
      }
    }
    
    console.log(`✅ 定期同期完了: ${successCount}/${pendingData.reservations.length}件`);
    return {
      success: true,
      message: `${successCount}件の予約データを同期しました`
    };
    
  } catch (error) {
    console.error('❌ 定期同期エラー:', error);
    return {
      success: false,
      message: `定期同期エラー: ${error.message}`
    };
  }
}

/**
 * 同期完了フラグを更新
 */
function markAsSynced(reservationId) {
  try {
    const apiUrl = `https://fitness2-rho.vercel.app/api/reservations/${reservationId}/mark-synced`;
    
    UrlFetchApp.fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('同期フラグ更新エラー:', error);
  }
}

/**
 * レスポンス作成ヘルパー
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 定期実行トリガーを設定（初回のみ実行）
 */
function setupTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncPendingReservations') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 1時間毎の定期実行トリガーを作成
  ScriptApp.newTrigger('syncPendingReservations')
    .timeBased()
    .everyHours(1)
    .create();
    
  console.log('✅ 1時間毎の定期実行トリガーを設定しました');
}