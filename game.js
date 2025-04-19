import pygame
import time
import os
import math

class PlantType:
    def __init__(self, name, cost, reward, level_required, grow_time, image_path):
        self.name = name
        self.cost = cost
        self.reward = reward
        self.level_required = level_required
        self.grow_time = grow_time
        self.image_path = image_path  # 保存图片路径
        self.image = None
        if image_path:
            print(f"尝试加载图片: {image_path}")
            if os.path.exists(image_path):
                try:
                    # 加载图片并转换为支持透明度的格式
                    self.image = pygame.image.load(image_path).convert_alpha()
                    print(f"成功加载图片: {image_path}")
                except Exception as e:
                    print(f"加载图片 {image_path} 失败: {e}")
            else:
                print(f"图片文件不存在: {image_path}")
        print(f"创建植物类型: {name}")

class Plant:
    def __init__(self, plant_type, x, y):
        self.type = plant_type
        self.x = x
        self.y = y
        self.plant_time = time.time()
        self.growth_stage = 0
        try:
            # 尝试加载系统字体
            if os.name == 'nt':
                self.font = pygame.font.SysFont('microsoft yahei', 20)
            else:
                self.font = pygame.font.SysFont('arial', 20)
            print(f"创建植物: {plant_type.name} 在位置 ({x}, {y})")
        except:
            # 如果系统字体加载失败，使用默认字体
            self.font = pygame.font.Font(None, 20)
            print("使用默认字体")
    
    def update(self):
        try:
            current_time = time.time()
            growth_progress = (current_time - self.plant_time) / self.type.grow_time
            self.growth_stage = min(int(growth_progress * 3), 2)
        except Exception as e:
            print(f"更新植物状态时出错: {e}")
            raise
    
    def is_ready_to_harvest(self):
        try:
            current_time = time.time()
            return (current_time - self.plant_time) >= self.type.grow_time
        except Exception as e:
            print(f"检查植物是否可收获时出错: {e}")
            raise
    
    def draw(self, screen):
        try:
            # 计算植物位置
            x = self.x * 100 + 50
            y = self.y * 100 + 150
            
            # 如果有图片，显示图片
            if self.type.image:
                # 根据生长阶段调整图片大小
                current_time = time.time()
                growth_progress = (current_time - self.plant_time) / self.type.grow_time
                
                # 使用平滑的大小变化
                if self.growth_stage == 0:
                    # 幼苗期：20-40像素
                    size = 20 + (growth_progress * 3 % 1) * 20
                elif self.growth_stage == 1:
                    # 生长期：40-60像素
                    size = 40 + (growth_progress * 3 % 1) * 20
                else:
                    # 成熟期：60-70像素，轻微摆动
                    size = 60 + (math.sin(current_time * 2) + 1) * 5
                
                # 缩放图片
                size = int(size)
                img = pygame.transform.scale(self.type.image, (size, size))
                
                # 居中显示图片，并根据生长阶段调整垂直位置
                img_rect = img.get_rect(center=(x, y - size/4))  # 随着植物长大，略微向上移动
                screen.blit(img, img_rect)
            else:
                # 如果没有图片，显示圆形
                if self.growth_stage == 0:
                    pygame.draw.circle(screen, (0, 100, 0), (x, y), 10)
                elif self.growth_stage == 1:
                    pygame.draw.circle(screen, (0, 150, 0), (x, y), 20)
                else:
                    pygame.draw.circle(screen, (0, 200, 0), (x, y), 30)
        except Exception as e:
            print(f"绘制植物时出错: {e}")
            raise 
