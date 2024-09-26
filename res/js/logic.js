
//  各パラメータ：
//  skilllevel：技レベル。0:未入手,1-5は技レベルを表す
//  rarity:星。主人公でない限り3-5,EXしかないので、0:星3,1:星4,2:星5,3:EX済とする
//  exRole:EXロール開放済みかどうか。0なら未開放、1なら開放済み

let characterDefaults = {}; // CSVデータを格納する変数

const list_role={"attack":"アタッカー","technical":"テクニカル","support":"サポート","speed":"スピード","field":"フィールド","multi":"マルチ"};
const list_type={
  "normal":"ノーマル","hono":"ほのお","mizu":"みず","denki":"でんき","kusa":"くさ","kori":"こおり",
  "kakutou":"かくとう","doku":"どく","jimen":"じめん","hikou":"ひこう","esper":"エスパー","musi":"むし",
  "iwa":"いわ","ghost":"ゴースト","dragon":"ドラゴン","aku":"あく","hagane":"はがね","fairy":"フェアリー"
};

// 48進数用の文字セット（0-9, a-z, A-K）
// 技レベルで3ビット、星で2ビット、exロールフラグで1ビットの計6ビットだが、
// 最大値は101111(2)で47なので48までの数値を確保
const base48Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL';

// ビットデータを48進数に変換する関数
function encodeCharacter(skilllevel, rarity, exRole) {
  const bitData = (parseInt(skilllevel) << 3) | (parseInt(rarity) << 1) | parseInt(exRole);
  return base48Chars[bitData];
}

// 48進数の文字をデコードしてビットデータに戻す関数
function decodeCharacter(characterCode) {
  const bitData = base48Chars.indexOf(characterCode);
  const skilllevel = (bitData >> 3) & 0b111; // 上位3ビットで技レベル
  const rarity = (bitData >> 1) & 0b11;     // 次の2ビットでレア度
  const exRole = bitData & 0b1;             // 最下位1ビットでEXロール
  return { skilllevel, rarity, exRole };
}

// CSVファイルの読み込み
async function loadCharacterDefaults() {
  const response = await fetch('res/chara/list.csv');
  const csvData = await response.text();
  const rows = csvData.split('\n');
  rows.forEach((row, index) => {
    if (index === 0) return; // ヘッダー行をスキップ
    const cols = row.split(',');
    const id = parseInt(cols[0].trim()); // CSVファイルの行番号をIDとして扱う
    const name = cols[1].trim(); // キャラクター名
    const defaultRarity = parseInt(cols[2].trim()); // レア度（星）
    const type = cols[3].trim();
    const role = cols[4].trim();
    // EXロールはデフォルトであれば必ずFalse
    const exRole = 0;
    // todo: exロールタイプの画像とかちゃんと用意したい
    const exRoleType = cols[5].trim() || '未所持'; // EXロール
    characterDefaults[id] = { name: name, rarity: defaultRarity, type:type, role: role, exRole: exRole };
  });

  generateCharacterForms(); // CSVデータの数に基づいてフォームを生成
}

// キャラクターフォームを生成する関数
function generateCharacterForms() {
  const formContainer = document.getElementById('character-forms');
  formContainer.innerHTML = ''; // フォームをリセット

  Object.keys(characterDefaults).forEach(characterId => {
    const { name, rarity, exRole } = characterDefaults[characterId];
    addCharacterForm(characterId, 0, rarity, 0); // 初期値でフォームを生成
  });
}

// キャラクターフォームを1つずつ生成する関数
function addCharacterForm(characterId, skilllevel, rarity, exRole) {
  /*
  if(rarity >= 7) rarity = rarity - 3
  const defaultRarity = rarity; // デフォルトはレア度3
  */

  const characterName = characterDefaults[characterId] ? characterDefaults[characterId].name : `キャラクター${characterId}`;
  const type = characterDefaults[characterId] ? characterDefaults[characterId].type : 'ノーマル';

  /*
  const newForm = `
    <div class="character-form">
      <h3>${characterName}</h3>
      <div>
        <label for="limit-break-img-${characterId}">技レベル:</label>
        <img id="limit-break-img-${characterId}" class="img-clickable" src="res/etc/lv${skilllevel}.png" alt="技レベル" data-skilllevel="${skilllevel}" onclick="cycleskilllevel(${characterId})">
      </div>
      <div>
        <label for="rarity-img-${characterId}">レア度:</label>
        <img id="rarity-img-${characterId}" class="img-clickable" src="res/etc/${getRarityImage(defaultRarity)}" alt="レア度" data-rarity="${defaultRarity}" onclick="cycleRarity(${characterId})">
      </div>
      <div>
        <label for="ex-role-img-${characterId}">EXロール:</label>
        <img id="ex-role-img-${characterId}" class="img-clickable" src="res/etc/${exRole ? 'EXRoll.png' : 'EXRoll-GS.png'}" alt="EXロール" data-exrole="${exRole}" onclick="cycleExRole(${characterId})">
      </div>
    </div>`;
  */
  //todo タイプ名を英語にする
  let div = document.createElement('div');
  div.innerHTML = `
        <div id="has-character-${characterId}" class="buddy ${skilllevel>0 ? 'active':''} ${type}" onclick="toggleBuddy(this)">
            ${characterName}
        </div>
  `;
  div.style.order = characterId;
  document.getElementById('character-forms').appendChild(div);
}

/*
// レア度に応じて適切な画像ファイル名を返す関数
function getRarityImage(rarity) {
  const rarityImages = ['star3.png', 'star4.png', 'star5.png', 'starEX.png']; // レア度3, 4, 5, EXに対応
  return rarityImages[rarity - 3];  // 修正: レア度3から始まるためオフセットを使用
}

// 技レベルの画像をクリックしたときに技レベルの状態を更新する関数
function cycleskilllevel(characterId) {
  const img = document.getElementById(`limit-break-img-${characterId}`);
  let skilllevel = parseInt(img.getAttribute('data-skilllevel'));

  // 技レベルの値を1つ増やす（6まで行ったら0に戻す）
  skilllevel = (skilllevel + 1) % 6;

  // 画像を差し替える
  img.setAttribute('data-skilllevel', skilllevel);
  img.src = `res/etc/lv${skilllevel}.png`;
}

// レア度の画像をクリックしたときにレア度の状態を更新する関数
function cycleRarity(characterId) {
  const img = document.getElementById(`rarity-img-${characterId}`);
  let rarity = parseInt(img.getAttribute('data-rarity'));

  // レア度の値を1つ増やす（3: star3.png, 4: star4.png, 5: star5.png, 6: starEX.png）
  rarity = rarity + 1; // レア度が3から6（EX）まで循環
  if(rarity == 7) rarity = 3

  // 画像を差し替える
  img.setAttribute('data-rarity', rarity);
  img.src = `res/etc/${getRarityImage(rarity)}`;
}

// EXロールの画像をクリックしたときにEXロールの状態を更新する関数
function cycleExRole(characterId) {
  const img = document.getElementById(`ex-role-img-${characterId}`);
  let exRole = parseInt(img.getAttribute('data-exrole'));

  // EXロールを0と1で切り替える
  exRole = (exRole + 1) % 2;

  // EXロール画像の配列
  const exRoleImages = ['EXRoll-GS.png', 'EXRoll.png']; // ここで画像が切り替わる
  img.setAttribute('data-exrole', exRole);
  img.src = `res/etc/${exRoleImages[exRole]}`;
}
*/

// URL生成関数
function generateUrl() {
  let encodedCharacters = '';
  Object.keys(characterDefaults).forEach(characterId => {
    /*
    const skilllevel = document.getElementById(`limit-break-img-${characterId}`).getAttribute('data-skilllevel');
    const rarity = document.getElementById(`rarity-img-${characterId}`).getAttribute('data-rarity') - 3;
    const exRole = document.getElementById(`ex-role-img-${characterId}`).getAttribute('data-exrole');
    */
   let skilllevel;
   if(document.getElementById(`has-character-${characterId}`).classList.contains('active')){
      skilllevel = 1
    }
    else{
      skilllevel = 0
    };
    //todo とりあえず仮置き
    const rarity = 2;
    const exRole = 0;
    encodedCharacters += encodeCharacter(skilllevel, rarity, exRole);
  });
  //const base64encode = btoa(encodedCharacters)
  const EncodedStr = huffmanEncodeWithTree(encodedCharacters)
  const baseUrl = window.location.origin + window.location.pathname;
  const query = `?data=${EncodedStr}`;
  const fullUrl = baseUrl + query;
  document.getElementById('generated-url').textContent = fullUrl;

  // コピーボタンを表示
  document.getElementById('copy-url-btn').style.display = 'inline-block';
}

// クエリパラメータからデータを取得して表示する関数
async function displayCharacterInfoFromQuery() {
  await loadCharacterDefaults(); // CSVデータを読み込み

  const params = new URLSearchParams(window.location.search);

  //const base64data = params.get('data');
  //const data = (base64data != null) ? atob(base64data) : null
  const huffmanData = params.get('data');
  const data = (huffmanData != null) ? huffmanDecodeWithTree(huffmanData) : null

  const formContainer = document.getElementById('character-forms');

  // クエリ情報がある場合、フォームに反映
  if (data) {
  // フォームをリセットしてから表示（既存のデフォルトフォームを消去）
    formContainer.innerHTML = '';
    data.split('').forEach((characterCode, index) => {
      const { skilllevel, rarity, exRole } = decodeCharacter(characterCode);
      addCharacterForm(index + 1, skilllevel, rarity + 3, exRole);
    });
  }
}

// URLをクリップボードにコピーする関数
function copyUrl() {
  const url = document.getElementById('generated-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    alert('URLがクリップボードにコピーされました!');
  });
}

// ページ読み込み時にクエリパラメータを解析して表示
window.onload = function () {
  displayCharacterInfoFromQuery();
};

// バディーズをトグル（アクティブ/非アクティブを切り替え）
function toggleBuddy(buddy) {
  buddy.classList.toggle("active");
}

// 昇順と降順を入れ替える
function changeOrderAsc(button) {
  let characters = Array.from(document.getElementById('character-forms').children);
  let count = characters.length;
  characters.forEach(character => {
    character.style.order = count - character.style.order;
  })
  if (button.textContent == "昇順"){button.textContent = "降順"}else{button.textContent = "昇順"}
}

// フィルター画面を開く
function openFilterWindow(){
  document.getElementById("filter-window").style.display = "flex";
}

// フィルター画面を閉じる
function ClosefilterWindow(){
  document.getElementById("filter-window").style.display = "none";
}

// フィルターをトグル（アクティブ/非アクティブを切り替え）
function toggleFilter(filterButton) {
  filterButton.classList.toggle("active");
}

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
    // 頻度の昇順でソート
    nodes.sort((a, b) => a.freq - b.freq);

    const left = nodes.shift();
    const right = nodes.shift();

    // 新しい内部ノードを作成して追加
    const newNode = new HuffmanNode(null, left.freq + right.freq, left, right);
    nodes.push(newNode);
  }

  return nodes[0];
}

// 各文字のビット列をマッピング
function buildHuffmanCodes(node, prefix = '', codeMap = {}) {
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
  if (node.char !== null) {
    return `1${node.char.charCodeAt(0).toString(2).padStart(8, '0')}`; // 1 + 文字のバイナリ
  } else {
    return `0${serializeTree(node.left)}${serializeTree(node.right)}`; // 0 + 左右の子を再帰的にシリアライズ
  }
}

// シリアライズされたハフマンツリーをデシリアライズ（ツリーに復元）
function deserializeTree(serializedTree) {
  let index = 0;

  function deserialize() {
    if (serializedTree[index] === '1') {
      index++;
      const charCode = parseInt(serializedTree.slice(index, index + 8), 2);
      index += 8;
      return new HuffmanNode(String.fromCharCode(charCode), 0);
    } else {
      index++;
      const left = deserialize();
      const right = deserialize();
      return new HuffmanNode(null, 0, left, right);
    }
  }

  return deserialize();
}

// 64進数変換用の文字セット
const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// ビット列を64進に変換
function toBase64(bitString) {
  let result = '';
  for (let i = 0; i < bitString.length; i += 6) {
    const segment = bitString.slice(i, i + 6).padEnd(6, '0');
    const index = parseInt(segment, 2);
    result += base64Characters[index];
  }
  return result;
}

// 64進をビット列に変換
function fromBase64(base64String) {
  let bitString = '';
  for (const char of base64String) {
    const index = base64Characters.indexOf(char);
    bitString += index.toString(2).padStart(6, '0');
  }
  return bitString;
}

// ビット列の長さを固定サイズで表現する
function intToFixedLengthBinary(num, length = 32) {
  return num.toString(2).padStart(length, '0'); // デフォルト32ビット（4バイト）
}

function fixedLengthBinaryToInt(binaryStr) {
  return parseInt(binaryStr, 2);
}

// エンコード（ツリーも含む）
function huffmanEncodeWithTree(str) {
  const freqMap = buildFrequencyTable(str);
  const huffmanTree = buildHuffmanTree(freqMap);
  const huffmanCodes = buildHuffmanCodes(huffmanTree);
  const encodedStr = str.split('').map(char => huffmanCodes[char]).join('');
  const serializedTree = serializeTree(huffmanTree);
  
  const fullEncodedStr = serializedTree + encodedStr;
  const originalBitLength = fullEncodedStr.length;

  // ビット列の長さを32ビットの固定長バイナリにして追加
  const lengthBinary = intToFixedLengthBinary(originalBitLength);
  const fullEncodedStrWithLength = lengthBinary + fullEncodedStr;

  const base64Encoded = toBase64(fullEncodedStrWithLength);
  
  return base64Encoded;
}

// 復号（ツリーも含む）
function huffmanDecodeWithTree(base64Encoded) {
  const fullEncodedStrWithLength = fromBase64(base64Encoded);

  // 先頭の32ビットを長さとして取得
  const lengthBinary = fullEncodedStrWithLength.slice(0, 32);
  const originalBitLength = fixedLengthBinaryToInt(lengthBinary);

  // 残りのビット列を取り出す
  const fullEncodedStr = fullEncodedStrWithLength.slice(32, 32 + originalBitLength);

  const [serializedTree, encodedStr] = splitTreeAndData(fullEncodedStr);
  const huffmanTree = deserializeTree(serializedTree);
  const decodedStr = huffmanDecode(encodedStr, buildHuffmanCodes(huffmanTree));
  return decodedStr;
}

// ツリーとエンコードされた文字列を分離
function splitTreeAndData(fullEncodedStr) {
  let index = 0;
  
  function readTree() {
    if (fullEncodedStr[index] === '1') {
      index += 9; // 1 + 8ビット（文字のバイナリ）
    } else {
      index++;
      readTree(); // 左の子を読む
      readTree(); // 右の子を読む
    }
  }

  readTree(); // ツリー全体を読み込む
  const serializedTree = fullEncodedStr.slice(0, index);
  const encodedStr = fullEncodedStr.slice(index);
  return [serializedTree, encodedStr];
}

// 復号に使うビット列とハフマンツリーから、復号する
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

// フィルターをリセットする
function resetFilter(){
  //ロールのフィルターをリセット
  Object.keys(list_role).forEach(role =>{
    if(document.getElementById(`role-${role}`).classList.contains('active')){document.getElementById(`role-${role}`).classList.remove('active');}
  });
  //タイプのフィルターをリセット
  Object.keys(list_type).forEach(type =>{
    if(document.getElementById(`type-${type}`).classList.contains('active')){document.getElementById(`type-${type}`).classList.remove('active');}
  });
}

// 設定に応じてバディーズをフィルタリングする
function applyFilters(){
  let filter_role=[];
  let filter_type=[];

  //ロールのうちフィルターが有効になっているものを取得
  Object.keys(list_role).forEach(role =>{
    if(document.getElementById(`role-${role}`).classList.contains('active')){filter_role.push(list_role[role])}
  });
  //タイプのうちフィルターが有効になっているものを取得
  Object.keys(list_type).forEach(type =>{
    if(document.getElementById(`type-${type}`).classList.contains('active')){filter_type.push(list_type[type])}
  });

  //有効になっているロールフィルターが0ではない場合、ロールをフィルタリングする
  if (filter_role.length != 0){
    Object.keys(characterDefaults).forEach(characterId => {
      buddy = document.getElementById(`has-character-${characterId}`);
      if (filter_role.includes(characterDefaults[characterId]["role"])){
        buddy.style.display = "flex";
      }
      else{
        buddy.style.display = "none";
      }
    });
  }
  //有効になっているタイプフィルターが0ではない場合、タイプをフィルタリングする
  if (filter_type.length != 0){
    Object.keys(characterDefaults).forEach(characterId => {
      buddy = document.getElementById(`has-character-${characterId}`);
      if (filter_type.includes(characterDefaults[characterId]["type"])){
        buddy.style.display = "flex";
      }
      else{
        buddy.style.display = "none";
      }
    });
  }
  //フィルター画面を閉じる
  ClosefilterWindow();
}