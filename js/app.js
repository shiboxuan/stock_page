/**
 * 主应用逻辑
 */

class StockApp {
    constructor() {
        this.data = null;
        this.chart = null;
        this.selectedStock = null;
        
        this.init();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        try {
            // 加载数据
            await this.loadData();
            
            // 初始化图表
            this.chart = new StockChart('mainChart', 'subChart');
            
            // 渲染股票列表
            this.renderStockList();
            
            // 绑定指标切换事件
            this.bindIndicatorTabs();
            
            // 默认选中第一只股票
            if (this.data.stocks.length > 0) {
                this.selectStock(this.data.stocks[0]);
            }
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('数据加载失败，请刷新页面重试');
        }
    }
    
    /**
     * 加载数据
     */
    async loadData() {
        const stockListEl = document.getElementById('stockList');
        stockListEl.innerHTML = '<div class="loading">加载数据中...</div>';
        
        try {
            // 添加时间戳防止缓存
            const timestamp = new Date().getTime();
            const response = await fetch(`data/recommended_stocks.json.gz?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const buffer = await response.arrayBuffer();
            
            // 使用pako解压gzip
            const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' });
            this.data = JSON.parse(decompressed);
            
            console.log(`数据加载成功: ${this.data.meta.total_stocks} 只股票`);
            
            // 更新元数据显示
            this.updateMetaInfo();
            
        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }
    
    /**
     * 更新元数据信息
     */
    updateMetaInfo() {
        const metaEl = document.getElementById('metaInfo');
        if (metaEl && this.data) {
            metaEl.innerHTML = `
                <div>更新时间: ${this.data.meta.generated_at}</div>
                <div>参考日期: ${this.data.meta.reference_date}</div>
                <div>股票数量: ${this.data.meta.total_stocks}</div>
            `;
        }
    }
    
    /**
     * 渲染股票列表
     */
    renderStockList() {
        const stockListEl = document.getElementById('stockList');
        
        if (!this.data || this.data.stocks.length === 0) {
            stockListEl.innerHTML = '<div class="loading">暂无推荐股票</div>';
            return;
        }
        
        stockListEl.innerHTML = '';
        
        this.data.stocks.forEach(stock => {
            const item = document.createElement('div');
            item.className = 'stock-item';
            item.dataset.code = stock.code;
            
            // 计算涨跌
            const klines = stock.klines;
            const lastKline = klines[klines.length - 1];
            const prevKline = klines.length > 1 ? klines[klines.length - 2] : lastKline;
            const change = lastKline.close - prevKline.close;
            const changePercent = (change / prevKline.close * 100).toFixed(2);
            const priceClass = change >= 0 ? 'up' : 'down';
            
            item.innerHTML = `
                <div class="stock-name">
                    <span>${stock.name}</span>
                    <span class="stock-price ${priceClass}">${stock.current_price.toFixed(2)}</span>
                </div>
                <div class="stock-code">${stock.code} · ${stock.industry}</div>
                <div class="stock-reason">${stock.reason}</div>
            `;
            
            item.addEventListener('click', () => {
                this.selectStock(stock);
            });
            
            stockListEl.appendChild(item);
        });
    }
    
    /**
     * 选择股票
     */
    selectStock(stock) {
        this.selectedStock = stock;
        
        // 更新列表选中状态
        document.querySelectorAll('.stock-item').forEach(item => {
            item.classList.toggle('active', item.dataset.code === stock.code);
        });
        
        // 更新头部信息
        this.updateStockHeader(stock);
        
        // 更新图表
        this.chart.setData(stock.klines);
    }
    
    /**
     * 更新股票头部信息
     */
    updateStockHeader(stock) {
        const headerEl = document.getElementById('stockHeader');
        
        const klines = stock.klines;
        const lastKline = klines[klines.length - 1];
        const prevKline = klines.length > 1 ? klines[klines.length - 2] : lastKline;
        const change = lastKline.close - prevKline.close;
        const changePercent = (change / prevKline.close * 100).toFixed(2);
        const priceClass = change >= 0 ? 'up' : 'down';
        
        headerEl.innerHTML = `
            <div class="stock-title">${stock.name} (${stock.code})</div>
            <div class="price-info">
                <span class="current-price ${priceClass}">${stock.current_price.toFixed(2)}</span>
                <span class="price-change ${priceClass}">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent}%)</span>
            </div>
            <div class="stock-info">
                <span>行业: ${stock.industry}</span>
                <span>策略: ${stock.strategy}</span>
            </div>
        `;
    }
    
    /**
     * 绑定指标切换事件
     */
    bindIndicatorTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 更新选中状态
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 切换指标
                const indicator = tab.dataset.indicator;
                if (this.chart) {
                    this.chart.setIndicator(indicator);
                }
            });
        });
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const stockListEl = document.getElementById('stockList');
        stockListEl.innerHTML = `<div class="error">${message}</div>`;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.stockApp = new StockApp();
});