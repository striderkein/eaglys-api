const crypto = require('crypto');

const hashString = (inputString) => {
  const sha256 = crypto.createHash('sha256');
  sha256.update(inputString);
  return sha256.digest('hex'); // ハッシュ化された文字列を16進数文字列として取得
}

// カラム名をハッシュ化する関数
const hashColumnNames = (node) => {
  const columnMap = [];
  let isUpdate = node?.type === 'update';
  const recursiveHash = (node) => {
    console.log(`isUpdate: ${isUpdate}`)

    if (node) {
      // UPDATE の場合
      if (node.type === 'update') {
        for (const setClause of node.set) {
          const originalColumnName = setClause.column; // setClause.column はカラム名
          const hashedColumnName = hashString(originalColumnName).substring(0, 8); // too long, so truncate
          setClause.column = hashedColumnName;
          columnMap.push({ [originalColumnName]: hashedColumnName });
        }
        for (const key of Object.keys(node.where)) {
          if (key === 'left') {
            const originalColumnName = node.where[key].column;
            const hashedColumnName = hashString(originalColumnName).substring(0, 8); // too long, so truncate
            node.where[key].column = hashedColumnName;
            columnMap.push({ [originalColumnName]: hashedColumnName });
          }
        }
      }

      // UPDATE 以外のクエリの場合
      if (node.type === 'column_ref') {
        console.log(`update のときにも column_ref は見てるよ node: ${JSON.stringify(node)}`)
        if (node.column) {
          const originalColumnName = node.column;
          const hashedColumnName = hashString(originalColumnName).substring(0, 8); // too long, so truncate
          if (!isUpdate) {
            node.column = hashedColumnName;
          }
          columnMap.push({ [originalColumnName]: hashedColumnName });
        }
      }

      for (const prop in node) {
        console.log(`prop: ${prop}`)
        if (node.hasOwnProperty(prop) && typeof node[prop] === 'object') {
          recursiveHash(node[prop]);
        }
      }
    }
  }
  recursiveHash(node);
  return { node, columnMap };
}

module.exports = { hashColumnNames };
