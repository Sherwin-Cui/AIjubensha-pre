// 新游戏逻辑 - 支持角色选择、私聊和搜查系统

// 游戏状态
let gameState = {
    selectedCharacter: null,
    currentChapter: 0,
    currentDialogue: 0,
    collectedClues: [],
    completedSearches: new Set(),
    searchedOptions: {},
    currentSearchPoint: null,
    isPlaying: false,
    inPrivateChat: false,
    currentPrivateChat: null,
    privateChatIndex: 0
};

// 角色立绘映射
const characterPortraits = {
    '劳森': 'assets/characters/lawson.webp',
    '鲍勃': 'assets/characters/bob.webp',
    '提图芭': 'assets/characters/tituba.webp',
    '维多利亚': 'assets/characters/Victoria.webp',
    '阿比盖尔': 'assets/characters/parris.png',
    '格里格斯': 'assets/characters/william.png',
    'DM': null,
    '镇民': null,
    '镇民们': null,
    '酒吧老板': null
};

// 章节背景图片
const chapterBackgrounds = [
    'assets/scenes/chapter1.webp',
    'assets/scenes/chapter2.webp', 
    'assets/scenes/chapter3.webp',
    'assets/scenes/chapter4.webp'
];

// 初始化游戏
function initGame() {
    document.getElementById('game-container').addEventListener('click', handleClick);
    updateClueCount();
    createUIButtons();
    
    // 初始时隐藏UI按钮
    document.getElementById('backpack-btn').style.display = 'none';
    document.getElementById('home-btn').style.display = 'none';
    document.getElementById('character-info-btn').style.display = 'none';
    
    showGameIntro();
}

// 显示游戏介绍
function showGameIntro() {
    document.getElementById('start-screen').classList.add('hidden');
    const container = document.getElementById('game-container');
    const introDiv = document.createElement('div');
    introDiv.id = 'game-intro-screen';
    introDiv.className = 'character-selection';
    
    introDiv.innerHTML = `
        <div class="selection-content">
            <h1>萨勒密小镇谋杀案</h1>
            <div class="game-intro">
                <p>欢迎来到1666年的萨勒密小镇，这是一个被恐惧与迷信笼罩的时代。三天前，镇上的牧师离奇死亡，症状诡异——没有外伤，却浑身抽搐，口中呓语。镇民们惊恐不安，纷纷传言这是巫术作祟。</p>
                <p>在这个充满猜疑和仇恨的夜晚，六个人被召集到昏暗的集会所中。他们都与死者有着复杂的关系，每个人都可能是凶手，也都可能是下一个受害者。而你，将从中选择一个角色，亲历这场1666年的神秘谋杀案。</p>
            </div>
            <button onclick="proceedToCharacterSelection()" class="intro-confirm-btn">开始选择角色</button>
        </div>
    `;
    
    container.appendChild(introDiv);
}

// 前往角色选择
function proceedToCharacterSelection() {
    document.getElementById('game-intro-screen').remove();
    showCharacterSelection();
}

// 创建UI按钮
function createUIButtons() {
    const container = document.getElementById('game-container');
    
    // 角色信息按钮
    const characterBtn = document.createElement('button');
    characterBtn.id = 'character-info-btn';
    characterBtn.className = 'ui-button';
    characterBtn.innerHTML = '🔍';
    characterBtn.title = '查看角色信息';
    characterBtn.addEventListener('click', function(e) {
        console.log('Character info button clicked!');
        e.stopPropagation();
        showCharacterInfo(e);
    });
    container.appendChild(characterBtn);
    
    // 私聊按钮 
    const chatBtn = document.createElement('button');
    chatBtn.id = 'private-chat-btn';
    chatBtn.className = 'ui-button hidden';
    chatBtn.innerHTML = '💬';
    chatBtn.title = '私聊';
    chatBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showPrivateChatOptions(e);
    });
    container.appendChild(chatBtn);
}

// 开始游戏 - 显示角色选择
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    showCharacterSelection();
}

// 显示角色选择界面
function showCharacterSelection() {
    const container = document.getElementById('game-container');
    const selectionDiv = document.createElement('div');
    selectionDiv.id = 'character-selection';
    selectionDiv.className = 'character-selection';
    
    let html = `
        <div class="selection-content">
            <h2>请选择你要扮演的角色：</h2>
            <div class="characters-grid">
    `;
    
    gameData.characterSelection.forEach(char => {
        // 映射完整姓名到简短名字
        const nameMapping = {
            '西蒙·劳森': '劳森',
            '鲍勃·卡里尔': '鲍勃', 
            '维多利亚·达斯汀': '维多利亚',
            '提图芭': '提图芭',
            '阿比盖尔·帕里斯': '阿比盖尔',
            '威廉·格里格斯': '格里格斯'
        };
        const shortName = nameMapping[char.name] || char.name;
        const portrait = characterPortraits[shortName] || 'assets/characters/default.png';
        html += `
            <div class="character-card" onclick="selectCharacter('${char.name}')">
                <div class="character-portrait" style="background-image: url('${portrait}')"></div>
                <h3>${char.name}</h3>
                <p class="character-role">${char.role}</p>
                <p class="character-desc">${char.description}</p>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    selectionDiv.innerHTML = html;
    container.appendChild(selectionDiv);
}

// 选择角色
function selectCharacter(characterName) {
    gameState.selectedCharacter = characterName;
    document.getElementById('character-selection').remove();
    gameState.isPlaying = true;
    loadChapter(0);
    
    // 显示UI按钮
    document.getElementById('backpack-btn').style.display = 'block';
    document.getElementById('home-btn').style.display = 'block';
    document.getElementById('character-info-btn').style.display = 'block';
}

// 显示角色信息
function showCharacterInfo(e) {
    if (e) e.stopPropagation();
    
    if (!gameState.selectedCharacter) {
        console.log('No selected character');
        return;
    }
    
    // 详细的角色信息数据
    const characterInfoData = {
        '劳森': {
            name: '西蒙・劳森',
            title: '镇长',
            age: '34岁',
            intro: '萨勒密的镇长，一个开朗的中年单身汉，曾经是镇上的医生。',
            goal: '你是杀害牧师的凶手。你的目标是隐藏罪行，将嫌疑引向他人，并保护维多利亚。',
            style: '对外保持镇长的威严与公正，对维多利亚则流露出不易察觉的关切。被质问时，要表现出被冤枉的愤怒和理性的辩解。',
            motive: '牧师凭借影响力处处与你作对，更重要的是，他以女巫审判为要挟，逼迫你深爱的维多利亚成为他的情人。',
            secrets: ['杀害牧师的整个犯罪过程', '与维多利亚的秘密恋情（核心动机）']
        },
        '鲍勃': {
            name: '鲍勃・卡里尔',
            title: '酒鬼农民',
            age: '43岁',
            intro: '一个因妻子被当成女巫烧死而堕落的酒鬼。终日酗酒，手抖得厉害，镇上人人都怕你。',
            goal: '你不是凶手。你要找到真凶为妻子报仇，同时洗清自己的嫌疑。',
            style: '粗俗、暴躁，充满对权威和伪善的憎恨。经常使用短句和诅咒。',
            motive: '牧师主导了对你妻子的审判，他是毁掉你家庭的元凶。你恨不得亲手杀了他。',
            secrets: ['曾因醉酒误服提图芭的草药，出现与牧师死亡时类似的症状']
        },
        '维多利亚': {
            name: '维多利亚・达斯汀',
            title: '寡妇',
            age: '30岁',
            intro: '一个美貌的寡妇。丈夫死后，是劳森镇长帮你保住了农场，你和他也因此秘密相爱。',
            goal: '你不是凶手。你强烈怀疑是劳森为了保护你而杀了人。核心任务是保护劳森，将嫌疑引向他人。',
            style: '戏剧化，情绪化，常常表现得像一个受惊的弱女子。善用感叹句和反问。',
            motive: '牧师以你的农场和名誉为要挟，想强迫你做他的情人。你对他恨之入骨。',
            secrets: ['与劳森镇长的秘密恋情', '牧师对你进行性威胁的具体细节']
        },
        '提图芭': {
            name: '提图芭',
            title: '印第安女孩',
            age: '18岁',
            intro: '一个懂草药的印第安女孩。镇民因你的异族身份而畏惧你，只有劳森镇长和格里格斯医生等人对你尚算友善。',
            goal: '你不是凶手。你要运用你的知识和逻辑洗清嫌疑，并找出真相。',
            style: '冷静、有礼、疏离。你的话不多，但总能切中要点。',
            motive: '牧师视你为异端，一直想将你驱逐出萨勒密。',
            secrets: ['非常清楚自己提供的草药配方与酒精混合是致命的']
        },
        '阿比盖尔': {
            name: '阿比盖尔・帕里斯',
            title: '牧师的侄女',
            age: '17岁',
            intro: '牧师的侄女，负责照料他的饮食起居。父母双亡，寄人篱下，对严苛、伪善的叔叔充满厌恶。',
            goal: '你不是凶手。你知道很多关于牧师的秘密，它们或许能帮你找到真凶。',
            style: '前期表现得胆小、顺从，像一只受惊的小鹿。后期可以逐渐展现出隐藏的叛逆和机敏。',
            motive: '叔叔（牧师）控制着你的生活，不许你与镇上的年轻人交往，时常克扣你的用度，你渴望自由。',
            secrets: ['对叔叔的死感到解脱甚至暗自欣喜']
        },
        '格里格斯': {
            name: '威廉・格里格斯医生',
            title: '医生',
            age: '38岁',
            intro: '萨勒密的现任医生。受过科学训练，对镇上弥漫的"巫术"恐慌感到不屑。',
            goal: '你不是凶手。你的目标是运用医学知识，从科学角度分析案情，找出合理的解释。',
            style: '理性、严谨、客观。喜欢用专业词汇解释现象，对"巫术"之说嗤之以鼻。',
            motive: '牧师公开宣扬"祈祷优于药石"，多次贬低你的医术，影响了你的声誉和诊所的生意。',
            secrets: ['给劳森开具潜在危险药物时曾有过犹豫，内心对他是否会滥用药物有不安']
        }
    };
    
    // 将完整角色名称映射到简短key
    const nameToKey = {
        '西蒙·劳森': '劳森',
        '鲍勃·卡里尔': '鲍勃',
        '维多利亚·达斯汀': '维多利亚',
        '提图芭': '提图芭',
        '阿比盖尔·帕里斯': '阿比盖尔',
        '威廉·格里格斯': '格里格斯'
    };
    
    const characterKey = nameToKey[gameState.selectedCharacter] || gameState.selectedCharacter;
    const characterInfo = characterInfoData[characterKey];
    
    if (!characterInfo) {
        console.error('Character info not found for:', gameState.selectedCharacter, 'key:', characterKey);
        return;
    }
    
    const popup = document.createElement('div');
    popup.id = 'character-info-popup';
    popup.className = 'character-info-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="character-portrait" style="background-image: url('${characterPortraits[characterKey]}')"></div>
            <h2>${characterInfo.name} (${characterInfo.title})</h2>
            <p class="character-age">${characterInfo.age}</p>
            
            <div class="character-section">
                <h4>📝 简介</h4>
                <p>${characterInfo.intro}</p>
            </div>
            
            <div class="character-section">
                <h4>🎯 目标</h4>
                <p>${characterInfo.goal}</p>
            </div>
            
            <div class="character-section">
                <h4>🗣️ 说话风格</h4>
                <p>${characterInfo.style}</p>
            </div>
            
            <div class="character-section">
                <h4>💭 动机/过往</h4>
                <p>${characterInfo.motive}</p>
            </div>
            
            <div class="character-section">
                <h4>🤫 需要隐藏的秘密</h4>
                <ul>
                    ${characterInfo.secrets.map(secret => `<li>${secret}</li>`).join('')}
                </ul>
            </div>
            
            <button onclick="closeCharacterInfo()">关闭</button>
        </div>
    `;
    
    document.getElementById('game-container').appendChild(popup);
}

// 关闭角色信息
function closeCharacterInfo() {
    const popup = document.getElementById('character-info-popup');
    if (popup) popup.remove();
}

// 加载章节
function loadChapter(chapterIndex) {
    if (chapterIndex >= gameData.chapters.length) {
        endGame();
        return;
    }
    
    const chapter = gameData.chapters[chapterIndex];
    gameState.currentChapter = chapterIndex;
    gameState.currentDialogue = 0;
    
    // 设置章节标题
    document.getElementById('chapter-title').textContent = `第${chapter.chapterNum}章：${chapter.title}`;
    
    // 设置背景图片
    const bgUrl = chapterBackgrounds[chapterIndex] || chapterBackgrounds[0];
    const bgElement = document.getElementById('background');
    bgElement.style.backgroundImage = `url('${bgUrl}')`;
    bgElement.style.backgroundSize = 'cover';
    bgElement.style.backgroundPosition = 'center';
    
    // 隐藏私聊按钮
    document.getElementById('private-chat-btn').classList.add('hidden');
    
    // 显示第一条对话
    showDialogue();
}

// 显示对话
function showDialogue() {
    const chapter = gameData.chapters[gameState.currentChapter];
    if (!chapter || gameState.currentDialogue >= chapter.dialogues.length) {
        // 章节结束，检查是否有私聊机会
        if (chapter && chapter.chatOpportunity) {
            showPrivateChatPrompt();
        } else {
            // 进入下一章
            loadChapter(gameState.currentChapter + 1);
        }
        return;
    }
    
    const dialogue = chapter.dialogues[gameState.currentDialogue];
    
    switch(dialogue.type) {
        case 'dialogue':
            showCharacterDialogue(dialogue);
            break;
        case 'clue':
            // 不再直接显示线索，而是触发搜查
            triggerSearchForClue(dialogue);
            break;
        case 'search':
            showSearchPoint(dialogue);
            break;
    }
}

// 触发线索对应的搜查
function triggerSearchForClue(clueDialogue) {
    const chapter = gameData.chapters[gameState.currentChapter];
    
    // 根据线索找到对应的搜查点
    let searchPointToShow = null;
    
    // 根据线索标题和章节找到对应的搜查点
    switch(clueDialogue.title) {
        case "细口瓶": // 第二章
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "会客厅内的物品");
            break;
        case "手帕": // 第二章 - 餐厅内的物品
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "餐厅内的物品");
            break;
        case "审判记录": // 第二章 - 书房内的物品
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "书房内的物品");
            break;
        case "空药瓶": // 第三章
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "厨房外的区域");
            break;
        case "处方笺": // 第三章 - 诊所内的记录
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "诊所内的记录");
            break;
        case "密信": // 第四章
            searchPointToShow = chapter.searchPoints.find(sp => sp.title === "劳森镇长的随身物品");
            break;
    }
    
    if (searchPointToShow && !gameState.completedSearches.has(searchPointToShow.id)) {
        showSearchOptions(searchPointToShow);
    } else {
        // 如果搜查点已完成或没找到，直接显示线索
        showClue(clueDialogue);
    }
}

// 显示角色对话
function showCharacterDialogue(dialogue) {
    const characterName = document.getElementById('character-name');
    const dialogueText = document.getElementById('dialogue-text');
    const portrait = document.getElementById('character-portrait');
    
    // 重置动画
    characterName.style.animation = 'none';
    dialogueText.style.animation = 'none';
    characterName.offsetHeight;
    dialogueText.offsetHeight;
    
    // 设置角色名
    const character = gameData.characters[dialogue.character];
    characterName.textContent = character ? character.displayName : dialogue.character;
    
    // 设置对话文本
    let text = dialogue.text;
    if (dialogue.action) {
        text = `(${dialogue.action}) ${text}`;
    }
    dialogueText.textContent = text;
    
    // 重新启动动画
    characterName.style.animation = 'fadeInUp 0.6s forwards';
    dialogueText.style.animation = 'fadeInUp 0.8s forwards';
    dialogueText.style.animationDelay = '0.2s';
    
    // 设置角色立绘
    const portraitUrl = characterPortraits[dialogue.character];
    
    if (portraitUrl) {
        portrait.style.animation = 'none';
        portrait.offsetHeight;
        portrait.style.backgroundImage = `url('${portraitUrl}')`;
        portrait.style.backgroundSize = 'contain';
        portrait.style.backgroundPosition = 'right center';
        portrait.style.backgroundRepeat = 'no-repeat';
        portrait.textContent = '';
        portrait.style.animation = 'characterSlideIn 0.6s ease-out forwards';
        portrait.style.animationDelay = '0.2s';
    } else {
        portrait.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            portrait.style.backgroundImage = 'none';
            portrait.textContent = '';
        }, 300);
    }
    
    // 特殊处理DM旁白
    if (dialogue.character === 'DM') {
        characterName.style.color = 'rgba(255,255,255,0.5)';
        portrait.style.animation = 'fadeOut 0.3s forwards';
    } else {
        characterName.style.color = 'rgba(255,255,255,0.7)';
    }
    
    // 检查是否是搜查点
    checkForSearchPoint();
}

// 检查搜查点
function checkForSearchPoint() {
    const chapter = gameData.chapters[gameState.currentChapter];
    const currentText = document.getElementById('dialogue-text').textContent;
    
    // 根据章节和对话索引决定是否触发搜查
    let shouldTriggerSearch = false;
    let searchPointToShow = null;
    
    // 第二章：罪案现场 - 在第一个DM对话后触发搜查
    if (gameState.currentChapter === 1 && gameState.currentDialogue === 1) {
        searchPointToShow = chapter.searchPoints[0]; // 会客厅内的物品
        shouldTriggerSearch = true;
    }
    // 第三章：毒药的踪迹 - 在第一个DM对话后触发搜查
    else if (gameState.currentChapter === 2 && gameState.currentDialogue === 1) {
        searchPointToShow = chapter.searchPoints[0]; // 寻找草药相关证据
        shouldTriggerSearch = true;
    }
    
    if (shouldTriggerSearch && searchPointToShow && !gameState.completedSearches.has(searchPointToShow.id)) {
        setTimeout(() => showSearchOptions(searchPointToShow), 1000);
    }
}

// 显示搜查选项
function showSearchOptions(searchPoint) {
    const popup = document.createElement('div');
    popup.id = 'search-popup';
    popup.className = 'search-popup';
    
    let html = `
        <div class="search-content">
            <h3>${searchPoint.title}</h3>
            <div class="search-options">
    `;
    
    searchPoint.options.forEach(option => {
        html += `
            <button class="search-option" onclick="selectSearchOption('${searchPoint.id}', '${option.key}')">
                ${option.text}
            </button>
        `;
    });
    
    html += `
            </div>
            <button onclick="closeSearchPopup()">取消搜查</button>
        </div>
    `;
    
    popup.innerHTML = html;
    document.getElementById('game-container').appendChild(popup);
}

// 选择搜查选项
function selectSearchOption(searchPointId, optionKey) {
    const chapter = gameData.chapters[gameState.currentChapter];
    const searchPoint = chapter.searchPoints.find(sp => sp.id === searchPointId);
    const option = searchPoint.options.find(opt => opt.key === optionKey);
    
    if (option && option.result) {
        // 显示搜查结果
        showSearchResult(option.result);
        
        // 根据具体的搜查组合触发线索发现
        let clueToShow = null;
        
        // 第二章搜查点
        if (searchPointId === "search_2_1" && optionKey === "A") {
            clueToShow = gameData.clues.find(clue => clue.title === "细口瓶");
        }
        if (searchPointId === "search_2_2" && optionKey === "C") {
            clueToShow = gameData.clues.find(clue => clue.title === "手帕");
        }
        if (searchPointId === "search_2_3" && optionKey === "A") {
            clueToShow = gameData.clues.find(clue => clue.title === "审判记录");
        }
        
        // 第三章搜查点
        if (searchPointId === "search_3_1" && optionKey === "B") {
            clueToShow = gameData.clues.find(clue => clue.title === "空药瓶");
        }
        if (searchPointId === "search_3_2" && optionKey === "A") {
            clueToShow = gameData.clues.find(clue => clue.title === "处方笺");
        }
        
        // 第四章搜查点
        if (searchPointId === "search_4_1" && optionKey === "B") {
            clueToShow = gameData.clues.find(clue => clue.title === "密信");
        }
        
        // 如果找到对应线索，显示线索弹窗
        if (clueToShow) {
            // 检查是否已经收集过这个线索
            const alreadyCollected = gameState.collectedClues.find(c => c.id === clueToShow.id);
            if (!alreadyCollected) {
                gameState.collectedClues.push(clueToShow);
                updateClueCount();
                
                setTimeout(() => {
                    showCluePopup(clueToShow);
                }, 1000);
            }
        }
        
        // 记录已搜查的选项
        if (!gameState.searchedOptions) {
            gameState.searchedOptions = {};
        }
        if (!gameState.searchedOptions[searchPointId]) {
            gameState.searchedOptions[searchPointId] = new Set();
        }
        gameState.searchedOptions[searchPointId].add(optionKey);
        
        // 显示线索弹窗（如果有的话）
        if (clueToShow) {
            // 检查是否已经收集过这个线索
            const alreadyCollected = gameState.collectedClues.find(c => c.id === clueToShow.id);
            if (!alreadyCollected) {
                gameState.collectedClues.push(clueToShow);
                updateClueCount();
                
                setTimeout(() => {
                    showCluePopup(clueToShow);
                }, 1000);
            }
        }
        
        // 设置当前搜查状态，等待玩家点击继续
        gameState.currentSearchPoint = searchPoint;
    }
    
    closeSearchPopup();
}

// 显示搜查结果
function showSearchResult(result) {
    const dialogueText = document.getElementById('dialogue-text');
    dialogueText.textContent = result;
    dialogueText.style.animation = 'fadeInUp 0.5s forwards';
}

// 关闭搜查弹窗
function closeSearchPopup() {
    const popup = document.getElementById('search-popup');
    if (popup) popup.remove();
}

// 显示线索弹窗
function showCluePopup(clue) {
    const popup = document.getElementById('clue-popup');
    document.getElementById('clue-title').textContent = clue.title;
    document.getElementById('clue-description').textContent = clue.description;
    popup.classList.remove('hidden');
}

// 显示线索
function showClue(clue) {
    showCluePopup(clue);
    
    if (!gameState.collectedClues.find(c => c.id === clue.clueId)) {
        gameState.collectedClues.push({
            id: clue.clueId,
            title: clue.title,
            description: clue.description
        });
        updateClueCount();
    }
}

// 关闭线索弹窗
function closeCluePopup() {
    document.getElementById('clue-popup').classList.add('hidden');
    nextDialogue();
}

// 显示私聊提示
function showPrivateChatPrompt() {
    const prompt = document.createElement('div');
    prompt.id = 'chat-prompt';
    prompt.className = 'chat-prompt';
    prompt.innerHTML = `
        <div class="prompt-content">
            <p>现在可以选择角色进行私聊</p>
        </div>
    `;
    
    document.getElementById('game-container').appendChild(prompt);
    document.getElementById('private-chat-btn').classList.remove('hidden');
    
    setTimeout(() => {
        if (prompt.parentNode) prompt.remove();
    }, 3000);
}

// 显示私聊选项
function showPrivateChatOptions(e) {
    if (e) e.stopPropagation();
    
    const popup = document.createElement('div');
    popup.id = 'private-chat-popup';
    popup.className = 'private-chat-popup';
    
    // 根据章节限制可选角色（私聊只对维多利亚角色可用）
    let availableCharacters = [];
    if (gameState.selectedCharacter !== '维多利亚·达斯汀' && gameState.selectedCharacter !== '维多利亚') {
        // 非维多利亚角色无法进行私聊
        popup.innerHTML = `
            <div class="chat-popup-content">
                <h3>私聊功能</h3>
                <p style="color: rgba(255,255,255,0.8); margin: 20px 0;">当前角色无法进行私聊</p>
                <button onclick="closeChatOptions()">关闭</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(popup);
        return;
    }
    
    switch (gameState.currentChapter) {
        case 0: // 第一章
            availableCharacters = ['劳森', '鲍勃', '提图芭', '阿比盖尔', '格里格斯'];
            break;
        case 1: // 第二章  
            availableCharacters = ['劳森', '鲍勃', '提图芭', '阿比盖尔', '格里格斯'];
            break;
        case 2: // 第三章
            availableCharacters = ['劳森', '鲍勃'];
            break;
        case 3: // 第四章
            availableCharacters = ['鲍勃', '提图芭'];
            break;
        default:
            availableCharacters = [];
    }
    
    let html = `
        <div class="chat-popup-content">
            <h3>选择私聊对象</h3>
            <div class="chat-characters">
    `;
    
    availableCharacters.forEach(charName => {
        const character = gameData.characters[charName];
        if (!character) {
            console.error('找不到角色信息:', charName);
            return;
        }
        const portrait = characterPortraits[charName];
        html += `
            <div class="chat-character" onclick="startPrivateChat('${charName}')">
                <div class="char-portrait" style="background-image: url('${portrait}')"></div>
                <span>${character.displayName}</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <button onclick="closeChatOptions()">取消</button>
        </div>
    `;
    
    popup.innerHTML = html;
    document.getElementById('game-container').appendChild(popup);
}

// 开始私聊
function startPrivateChat(partnerName) {
    // 根据当前章节构建私聊ID
    const chapterId = gameState.currentChapter + 1; // 章节ID从1开始
    const chatId = `chat_${chapterId}_victoria_${partnerName}`;
    const chatData = gameData.privateChats[chatId];
    
    if (!chatData) {
        console.error('找不到私聊数据:', chatId);
        return;
    }
    
    closeChatOptions();
    
    // 保存当前主线进度
    gameState.savedDialogueIndex = gameState.currentDialogue;
    
    gameState.inPrivateChat = true;
    gameState.currentPrivateChat = {
        data: chatData
    };
    gameState.privateChatIndex = 0;  // 重置私聊索引
    
    showPrivateChatInterface();
}

// 显示私聊界面
function showPrivateChatInterface() {
    // 隐藏主对话框
    document.getElementById('dialogue-box').style.display = 'none';
    
    // 设置黑色背景
    document.getElementById('background').style.background = 'linear-gradient(135deg, #000000, #1a1a1a)';
    
    // 显示私聊标题
    const chapterTitle = document.getElementById('chapter-title');
    chapterTitle.style.display = 'block';
    chapterTitle.textContent = '私人对话';
    
    // 显示返回群聊按钮
    document.getElementById('back-to-main-btn').style.display = 'block';
    
    // 重置对话系统状态用于私聊
    gameState.privateChatIndex = 0;
    
    showNextChatMessage();
}

// 显示下一条私聊消息
function showNextChatMessage() {
    const chat = gameState.currentPrivateChat;
    if (!chat || !chat.data || gameState.privateChatIndex >= chat.data.dialogues.length) {
        endPrivateChat();
        return;
    }
    
    const dialogue = chat.data.dialogues[gameState.privateChatIndex];
    
    // 使用主对话框显示私聊内容
    const dialogueBox = document.getElementById('dialogue-box');
    const characterName = document.getElementById('character-name');
    const dialogueText = document.getElementById('dialogue-text');
    const clickHint = document.getElementById('click-hint');
    
    dialogueBox.style.display = 'block';
    characterName.textContent = dialogue.character;
    dialogueText.textContent = dialogue.text;
    
    // 根据是否是最后一条消息设置提示文字
    const isLastMessage = gameState.privateChatIndex >= chat.data.dialogues.length - 1;
    clickHint.textContent = isLastMessage ? '点击结束对话 ✕' : '点击继续 ▶';
    
    // 显示角色立绘
    const characterPortrait = document.getElementById('character-portrait');
    const portrait = characterPortraits[dialogue.character];
    if (portrait) {
        characterPortrait.style.backgroundImage = `url('${portrait}')`;
        characterPortrait.style.display = 'block';
    } else {
        characterPortrait.style.display = 'none';
    }
    
    // 增加索引，准备下一条消息
    gameState.privateChatIndex++;
}

// 下一条私聊消息
function nextChatMessage() {
    showNextChatMessage();
}

// 结束私聊
function endPrivateChat() {
    gameState.inPrivateChat = false;
    gameState.currentPrivateChat = null;
    gameState.privateChatIndex = 0;
    
    // 隐藏私聊按钮和返回按钮
    document.getElementById('private-chat-btn').classList.add('hidden');
    const backBtn = document.getElementById('back-to-main-btn');
    if (backBtn) backBtn.style.display = 'none';
    
    // 清除保存的对话索引
    gameState.savedDialogueIndex = undefined;
    
    // 私聊结束后进入下一章
    loadChapter(gameState.currentChapter + 1);
}

// 关闭私聊选项
function closeChatOptions() {
    const popup = document.getElementById('private-chat-popup');
    if (popup) popup.remove();
}

// 下一条对话
function nextDialogue() {
    if (gameState.inPrivateChat) return;
    gameState.currentDialogue++;
    showDialogue();
}

// 处理点击事件
function handleClick(e) {
    if (!gameState.isPlaying) return;
    
    // 忽略按钮点击，但特殊按钮的点击会被它们自己的事件处理器处理
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    // 忽略弹窗点击
    if (!document.getElementById('clue-popup').classList.contains('hidden')) return;
    if (document.getElementById('search-popup')) return;
    if (document.getElementById('private-chat-popup')) return;
    if (document.getElementById('character-info-popup')) return;
    
    // 如果在私聊中，点击继续私聊对话
    if (gameState.inPrivateChat) {
        const chat = gameState.currentPrivateChat;
        if (chat && gameState.privateChatIndex >= chat.data.dialogues.length) {
            // 私聊对话播放完毕，显示提示并返回私聊选择
            showPrivateChatEndPrompt();
        } else {
            showNextChatMessage();
        }
    } else {
        // 检查是否在搜查状态中
        if (gameState.currentSearchPoint) {
            const totalOptions = gameState.currentSearchPoint.options.length;
            const searchedCount = gameState.searchedOptions[gameState.currentSearchPoint.id]?.size || 0;
            
            if (searchedCount >= totalOptions) {
                // 所有选项都搜查完毕，继续对话
                const searchPointId = gameState.currentSearchPoint.id;
                gameState.currentSearchPoint = null;
                gameState.completedSearches.add(searchPointId);
                nextDialogue();
            } else {
                // 重新显示搜查选项，但过滤掉已搜查的选项
                showRemainingSearchOptions(gameState.currentSearchPoint);
            }
        } else {
            nextDialogue();
        }
    }
}

// 显示剩余搜查选项
function showRemainingSearchOptions(searchPoint) {
    const searchedOptions = gameState.searchedOptions[searchPoint.id] || new Set();
    
    const popup = document.createElement('div');
    popup.id = 'search-popup';
    popup.className = 'search-popup';
    
    let html = `
        <div class="search-content">
            <h3>${searchPoint.title}</h3>
            <div class="search-options">
    `;
    
    searchPoint.options.forEach(option => {
        if (!searchedOptions.has(option.key)) {
            html += `
                <button class="search-option" onclick="selectSearchOption('${searchPoint.id}', '${option.key}')">
                    ${option.text}
                </button>
            `;
        }
    });
    
    html += `
            </div>
            <button onclick="closeSearchPopup()">取消搜查</button>
        </div>
    `;
    
    popup.innerHTML = html;
    document.getElementById('game-container').appendChild(popup);
}

// 显示私聊结束提示
function showPrivateChatEndPrompt() {
    // 退出当前私聊状态
    gameState.inPrivateChat = false;
    gameState.currentPrivateChat = null;
    gameState.privateChatIndex = 0;
    
    // 隐藏返回群聊按钮
    document.getElementById('back-to-main-btn').style.display = 'none';
    
    // 恢复正常背景
    updateBackground(gameState.currentChapter);
    
    // 显示私聊结束提示和选择
    const dialogueText = document.getElementById('dialogue-text');
    const characterName = document.getElementById('character-name');
    
    characterName.textContent = "私聊结束";
    dialogueText.innerHTML = `
        <p style="margin-bottom: 20px;">私聊已结束。你可以选择：</p>
        <button onclick="showPrivateChatOptions()" style="
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            margin-right: 10px;
            border-radius: 5px;
            cursor: pointer;
        ">继续与其他人私聊</button>
        <button onclick="endPrivateChat()" style="
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        ">进入下一章</button>
    `;
    
    // 显示主对话界面
    document.getElementById('dialogue-box').style.display = 'block';
}

// 切换背包
function toggleBackpack(e) {
    e.stopPropagation();
    const panel = document.getElementById('backpack-panel');
    
    if (panel.classList.contains('hidden')) {
        showBackpack();
    } else {
        closeBackpack();
    }
}

// 显示背包
function showBackpack() {
    const panel = document.getElementById('backpack-panel');
    const list = document.getElementById('clues-list');
    
    list.innerHTML = '';
    
    if (gameState.collectedClues.length === 0) {
        list.innerHTML = '<p style="text-align: center; opacity: 0.6;">暂无线索</p>';
    } else {
        gameState.collectedClues.forEach(clue => {
            const item = document.createElement('div');
            item.className = 'clue-item';
            item.innerHTML = `
                <h4>${clue.title}</h4>
                <p>${clue.description}</p>
            `;
            list.appendChild(item);
        });
    }
    
    panel.classList.remove('hidden');
}

// 关闭背包
function closeBackpack() {
    document.getElementById('backpack-panel').classList.add('hidden');
}

// 更新线索计数
function updateClueCount() {
    document.getElementById('clue-count').textContent = gameState.collectedClues.length;
}

// 游戏结束
function endGame() {
    gameState.isPlaying = false;
    const dialogueBox = document.getElementById('dialogue-box');
    dialogueBox.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2 style="color: #fff; margin-bottom: 20px;">游戏结束</h2>
            <p style="margin-bottom: 30px; color: rgba(255,255,255,0.8);">感谢您的游玩！</p>
            <button onclick="location.reload()" style="
                background: #fff;
                color: #000;
                border: none;
                padding: 15px 40px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">重新开始</button>
        </div>
    `;
}

// 返回主页功能
function returnToHome() {
    // 确认对话
    if (confirm('确定要返回主页吗？当前游戏进度将丢失。')) {
        // 重置游戏状态
        gameState.isPlaying = false;
        gameState.currentChapter = 0;
        gameState.currentDialogue = 0;
        gameState.selectedCharacter = null;
        gameState.collectedClues = [];
        gameState.inPrivateChat = false;
        gameState.currentPrivateChat = null;
        gameState.privateChatIndex = 0;
        gameState.savedDialogueIndex = undefined;
        
        // 隐藏所有游戏界面元素
        document.getElementById('chapter-title').style.display = 'none';
        document.getElementById('dialogue-box').style.display = 'none';
        document.getElementById('backpack-btn').style.display = 'none';
        document.getElementById('home-btn').style.display = 'none';
        document.getElementById('character-portrait').innerHTML = '';
        document.getElementById('backpack-panel').classList.add('hidden');
        
        // 清除背景
        document.getElementById('background').style.backgroundImage = '';
        document.getElementById('background').className = 'background-layer';
        
        // 显示角色选择界面
        showCharacterSelection();
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);