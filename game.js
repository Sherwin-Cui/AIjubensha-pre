// 游戏状态
let gameState = {
    currentChapter: 0,
    currentDialogue: 0,
    collectedClues: [],
    isPlaying: false
};

// 角色立绘映射
const characterPortraits = {
    '劳森': 'assets/characters/lawson.webp',
    '鲍勃': 'assets/characters/bob.webp',
    '提图芭': 'assets/characters/tituba.webp',
    '维多利亚': 'assets/characters/Victoria.webp',
    '玩家': null, // 玩家无立绘
    'DM': null, // 旁白无立绘
    '镇民': null,
    '镇民们': null,
    '酒吧老板': null
};

// 章节背景图片
const chapterBackgrounds = [
    'assets/scenes/chapter1.webp', // 第一章
    'assets/scenes/chapter2.webp', // 第二章
    'assets/scenes/chapter3.webp', // 第三章
    'assets/scenes/chapter4.webp'  // 第四章
];

// 初始化游戏
function initGame() {
    document.getElementById('game-container').addEventListener('click', handleClick);
    document.getElementById('backpack-btn').addEventListener('click', toggleBackpack);
    updateClueCount();
}

// 开始游戏
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.isPlaying = true;
    loadChapter(0);
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
    document.getElementById('background').style.backgroundImage = `url('${bgUrl}')`;
    document.getElementById('background').style.backgroundSize = 'cover';
    document.getElementById('background').style.backgroundPosition = 'center';
    
    // 显示第一条对话
    showDialogue();
}

// 显示对话
function showDialogue() {
    const chapter = gameData.chapters[gameState.currentChapter];
    if (!chapter || gameState.currentDialogue >= chapter.dialogues.length) {
        // 章节结束，进入下一章
        loadChapter(gameState.currentChapter + 1);
        return;
    }
    
    const dialogue = chapter.dialogues[gameState.currentDialogue];
    
    switch(dialogue.type) {
        case 'dialogue':
            showCharacterDialogue(dialogue);
            break;
        case 'clue':
            showClue(dialogue);
            break;
        case 'scene':
            showSceneTransition(dialogue);
            break;
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
    
    // 强制重绘
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
        // 有立绘图片 - 重置并重新触发动画
        portrait.style.animation = 'none';
        portrait.offsetHeight; // 强制重绘
        portrait.style.backgroundImage = `url('${portraitUrl}')`;
        portrait.style.backgroundSize = 'contain';
        portrait.style.backgroundPosition = 'right center'; // 改为右对齐
        portrait.style.backgroundRepeat = 'no-repeat';
        portrait.textContent = '';
        portrait.style.animation = 'characterSlideIn 0.6s ease-out forwards';
        portrait.style.animationDelay = '0.2s';
    } else {
        // 无立绘，淡出效果
        portrait.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            portrait.style.backgroundImage = 'none';
            portrait.textContent = '';
        }, 300);
    }
    
    // 特殊处理DM旁白
    if (dialogue.character === 'DM') {
        characterName.style.color = 'rgba(255,255,255,0.5)';
        // DM旁白时隐藏立绘
        portrait.style.animation = 'fadeOut 0.3s forwards';
    } else {
        characterName.style.color = 'rgba(255,255,255,0.7)';
    }
}

// 显示线索
function showClue(clue) {
    const popup = document.getElementById('clue-popup');
    const title = document.getElementById('clue-title');
    const desc = document.getElementById('clue-description');
    
    title.textContent = clue.title;
    desc.textContent = clue.description;
    
    popup.classList.remove('hidden');
    
    // 添加到收集的线索
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

// 显示场景切换
function showSceneTransition(scene) {
    const transition = document.getElementById('scene-transition');
    const text = document.getElementById('scene-text');
    
    text.textContent = scene.text;
    transition.classList.remove('hidden');
    
    setTimeout(() => {
        transition.classList.add('hidden');
        nextDialogue();
    }, 2000);
}

// 下一条对话
function nextDialogue() {
    gameState.currentDialogue++;
    showDialogue();
}

// 处理点击事件
function handleClick(e) {
    if (!gameState.isPlaying) return;
    
    // 忽略按钮点击
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    // 忽略弹窗点击
    if (!document.getElementById('clue-popup').classList.contains('hidden')) return;
    if (!document.getElementById('backpack-panel').classList.contains('hidden')) return;
    if (!document.getElementById('scene-transition').classList.contains('hidden')) return;
    
    nextDialogue();
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
    
    // 清空并重新填充线索列表
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
            <h2 style="color: #d4af37; margin-bottom: 20px;">游戏结束</h2>
            <p style="margin-bottom: 30px;">感谢您的游玩！</p>
            <button onclick="location.reload()" style="
                background: #d4af37;
                color: #000;
                border: none;
                padding: 10px 30px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">重新开始</button>
        </div>
    `;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initGame);