# リマインダー自動実行の設定

## 問題
Vercelの無料プランではCronジョブが制限される場合があります。

## 解決策

### 1. Vercelダッシュボードで確認
1. https://vercel.com/dashboard にログイン
2. プロジェクト「fitness2」を選択
3. Settings → Functions → Crons タブを確認
4. Cronジョブが表示されているか確認

### 2. 外部Cronサービスの使用

#### A. GitHub Actions（推奨）
`.github/workflows/reminder-cron.yml` を作成：

```yaml
name: Daily Reminders Cron
on:
  schedule:
    - cron: '0 * * * *'  # 毎時0分に実行
jobs:
  reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminder API
        run: |
          curl -X GET "https://fitness2-rho.vercel.app/api/cron/daily-reminders"
```

#### B. Uptime Robot
1. https://uptimerobot.com/ にサインアップ
2. Monitor追加：
   - Type: HTTP(s)
   - URL: `https://fitness2-rho.vercel.app/api/cron/daily-reminders`
   - Monitoring Interval: 60分

#### C. Cron-job.org
1. https://cron-job.org/ にサインアップ
2. 新しいCronジョブ作成：
   - URL: `https://fitness2-rho.vercel.app/api/cron/daily-reminders`
   - Schedule: `0 * * * *`

## 確認方法
リマインダーが自動実行されているかは以下で確認：
1. Vercel Function Logs
2. LINEでリマインダーメッセージ受信
3. 管理画面の予約一覧でリマインダー送信状況