// 在文件最开始添加错误处理
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error:', msg, url, lineNo, columnNo, error);
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '游戏运行出错，请查看控制台以获取详细信息';
        errorDiv.style.display = 'block';
        document.getElementById('loadingMessage').style.display = 'none';
    }
    return false;
};

// 游戏状态
const gameState = {
    plants: [],
    level: 1,
    money: 100,
    selectedPlant: null,
    initialized: false,
    lastTime: 0,
    version: '1.1',
    plantImages: {},
    effects: [], // 用于存储视觉效果
    notifications: [], // 用于存储通知消息
    sounds: {} // 用于存储音效
};

const cellSize = 100;
const GROWTH_TIME = 5000; // 设置为5秒，让游戏节奏更好

// 植物类型
const availablePlants = [
    { name: '胡萝卜', cost: 10, reward: 20, levelRequired: 1, imagePath: 'assets/carrot.png' },
    { name: '白菜', cost: 20, reward: 40, levelRequired: 2, imagePath: 'assets/cabbage.png' },
    { name: '草莓', cost: 40, reward: 80, levelRequired: 3, imagePath: 'assets/strawberry.png' },
    { name: '西瓜', cost: 80, reward: 160, levelRequired: 4, imagePath: 'assets/watermelon.png' }
];

// 音效路径配置
const soundEffects = {
    plant: 'assets/plant.mp3',
    harvest: 'assets/coin.mp3',
    levelUp: 'assets/levelup.mp3',
    error: 'assets/error.mp3'
};

// 加载音效
function loadSounds() {
    return new Promise((resolve, reject) => {
        let loadedSounds = 0;
        const totalSounds = Object.keys(soundEffects).length;

        for (const [key, path] of Object.entries(soundEffects)) {
            const audio = new Audio(path);
            audio.addEventListener('canplaythrough', () => {
                loadedSounds++;
                gameState.sounds[key] = audio;
                if (loadedSounds === totalSounds) {
                    resolve();
                }
            });
            audio.addEventListener('error', (e) => {
                console.error(`无法加载音效: ${path}`, e);
                loadedSounds++;
                if (loadedSounds === totalSounds) {
                    resolve();
                }
            });
        }
    });
}

// 播放音效
function playSound(soundName) {
    const sound = gameState.sounds[soundName];
    if (sound) {
        sound.currentTime = 0; // 重置音效到开始位置
        sound.play().catch(e => console.error('播放音效失败:', e));
    }
}

// 游戏初始化
function init() {
    console.log('游戏初始化开始');
    showDebug('正在初始化游戏...');

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        showError('找不到游戏画布');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        showError('无法获取画布上下文');
        return;
    }

    // 显示加载进度
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('加载游戏资源...', canvas.width / 2, canvas.height / 2);

    let loadedImages = 0;
    const totalImages = availablePlants.length;

    showDebug(`开始加载 ${totalImages} 个图片资源`);

    // 加载图片
    availablePlants.forEach(plant => {
        const img = new Image();
        img.onload = () => {
            loadedImages++;
            gameState.plantImages[plant.name] = img;
            showDebug(`已加载 ${loadedImages}/${totalImages} 个图片`);

            // 更新加载进度
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.fillText(`加载游戏资源... ${Math.floor((loadedImages / totalImages) * 100)}%`, canvas.width / 2, canvas.height / 2);

            if (loadedImages === totalImages) {
                showDebug('所有图片加载完成，开始游戏');
                startGame(canvas, ctx);
            }
        };
        img.onerror = () => {
            showError(`无法加载图片: ${plant.imagePath}`);
            console.error(`Failed to load ${plant.imagePath}`);
        };
        img.src = plant.imagePath;
    });
}

// 开始游戏
function startGame(canvas, ctx) {
    showDebug('游戏启动中...');
    
    // 加载保存的游戏数据
    loadGameData();
    showDebug('游戏数据加载完成');

    // 加载音效
    loadSounds().then(() => {
        showDebug('音效加载完成');
    }).catch(error => {
        console.error('加载音效时出错:', error);
    });

    // 添加点击事件
    canvas.addEventListener('click', (event) => handleClick(event, canvas));
    showDebug('游戏控制已启用');

    // 开始游戏循环
    function gameLoop() {
        if (!gameState.initialized) {
            gameState.initialized = true;
            showDebug('游戏循环开始运行');
        }
        update();
        draw(ctx, canvas);
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // 隐藏加载信息
    document.getElementById('loadingMessage').style.display = 'none';
}

// 保存游戏数据
function saveGameData() {
    localStorage.setItem('gameData', JSON.stringify({
        plants: gameState.plants,
        level: gameState.level,
        money: gameState.money
    }));
}

// 加载游戏数据
function loadGameData() {
    const data = localStorage.getItem('gameData');
    if (data) {
        const saved = JSON.parse(data);
        gameState.plants = saved.plants || [];
        gameState.level = saved.level || 1;
        gameState.money = saved.money || 100;
    }
}

// 计算升级所需金币
function calculateRequiredMoney(level) {
    return Math.pow(2, level - 1) * 100;
}

// 添加金币效果
function addCoinEffect(x, y, amount) {
    gameState.effects.push({
        type: 'coin',
        x: x,
        y: y,
        amount: amount,
        startTime: Date.now(),
        duration: 1000
    });
}

// 添加通知
function addNotification(message, type = 'info') {
    gameState.notifications.push({
        message,
        type,
        startTime: Date.now(),
        duration: 2000
    });
}

// 更新游戏状态
function update() {
    const now = Date.now();
    const plantsToHarvest = [];

    // 更新植物
    gameState.plants.forEach((plant, index) => {
        const growthProgress = Math.min(1, (now - plant.plantTime) / GROWTH_TIME);
        plant.scale = 0.5 + (growthProgress * 0.5);
        plant.swing = Math.sin((now / 1000) * 2 + index) * 0.05;

        if (now - plant.plantTime >= GROWTH_TIME) {
            plantsToHarvest.push(index);
        }
    });

    // 处理收获
    for (let i = plantsToHarvest.length - 1; i >= 0; i--) {
        const index = plantsToHarvest[i];
        const plant = gameState.plants[index];
        const centerX = plant.x * cellSize + cellSize / 2;
        const centerY = plant.y * cellSize + 150;
        
        playSound('harvest');
        addCoinEffect(centerX, centerY, plant.reward);
        addNotification(`收获 ${plant.name}，获得 $${plant.reward}！`);
        
        gameState.money += plant.reward;
        gameState.plants.splice(index, 1);

        // 检查升级
        const requiredMoney = calculateRequiredMoney(gameState.level);
        if (gameState.money >= requiredMoney) {
            gameState.level++;
            addNotification(`恭喜升级到 ${gameState.level} 级！`, 'success');
            showLevelUpMessage();
        }
    }

    // 更新效果
    gameState.effects = gameState.effects.filter(effect => {
        return now - effect.startTime < effect.duration;
    });

    // 更新通知
    gameState.notifications = gameState.notifications.filter(notification => {
        return now - notification.startTime < notification.duration;
    });

    saveGameData();
}

// 显示升级消息
function showLevelUpMessage() {
    playSound('levelUp');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 保存当前状态
    ctx.save();
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制升级消息
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`恭喜升级到 ${gameState.level} 级！`, canvas.width/2, canvas.height/2);
    
    // 显示下一级所需金币
    ctx.font = '24px Arial';
    const nextLevelMoney = calculateRequiredMoney(gameState.level);
    ctx.fillText(`下一级需要: ${nextLevelMoney} 金币`, canvas.width/2, canvas.height/2 + 50);
    
    // 恢复状态
    ctx.restore();
    
    // 2秒后消失
    setTimeout(() => {
        requestAnimationFrame(() => draw(ctx, canvas));
    }, 2000);
}

// 绘制游戏
function draw(ctx, canvas) {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制顶部菜单背景
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, 50);

    // 计算植物菜单的总宽度
    const menuWidth = availablePlants.length * 80; // 每个按钮宽度改为80px
    const startX = (canvas.width - menuWidth) / 2; // 居中植物菜单

    // 绘制游戏标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('快乐农场', startX / 2, 35); // 将标题放在左侧

    // 绘制菜单按钮
    availablePlants.forEach((plant, index) => {
        const enabled = gameState.money >= plant.cost && gameState.level >= plant.levelRequired;
        const x = startX + index * 80; // 使用新的起始位置和宽度
        
        // 绘制按钮背景
        ctx.fillStyle = enabled ? '#66BB6A' : '#A5D6A7';
        ctx.fillRect(x, 5, 75, 40); // 稍微缩小按钮并留出间距
        ctx.strokeStyle = '#2E7D32';
        ctx.strokeRect(x, 5, 75, 40);

        // 绘制植物图片
        const img = gameState.plantImages[plant.name];
        if (img) {
            ctx.drawImage(img, x + 5, 10, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${plant.cost}`, x + 50, 30);
        }
    });

    // 绘制金钱显示（放在右侧）
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`$${gameState.money}`, canvas.width - 20, 35);

    // 绘制网格
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 5; j++) {
            ctx.fillStyle = '#e8f5e9';
            ctx.fillRect(i * cellSize, j * cellSize + 100, cellSize, cellSize);
            ctx.strokeStyle = '#81c784';
            ctx.strokeRect(i * cellSize, j * cellSize + 100, cellSize, cellSize);
        }
    }

    // 绘制植物
    gameState.plants.forEach(plant => {
        const img = gameState.plantImages[plant.name];
        if (img) {
            ctx.save();
            
            const centerX = plant.x * cellSize + cellSize / 2;
            const centerY = plant.y * cellSize + 150;
            
            ctx.translate(centerX, centerY);
            
            if (plant.swing !== undefined) {
                ctx.rotate(plant.swing);
            }
            
            const scale = plant.scale || 1;
            ctx.scale(scale, scale);
            
            const drawWidth = cellSize - 10;
            const drawHeight = cellSize - 10;
            ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
            
            // 绘制生长进度
            const progress = Math.min(1, (Date.now() - plant.plantTime) / GROWTH_TIME);
            const progressWidth = drawWidth * 0.8;
            const progressHeight = 5;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-progressWidth/2, drawHeight/2 + 5, progressWidth, progressHeight);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(-progressWidth/2, drawHeight/2 + 5, progressWidth * progress, progressHeight);
            
            ctx.restore();
        }
    });

    // 绘制进度条
    const requiredMoney = calculateRequiredMoney(gameState.level);
    const progress = Math.min(1, gameState.money / requiredMoney);
    drawProgressBar(ctx, 10, 550, 200, 20, progress);

    // 绘制重置按钮
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(700, 540, 80, 30);
    ctx.strokeStyle = '#d84315';
    ctx.strokeRect(700, 540, 80, 30);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('重置游戏', 740, 560);

    // 绘制选中提示
    if (gameState.selectedPlant) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`已选择: ${gameState.selectedPlant.name}`, 400, 580);
    }

    // 绘制效果
    gameState.effects.forEach(effect => {
        if (effect.type === 'coin') {
            const progress = (Date.now() - effect.startTime) / effect.duration;
            const alpha = 1 - progress;
            const offsetY = progress * -50; // 向上飘动

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`+$${effect.amount}`, effect.x, effect.y + offsetY);
            ctx.restore();
        }
    });

    // 绘制通知
    gameState.notifications.forEach((notification, index) => {
        const progress = (Date.now() - notification.startTime) / notification.duration;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = notification.type === 'success' ? '#4CAF50' : '#2196F3';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.message, canvas.width / 2, 80 + index * 25);
        ctx.restore();
    });
}

// 绘制进度条
function drawProgressBar(ctx, x, y, width, height, progress) {
    const requiredMoney = calculateRequiredMoney(gameState.level);
    
    // 绘制背景
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x, y, width, height);
    
    // 绘制进度
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x, y, width * progress, height);
    
    // 绘制边框
    ctx.strokeStyle = '#2E7D32';
    ctx.strokeRect(x, y, width, height);
    
    // 绘制文字
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`等级 ${gameState.level}`, x + 10, y + 15);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(progress * 100)}% (${gameState.money}/${requiredMoney}金币)`, x + width - 10, y + 15);
}

// 处理点击
function handleClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检查重置按钮
    if (x >= 700 && x <= 780 && y >= 540 && y <= 570) {
        if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
            playSound('error');
            gameState.plants = [];
            gameState.level = 1;
            gameState.money = 100;
            gameState.selectedPlant = null;
            saveGameData();
        }
        return;
    }

    // 检查植物选择
    if (y < 50) {
        const menuWidth = availablePlants.length * 80;
        const startX = (canvas.width - menuWidth) / 2;
        const index = Math.floor((x - startX) / 80);
        
        if (index >= 0 && index < availablePlants.length) {
            const plant = availablePlants[index];
            if (gameState.money >= plant.cost && gameState.level >= plant.levelRequired) {
                gameState.selectedPlant = plant;
            } else {
                playSound('error');
            }
        }
    }
    // 检查种植区域
    else if (y > 100 && gameState.selectedPlant) {
        const gridX = Math.floor(x / 100);
        const gridY = Math.floor((y - 100) / 100);
        if (!gameState.plants.some(p => p.x === gridX && p.y === gridY)) {
            if (gameState.money >= gameState.selectedPlant.cost) {
                playSound('plant');
                gameState.plants.push({
                    name: gameState.selectedPlant.name,
                    x: gridX,
                    y: gridY,
                    plantTime: Date.now(),
                    reward: gameState.selectedPlant.reward,
                    scale: 0.5,
                    swing: 0
                });
                gameState.money -= gameState.selectedPlant.cost;
                addNotification(`种植了 ${gameState.selectedPlant.name}`);
                saveGameData();
            } else {
                playSound('error');
                addNotification('金币不足！', 'error');
            }
        } else {
            playSound('error');
            addNotification('这块地已经种植了！', 'error');
        }
    }
}

// 启动游戏
window.addEventListener('load', () => {
    console.log('页面加载完成，准备初始化游戏');
    setTimeout(init, 100); // 给予一些时间让页面完全准备好
});

// 添加调试函数到全局作用域
window.showDebug = function(message) {
    const debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
        debugDiv.style.display = 'block';
        debugDiv.textContent = message;
    }
    console.log(message);
};

window.showError = function(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        document.getElementById('loadingMessage').style.display = 'none';
    }
    console.error(message);
};
