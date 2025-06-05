// pages/game/game.js
Page({
  data: {
    score: 0,          // 当前得分
    highScore: 0,      // 最高分
    gameOver: false,   // 游戏是否结束
    paused: true,      // 游戏是否暂停
    snake: [],         // 蛇身体坐标数组
    food: {},          // 食物坐标
    direction: 'right', // 蛇移动方向
    timer: null,       // 游戏计时器
    speed: 400,        // 蛇移动速度(ms)
    gridSize: 15,      // 网格大小
    canvasWidth: 300,  // 画布宽度
    canvasHeight: 400, // 画布高度
    touchStartX: 0,    // 触摸开始X坐标
    touchStartY: 0     // 触摸开始Y坐标
  },

  onLoad: function() {
    // 获取系统信息以适应不同屏幕
    const windowInfo = wx.getWindowInfo();
    const screenWidth = windowInfo.windowWidth;
    const canvasHeight = screenWidth * 1.2; // 保持一定的宽高比
    
    this.setData({
      canvasWidth: screenWidth,
      canvasHeight: canvasHeight,
      highScore: wx.getStorageSync('snakeHighScore') || 0
    });
  },
  
  onReady: function() {
    // 在页面渲染完成后创建canvas上下文
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 设置canvas的实际尺寸
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = this.data.canvasWidth * dpr;
        canvas.height = this.data.canvasHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        // 初始化游戏
        this.initGame();
      });
  },
  
  onUnload: function() {
    // 页面卸载时清除计时器
    this.clearGameTimer();
  },
  
  // 初始化游戏
  initGame: function() {
    const gridSize = this.data.gridSize;
    const canvasWidth = this.data.canvasWidth;
    const canvasHeight = this.data.canvasHeight;
    
    // 计算网格数量
    const gridCountX = Math.floor(canvasWidth / gridSize);
    const gridCountY = Math.floor(canvasHeight / gridSize);
    
    // 初始化蛇的位置 (居中)
    const startX = Math.floor(gridCountX / 2);
    const startY = Math.floor(gridCountY / 2);
    
    const snake = [
      {x: startX, y: startY},
      {x: startX - 1, y: startY},
      {x: startX - 2, y: startY}
    ];
    
    this.setData({
      snake: snake,
      direction: 'right',
      score: 0,
      gameOver: false,
      paused: true
    });
    
    // 生成第一个食物
    this.generateFood();
    
    // 绘制游戏
    if (this.ctx) {
      this.drawGame();
    } else {
      console.error('无法创建Canvas上下文');
    }
  },
    
  // 开始游戏
  startGame: function() {
    if (this.data.gameOver) {
      this.initGame();
    }
    
    this.setData({
      paused: false
    });
    
    this.clearGameTimer();
    this.data.timer = setInterval(() => {
      this.moveSnake();
    }, this.data.speed);
  },
  
  // 暂停游戏
  pauseGame: function() {
    this.setData({
      paused: true
    });
    this.clearGameTimer();
  },
  
  // 清除游戏计时器
  clearGameTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },
    
  // 生成食物
  generateFood: function() {
    const gridSize = this.data.gridSize;
    const canvasWidth = this.data.canvasWidth;
    const canvasHeight = this.data.canvasHeight;
    const snake = this.data.snake;
    
    // 计算网格数量
    const gridCountX = Math.floor(canvasWidth / gridSize);
    const gridCountY = Math.floor(canvasHeight / gridSize);
    
    // 随机生成食物位置
    let food;
    let foodOnSnake;
    
    do {
      foodOnSnake = false;
      food = {
        x: Math.floor(Math.random() * (gridCountX - 1)),
        y: Math.floor(Math.random() * (gridCountY - 1))
      };
      
      // 检查食物是否在蛇身上
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
          foodOnSnake = true;
          break;
        }
      }
    } while (foodOnSnake);
    
    this.setData({
      food: food
    });
  },
  
  // 移动蛇
  moveSnake: function() {
    const snake = this.data.snake;
    const direction = this.data.direction;
    const food = this.data.food;
    
    // 获取蛇头
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 根据方向移动蛇头
    switch (direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    // 检查碰撞
    if (this.checkCollision(head)) {
      this.gameOver();
      return;
    }
    
    // 将新头部添加到蛇身体前面
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
      // 吃到食物，加分并生成新食物
      this.setData({
        score: this.data.score + 10
      });
      
      // 更新最高分
      if (this.data.score > this.data.highScore) {
        this.setData({
          highScore: this.data.score
        });
        wx.setStorageSync('snakeHighScore', this.data.score);
      }
      
      // 生成新食物
      this.generateFood();
      
      // 加速（可选）
      if (this.data.speed > 50 && this.data.score % 50 === 0) {
        this.setData({
          speed: this.data.speed - 10
        });
        
        // 重新设置计时器以应用新速度
        this.clearGameTimer();
        this.data.timer = setInterval(() => {
          this.moveSnake();
        }, this.data.speed);
      }
    } else {
      // 没吃到食物，移除尾部
      snake.pop();
    }
    
    this.setData({
      snake: snake
    });
    
    // 确保ctx存在后再重新绘制游戏
    if (this.ctx) {
      this.drawGame();
    } else {
      console.error('Canvas上下文未初始化');
    }
  },
    
  // 检查碰撞
  checkCollision: function(head) {
    const snake = this.data.snake;
    const gridSize = this.data.gridSize;
    const canvasWidth = this.data.canvasWidth;
    const canvasHeight = this.data.canvasHeight;
    
    // 计算网格数量
    const gridCountX = Math.floor(canvasWidth / gridSize);
    const gridCountY = Math.floor(canvasHeight / gridSize);
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= gridCountX || head.y < 0 || head.y >= gridCountY) {
      return true;
    }
    
    // 检查是否撞到自己（从第二个身体部分开始检查）
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    return false;
  },
  
  // 游戏结束
  gameOver: function() {
    this.clearGameTimer();
    this.setData({
      gameOver: true
    });
    
    // 显示游戏结束提示
    wx.showModal({
      title: '游戏结束',
      content: `您的得分是: ${this.data.score}`,
      showCancel: false,
      confirmText: '再来一局',
      confirmColor: '#1E8449',
      success: (res) => {
        if (res.confirm) {
          this.initGame();
        }
      }
    });
    
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({type: 'medium'});
    }
    
    // 播放结束音效（如果需要）
    // const innerAudioContext = wx.createInnerAudioContext();
    // innerAudioContext.src = '/assets/sounds/game-over.mp3';
    // innerAudioContext.play();
  },
  
  // 绘制游戏
  drawGame: function() {
    const ctx = this.ctx;
    // 检查ctx是否已正确初始化
    if (!ctx) {
      console.error('Canvas上下文未初始化');
      return;
    }
    
    const gridSize = this.data.gridSize;
    const snake = this.data.snake;
    const food = this.data.food;
    const canvasWidth = this.data.canvasWidth;
    const canvasHeight = this.data.canvasHeight;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制背景
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制背景网格
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    
    // 绘制水平线
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }
    
    // 绘制食物
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;
    const foodRadius = gridSize / 2 - 2;
    
    // 创建食物的径向渐变
    const foodGradient = ctx.createRadialGradient(
      foodX - foodRadius/3, foodY - foodRadius/3, foodRadius/8,
      foodX, foodY, foodRadius
    );
    foodGradient.addColorStop(0, '#FF6B6B');
    foodGradient.addColorStop(1, '#FF0000');
    
    // 绘制食物主体
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 添加食物高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(foodX - foodRadius/3, foodY - foodRadius/3, foodRadius/4, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制蛇
    // 蛇身体的圆角矩形函数
    const drawRoundedRect = (x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };
    
    // 绘制蛇身
    for (let i = snake.length - 1; i >= 1; i--) {
      const segmentX = snake[i].x * gridSize;
      const segmentY = snake[i].y * gridSize;
      
      // 创建蛇身渐变
      const bodyGradient = ctx.createLinearGradient(
        segmentX, segmentY,
        segmentX + gridSize, segmentY + gridSize
      );
      bodyGradient.addColorStop(0, '#32CD32');
      bodyGradient.addColorStop(1, '#2ECC71');
      
      ctx.fillStyle = bodyGradient;
      drawRoundedRect(segmentX + 1, segmentY + 1, gridSize - 2, gridSize - 2, 4);
      ctx.fill();
      
      // 添加连接效果
      if (i < snake.length - 1) {
        const prevX = snake[i+1].x;
        const prevY = snake[i+1].y;
        const currX = snake[i].x;
        const currY = snake[i].y;
        
        // 如果两节相邻，绘制连接
        if (Math.abs(prevX - currX) <= 1 && Math.abs(prevY - currY) <= 1) {
          ctx.fillStyle = bodyGradient;
          if (prevX === currX) {
            // 垂直连接
            const connectY = prevY < currY ? prevY * gridSize + gridSize - 1 : currY * gridSize + gridSize - 1;
            ctx.fillRect(currX * gridSize + 1, connectY, gridSize - 2, 2);
          } else if (prevY === currY) {
            // 水平连接
            const connectX = prevX < currX ? prevX * gridSize + gridSize - 1 : currX * gridSize + gridSize - 1;
            ctx.fillRect(connectX, currY * gridSize + 1, 2, gridSize - 2);
          }
        }
      }
    }
    
    // 绘制蛇头
    const headX = snake[0].x * gridSize;
    const headY = snake[0].y * gridSize;
    
    // 创建蛇头渐变
    const headGradient = ctx.createLinearGradient(
      headX, headY,
      headX + gridSize, headY + gridSize
    );
    headGradient.addColorStop(0, '#1E8449');
    headGradient.addColorStop(1, '#27AE60');
    
    ctx.fillStyle = headGradient;
    drawRoundedRect(headX + 1, headY + 1, gridSize - 2, gridSize - 2, 5);
    ctx.fill();
    
    // 添加蛇眼睛
    const eyeRadius = gridSize / 8;
    const eyeOffset = gridSize / 4;
    ctx.fillStyle = 'white';
    
    // 根据方向调整眼睛位置
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    
    switch(this.data.direction) {
      case 'up':
        leftEyeX = headX + eyeOffset;
        leftEyeY = headY + eyeOffset;
        rightEyeX = headX + gridSize - eyeOffset;
        rightEyeY = headY + eyeOffset;
        break;
      case 'down':
        leftEyeX = headX + gridSize - eyeOffset;
        leftEyeY = headY + gridSize - eyeOffset;
        rightEyeX = headX + eyeOffset;
        rightEyeY = headY + gridSize - eyeOffset;
        break;
      case 'left':
        leftEyeX = headX + eyeOffset;
        leftEyeY = headY + eyeOffset;
        rightEyeX = headX + eyeOffset;
        rightEyeY = headY + gridSize - eyeOffset;
        break;
      case 'right':
      default:
        leftEyeX = headX + gridSize - eyeOffset;
        leftEyeY = headY + eyeOffset;
        rightEyeX = headX + gridSize - eyeOffset;
        rightEyeY = headY + gridSize - eyeOffset;
        break;
    }
    
    // 绘制眼睛
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制眼球
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeRadius / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeRadius / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制边界
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  },
  
  // 处理触摸开始事件
  touchStart: function(e) {
    if (this.data.gameOver) return;
    
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    });
  },
  
  // 处理触摸结束事件
  touchEnd: function(e) {
    if (this.data.gameOver) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    const startX = this.data.touchStartX;
    const startY = this.data.touchStartY;
    
    // 计算X和Y方向的移动距离
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // 确定主要移动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平移动
      if (deltaX > 0 && this.data.direction !== 'left') {
        // 向右滑动
        this.setData({ direction: 'right' });
      } else if (deltaX < 0 && this.data.direction !== 'right') {
        // 向左滑动
        this.setData({ direction: 'left' });
      }
    } else {
      // 垂直移动
      if (deltaY > 0 && this.data.direction !== 'up') {
        // 向下滑动
        this.setData({ direction: 'down' });
      } else if (deltaY < 0 && this.data.direction !== 'down') {
        // 向上滑动
        this.setData({ direction: 'up' });
      }
    }
    
    // 如果游戏暂停，则开始游戏
    if (this.data.paused && !this.data.gameOver) {
      this.startGame();
    }
  },
    
  // 重新开始游戏
  restartGame: function() {
    this.initGame();
    this.startGame();
  },
  
  // 返回首页
  goToIndex: function() {
    wx.navigateBack();
  }
});