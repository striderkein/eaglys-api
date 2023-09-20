const express = require('express');
const sqlite3 = require('sqlite3');
const { Parser } = require('node-sql-parser');

const { hashColumnNames } = require('./util');

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

// APIエンドポイント2: カラム名をハッシュ化し、マップを保存
app.post('/modify-ast', (req, res) => {
  const parser = new Parser();
  const sqlQuery = req.body.sql;
  const ast = parser.astify(sqlQuery);

  // カラム名のハッシュ化とマップの作成
  const columnMap = hashColumnNames(ast);

  console.log(`columnMap: ${JSON.stringify(columnMap)}`)
  // SQLiteデータベースにマップを保存
  db.serialize(() => {
    const stmt = db.prepare("INSERT INTO column_map VALUES (?, ?)");

    for (const entry of columnMap) {
      const original = Object.keys(entry)[0];
      const hashed = entry[original];
      stmt.run(original, hashed);
    }

    stmt.finalize();
    res.json(columnMap);
  });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
