/**
 * Google Apps Script - 予約データ自動同期
 * 予約完了時にGoogle Sheetsに自動書き込み
 */

// スプレッドシートIDを設定
const SPREADSHEET_ID = '1fE2aimUZu7yGyswe5rGau27ehxuYnY85pI37x13b0Q4';

// LINE設定（必要に応じて設定）
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN';
const PERSONAL_LINE_ID = 'YOUR_PERSONAL_LINE_ID_HERE';

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
    
    // リクエストデータの取得
    let reservationData;
    if (e && e.postData && e.postData.contents) {
      reservationData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      reservationData = e.parameter;
    } else {
      throw new Error('リクエストデータが取得できません');
    }
    
    console.log('📊 受信した予約データ:', JSON.stringify(reservationData));
    
    if (!reservationData) {
      return createResponse(false, '予約データが見つかりません');
    }
    
    // 新しいwriteToSpreadsheet関数を使用
    const writeResult = writeToSpreadsheet(reservationData);
    
    if (writeResult.success) {
      // LINE通知の送信
      try {
        console.log('📱 LINE通知処理開始');
        const notificationResult = sendPersonalReservationNotification(reservationData, writeResult);
        console.log('📱 LINE通知結果:', JSON.stringify(notificationResult));
        
        return createResponse(true, 'スプレッドシート書き込みとLINE通知が完了しました', {
          writeResult: writeResult,
          notificationResult: notificationResult
        });
      } catch (notificationError) {
        console.error('❌ LINE通知処理エラー:', notificationError);
        return createResponse(true, 'スプレッドシート書き込み完了、LINE通知エラー', {
          writeResult: writeResult,
          notificationError: notificationError.message
        });
      }
    } else {
      return createResponse(false, writeResult.error || 'スプレッドシート書き込み失敗');
    }
    
  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    return createResponse(false, `エラー: ${error.message}`);
  }
}

// =================================================================
// スプレッドシート書き込み関数（新バージョン）
// =================================================================

function writeToSpreadsheet(reservationData) {
  console.log('📊 スプレッドシート書き込み開始');
  console.log('📊 書き込みデータ:', JSON.stringify(reservationData));
  
  try {
    // スプレッドシートIDを取得
    const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID') || '1fE2aimUZu7yGyswe5rGau27ehxuYnY85pI37x13b0Q4';
    
    if (!SPREADSHEET_ID) {
      console.error('❌ SPREADSHEET_ID が設定されていません');
      return { success: false, error: 'スプレッドシートIDが未設定' };
    }
    
    console.log('📊 スプレッドシートID:', SPREADSHEET_ID);
    
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    console.log('📊 シート名:', sheet.getName());
    
    // 予約IDを生成
    const recordId = 'R' + new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    
    // 書き込むデータを準備
    const dataToWrite = {
      reservationDateTime: reservationData.reservationDateTime || new Date().toLocaleString('ja-JP'),
      experienceDate: reservationData.experienceDate || '',
      timeSlot: reservationData.timeSlot || '',
      start_time: reservationData.start_time || '',
      end_time: reservationData.end_time || '',
      experienceProgram: reservationData.programName || '',
      nameKanji: reservationData.customerNameKanji || '',
      nameKatakana: reservationData.customerNameKatakana || '',
      phoneNumber: reservationData.phone || ''
    };
    
    console.log('📊 書き込み用データ:', JSON.stringify(dataToWrite));
    
    // 次の空行を取得
    const lastRow = sheet.getLastRow();
    const nextRow = lastRow + 1;
    
    console.log('📊 書き込み行:', nextRow);
    
    // 既存のスプレッドシート構造に合わせて書き込み（B列から開始）
    // 既存の列構造: B=体験日, C=体験プログラム(時間付き), D=名前(漢字), E=名前(カタカナ), F=電話番号
    
    // 体験時間を組み合わせ
    const experienceTime = reservationData.timeSlot || 
                          (reservationData.start_time && reservationData.end_time ? 
                           `${reservationData.start_time.slice(0, 5)}-${reservationData.end_time.slice(0, 5)}` : '') ||
                          reservationData.start_time || '';
    
    // プログラム名と時間を結合（既存の形式に合わせる）
    const programWithTime = experienceTime ? `${dataToWrite.experienceProgram} (${experienceTime})` : dataToWrite.experienceProgram;
    
    // データを書き込み（B列からF列に書き込み）
    const rowData = [
      dataToWrite.experienceDate,      // B列: 体験日
      programWithTime,                 // C列: 体験プログラム（時間付き）
      dataToWrite.nameKanji,          // D列: 名前（漢字）
      dataToWrite.nameKatakana,       // E列: 名前（カタカナ）
      dataToWrite.phoneNumber         // F列: 電話番号
    ];
    
    // B列(2)から5列分に書き込み
    sheet.getRange(nextRow, 2, 1, 5).setValues([rowData]);
    
    console.log('✅ スプレッドシート書き込み完了');
    
    const result = {
      success: true,
      rowNumber: nextRow,
      recordId: recordId,
      sheetName: sheet.getName(),
      data: dataToWrite
    };
    
    console.log('📊 書き込み結果:', JSON.stringify(result));
    return result;
    
  } catch (error) {
    console.error('❌ スプレッドシート書き込みエラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Google Sheetsに予約データを書き込み（旧バージョン - 互換性のため残す）
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
    
    const result = {
      success: true,
      message: `Google Sheetsに書き込み完了（行${targetRow}）`,
      rowNumber: targetRow,
      recordId: `R${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
      sheetName: sheet.getName(),
      data: writeResultData
    };
    
    // LINE通知の送信
    try {
      console.log('📱 LINE通知処理開始');
      const notificationResult = sendPersonalReservationNotification(reservationData, result);
      console.log('📱 LINE通知結果:', JSON.stringify(notificationResult));
      result.lineNotification = notificationResult;
    } catch (notificationError) {
      console.error('❌ LINE通知処理エラー:', notificationError);
      result.lineNotificationError = notificationError.message;
    }
    
    return result;
    
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

/**
 * LINE通知関数
 */
function sendLineMessage(lineId, message) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN') {
    console.log('⚠️ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    return { success: false, error: 'LINE設定が不完全です' };
  }
  
  try {
    const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      payload: JSON.stringify({
        to: lineId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });
    
    if (response.getResponseCode() === 200) {
      console.log('✅ LINE通知送信成功');
      return { success: true };
    } else {
      console.error('❌ LINE通知送信失敗:', response.getContentText());
      return { success: false, error: response.getContentText() };
    }
  } catch (error) {
    console.error('❌ LINE通知エラー:', error);
    return { success: false, error: error.message };
  }
}

// =================================================================
// 予約時間対応版：writeResult.dataをそのまま使用するLINE通知関数
// =================================================================

function sendPersonalReservationNotification(reservationData, writeResult) {
  console.log('📱 個人通知送信開始（予約時間対応版）');
  console.log('📱 writeResult:', JSON.stringify(writeResult));
  
  if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN') {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    return { success: false, error: 'LINE設定が不完全です' };
  }
  
  if (!writeResult || !writeResult.success || !writeResult.data) {
    console.error('❌ writeResultが不正です');
    return { success: false, error: 'writeResultが不正です' };
  }
  
  try {
    // writeResult.dataから直接取得（スプレッドシートに書き込まれたのと同じデータ）
    const data = writeResult.data;
    
    console.log('📱 使用するデータ:', JSON.stringify(data));
    
    const customerName = data.nameKanji || '未設定';
    const customerNameKana = data.nameKatakana || '未入力';
    const experienceDate = data.experienceDate || '未設定';
    const startTime = data.start_time || data.startTime || '未設定';  // 開始時間（スネークケース対応）
    const endTime = data.end_time || data.endTime || '未設定';  // 終了時間（スネークケース対応）
    const programName = data.experienceProgram || '未設定';
    const phone = data.phoneNumber || '未登録';
    const reservationDateTime = data.reservationDateTime || '未記録';
    
    // 体験時間の表示形式を作成（HH:MM形式に整形）
    const formatTime = (time) => {
      if (!time || time === '未設定') return time;
      return time.slice(0, 5);  // "HH:MM:SS" -> "HH:MM"
    };
    
    const experienceTimeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    
    console.log('📱 抽出したデータ:');
    console.log('  - 名前（漢字）:', customerName);
    console.log('  - 名前（カタカナ）:', customerNameKana);
    console.log('  - 体験日:', experienceDate);
    console.log('  - 体験時間:', experienceTimeDisplay);
    console.log('  - 体験プログラム:', programName);
    console.log('  - 電話番号:', phone);
    console.log('  - 予約入力日時:', reservationDateTime);
    
    // 個人用通知メッセージ
    const personalMessage = `🎉 新しい予約が入りました！

📋 予約詳細
━━━━━━━━━━━━━━━━━━━━
👤 名前（漢字）: ${customerName}
👤 名前（カタカナ）: ${customerNameKana}
📅 体験日: ${experienceDate}
⏰ 体験時間: ${experienceTimeDisplay}
🏃 体験プログラム: ${programName}
📞 電話番号: ${phone}

🆔 予約ID: ${writeResult.recordId}
📊 行番号: ${writeResult.rowNumber}
📝 受信時刻: ${reservationDateTime}
━━━━━━━━━━━━━━━━━━━━
💼 予約管理システムより自動送信`;

    console.log('📱 作成されたメッセージ:');
    console.log(personalMessage);

    const results = [];
    
    // 個人（管理者）に通知送信
    if (PERSONAL_LINE_ID && PERSONAL_LINE_ID !== 'YOUR_PERSONAL_ID_HERE') {
      try {
        console.log('📱 個人通知送信中...', PERSONAL_LINE_ID);
        const personalResult = sendLineMessage(PERSONAL_LINE_ID, personalMessage);
        results.push({ target: 'personal', result: personalResult });
        console.log('✅ 個人通知送信完了');
      } catch (error) {
        console.error('❌ 個人通知送信失敗:', error);
        results.push({ target: 'personal', error: error.message });
      }
    } else {
      console.log('⚠️ 個人IDが設定されていません');
      results.push({ target: 'personal', error: '個人ID未設定' });
    }
    
    // 顧客確認メッセージ（LINE IDがある場合）
    const customerLineId = reservationData.lineId || reservationData['lineId'] || reservationData.line_id;
    if (customerLineId) {
      console.log('📱 顧客LINE ID検出:', customerLineId);
      const customerMessage = `✅ 予約が完了しました

📋 ご予約内容
━━━━━━━━━━━━━━━━━━━━
👤 お名前: ${customerName}
📅 体験日: ${experienceDate}
⏰ 体験時間: ${experienceTimeDisplay}
🏃 体験プログラム: ${programName}

🆔 予約番号: ${writeResult.recordId}
━━━━━━━━━━━━━━━━━━━━
ご来店をお待ちしております！
ご不明な点がございましたら、お気軽にお声かけください 😊`;

      try {
        const customerResult = sendLineMessage(customerLineId, customerMessage);
        results.push({ target: 'customer', result: customerResult });
        console.log('✅ 顧客確認メッセージ送信完了');
      } catch (error) {
        console.error('❌ 顧客確認メッセージ送信失敗:', error);
        results.push({ target: 'customer', error: error.message });
      }
    } else {
      console.log('📱 顧客LINE IDが見つかりませんでした');
    }
    
    const finalResult = {
      success: true,
      results: results,
      sentCount: results.filter(r => r.result && r.result.success).length,
      usedData: {
        customerName: customerName,
        customerNameKana: customerNameKana,
        experienceDate: experienceDate,
        experienceTime: experienceTimeDisplay,
        startTime: startTime,
        endTime: endTime,
        programName: programName,
        phone: phone
      }
    };
    
    console.log('📱 最終通知結果:', JSON.stringify(finalResult));
    return finalResult;
    
  } catch (error) {
    console.error('❌ 通知処理でエラー:', error);
    console.error('❌ エラー詳細:', error.message);
    return { success: false, error: error.message };
  }
}

// =================================================================
// テスト関数（予約時間を含むwriteResult.dataを使用）
// =================================================================

function testNotificationWithWriteResultData() {
  console.log('🧪 writeResult.dataを使用したテスト開始（予約時間対応版）');
  
  // 実際のwriteResult.dataの構造に基づくテスト
  const testWriteResult = {
    success: true,
    rowNumber: 2,
    recordId: 'R250703192509',
    sheetName: 'シート1',
    data: {
      reservationDateTime: '2025/07/03 19:25:09',
      experienceDate: '2025-06-30',
      start_time: '14:00:00',  // 開始時間（スネークケース）
      end_time: '15:00:00',    // 終了時間（スネークケース）
      experienceProgram: 'ピラティス',
      nameKanji: 'あきやまさよ',
      nameKatakana: 'アキヤマ',
      phoneNumber: '2223'
    }
  };
  
  // reservationDataは空でもOK（writeResult.dataを使用するため）
  const testReservationData = {};
  
  console.log('🧪 テスト用writeResult:', JSON.stringify(testWriteResult));
  
  try {
    const result = sendPersonalReservationNotification(testReservationData, testWriteResult);
    console.log('🧪 テスト結果:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('🧪 テスト失敗:', error);
    return { success: false, error: error.message };
  }
}