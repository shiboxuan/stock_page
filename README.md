# 推荐股票数据展示网页

一个基于 Gitee Pages 的股票数据展示网页，用于展示被推荐股票的K线图和技术指标。

## 功能特性

- 📊 **K线图展示**：显示股票的日K线图，支持缩放和拖拽
- 📈 **均线指标**：MA5、MA10、MA20、MA60 均线
- 📉 **技术指标**：
  - VOL（成交量）
  - MACD（指数平滑异同移动平均线）
  - KDJ（随机指标）
  - BOLL（布林带）
  - 自定义指标1（多空趋势指标）
  - 自定义指标2（动力线指标）
- 📱 **响应式设计**：支持桌面和移动设备访问
- 🔄 **实时数据**：每次打开网页自动加载最新数据

## 在线访问

通过 Gitee Pages 访问：`https://[用户名].gitee.io/stock_page`

## 项目结构

```
stock_page/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── app.js             # 主应用逻辑
│   ├── chart.js           # K线图表模块
│   └── indicators.js      # 技术指标计算模块
├── data/
│   └── recommended_stocks.json.gz  # 股票数据（gzip压缩）
└── docs/
    └── recommended_stocks_data_schema.md  # 数据格式说明
```

## 使用说明

1. **选择股票**：在左侧列表中点击选择要查看的股票
2. **查看K线**：右侧主图显示K线和均线
3. **切换指标**：点击指标标签切换副图指标
4. **缩放图表**：使用鼠标滚轮缩放K线图
5. **拖拽查看**：按住鼠标拖拽查看历史数据
6. **查看详情**：鼠标悬停在K线上查看详细数据

## 技术栈

- **前端**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **图表**：Canvas 2D API
- **数据解压**：[pako](https://github.com/nodeca/pako) (gzip解压)
- **部署**：Gitee Pages

## 数据更新

数据文件 `data/recommended_stocks.json.gz` 由后端策略系统自动更新，包含：
- 推荐股票列表
- 每只股票最近100个交易日的K线数据
- 股票基本信息和推荐理由

## 本地开发

由于浏览器安全限制，本地开发需要启动一个HTTP服务器：

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后访问 `http://localhost:8080`

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 移动端浏览器

## License

MIT