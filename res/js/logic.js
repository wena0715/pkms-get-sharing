
//  各パラメータ：
//  skilllevel：技レベル。0:未入手,1-5は技レベルを表す
//  rarity:星。主人公でない限り3-5,EXしかないので、0:星3,1:星4,2:星5,3:EX済とする
//  exRole:EXロール開放済みかどうか。0なら未開放、1なら開放済み

let characterDefaults = {}; // CSVデータを格納する変数

const list_role={"アタッカー":"attack","テクニカル":"technical","サポート":"support","スピード":"speed","フィールド":"field","マルチ":"multi"};
const list_type={
  "ノーマル":"normal","ほのお":"hono","みず":"mizu","でんき":"denki","くさ":"kusa","こおり":"kori",
  "かくとう":"kakutou","どく":"doku","じめん":"jimen","ひこう":"hikou","エスパー":"esper","むし":"musi",
  "いわ":"iwa","ゴースト":"ghost","ドラゴン":"dragon","あく":"aku","はがね":"hagane","フェアリー":"fairy"
};

// 88進数用の文字セット（0-9, a-z, A-Z,記号）
// フェス限の技レベルが10まで用意されるという情報が出ているので、技レベルで4ビット確保し、
// 星で2ビット、exロールフラグで1ビットの計6ビットだが、
// 最大値1010111(2)の88通り確保する
const base48Chars = `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&'()*+,-./:;<=>?@[\]^`;

// ビットデータを88進数に変換する関数
function encodeCharacter(skilllevel, rarity, exRole) {
  const bitData = (parseInt(skilllevel) << 4) | (parseInt(rarity) << 1) | parseInt(exRole);
  return base48Chars[bitData];
}

// 88進数の文字をデコードしてビットデータに戻す関数
function decodeCharacter(characterCode) {
  const bitData = base48Chars.indexOf(characterCode);
  const skilllevel = (bitData >> 4) & 0b1111; // 上位4ビットで技レベル
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
    const exRole = cols[5].trim(); // EXロール
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

  const characterName = characterDefaults[characterId] ? characterDefaults[characterId].name : `キャラクター${characterId}`;
  const type = characterDefaults[characterId] ? characterDefaults[characterId].type : 'ノーマル';
  const role = characterDefaults[characterId] ? characterDefaults[characterId].role : 'アタッカー';
  const exroleType = characterDefaults[characterId] ? characterDefaults[characterId].exRole : '';

  let div = document.createElement('div');
  div.innerHTML = `
        <div id="has-character-${characterId}" class="buddy ${skilllevel>0 ? 'active':''} ${type} ${exroleType=='' ? 'no-ex' : ''}" onclick="toggleBuddy(this)">
          <div class="character-name">
            <div><img class="role" src="res/etc/role/${list_role[role]}.png"></div>
            <div>${characterName}</div>
          </div>
          <div>
            <button class="skill-level-button" onclick="toggleSkillLevel(event,this)">
              <div class="skill-level">
                <img class="skill-level" src="res/etc/skillLevel.png">
                <div class="lv">lv.</div>
                <div class="num-lv">${skilllevel}</div>
                <div class="num-lv-max">/5</div>
              </div>
            </button>
            <button class="ex-role-button ${exRole>0 ? 'active':''}" onclick="toggleExRole(event,this)">
              <div class="ex-role">
                <img class="ex-role" src="res/etc/role/${list_role[exroleType]}_cake.png">
                <div class="ex-role-txt">EXロール</div>
              </div>
            </button>
          </div>
        </div>
  `;
  div.style.order = characterId;
  document.getElementById('character-forms').appendChild(div);
}

// URL生成関数
function generateUrl() {
  let encodedCharacters = '';
  Object.keys(characterDefaults).forEach(characterId => {
    const buddy = document.getElementById(`has-character-${characterId}`);
    // バディーが有効でない場合、技レベルexロールともになし
    let skilllevel = 0;
    let exRole = 0;

    // バディーが有効かどうかを確認する
    if(buddy.classList.contains('active')){
      //技レベルを取得
      skilllevel = buddy.getElementsByClassName("num-lv")[0].textContent;
      //exロールが有効かどうか取得
      if(buddy.getElementsByClassName("ex-role-button")[0].classList.contains('active')){
        exRole = 1;
      }
    }
    //todo とりあえず仮置き
    const rarity = 2;
    encodedCharacters += encodeCharacter(skilllevel, rarity, exRole);
  });
  const EncodedStr = encodeURIComponent(huffmanEncodeWithTree(encodedCharacters));
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

  const huffmanData = params.get('data');
  const data = (huffmanData != null) ? huffmanDecodeWithTree(decodeURIComponent(huffmanData)) : null

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
