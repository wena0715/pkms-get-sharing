

// バディーズをトグル（アクティブ/非アクティブを切り替え）
function toggleBuddy(buddy) {
    buddy.classList.toggle("active");
    //技レベルが0(未所持)だった場合、1に変更する
    if(buddy.getElementsByClassName("num-lv")[0].textContent == "0"){
        buddy.getElementsByClassName("num-lv")[0].textContent = "1";
    }
}

// EXロールボタンをトグル
function toggleExRole(event,button){ 
    event.stopPropagation();
    button.classList.toggle("active");
}

// 技レベルを1-5で切り替える、5まで行ったら1に戻す
function toggleSkillLevel(event,button){
    event.stopPropagation();
    level = button.getElementsByClassName("num-lv")[0];
    
    if (level.textContent == "1" ){level.textContent = "2";}
    else if (level.textContent == "2" ){level.textContent = "3";}
    else if (level.textContent == "3" ){level.textContent = "4";}
    else if (level.textContent == "4" ){level.textContent = "5";}
    else if (level.textContent == "5" ){level.textContent = "1";}
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

// フィルターをリセットする
function resetFilter(){
    //ロールのフィルターをリセット
    Object.values(list_role).forEach(role =>{
        if(document.getElementById(`role-${role}`).classList.contains('active')){document.getElementById(`role-${role}`).classList.remove('active');}
    });
    //タイプのフィルターをリセット
    Object.values(list_type).forEach(type =>{
        if(document.getElementById(`type-${type}`).classList.contains('active')){document.getElementById(`type-${type}`).classList.remove('active');}
    });
}

// 設定に応じてバディーズをフィルタリングする
function applyFilters(){
    let filter_role=[];
    let filter_type=[];

    //ロールのうちフィルターが有効になっているものを取得
    Object.values(list_role).forEach(role =>{
        if(document.getElementById(`role-${role}`).classList.contains('active')){filter_role.push(list_role[role])}
    });
    //タイプのうちフィルターが有効になっているものを取得
    Object.values(list_type).forEach(type =>{
        if(document.getElementById(`type-${type}`).classList.contains('active')){filter_type.push(list_type[type])}
    });

    //一度すべて有効にする
        Object.keys(characterDefaults).forEach(characterId => {
        document.getElementById(`has-character-${characterId}`).style.display = "flex";
        });

    //有効になっているロールフィルターが0ではない場合、ロールをフィルタリングする
    if (filter_role.length != 0){
        Object.keys(characterDefaults).forEach(characterId => {
        buddy = document.getElementById(`has-character-${characterId}`);
        if (!filter_role.includes(characterDefaults[characterId]["role"])){
            buddy.style.display = "none";
        }
        });
    }
    //有効になっているタイプフィルターが0ではない場合、タイプをフィルタリングする
    if (filter_type.length != 0){
        Object.keys(characterDefaults).forEach(characterId => {
        buddy = document.getElementById(`has-character-${characterId}`);
        if (!filter_type.includes(characterDefaults[characterId]["type"])){
            buddy.style.display = "none";
        }
        });
    }
    //フィルター画面を閉じる
    ClosefilterWindow();
}