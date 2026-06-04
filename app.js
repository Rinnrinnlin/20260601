const pokedexGrid = document.getElementById('pokedex-grid');
const searchInput = document.getElementById('search-input');
const errorMessage = document.getElementById('error-message');
const filterTags = document.getElementById('filter-tags');

let allPokemonDetails = []; // 存放所有抓下來的寶可夢詳細資料
let currentTypeFilter = 'all';

// 1. 初始化：利用 fetch 一口氣抓取前 50 隻寶可夢（可自行調整數量，如 151 隻）
async function initPokedex() {
    try {
        errorMessage.classList.add('hidden');
        pokedexGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">載入中...</p>';

        // 先獲取基礎列表
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151&offset=0');
        if (!response.ok) throw new Error('無法取得寶可夢列表資料');
        const data = await response.json();

        // 針對每隻寶可夢，發送個別的 fetch 取得圖片、屬性等細節
        const detailPromises = data.results.map(async (pokemon) => {
            const res = await fetch(pokemon.url);
            return res.json();
        });

        // 平行處理所有請求，提升載入速度
        allPokemonDetails = await Promise.all(detailPromises);

        // 渲染畫面
        renderPokedex(allPokemonDetails);

    } catch (error) {
        showError(error.message);
    }
}

// 2. 將資料渲染至網頁（支援過濾功能）
function renderPokedex(pokemonList) {
    pokedexGrid.innerHTML = ''; // 清空容器

    if (pokemonList.length === 0) {
        pokedexGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#999;">找不到相符的寶可夢</p>';
        return;
    }

    pokemonList.forEach(pokemon => {
        // 建立卡片 HTML 結構
        const card = document.createElement('div');
        card.classList.add('pokemon-card');

        // 格式化 ID (例如: #001)
        const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;

        // 取得屬性標籤 HTML
        const typesHTML = pokemon.types.map(t => {
            return `<span class="type-badge type-${t.type.name}">${translateType(t.type.name)}</span>`;
        }).join('');

        // 優先使用官方高畫質圖片，沒有則用預設圖
        const imgUrl = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;

        card.innerHTML = `
            <p class="poke-id">${formattedId}</p>
            <img class="poke-img" src="${imgUrl}" alt="${pokemon.name}">
            <h3 class="poke-name">${pokemon.name}</h3>
            <div class="card-types">${typesHTML}</div>
        `;

        pokedexGrid.appendChild(card);
    });
}

// 3. 搜尋與篩選邏輯
function filterPokemon() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filtered = allPokemonDetails.filter(pokemon => {
        // 檢查名字或編號是否符合搜尋字詞
        const matchesSearch = pokemon.name.includes(searchTerm) || String(pokemon.id) === searchTerm;
        // 檢查是否符合當前選中的屬性
        const matchesType = currentTypeFilter === 'all' || pokemon.types.some(t => t.type.name === currentTypeFilter);

        return matchesSearch && matchesType;
    });

    renderPokedex(filtered);
}

// 監聽搜尋輸入
searchInput.addEventListener('input', filterPokemon);

// 監聽屬性標籤點擊
filterTags.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
        // 切換 active 樣式
        document.querySelectorAll('.tag').forEach(tag => tag.classList.remove('active'));
        e.target.classList.add('active');

        // 設定目前屬性並過濾
        currentTypeFilter = e.target.getAttribute('data-type');
        filterPokemon();
    }
});

// 4. 錯誤處理顯示
function showError(message) {
    errorMessage.innerText = `發生錯誤：${message}`;
    errorMessage.classList.remove('hidden');
    pokedexGrid.innerHTML = '';
}

// 簡單的屬性英翻中對應表
function translateType(type) {
    const translations = {
        grass: '草', poison: '毒', fire: '火', flying: '飛行',
        water: '水', bug: '蟲', normal: '一般', electric: '電',
        ground: '地面', fairy: '妖精', fighting: '格鬥', psychic: '超能力',
        rock: '岩石', steel: '鋼', ice: '冰', ghost: '幽靈', dragon: '龍'
    };
    return translations[type] || type;
}

// 網頁載入後啟動
window.addEventListener('DOMContentLoaded', initPokedex);