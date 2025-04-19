import pygame
import os
import math
from plants import Plant, PlantType

class Game:
    def __init__(self, screen):
        self.screen = screen
        self.plants = []
        self.level = 1
        self.money = 100
        self.selected_plant = None
        self.cell_size = 100  # 添加网格单元格大小
        
        # 尝试加载系统字体
        try:
            # Windows系统字体
            if os.name == 'nt':
                self.font = pygame.font.SysFont('microsoft yahei', 24)
                self.small_font = pygame.font.SysFont('microsoft yahei', 18)
            else:
                self.font = pygame.font.SysFont('arial', 24)
                self.small_font = pygame.font.SysFont('arial', 18)
        except:
            # 如果系统字体加载失败，使用默认字体
            self.font = pygame.font.Font(None, 24)
            self.small_font = pygame.font.Font(None, 18)
        
        # 定义颜色
        self.colors = {
            'background': (240, 240, 240),
            'grid': (200, 230, 200),
            'grid_line': (180, 210, 180),
            'button': (100, 200, 100),
            'button_hover': (120, 220, 120),
            'button_disabled': (200, 200, 200),
            'text': (0, 0, 0),
            'text_light': (255, 255, 255),
            'level_bar': (100, 200, 100),
            'money_bar': (255, 215, 0)
        }
        
        # 初始化可种植的植物
        self.available_plants = [
            PlantType("胡萝卜", 10, 20, 1, 5, "assets/carrot.png.png"),
            PlantType("白菜", 15, 30, 2, 8, "assets/cabbage.png.png"),
            PlantType("草莓", 20, 40, 3, 12, "assets/strawberry.png.png"),
            PlantType("西瓜", 30, 60, 4, 20, "assets/watermelon.png.png")
        ]
        
        # 创建渐变背景
        self.background = pygame.Surface((800, 600))
        for y in range(600):
            color = (240 - y//4, 240 - y//4, 240 - y//4)
            pygame.draw.line(self.background, color, (0, y), (800, y))
        
        # 加载植物图片
        self.plant_images = {}
        for plant_type in self.available_plants:
            try:
                image_path = plant_type.image_path
                print(f"尝试加载图片: {image_path}")
                if os.path.exists(image_path):
                    image = pygame.image.load(image_path).convert_alpha()
                    # 调整图片大小
                    image = pygame.transform.scale(image, (self.cell_size - 10, self.cell_size - 10))
                    self.plant_images[plant_type.name] = image
                    print(f"成功加载图片: {plant_type.name}")
                else:
                    print(f"图片文件不存在: {image_path}")
                    self.plant_images[plant_type.name] = None
            except Exception as e:
                print(f"加载图片时出错: {e}")
                self.plant_images[plant_type.name] = None
        
        print("游戏初始化完成")
    
    def draw_button(self, x, y, width, height, text, enabled=True, hover=False, image=None):
        # 绘制按钮背景
        color = self.colors['button']
        if not enabled:
            color = self.colors['button_disabled']
        elif hover:
            color = self.colors['button_hover']
        
        pygame.draw.rect(self.screen, color, (x, y, width, height), border_radius=10)
        pygame.draw.rect(self.screen, (0, 0, 0), (x, y, width, height), 2, border_radius=10)
        
        # 如果有图片，绘制图片
        if image:
            # 调整图片大小
            img_size = min(width - 20, height - 20)
            image = pygame.transform.scale(image, (img_size, img_size))
            # 居中显示图片
            img_rect = image.get_rect(center=(x + width//2, y + height//2 - 10))
            self.screen.blit(image, img_rect)
        
        # 绘制文字
        text_surface = self.font.render(text, True, self.colors['text_light'] if enabled else self.colors['text'])
        text_rect = text_surface.get_rect(center=(x + width//2, y + height - 15))
        self.screen.blit(text_surface, text_rect)
    
    def draw_progress_bar(self, x, y, width, height, progress, color):
        # 绘制进度条背景（带立体效果）
        # 绘制阴影
        pygame.draw.rect(self.screen, (180, 180, 180), (x + 2, y + 2, width, height), border_radius=5)
        # 绘制背景
        pygame.draw.rect(self.screen, (200, 200, 200), (x, y, width, height), border_radius=5)
        # 绘制边框
        pygame.draw.rect(self.screen, (0, 0, 0), (x, y, width, height), 1, border_radius=5)
        
        # 绘制进度（带渐变色效果）
        if progress > 0:
            progress_width = int(width * progress)
            
            # 创建渐变色表面
            gradient_surface = pygame.Surface((progress_width, height))
            for i in range(progress_width):
                # 计算当前位置的颜色
                ratio = i / progress_width
                # 从深色到浅色的渐变
                r = int(color[0] * (0.7 + 0.3 * ratio))
                g = int(color[1] * (0.7 + 0.3 * ratio))
                b = int(color[2] * (0.7 + 0.3 * ratio))
                # 绘制垂直线
                pygame.draw.line(gradient_surface, (r, g, b), (i, 0), (i, height))
            
            # 添加高光效果
            highlight_surface = pygame.Surface((progress_width, height//3), pygame.SRCALPHA)
            for i in range(progress_width):
                alpha = int(100 * (1 - i / progress_width))
                pygame.draw.line(highlight_surface, (255, 255, 255, alpha), (i, 0), (i, height//3))
            
            # 绘制进度条
            gradient_surface.set_colorkey((0, 0, 0))
            self.screen.blit(gradient_surface, (x, y))
            self.screen.blit(highlight_surface, (x, y))
            
            # 添加等级和进度文字（分开显示）
            level_text = f"等级 {self.level}"
            progress_text = f"{int(progress * 100)}%"
            
            # 绘制等级文字（靠左）
            level_surface = self.small_font.render(level_text, True, (0, 0, 0))
            level_rect = level_surface.get_rect(center=(x + 40, y + height//2))
            self.screen.blit(level_surface, level_rect)
            
            # 绘制进度文字（靠右）
            progress_surface = self.small_font.render(progress_text, True, (0, 0, 0))
            progress_rect = progress_surface.get_rect(center=(x + width - 30, y + height//2))
            self.screen.blit(progress_surface, progress_rect)
    
    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:  # 左键点击
                mouse_pos = pygame.mouse.get_pos()
                self.handle_click(mouse_pos)
    
    def handle_click(self, pos):
        x, y = pos
        # 检查是否点击了植物选择区域
        if y < 50:  # 顶部菜单区域
            plant_index = x // 100
            if plant_index < len(self.available_plants):
                plant_type = self.available_plants[plant_index]
                if self.money >= plant_type.cost and plant_type.level_required <= self.level:
                    self.selected_plant = plant_type
                    print(f"选择了植物: {plant_type.name}")
        
        # 检查是否点击了种植区域
        elif y > 100:  # 种植区域
            if self.selected_plant:
                grid_x = x // 100
                grid_y = (y - 100) // 100
                if self.can_plant_at(grid_x, grid_y):
                    print(f"在位置 ({grid_x}, {grid_y}) 种植了 {self.selected_plant.name}")
                    self.plant(grid_x, grid_y)
    
    def can_plant_at(self, x, y):
        for plant in self.plants:
            if plant.x == x and plant.y == y:
                return False
        return True
    
    def plant(self, x, y):
        if self.selected_plant and self.money >= self.selected_plant.cost:
            self.plants.append(Plant(self.selected_plant, x, y))
            self.money -= self.selected_plant.cost
    
    def update(self):
        for plant in self.plants:
            plant.update()
            if plant.is_ready_to_harvest():
                self.money += plant.type.reward
                self.plants.remove(plant)
                print(f"收获植物，获得 {plant.type.reward} 金钱")
                # 检查是否升级
                if self.money >= self.level * 100:
                    self.level += 1
                    print(f"升级到 {self.level} 级")
    
    def draw(self):
        try:
            # 绘制渐变背景
            self.screen.blit(self.background, (0, 0))
            
            # 绘制顶部菜单
            for i, plant_type in enumerate(self.available_plants):
                # 检查鼠标是否悬停在按钮上
                mouse_pos = pygame.mouse.get_pos()
                hover = (i * 100 <= mouse_pos[0] < (i + 1) * 100 and 0 <= mouse_pos[1] < 50)
                
                # 检查按钮是否可用
                enabled = (self.money >= plant_type.cost and plant_type.level_required <= self.level)
                
                # 绘制按钮背景
                color = self.colors['button']
                if not enabled:
                    color = self.colors['button_disabled']
                elif hover:
                    color = self.colors['button_hover']
                
                pygame.draw.rect(self.screen, color, (i * 100, 0, 100, 50), border_radius=10)
                pygame.draw.rect(self.screen, (0, 0, 0), (i * 100, 0, 100, 50), 2, border_radius=10)
                
                # 绘制植物图片和价格（并排显示）
                if self.plant_images[plant_type.name]:
                    img_size = 30
                    image = pygame.transform.scale(self.plant_images[plant_type.name], (img_size, img_size))
                    # 图片靠左
                    img_rect = image.get_rect(center=(i * 100 + 30, 25))
                    self.screen.blit(image, img_rect)
                    
                    # 价格靠右
                    text_surface = self.small_font.render(f"${plant_type.cost}", True, self.colors['text_light'] if enabled else self.colors['text'])
                    text_rect = text_surface.get_rect(center=(i * 100 + 70, 25))
                    self.screen.blit(text_surface, text_rect)
            
            # 绘制种植区域
            for i in range(8):
                for j in range(5):
                    # 绘制网格背景
                    pygame.draw.rect(self.screen, self.colors['grid'], 
                                   (i * 100, j * 100 + 100, 100, 100))
                    # 绘制网格线
                    pygame.draw.rect(self.screen, self.colors['grid_line'], 
                                   (i * 100, j * 100 + 100, 100, 100), 1)
            
            # 绘制植物
            for plant in self.plants:
                plant.draw(self.screen)
            
            # 绘制游戏信息
            # 等级进度条
            level_progress = (self.money % (self.level * 100)) / (self.level * 100)
            self.draw_progress_bar(10, 550, 200, 20, level_progress, self.colors['level_bar'])
            
            # 金钱显示（右下角，使用小字体）
            money_text = self.small_font.render(f"金钱: ${self.money}", True, self.colors['text'])
            money_rect = money_text.get_rect(bottomright=(790, 590))
            self.screen.blit(money_text, money_rect)
            
            # 如果选择了植物，显示提示
            if self.selected_plant:
                hint_text = self.small_font.render(f"已选择: {self.selected_plant.name}", True, self.colors['text'])
                self.screen.blit(hint_text, (400, 530))
        except Exception as e:
            print(f"绘制时出错: {e}")
            raise 
