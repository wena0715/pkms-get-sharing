
//  各パラメータ：
//  limitbreak：技レベル。0:未入手,1-5は技レベルを表す
//  rarity:星。主人公でない限り3-5,EXしかないので、0:星3,1:星4,2:星5,3:EX済とする
//  exRole:EXロール開放済みかどうか。0なら未開放、1なら開放済み

let characterDefaults = {}; // CSVデータを格納する変数

// 48進数用の文字セット（0-9, a-z, A-K）
// 技レベルで3ビット、星で2ビット、exロールフラグで1ビットの計6ビットだが、
// 最大値は101111(2)で47なので48までの数値を確保
const base48Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL';

// ビットデータを48進数に変換する関数
function encodeCharacter(limitBreak, rarity, exRole) {
  const bitData = (parseInt(limitBreak) << 3) | (parseInt(rarity) << 1) | parseInt(exRole);
  return base48Chars[bitData];
}

// 48進数の文字をデコードしてビットデータに戻す関数
function decodeCharacter(characterCode) {
  const bitData = base48Chars.indexOf(characterCode);
  const limitBreak = (bitData >> 3) & 0b111; // 上位3ビットで技レベル
  const rarity = (bitData >> 1) & 0b11;     // 次の2ビットでレア度
  const exRole = bitData & 0b1;             // 最下位1ビットでEXロール
  return { limitBreak, rarity, exRole };
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
    characterDefaults[id] = { name: name, rarity: defaultRarity, type:type, exRole: exRole };
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
function addCharacterForm(characterId, limitBreak, rarity, exRole) {
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
        <img id="limit-break-img-${characterId}" class="img-clickable" src="res/etc/lv${limitBreak}.png" alt="技レベル" data-limitbreak="${limitBreak}" onclick="cycleLimitBreak(${characterId})">
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
        <div id="has-character-${characterId}" class="buddy ${limitBreak>0 ? 'active':''} ${type}" onclick="toggleBuddy(this)">
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
function cycleLimitBreak(characterId) {
  const img = document.getElementById(`limit-break-img-${characterId}`);
  let limitBreak = parseInt(img.getAttribute('data-limitbreak'));

  // 技レベルの値を1つ増やす（6まで行ったら0に戻す）
  limitBreak = (limitBreak + 1) % 6;

  // 画像を差し替える
  img.setAttribute('data-limitbreak', limitBreak);
  img.src = `res/etc/lv${limitBreak}.png`;
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
    const limitBreak = document.getElementById(`limit-break-img-${characterId}`).getAttribute('data-limitbreak');
    const rarity = document.getElementById(`rarity-img-${characterId}`).getAttribute('data-rarity') - 3;
    const exRole = document.getElementById(`ex-role-img-${characterId}`).getAttribute('data-exrole');
    */
   let limitBreak;
   if(document.getElementById(`has-character-${characterId}`).classList.contains('active')){
      limitBreak = 1
    }
    else{
      limitBreak = 0
    };
    //todo とりあえず仮置き
    const rarity = 2;
    const exRole = 0;
    encodedCharacters += encodeCharacter(limitBreak, rarity, exRole);
  });

  const base64encode = btoa(encodedCharacters)
  const baseUrl = window.location.origin + window.location.pathname;
  const query = `?data=${base64encode}`;
  const fullUrl = baseUrl + query;
  document.getElementById('generated-url').textContent = fullUrl;

  // コピーボタンを表示
  document.getElementById('copy-url-btn').style.display = 'inline-block';
}

// クエリパラメータからデータを取得して表示する関数
async function displayCharacterInfoFromQuery() {
  await loadCharacterDefaults(); // CSVデータを読み込み

  const params = new URLSearchParams(window.location.search);

  const base64data = params.get('data');
  const data = (base64data != null) ? atob(base64data) : null
  
  const formContainer = document.getElementById('character-forms');

  // クエリ情報がある場合、フォームに反映
  if (data) {
  // フォームをリセットしてから表示（既存のデフォルトフォームを消去）
    formContainer.innerHTML = '';
    data.split('').forEach((characterCode, index) => {
      const { limitBreak, rarity, exRole } = decodeCharacter(characterCode);
      addCharacterForm(index + 1, limitBreak, rarity + 3, exRole);
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
