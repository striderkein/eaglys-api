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
  res.json(node);
});

// APIエンドポイント3: 変更されたASTからSQLを再構築
app.post('/rebuild-sql', (req, res) => {
  try {
    const ast = req.body.ast;

    // SQLiteデータベースからカラムマップを取得
    const columnMap = new Map();
    db.all("SELECT original, hashed FROM column_map", [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      rows.forEach((row) => {
        columnMap.set(row.hashed, row.original);
      });

      // AST内のハッシュ化されたカラム名を元のカラム名に変換
      const revertColumnNames = (node) => {
        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            revertColumnNames(node[key]);
          } else if (key === 'column' && typeof node[key] === 'string') {
            const originalColumnName = columnMap.get(node[key]);
            if (originalColumnName) {
              node[key] = originalColumnName;
            }
          }
        }
      };

      revertColumnNames(ast);

      // ASTからSQLクエリを再構築
      const parser = new Parser();
      const rebuiltSql = parser.sqlify(ast);

      res.json({ query: rebuiltSql });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
