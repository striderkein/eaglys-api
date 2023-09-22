# eaglys-api

## setting

```shell
cp .env.sample .env
# Edit the environment variable 'EAGLYS_API_PORT' to match your own environment.
npm i
```

## How to start

- local
- Docker

### local

```shell
npm start
```

### Docker

```shell
docker-compose up
```

## endpoints

- `/parse-sql`
- `/modify-ast`
- `/rebuild-sql`

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
curl -H 'Content-Type: application/json' -d @ast.json http://localhost:3000/modify-ast
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
}
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

## How to deploy to ECS

### premise

The following items are installed:

- aws-cli
- Docker

### setting environment variable

```shell
REPOSITORY_NAME=eaglys-api
AWS_REGION=<YOUR_REGION>
```

### create Docker image

```shell
docker build -t eaglys-api .
```

### push Docker image to ECR

create repository

```shell
aws ecr create-repository --repository-name eaglys-api --region ${AWS_REGION}
```

response(sample)

```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:ap-northeast-1:xxxxxxxxxxxx:repository/eaglys-api",
        "registryId": "xxxxxxxxxxxx",
        "repositoryName": "eaglys-api",
        "repositoryUri": "xxxxxxxxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/eaglys-api",
        "createdAt": "2023-09-21T15:33:31+09:00",
        "imageTagMutability": "MUTABLE",
        "imageScanningConfiguration": {
            "scanOnPush": false
        },
        "encryptionConfiguration": {
            "encryptionType": "AES256"
        }
    }
}
```

setting `regitryId` as environment variable

```shell
REGISTRY_ID=xxxxxxxxxxxx
```

Docker login and access to ECR repository

```shell
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${REGISTRY_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

response(sample)

```json
Login Succeeded

Logging in with your password grants your terminal complete access to your account. 
For better security, log in with a limited-privilege personal access token. Learn more at https://docs.docker.com/go/access-tokens/
```

attach tag to image, and push to ECR

```shell
docker tag eaglys-api:latest ${REGISTRY_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/eaglys-api:latest
docker push ${REGISTRY_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/eaglys-api:latest
```

confirm push result

```shell
aws ecr list-images --repository-name ${REPOSITORY_NAME} --region ${AWS_REGION}
```

```json
{
    "imageIds": [
        {
            "imageDigest": "sha256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            "imageTag": "latest"
        }
    ]
}
```

