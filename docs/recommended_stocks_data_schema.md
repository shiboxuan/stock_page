# 推荐股票 K 线数据结构说明

## 概述

本文档描述了 `stock_page/data/recommended_stocks.json.gz` 文件的数据结构。该文件包含每日推荐股票的 K 线数据，供前端页面展示使用。

## 文件信息

| 属性 | 值 |
|------|------|
| 文件路径 | `stock_page/data/recommended_stocks.json.gz` |
| 文件格式 | JSON + gzip 压缩 |
| 编码 | UTF-8 |
| 更新频率 | 每日推荐完成后自动更新 |
| 生成模块 | `src/utils/kline_exporter.py` |

## 数据结构

### 顶层结构

```json
{
  "meta": { ... },
  "stocks": [ ... ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `meta` | Object | 元数据信息 |
| `stocks` | Array | 推荐股票列表 |

---

### meta 对象

元数据包含数据生成的相关信息。

```json
{
  "meta": {
    "generated_at": "2026-03-14 14:50:00",
    "reference_date": "2026-03-14",
    "export_days": 100,
    "total_stocks": 5,
    "strategies": ["BollSqueezeStrategy"]
  }
}
```

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `generated_at` | string | 数据生成时间（YYYY-MM-DD HH:MM:SS） | `"2026-03-14 14:50:00"` |
| `reference_date` | string | 参考交易日期（YYYY-MM-DD） | `"2026-03-14"` |
| `export_days` | int | 导出的 K 线天数 | `100` |
| `total_stocks` | int | 推荐股票总数 | `5` |
| `strategies` | Array[string] | 使用的策略名称列表 | `["BollSqueezeStrategy"]` |

---

### stocks 数组

每个元素代表一只推荐股票及其 K 线数据。

```json
{
  "stocks": [
    {
      "code": "000001",
      "name": "平安银行",
      "industry": "银行",
      "current_price": 12.50,
      "reason": "缩量小阳(量比=0.85), 均线粘合(2.1%,R²=0.75,15天收敛), ...",
      "strategy": "BollSqueezeStrategy",
      "kline_count": 100,
      "klines": [ ... ]
    }
  ]
}
```

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `code` | string | 股票代码（6位数字） | `"000001"` |
| `name` | string | 股票名称 | `"平安银行"` |
| `industry` | string | 所属行业 | `"银行"` |
| `current_price` | float | 当前价格（未复权收盘价） | `12.50` |
| `reason` | string | 推荐理由 | `"缩量小阳(量比=0.85), ..."` |
| `strategy` | string | 推荐该股票的策略名称 | `"BollSqueezeStrategy"` |
| `kline_count` | int | K 线数据条数 | `100` |
| `klines` | Array[Object] | K 线数据列表（按日期升序） | 见下文 |

---

### klines 数组

每个元素代表一根日 K 线数据。数据按日期升序排列（最早的在前，最新的在后）。

```json
{
  "klines": [
    {
      "date": "2025-10-15",
      "open": 12.30,
      "high": 12.80,
      "low": 12.20,
      "close": 12.50,
      "open_hfq": 123.45,
      "high_hfq": 128.00,
      "low_hfq": 122.00,
      "close_hfq": 125.00,
      "vol": 12345678,
      "amount": 154320000.50,
      "turn": 1.23
    }
  ]
}
```

| 字段 | 类型 | 说明 | 单位 |
|------|------|------|------|
| `date` | string | 交易日期（YYYY-MM-DD） | - |
| `open` | float | 开盘价（未复权） | 元 |
| `high` | float | 最高价（未复权） | 元 |
| `low` | float | 最低价（未复权） | 元 |
| `close` | float | 收盘价（未复权） | 元 |
| `open_hfq` | float | 开盘价（后复权） | 元 |
| `high_hfq` | float | 最高价（后复权） | 元 |
| `low_hfq` | float | 最低价（后复权） | 元 |
| `close_hfq` | float | 收盘价（后复权） | 元 |
| `vol` | int | 成交量 | 股 |
| `amount` | float | 成交额 | 元 |
| `turn` | float | 换手率 | % |

---

## 价格说明

### 未复权价格 vs 后复权价格

- **未复权价格**（`open`, `high`, `low`, `close`）：原始交易价格，适合展示当日实际成交价格
- **后复权价格**（`open_hfq`, `high_hfq`, `low_hfq`, `close_hfq`）：考虑了分红、送股等因素调整后的价格，适合计算技术指标和绘制连续走势图

**建议**：
- 绘制 K 线图时使用**后复权价格**，以保证价格连续性
- 展示当前价格时使用**未复权价格**（`current_price` 字段）

---

## 读取示例

### Python 读取示例

```python
import gzip
import json

# 读取 gzip 压缩的 JSON 文件
with gzip.open('stock_page/data/recommended_stocks.json.gz', 'rt', encoding='utf-8') as f:
    data = json.load(f)

# 访问元数据
print(f"生成时间: {data['meta']['generated_at']}")
print(f"推荐股票数: {data['meta']['total_stocks']}")

# 遍历推荐股票
for stock in data['stocks']:
    print(f"{stock['name']} ({stock['code']}) - {stock['industry']}")
    print(f"  当前价: {stock['current_price']}")
    print(f"  K线数: {stock['kline_count']}")
    
    # 获取最新一根 K 线
    latest_kline = stock['klines'][-1]
    print(f"  最新日期: {latest_kline['date']}")
    print(f"  收盘价: {latest_kline['close']}")
```

### JavaScript 读取示例（浏览器端）

```javascript
// 使用 pako 库解压 gzip
async function loadRecommendedStocks() {
    const response = await fetch('data/recommended_stocks.json.gz');
    const buffer = await response.arrayBuffer();
    
    // 使用 pako 解压
    const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' });
    const data = JSON.parse(decompressed);
    
    console.log(`推荐股票数: ${data.meta.total_stocks}`);
    
    data.stocks.forEach(stock => {
        console.log(`${stock.name} (${stock.code})`);
    });
    
    return data;
}
```

### JavaScript 读取示例（Node.js）

```javascript
const fs = require('fs');
const zlib = require('zlib');

// 读取并解压
const compressed = fs.readFileSync('stock_page/data/recommended_stocks.json.gz');
const decompressed = zlib.gunzipSync(compressed);
const data = JSON.parse(decompressed.toString('utf-8'));

console.log(`推荐股票数: ${data.meta.total_stocks}`);
```

---

## 数据更新流程

```
策略执行完成
    │
    ▼
收集推荐股票的 K 线数据
    │
    ▼
导出为 JSON + gzip 文件
(stock_page/data/recommended_stocks.json.gz)
    │
    ▼
Git 操作：
├── git reset --hard HEAD（清理本地更改）
├── git clean -fd（删除未跟踪文件）
├── git pull（拉取最新代码）
├── git add data/recommended_stocks.json.gz
├── git commit -m "Update recommended stocks data - YYYY-MM-DD HH:MM"
└── git push
    │
    ▼
前端页面可通过 Git 仓库获取最新数据
```

---

## 文件大小估算

| 推荐股票数 | K 线天数 | 预估文件大小（压缩后） |
|-----------|---------|---------------------|
| 5 只 | 100 天 | ~15-25 KB |
| 10 只 | 100 天 | ~30-50 KB |
| 20 只 | 100 天 | ~60-100 KB |
| 50 只 | 100 天 | ~150-250 KB |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/utils/kline_exporter.py` | K 线数据导出模块 |
| `src/utils/git_proxy/git_proxy.py` | Git 操作封装模块 |
| `docs/database_schema.md` | 数据库表结构说明（K 线数据来源） |

---

## 注意事项

1. **数据排序**：`klines` 数组按日期升序排列，最新的 K 线在数组末尾
2. **空值处理**：所有字段均不为 null，如果原始数据存在空值，该股票会被跳过
3. **后复权价格**：用于技术指标计算，保证价格连续性
4. **换手率**：`turn` 字段单位为百分比，如 `1.23` 表示 1.23%
5. **成交量**：`vol` 字段单位为股（不是手），如需转换为手需除以 100