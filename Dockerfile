# 使用するベースイメージを指定
FROM node:18

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# 依存関係のあるファイルをコピー
COPY package*.json ./

# アプリケーションの依存関係をインストール
RUN npm install

# アプリソースをコピー
COPY . .

# アプリケーションをビルド
# (ビルドスクリプトがある場合に実行)

# アプリケーションを起動
CMD [ "node", "app.js" ]
