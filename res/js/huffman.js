class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

// 文字列から頻度表を作成
function buildFrequencyTable(str) {
  const freqMap = {};
  for (const char of str) {
    if (char in freqMap) {
      freqMap[char]++;
    } else {
      freqMap[char] = 1;
    }
  }
  return freqMap;
}

// 優先度付きキュー（配列）を使ってハフマン木を構築
function buildHuffmanTree(freqMap) {
  const nodes = [];
  for (const char in freqMap) {
    nodes.push(new HuffmanNode(char, freqMap[char]));
  }

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const newNode = new HuffmanNode(null, left.freq + right.freq, left, right);
    nodes.push(newNode);
  }

  return nodes[0];
}

// ハフマンツリーを走査してビット列を作成
function buildHuffmanCodes(node, prefix = '', codeMap = {}) {
  if (!node) return;
  if (node.char !== null) {
    codeMap[node.char] = prefix;
  } else {
    buildHuffmanCodes(node.left, prefix + '0', codeMap);
    buildHuffmanCodes(node.right, prefix + '1', codeMap);
  }
  return codeMap;
}

// ハフマンツリーをシリアライズ（ビット列化）
function serializeTree(node) {
  if (!node) return '';
  if (node.char !== null) {
    return `1${node.char.charCodeAt(0).toString(2).padStart(8, '0')}`; // 1 + 文字のバイナリ
  } else {
    return `0${serializeTree(node.left)}${serializeTree(node.right)}`; // 0 + 子ノード再帰的にシリアライズ
  }
}

// シリアライズされたツリーをデシリアライズ
function deserializeTree(serializedTree) {
  let index = 0;

  function deserialize() {
    if (index >= serializedTree.length) return null;
    if (serializedTree[index] === '1') {
      index++;
      const charCode = parseInt(serializedTree.slice(index, index + 8), 2);
      index += 8;
      return new HuffmanNode(String.fromCharCode(charCode), 0);
    } else if (serializedTree[index] === '0') {
      index++;
      const left = deserialize();
      const right = deserialize();
      return new HuffmanNode(null, 0, left, right);
    }
    return null;
  }

  return deserialize();
}

// 64進数変換用の文字セット（URLセーフ）
const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// ビット列をURLセーフBase64に変換
function toBase64(bitString) {
  let result = '';
  for (let i = 0; i < bitString.length; i += 6) {
    const segment = bitString.slice(i, i + 6).padEnd(6, '0');
    const index = parseInt(segment, 2);
    result += base64Characters[index];
  }
  return result;
}

// URLセーフBase64をビット列に変換
function fromBase64(base64String) {
  let bitString = '';
  for (const char of base64String) {
    const index = base64Characters.indexOf(char);
    bitString += index.toString(2).padStart(6, '0');
  }
  return bitString;
}

// エンコード処理（ビット列の長さをエンコード文字列に含める）
function huffmanEncodeWithTree(str) {
  const freqMap = buildFrequencyTable(str);
  const huffmanTree = buildHuffmanTree(freqMap);
  const huffmanCodes = buildHuffmanCodes(huffmanTree);
  const encodedStr = str.split('').map(char => huffmanCodes[char]).join('');
  const serializedTree = serializeTree(huffmanTree);

  const fullEncodedStr = serializedTree + encodedStr;
  const bitLength = fullEncodedStr.length;  // ビット列の長さを記録

  // ビット列の長さを32ビットのバイナリとしてエンコード文字列に含める
  const lengthBinary = bitLength.toString(2).padStart(32, '0');
  const fullEncodedStrWithLength = lengthBinary + fullEncodedStr;

  const base64Encoded = toBase64(fullEncodedStrWithLength);

  return base64Encoded; // エンコード結果に長さ情報を含める
}

// デコード処理（ビット列の長さを含んだエンコード文字列を処理）
function huffmanDecodeWithTree(base64Encoded) {
  const fullEncodedStrWithLength = fromBase64(base64Encoded);

  // 先頭32ビットはビット列の長さ
  const lengthBinary = fullEncodedStrWithLength.slice(0, 32);
  const bitLength = parseInt(lengthBinary, 2);

  // 残りのビット列を取り出す
  const fullEncodedStr = fullEncodedStrWithLength.slice(32, 32 + bitLength);

  const [serializedTree, encodedStr] = splitTreeAndData(fullEncodedStr);
  const huffmanTree = deserializeTree(serializedTree);
  const huffmanCodes = buildHuffmanCodes(huffmanTree);

  return huffmanDecode(encodedStr, huffmanCodes);
}

// ツリーとエンコードされた文字列を分離
function splitTreeAndData(fullEncodedStr) {
  let index = 0;

  function readTree() {
    if (index >= fullEncodedStr.length) return;
    if (fullEncodedStr[index] === '1') {
      index += 9; // 1 + 8ビット
    } else if (fullEncodedStr[index] === '0') {
      index++;
      readTree();
      readTree();
    }
  }

  readTree();
  const serializedTree = fullEncodedStr.slice(0, index);
  const encodedStr = fullEncodedStr.slice(index);

  return [serializedTree, encodedStr];
}

// ビット列をデコード
function huffmanDecode(encodedStr, huffmanCodes) {
  let decodedStr = '';
  let temp = '';

  const reversedCodes = Object.entries(huffmanCodes).reduce((acc, [char, code]) => {
    acc[code] = char;
    return acc;
  }, {});

  for (const bit of encodedStr) {
    temp += bit;
    if (temp in reversedCodes) {
      decodedStr += reversedCodes[temp];
      temp = '';
    }
  }

  return decodedStr;
}
