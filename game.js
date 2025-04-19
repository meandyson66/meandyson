const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
let plants = [];
let level = 1;
let money = 100;
let selectedPlant = null;
const cellSize = 100;
const GROWTH_TIME = 1000; // 植物生长时间（毫秒）

// 植物类型
const availablePlants = [
    { name: '胡萝卜', cost: 10, reward: 20, levelRequired: 1, imagePath: 'assets/carrot.png.png' },
    { name: '白菜', cost: 15, reward: 30, levelRequired: 2, imagePath: 'assets/cabbage.png.png' },
    { name: '草莓', cost: 20, reward: 40, levelRequired: 3, imagePath: 'assets/strawberry.png.png' },
    { name: '西瓜', cost: 30, reward: 60, levelRequired: 4, imagePath: 'assets/watermelon.png.png' }
];

// 加载植物图片
const plantImages = {};
availablePlants.forEach(plant => {
    const img = new Image();
    img.src = plant.imagePath;
    plantImages[plant.name] = img;
});

// 加载游戏数据
function loadGameData() {
    const savedData = localStorage.getItem('gameData');
    if (savedData) {
        const data = JSON.parse(savedData);
        plants = data.plants || [];
        level = data.level || 1;
        money = data.money || 100;
        selectedPlant = null;
    }
}

// 保存游戏数据
function saveGameData() {
    const gameData = {
        plants,
        level,
        money
    };
    localStorage.setItem('gameData', JSON.stringify(gameData));
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制顶部菜单背景
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, 50);

    // 绘制种植区域网格
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 5; j++) {
            // 绘制网格背景
            ctx.fillStyle = '#e8f5e9';
            ctx.fillRect(i * cellSize, j * cellSize + 100, cellSize, cellSize);
            // 绘制网格线
            ctx.strokeStyle = '#81c784';
            ctx.strokeRect(i * cellSize, j * cellSize + 100, cellSize, cellSize);
        }
    }

    // 绘制植物
    plants.forEach(plant => {
        const img = plantImages[plant.name];
        if (img) {
            ctx.drawImage(img, plant.x * cellSize + 5, plant.y * cellSize + 105, cellSize - 10, cellSize - 10);
        }
    });

    // 绘制顶部菜单
    availablePlants.forEach((plant, index) => {
        // 绘制按钮背景
        ctx.fillStyle = money >= plant.cost && level >= plant.levelRequired ? '#66BB6A' : '#A5D6A7';
        ctx.fillRect(index * 100, 0, 100, 50);
        ctx.strokeStyle = '#2E7D32';
        ctx.strokeRect(index * 100, 0, 100, 50);

        const img = plantImages[plant.name];
        if (img) {
            ctx.drawImage(img, index * 100 + 30, 10, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${plant.cost}`, index * 100 + 70, 30);
        }
    });

    // 绘制等级进度条
    const levelProgress = (money % (level * 100)) / (level * 100);
    drawProgressBar(10, 550, 200, 20, levelProgress, '#4CAF50');

    // 绘制金钱显示
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`金钱: $${money}`, 790, 590);

    // 如果选择了植物，显示提示
    if (selectedPlant) {
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`已选择: ${selectedPlant.name}`, 400, 580);
    }
}

// 绘制进度条
function drawProgressBar(x, y, width, height, progress, color) {
    // 绘制背景
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(x, y, width, height);

    // 绘制进度
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * progress, height);

    // 绘制等级和进度文字
    ctx.fillStyle = 'black';
    ctx.fillText(`等级 ${level}`, x + 40, y + height / 2);
    ctx.fillText(`${Math.floor(progress * 100)}%`, x + width - 30, y + height / 2);
}

// 处理点击事件
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 检查是否点击了植物选择区域
    if (y < 50) {
        const plantIndex = Math.floor(x / 100);
        if (plantIndex < availablePlants.length) {
            const plant = availablePlants[plantIndex];
            if (money >= plant.cost && plant.levelRequired <= level) {
                selectedPlant = plant;
                console.log(`选择了植物: ${plant.name}`);
            }
        }
    }
    // 检查是否点击了种植区域
    else if (y > 100) {
        if (selectedPlant) {
            const gridX = Math.floor(x / 100);
            const gridY = Math.floor((y - 100) / 100);
            if (canPlantAt(gridX, gridY)) {
                console.log(`在位置 (${gridX}, ${gridY}) 种植了 ${selectedPlant.name}`);
                plant(gridX, gridY);
            }
        }
    }
});

// 检查是否可以种植
function canPlantAt(x, y) {
    return !plants.some(plant => plant.x === x && plant.y === y);
}

// 种植植物
function plant(x, y) {
    if (selectedPlant && money >= selectedPlant.cost) {
        plants.push({
            name: selectedPlant.name,
            x,
            y,
            plantTime: Date.now(),
            reward: selectedPlant.reward
        });
        money -= selectedPlant.cost;
    }
}

// 添加更新函数
function update() {
    const now = Date.now();
    const plantsToHarvest = [];

    // 检查植物是否可以收获
    plants.forEach((plant, index) => {
        if (now - plant.plantTime >= GROWTH_TIME) {
            plantsToHarvest.push(index);
        }
    });

    // 从后往前收获植物，以避免数组索引问题
    for (let i = plantsToHarvest.length - 1; i >= 0; i--) {
        const index = plantsToHarvest[i];
        const plant = plants[index];
        money += plant.reward;
        plants.splice(index, 1);
        
        // 检查是否升级
        if (money >= level * 100) {
            level++;
            console.log(`升级到 ${level} 级！`);
        }
    }
}

// 修改游戏循环
function gameLoop() {
    update();
    draw();
    saveGameData();
    requestAnimationFrame(gameLoop);
}

// 在游戏启动时加载数据
loadGameData();
gameLoop(); 
