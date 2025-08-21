#!/bin/bash

# 開発サーバー起動スクリプト（組織内共有用）

echo "🚀 開発サーバーを起動します"

# 現在のIPアドレスを取得
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo "📍 あなたのIPアドレス: $IP_ADDRESS"

# フロントエンドサーバーを起動（バックグラウンド）
echo "🎨 フロントエンドサーバーを起動中..."
cd frontend
BROWSER=none HOST=0.0.0.0 npm start &
FRONTEND_PID=$!

# 少し待つ
sleep 3

# バックエンドサーバーを起動
echo "🔧 バックエンドサーバーを起動中..."
cd ../backend
HOST=0.0.0.0 npm run dev &
BACKEND_PID=$!

echo ""
echo "✅ サーバーが起動しました！"
echo ""
echo "🌐 ローカルアクセス:"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:3000"
echo ""
echo "👥 チーム共有アクセス:"
echo "   フロントエンド: http://${IP_ADDRESS}:3000"
echo "   バックエンドAPI: http://${IP_ADDRESS}:3000"
echo ""
echo "🛑 終了するには Ctrl+C を押してください"

# 終了時にプロセスをクリーンアップ
cleanup() {
    echo "🛑 サーバーを終了しています..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# プロセスが生きている間待機
wait