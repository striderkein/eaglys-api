# eaglys-api

## setting

```shell
npm i
```

## How to start

```shell
npm start
```

## endpoints

* `/parse-sql`
* `/modify-ast`
* `/rebuild-sql`

### `/parse-sql`

request

```shell
curl -X POST -H 'Content-Type: application/json' -d '{"sql":"SELECT NAME FROM USERS WHERE USER_ID = 1 AND AGE = 10"}' http://localhost:3000/parse-sql
```

response

```json
{
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
          "column": "*"
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
}
```

### `/modify-ast`

request

```shell
curl -X POST -H 'Content-Type: application/json' -d '{"sql":"SELECT NAME FROM USERS WHERE USER_ID = 1 AND AGE = 10"}' http://localhost:3000/modify-ast
```

response

```json
[
  {
    "NAME": "eaa58932"
  },
  {
    "USER_ID": "e5bb97d1"
  },
  {
    "AGE": "ab864bbd"
  }
]
```

### `/rebuild-sql`

request

```shell
curl -H 'Content-Type: application/json' -d @ast.json http://localhost:3000/rebuild-sql
```

`ast.json`

```json
{
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
    }
}
```

response

```json
{
    "query": "SELECT `NAME` FROM `USERS` WHERE `USER_ID` = 1 AND `AGE` = 10"
}
```
