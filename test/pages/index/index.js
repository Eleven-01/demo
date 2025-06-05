// pages/index/index.js
Page({
  data: {
    highScore: 0
  },

  onLoad: function() {
    // 获取本地存储的最高分
    const highScore = wx.getStorageSync('snakeHighScore') || 0;
    this.setData({
      highScore: highScore
    });
  },

  // 开始游戏
  startGame: function() {
    wx.navigateTo({
      url: '../game/game'
    });
  },

  // 查看游戏规则
  showRules: function() {
    wx.showModal({
      title: '游戏规则',
      content: '1. 滑动屏幕控制蛇的移动方向\n2. 吃到食物得分增加\n3. 撞到墙壁或自己的身体游戏结束\n4. 随着得分增加，蛇的移动速度会加快',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});