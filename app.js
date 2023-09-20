const express = require('express');
const sqlite3 = require('sqlite3');
const { Parser } = require('node-sql-parser');

const app = express();
const port = 3000;

// SQLiteデータベースをオープン
const db = new sqlite3.Database('columnMap.db');

// テーブルを作成
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS column_map (original TEXT, hashed TEXT)");
});

// ミドルウェア
app.use(express.json());

// APIエンドポイント1: SQLをASTに変換する
app.post('/parse-sql', (req, res) => {
  const parser = new Parser();
  const sqlQuery = req.body.sql;
  const ast = parser.astify(sqlQuery);
  res.status(201).json({ ast });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
