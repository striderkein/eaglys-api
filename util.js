const crypto = require('crypto');

const hashString = (inputString) => {
  const sha256 = crypto.createHash('sha256');
  sha256.update(inputString);
  return sha256.digest('hex'); // ハッシュ化された文字列を16進数文字列として取得
}

// カラム名をハッシュ化する関数
const hashColumnNames = (node) => {
  const columnMap = [];
  const recursiveHash = (node) => {
    if (node) {
      if (node.type === 'column_ref') {
        if (node.column) {
          const originalColumnName = node.column;
          const hashedColumnName = hashString(originalColumnName).substring(0, 8); // too long, so truncate
          node.column = hashedColumnName;
          // マップに追加 `originalColumnName: hashedColumnName` の形式で
          columnMap.push({ [originalColumnName]: hashedColumnName });
        }
      }

      for (const prop in node) {
        if (node.hasOwnProperty(prop) && typeof node[prop] === 'object') {
          recursiveHash(node[prop]);
        }
      }
    }
  }
  recursiveHash(node);
  console.log(`columnMap in util: ${JSON.stringify(columnMap)}, length: ${columnMap.length}`)
  return columnMap;
}

module.exports = { hashColumnNames };
