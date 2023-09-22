const express = require('express');
const sqlite3 = require('sqlite3');
const { Parser } = require('node-sql-parser');
const cors = require('cors');

const { hashColumnNames } = require('./util');

const app = express();
app.use(cors());
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
  try {
    const parser = new Parser();
    const sqlQuery = req.body.sql;
    const ast = parser.astify(sqlQuery);
    res.status(201).json({ ast });
  } catch (error) {
    console.error("Parsing Error: ", error);
    res.status(500).json({ error: error.message });
  }
});

// APIエンドポイント2: カラム名をハッシュ化し、マップを保存
app.post('/modify-ast', (req, res) => {
  const ast = req.body.ast;

  // カラム名のハッシュ化とマップの作成
  const hashedResult = hashColumnNames(ast);
  const columnMap = hashedResult.columnMap;
  const node = hashedResult.node;

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
  });
  res.json({ ast: node });
});

// APIエンドポイント3: 変更されたASTからSQLを再構築
app.post('/rebuild-sql', (req, res) => {
  try {
    const ast = req.body.ast;

    // SQLiteデータベースからカラムマップを取得
    const columnMap = new Map();
    db.all("SELECT original, hashed FROM column_map", [], (err, rows) => {
      if (err) {
        throw err;
      }

      rows.forEach((row) => {
        columnMap.set(row.hashed, row.original);
      });

      // ASTからSQLクエリを再構築
      const parser = new Parser();
      const rebuiltSql = parser.sqlify(ast);

      res.json({ query: rebuiltSql });
    });
  } catch (err) {
    console.error("Rebuild Error: ", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;

// サーバーの起動
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
