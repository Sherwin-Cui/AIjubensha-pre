const fs = require('fs');
const path = require('path');

// 读取脚本文件
const scriptPath = path.join(__dirname, '脚本.txt');
const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
const lines = scriptContent.split('\n');

// 数据结构
const gameData = {
    chapters: [],
    characters: new Set(),
    clues: []
};

let currentChapter = null;
let dialogueIndex = 0;

// 解析每一行
lines.forEach((line, lineIndex) => {
    line = line.trim();
    if (!line) return;
    
    // 匹配章节标题
    if (line.startsWith('## ')) {
        const chapterMatch = line.match(/## 第(.+?)章[：:]\s*(.+)/);
        if (chapterMatch) {
            currentChapter = {
                id: gameData.chapters.length + 1,
                title: chapterMatch[2],
                chapterNum: chapterMatch[1],
                dialogues: []
            };
            gameData.chapters.push(currentChapter);
        }
    }
    // 匹配场景切换
    else if (line.startsWith('【切换场景')) {
        const sceneMatch = line.match(/【切换场景[：:]\s*(.+?)】/);
        if (sceneMatch && currentChapter) {
            currentChapter.dialogues.push({
                id: dialogueIndex++,
                type: 'scene',
                text: sceneMatch[1]
            });
        }
    }
    // 匹配线索发现
    else if (line.startsWith('【发现线索')) {
        const clueMatch = line.match(/【发现线索[：:]\s*(.+?)】(.+)/);
        if (clueMatch && currentChapter) {
            const clue = {
                id: gameData.clues.length + 1,
                title: clueMatch[1],
                description: clueMatch[2].trim()
            };
            gameData.clues.push(clue);
            currentChapter.dialogues.push({
                id: dialogueIndex++,
                type: 'clue',
                clueId: clue.id,
                title: clue.title,
                description: clue.description
            });
        }
    }
    // 匹配对话
    else if (line.startsWith('【')) {
        const dialogueMatch = line.match(/【(.+?)】\s*(.+)/);
        if (dialogueMatch && currentChapter) {
            const character = dialogueMatch[1];
            const text = dialogueMatch[2];
            
            // 提取动作描述（括号中的内容）
            const actionMatch = text.match(/^\((.+?)\)\s*(.+)/);
            let action = '';
            let dialogue = text;
            
            if (actionMatch) {
                action = actionMatch[1];
                dialogue = actionMatch[2];
            }
            
            // 统一处理角色名错别字
            let normalizedCharacter = character;
            if (character === '维多多利亚') normalizedCharacter = '维多利亚';
            
            gameData.characters.add(normalizedCharacter);
            currentChapter.dialogues.push({
                id: dialogueIndex++,
                type: 'dialogue',
                character: normalizedCharacter,
                action: action,
                text: dialogue
            });
        }
    }
});

// 转换characters为对象，过滤掉非角色内容
const characterMap = {};
const validCharacters = ['劳森', '鲍勃', '提图芭', '维多利亚', '玩家', 'DM', '镇民', '镇民们', '酒吧老板'];

Array.from(gameData.characters).forEach(char => {
    // 过滤掉"结局"等非角色标签
    if (char === '结局' || char === '切换场景') return;
    
    // 统一处理错别字和重复
    let normalizedChar = char;
    if (char === '维多多利亚') normalizedChar = '维多利亚';
    
    characterMap[normalizedChar] = {
        name: normalizedChar,
        displayName: getDisplayName(normalizedChar)
    };
});

function getDisplayName(character) {
    const nameMap = {
        '劳森': '西蒙·劳森',
        '鲍勃': '鲍勃·卡里尔',
        '提图芭': '提图芭',
        '维多利亚': '维多利亚·达斯汀',
        '玩家': '副总督',
        'DM': '旁白',
        '镇民': '镇民',
        '镇民们': '镇民们',
        '酒吧老板': '酒吧老板'
    };
    return nameMap[character] || character;
}

// 输出统计信息
console.log(`解析完成！`);
console.log(`- 章节数: ${gameData.chapters.length}`);
console.log(`- 角色数: ${gameData.characters.size}`);
console.log(`- 线索数: ${gameData.clues.length}`);
console.log(`- 总对话数: ${dialogueIndex}`);

// 生成JavaScript数据文件
const outputData = `// 自动生成的剧本数据
const gameData = ${JSON.stringify({
    chapters: gameData.chapters,
    characters: characterMap,
    clues: gameData.clues
}, null, 2)};`;

fs.writeFileSync(path.join(__dirname, 'data.js'), outputData);
console.log('\n数据已保存到 data.js');