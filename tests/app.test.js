const request = require('supertest');
const app = require('../app');
// const db = require('sqlite3').Database; // これも適切なパスに変更する必要があるかも

// モックを設定
jest.mock('sqlite3', () => {
  return {
    Database: jest.fn(() => {
      return {
        all: jest.fn((sql, params, callback) => {
          // callback(null, [{ original: 'name', hashed: 'hashed_name' }]);
          callback(null, [
            {"original":"NAME","hashed":"eaa58932"},
            {"original":"USER_ID","hashed":"e5bb97d1"},
            {"original":"AGE","hashed":"ab864bbd"},
          ]);
        }),
        serialize: jest.fn((callback) => {
          if (callback) callback();
        }),
        run: jest.fn(),
        prepare: jest.fn(() => {
          return {
            run: jest.fn(),
            finalize: jest.fn(),
          };
        }),
      };
    }),
  };
});

describe('POST /parse-sql', () => {
  it('should parse SQL to AST', async () => {
    const res = await request(app)
      .post('/parse-sql')
      .send({ sql: 'SELECT NAME FROM USERS WHERE USER_ID = 1 AND AGE = 10' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('ast');
  });
});

// エンドポイント2: カラム名をハッシュ化し、マップを保存
describe('POST /modify-ast', () => {
  it('should hash column names and save the map', async () => {
    const astSample = {
      "ast": {
        "with": null,
        "type": "select",
        "options": null,
        "distinct": null,
        "columns": [
            {
                "expr": {
                    "type": "column_ref",
                    "table": null,
                    "column": "NAME"
                },
                "as": null
            }
        ],
        "into": {
            "position": null
        },
        "from": [
            {
                "db": null,
                "table": "USERS",
                "as": null
            }
        ],
        "where": {
            "type": "binary_expr",
            "operator": "AND",
            "left": {
                "type": "binary_expr",
                "operator": "=",
                "left": {
                    "type": "column_ref",
                    "table": null,
                    "column": "USER_ID"
                },
                "right": {
                    "type": "number",
                    "value": 1
                }
            },
            "right": {
                "type": "binary_expr",
                "operator": "=",
                "left": {
                    "type": "column_ref",
                    "table": null,
                    "column": "AGE"
                },
                "right": {
                    "type": "number",
                    "value": 10
                }
            }
        },
        "groupby": null,
        "having": null,
        "orderby": null,
        "limit": null,
        "locking_read": null,
        "window": null
      }
    };
    const res = await request(app)
      .post('/modify-ast')
      .send({ ast: astSample });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('ast');
  });

  it('should hash column names in UPDATE query', async () => {
    const ast = {
      "type": "update",
      "table": [
        {
          "db": null,
          "table": "USERS",
          "as": null
        }
      ],
      "set": [
        {
          "column": "column1",
          "value": {
            "type": "column_ref",
            "table": null,
            "column": "value1"
          },
          "table": null
        }
      ],
      "where": {
        "type": "binary_expr",
        "operator": "=",
        "left": {
          "type": "column_ref",
          "table": null,
          "column": "id"
        },
        "right": {
          "type": "number",
          "value": 1
        }
      },
      "orderby": null,
      "limit": null
    };

    const response = await request(app)
      .post('/modify-ast')
      .send({ ast });

    expect(response.status).toBe(200);
    expect(response.body.ast.set[0].column).not.toBe('column1');
    expect(response.body.ast.set[0].value.column).toBe('value1');
  });

  it('should hash column names in SELECT query', async () => {
    const ast = {
      "type": "select",
      "distinct": null,
      "columns": [
        {
          "expr": {
            "type": "column_ref",
            "table": null,
            "column": "column1"
          },
          "as": null
        },
        {
          "expr": {
            "type": "column_ref",
            "table": null,
            "column": "column2"
          },
          "as": null
        }
      ],
      "from": [
        {
          "db": null,
          "table": "USERS",
          "as": null
        }
      ],
      "where": null,
      "groupby": null,
      "having": null,
      "orderby": null,
      "limit": null
    };

    const response = await request(app)
      .post('/modify-ast')
      .send({ ast });

    expect(response.status).toBe(200);
    expect(response.body.ast.columns[0].expr.column).not.toBe('column1');
    expect(response.body.ast.columns[1].expr.column).not.toBe('column2');
  });
});

// エンドポイント3: 変更されたASTからSQLを再構築
describe('POST /rebuild-sql', () => {
  it('should rebuild SQL from the modified AST', async () => {
    const astSample = {
      "with": null,
      "type": "select",
      "options": null,
      "distinct": null,
      "columns": [
        {
          "expr": {
            "type": "column_ref",
            "table": null,
            "column": "eaa58932"
          },
          "as": null
        }
      ],
      "into": {
        "position": null
      },
      "from": [
        {
          "db": null,
          "table": "USERS",
          "as": null
        }
      ],
      "where": {
        "type": "binary_expr",
        "operator": "AND",
        "left": {
          "type": "binary_expr",
          "operator": "=",
          "left": {
            "type": "column_ref",
            "table": null,
            "column": "e5bb97d1"
          },
          "right": {
            "type": "number",
            "value": 1
          }
        },
        "right": {
          "type": "binary_expr",
          "operator": "=",
          "left": {
            "type": "column_ref",
            "table": null,
            "column": "ab864bbd"
          },
          "right": {
            "type": "number",
            "value": 10
          }
        }
      },
      "groupby": null,
      "having": null,
      "orderby": null,
      "limit": null,
      "locking_read": null,
      "window": null
    };
    const res = await request(app)
      .post('/rebuild-sql')
      .send({ ast: astSample });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('query');
  });
});
