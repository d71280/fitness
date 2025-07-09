/**
 * Google Apps Script - 予約データ定期ポーリング
 * 5分ごとに予約システムAPIから新規予約を取得してGoogle Sheetsに書き込み
 */

// 設定
const RESERVATION_API_URL = 'https://fitness2-rho.vercel.app/api/reservations/unsynced';
const SPREADSHEET_ID = '1fE2aimUZu7yGyswe5rGqu27ohXnYB5pJ37x13bOQ4';
const LINE_ACCESS_TOKEN = '1SLhTzln1vKVHV3PHuv+L9pSxr2kcVq9RcmjcaYUdIetU9YVNqOpQuQFiNtdos2sWh6h8Td+to7Gi57qI+o9/pHbY7GWOmB1/vTpjL0EhvbVyH0O+0BgnNgGU5NHzm/fQ/4a/af1TQ52GriYS/E1oAdB04t89/1O/w1cDnyilFU=';
const STAFF_GROUP_ID = 'YOUR_GROUP_ID'; // 必要に応じて設定

// メイン処理関数（5分ごとに実行される）
function checkNewReservations() {
  try {
    console.log('新規予約チェック開始:', new Date());
    
    // 最後にチェックした時刻を取得
    const lastCheckTime = getLastCheckTime();
    
    // API から新規予約を取得
    const newReservations = fetchNewReservations(lastCheckTime);
    
    if (newReservations && newReservations.length > 0) {
      console.log(`${newReservations.length}件の新規予約を検出`);
      
      // 各予約を処理
      newReservations.forEach(reservation => {
        processNewReservation(reservation);
      });
      
      // 最終チェック時刻を更新
      updateLastCheckTime();
    } else {
      console.log('新規予約なし');
    }
    
  } catch (error) {
    console.error('予約チェックエラー:', error);
    // エラー通知（LINE設定がある場合）
    if (STAFF_GROUP_ID !== 'YOUR_GROUP_ID') {
      sendErrorNotification(error);
    }
  }
}

// 予約APIから新規データを取得
function fetchNewReservations(lastCheckTime) {
  const url = `${RESERVATION_API_URL}?since=${encodeURIComponent(lastCheckTime)}`;
  
  const options = {
    'method': 'GET',
    'headers': {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.reservations || [];
    } else {
      throw new Error(`API エラー: ${response.getResponseCode()}`);
    }
  } catch (error) {
    console.error('API取得エラー:', error);
    return [];
  }
}

// 新規予約を処理する
function processNewReservation(reservation) {
  try {
    // スプレッドシートに書き込み
    const rowNumber = writeReservationToSheet(reservation);
    
    // 同期完了をAPIに通知
    markAsSynced(reservation.id);
    
    // LINE通知送信（設定がある場合）
    if (STAFF_GROUP_ID !== 'YOUR_GROUP_ID') {
      sendNewReservationNotification(reservation, rowNumber);
    }
    
    console.log(`予約処理完了: ID ${reservation.id}, 行 ${rowNumber}`);
    
  } catch (error) {
    console.error('予約処理エラー:', error);
  }
}

// スプレッドシートに書き込み
function writeReservationToSheet(reservation) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getActiveSheet();
  
  // 予約データからフォーマット
  const schedule = reservation.schedule || {};
  const customer = reservation.customer || {};
  
  const today = new Date().toLocaleDateString('ja-JP');
  const customerName = customer.name ? customer.name.split('(')[0].trim() : '';
  const experienceDate = schedule.date ? new Date(schedule.date).toLocaleDateString('ja-JP') : '';
  const timeSlot = `${schedule.start_time?.slice(0, 5) || '時間未設定'}-${schedule.end_time?.slice(0, 5) || '時間未設定'}`;
  const programName = schedule.program?.name || 'プログラム未設定';
  
  const rowData = [today, customerName, experienceDate, timeSlot, programName];
  
  // 最後の行の次に追加
  const lastRow = sheet.getLastRow();
  const targetRow = Math.max(lastRow + 1, 5); // 最低でも5行目から開始
  
  // B列からF列に書き込み
  const range = sheet.getRange(targetRow, 2, 1, 5); // B列(2)から5列分
  range.setValues([rowData]);
  
  return targetRow;
}

// 同期完了をAPIに通知
function markAsSynced(reservationId) {
  try {
    const url = `https://fitness2-rho.vercel.app/api/reservations/${reservationId}/mark-synced`;
    
    UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`予約ID ${reservationId} を同期済みに更新`);
  } catch (error) {
    console.error('同期フラグ更新エラー:', error);
  }
}

// 最後のチェック時刻を取得
function getLastCheckTime() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const lastCheck = properties.getProperty('LAST_CHECK_TIME');
    
    if (lastCheck) {
      return lastCheck;
    } else {
      // 初回実行時は30分前から
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return thirtyMinutesAgo.toISOString();
    }
  } catch (error) {
    console.error('最終チェック時刻取得エラー:', error);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return oneHourAgo.toISOString();
  }
}

// 最終チェック時刻を更新
function updateLastCheckTime() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('LAST_CHECK_TIME', new Date().toISOString());
  } catch (error) {
    console.error('最終チェック時刻更新エラー:', error);
  }
}

// LINE通知送信
function sendNewReservationNotification(reservation, rowNumber) {
  const schedule = reservation.schedule || {};
  const customer = reservation.customer || {};
  
  const message = `🎉 新しい予約を検出しました！

📋 予約詳細:
・予約ID: ${reservation.id}
・顧客名: ${customer.name || '未設定'}
・プログラム: ${schedule.program?.name || '未設定'}
・予約日時: ${schedule.date} ${schedule.start_time?.slice(0, 5)}-${schedule.end_time?.slice(0, 5)}
・電話: ${customer.phone || '未設定'}

📊 管理情報:
・検出時刻: ${new Date().toLocaleString('ja-JP')}
・行番号: ${rowNumber}
・ステータス: ${reservation.status}`;

  const payload = {
    'to': STAFF_GROUP_ID,
    'messages': [{
      'type': 'text',
      'text': message
    }]
  };
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    },
    'payload': JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
    console.log('LINE通知送信完了');
  } catch (error) {
    console.error('LINE通知エラー:', error);
  }
}

// エラー通知
function sendErrorNotification(error) {
  const message = `⚠️ 予約チェックシステムでエラーが発生しました

エラー内容: ${error.message}
発生時刻: ${new Date().toLocaleString('ja-JP')}

システム管理者に連絡してください。`;

  const payload = {
    'to': STAFF_GROUP_ID,
    'messages': [{
      'type': 'text',
      'text': message
    }]
  };
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
    },
    'payload': JSON.stringify(payload)
  };
  
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  } catch (notificationError) {
    console.error('エラー通知送信失敗:', notificationError);
  }
}

// 時間ベーストリガー設定関数
function setupTimeTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkNewReservations') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // 5分ごとに実行するトリガーを作成
  ScriptApp.newTrigger('checkNewReservations')
    .timeBased()
    .everyMinutes(5)
    .create();
    
  console.log('5分間隔のトリガーを設定しました');
}

// 手動テスト関数
function testReservationCheck() {
  console.log('手動テスト実行...');
  checkNewReservations();
}

// テスト用：サンプルデータ書き込み
function testSheetWrite() {
  const testReservation = {
    id: 999,
    status: 'confirmed',
    schedule: {
      date: '2025-07-02',
      start_time: '10:00:00',
      end_time: '11:00:00',
      program: { name: 'ヨガ' }
    },
    customer: {
      name: '定期ポーリングテスト (テストタロウ)',
      phone: '090-1234-5678'
    }
  };
  
  const rowNumber = writeReservationToSheet(testReservation);
  console.log('テスト書き込み完了: 行', rowNumber);
}