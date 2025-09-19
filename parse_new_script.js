const fs = require('fs');
const path = require('path');

// 读取新脚本文件
const scriptPath = path.join(__dirname, '新脚本.md');
const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
const lines = scriptContent.split('\n');

// 数据结构
const gameData = {
    characterSelection: [],
    chapters: [],
    privateChats: {},
    characters: {},
    clues: []
};

let currentChapter = null;
let dialogueIndex = 0;
let currentPrivateChat = null;
let currentSearchPoint = null;
let isParsingCharacterSelection = false;
let isParsingPrivateChat = false;

// 解析每一行
lines.forEach((line, lineIndex) => {
    line = line.trim();
    if (!line) return;
    
    // 检测角色选择开始
    if (line.includes('**请选择你要扮演的角色：**')) {
        isParsingCharacterSelection = true;
        return;
    }
    
    // 解析角色选择
    if (isParsingCharacterSelection && line.startsWith('### ')) {
        const match = line.match(/### (\d+)\.\s*(.+?)（(.+?)）/);
        if (match) {
            const [, id, name, role] = match;
            // 获取下一行的描述
            const nextLine = lines[lineIndex + 1];
            const description = nextLine ? nextLine.trim() : '';
            
            gameData.characterSelection.push({
                id: parseInt(id),
                name: name,
                role: role,
                description: description
            });
        }
    }
    
    // 检测角色选择结束
    if (line.includes('## 第一章：')) {
        isParsingCharacterSelection = false;
    }
    
    // 匹配章节标题
    if (line.startsWith('## 第') && line.includes('章：')) {
        const chapterMatch = line.match(/## 第(.+?)章[：:]\s*(.+)/);
        if (chapterMatch) {
            currentChapter = {
                id: gameData.chapters.length + 1,
                title: chapterMatch[2],
                chapterNum: chapterMatch[1],
                dialogues: [],
                searchPoints: [],
                chatOpportunity: null
            };
            
            // 为第一章添加DM开场介绍
            if (chapterMatch[1] === '一') {
                currentChapter.dialogues.push({
                    id: dialogueIndex++,
                    type: 'dialogue',
                    character: 'DM',
                    action: '',
                    text: '欢迎来到1666年的萨勒密小镇，这是一个被恐惧与迷信笼罩的时代。三天前，镇上的牧师离奇死亡，症状诡异——没有外伤，却浑身抽搐，口中呓语。镇民们惊恐不安，纷纷传言这是巫术作祟。在这个充满猜疑和仇恨的夜晚，六个人被召集到昏暗的集会所中。他们都与死者有着复杂的关系，每个人都可能是凶手，也都可能是下一个受害者。'
                });
            }
            
            gameData.chapters.push(currentChapter);
        }
    }
    
    // 匹配私聊时机
    else if (line.startsWith('## 私聊时机：')) {
        if (currentChapter) {
            currentChapter.chatOpportunity = {
                id: `chat_${currentChapter.id}`,
                title: line.replace('## 私聊时机：', '').trim()
            };
        }
    }
    
    // 匹配私聊选择
    else if (line.startsWith('【私聊选择】')) {
        isParsingPrivateChat = true;
        currentPrivateChat = {
            options: []
        };
    }
    
    // 解析私聊选项
    else if (isParsingPrivateChat && line.startsWith('├ 选项')) {
        const optionMatch = line.match(/├ 选项([A-F])：(.+)/);
        if (optionMatch && currentPrivateChat) {
            currentPrivateChat.options.push({
                key: optionMatch[1],
                text: optionMatch[2]
            });
        }
    }
    
    // 匹配具体私聊对话
    else if (line.startsWith('【私聊：维多利亚 × ')) {
        const chatMatch = line.match(/【私聊：维多利亚 × (.+?)】/);
        if (chatMatch && currentChapter) {
            const partnerName = chatMatch[1];
            const chapterId = currentChapter.id;
            const chatId = `chat_${chapterId}_victoria_${partnerName}`;
            
            if (!gameData.privateChats[chatId]) {
                gameData.privateChats[chatId] = {
                    chapterId: chapterId,
                    participants: ['维多利亚', partnerName],
                    dialogues: []
                };
            }
            currentPrivateChat = gameData.privateChats[chatId];
        }
    }
    
    // 私聊对话内容
    else if (currentPrivateChat && currentPrivateChat.dialogues !== undefined && line.startsWith('【') && !line.includes('私聊结束')) {
        const dialogueMatch = line.match(/【(.+?)】(.+)/);
        if (dialogueMatch) {
            currentPrivateChat.dialogues.push({
                character: dialogueMatch[1],
                text: dialogueMatch[2].trim()
            });
        }
    }
    
    // 私聊结束
    else if (line.startsWith('【私聊结束】')) {
        isParsingPrivateChat = false;
        currentPrivateChat = null;
    }
    
    // 匹配搜查点
    else if (line.startsWith('【搜查】')) {
        const searchMatch = line.match(/【搜查】(.+)/);
        if (searchMatch && currentChapter) {
            currentSearchPoint = {
                id: `search_${currentChapter.id}_${currentChapter.searchPoints.length + 1}`,
                title: searchMatch[1],
                options: []
            };
            currentChapter.searchPoints.push(currentSearchPoint);
        }
    }
    
    // 搜查选项
    else if (currentSearchPoint && line.startsWith('├ 选项')) {
        const optionMatch = line.match(/├ 选项([A-C])：(.+)/);
        if (optionMatch) {
            currentSearchPoint.options.push({
                key: optionMatch[1],
                text: optionMatch[2],
                result: null
            });
        }
    }
    
    // 搜查结果
    else if (line.startsWith('【选项') && line.includes('结果】')) {
        const resultMatch = line.match(/【选项([A-C])结果】(.+)/);
        if (resultMatch && currentSearchPoint) {
            const optionKey = resultMatch[1];
            const result = resultMatch[2];
            
            const option = currentSearchPoint.options.find(opt => opt.key === optionKey);
            if (option) {
                option.result = result;
            }
        }
    }
    
    // 匹配线索发现
    else if (line.startsWith('【发现线索：')) {
        const clueMatch = line.match(/【发现线索[：:]\s*(.+?)】(.+)/);
        if (clueMatch && currentChapter) {
            const clue = {
                id: gameData.clues.length + 1,
                title: clueMatch[1],
                description: clueMatch[2].trim()
            };
            gameData.clues.push(clue);
            
            // 将线索添加到当前对话中
            currentChapter.dialogues.push({
                id: dialogueIndex++,
                type: 'clue',
                clueId: clue.id,
                title: clue.title,
                description: clue.description
            });
        }
    }
    
    // 匹配普通对话
    else if (line.startsWith('【') && !isParsingPrivateChat) {
        const dialogueMatch = line.match(/【(.+?)】\s*(.+)/);
        if (dialogueMatch && currentChapter) {
            const character = dialogueMatch[1];
            const text = dialogueMatch[2];
            
            // 跳过一些特殊标记
            if (character === 'DM' || character === '维多利亚' || character === '劳森' || 
                character === '鲍勃' || character === '提图芭' || character === '阿比盖尔' || 
                character === '格里格斯') {
                
                // 提取动作描述
                const actionMatch = text.match(/^\((.+?)\)\s*(.+)/);
                let action = '';
                let dialogue = text;
                
                if (actionMatch) {
                    action = actionMatch[1];
                    dialogue = actionMatch[2];
                }
                
                currentChapter.dialogues.push({
                    id: dialogueIndex++,
                    type: 'dialogue',
                    character: character,
                    action: action,
                    text: dialogue
                });
            }
        }
    }
});

// 生成角色映射
const characterNames = ['劳森', '鲍勃', '提图芭', '维多利亚', '阿比盖尔', '格里格斯'];
characterNames.forEach(name => {
    let displayName = name;
    let fileName = name.toLowerCase();
    
    // 特殊映射
    const nameMap = {
        '劳森': { display: '西蒙·劳森', file: 'lawson.webp' },
        '鲍勃': { display: '鲍勃·卡里尔', file: 'bob.webp' },
        '提图芭': { display: '提图芭', file: 'tituba.webp' },
        '维多利亚': { display: '维多利亚·达斯汀', file: 'Victoria.webp' },
        '阿比盖尔': { display: '阿比盖尔·帕里斯', file: 'parris.png' },
        '格里格斯': { display: '威廉·格里格斯医生', file: 'william.png' }
    };
    
    gameData.characters[name] = {
        name: name,
        displayName: nameMap[name]?.display || name,
        portrait: nameMap[name]?.file || `${fileName}.png`
    };
});

// 输出统计信息
console.log(`解析完成！`);
console.log(`- 可选角色: ${gameData.characterSelection.length}`);
console.log(`- 章节数: ${gameData.chapters.length}`);
console.log(`- 角色数: ${Object.keys(gameData.characters).length}`);
console.log(`- 私聊对话组: ${Object.keys(gameData.privateChats).length}`);
console.log(`- 线索数: ${gameData.clues.length}`);
console.log(`- 搜查点总数: ${gameData.chapters.reduce((sum, ch) => sum + ch.searchPoints.length, 0)}`);

// 生成新的数据文件
const outputData = `// 基于新脚本自动生成的游戏数据
const gameData = ${JSON.stringify(gameData, null, 2)};`;

fs.writeFileSync(path.join(__dirname, 'new_data.js'), outputData);
console.log('\n数据已保存到 new_data.js');