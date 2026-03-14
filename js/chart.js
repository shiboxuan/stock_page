/**
 * K线图表绑定模块
 */

class StockChart {
    constructor(mainCanvasId, subCanvasId) {
        this.mainCanvas = document.getElementById(mainCanvasId);
        this.subCanvas = document.getElementById(subCanvasId);
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.subCtx = this.subCanvas.getContext('2d');
        
        this.klines = [];
        this.currentIndicator = 'vol';
        this.indicatorData = {};
        
        // 图表配置
        this.config = {
            padding: { top: 30, right: 60, bottom: 20, left: 10 },
            candleWidth: 6,
            candleGap: 2,
            colors: {
                up: '#f23645',
                down: '#089981',
                ma5: '#ffffff',
                ma10: '#ffff00',
                ma20: '#ff00ff',
                ma60: '#00ffff',
                grid: 'rgba(255,255,255,0.1)',
                text: '#a0a0a0',
                crosshair: 'rgba(255,255,255,0.3)'
            }
        };
        
        // 视图状态
        this.viewState = {
            startIndex: 0,
            visibleCount: 60,
            hoveredIndex: -1
        };
        
        // 绑定事件
        this.bindEvents();
        
        // 响应式调整
        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(this.mainCanvas.parentElement);
        this.resizeObserver.observe(this.subCanvas.parentElement);
    }
    
    /**
     * 绑定鼠标和触摸事件
     */
    bindEvents() {
        // 鼠标滚轮缩放
        this.mainCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e.deltaY > 0 ? 1 : -1);
        });
        
        // 鼠标移动显示十字光标
        this.mainCanvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.mainCanvas.addEventListener('mouseleave', () => {
            this.viewState.hoveredIndex = -1;
            this.render();
            this.hideCrosshairInfo();
        });
        
        // 触摸事件支持
        let touchStartX = 0;
        let touchStartIndex = 0;
        
        this.mainCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartIndex = this.viewState.startIndex;
            }
        });
        
        this.mainCanvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - touchStartX;
                const candleFullWidth = this.config.candleWidth + this.config.candleGap;
                const indexDelta = Math.round(deltaX / candleFullWidth);
                this.viewState.startIndex = Math.max(0, 
                    Math.min(this.klines.length - this.viewState.visibleCount, 
                    touchStartIndex - indexDelta));
                this.render();
            }
        });
        
        // 鼠标拖拽
        let isDragging = false;
        let dragStartX = 0;
        let dragStartIndex = 0;
        
        this.mainCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartIndex = this.viewState.startIndex;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStartX;
                const candleFullWidth = this.config.candleWidth + this.config.candleGap;
                const indexDelta = Math.round(deltaX / candleFullWidth);
                this.viewState.startIndex = Math.max(0, 
                    Math.min(this.klines.length - this.viewState.visibleCount, 
                    dragStartIndex - indexDelta));
                this.render();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    /**
     * 处理缩放
     */
    handleZoom(direction) {
        const oldVisibleCount = this.viewState.visibleCount;
        
        if (direction > 0) {
            // 缩小
            this.viewState.visibleCount = Math.min(this.klines.length, this.viewState.visibleCount + 5);
        } else {
            // 放大
            this.viewState.visibleCount = Math.max(20, this.viewState.visibleCount - 5);
        }
        
        // 调整起始位置保持中心
        if (oldVisibleCount !== this.viewState.visibleCount) {
            const delta = this.viewState.visibleCount - oldVisibleCount;
            this.viewState.startIndex = Math.max(0, 
                Math.min(this.klines.length - this.viewState.visibleCount,
                this.viewState.startIndex - Math.floor(delta / 2)));
            this.updateCandleWidth();
            this.render();
        }
    }
    
    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        const chartLeft = this.config.padding.left;
        const index = Math.floor((x - chartLeft) / candleFullWidth) + this.viewState.startIndex;
        
        if (index >= this.viewState.startIndex && 
            index < this.viewState.startIndex + this.viewState.visibleCount &&
            index < this.klines.length) {
            this.viewState.hoveredIndex = index;
            this.render();
            this.showCrosshairInfo(index, x, y);
        }
    }
    
    /**
     * 显示十字光标信息
     */
    showCrosshairInfo(index, x, y) {
        const kline = this.klines[index];
        if (!kline) return;
        
        let infoEl = document.querySelector('.crosshair-info');
        if (!infoEl) {
            infoEl = document.createElement('div');
            infoEl.className = 'crosshair-info';
            this.mainCanvas.parentElement.appendChild(infoEl);
        }
        
        const change = kline.close - kline.open;
        const changePercent = (change / kline.open * 100).toFixed(2);
        const changeClass = change >= 0 ? 'up' : 'down';
        
        infoEl.innerHTML = `
            <div class="info-row"><span class="label">日期</span><span class="value">${kline.date}</span></div>
            <div class="info-row"><span class="label">开盘</span><span class="value ${changeClass}">${kline.open.toFixed(2)}</span></div>
            <div class="info-row"><span class="label">最高</span><span class="value ${changeClass}">${kline.high.toFixed(2)}</span></div>
            <div class="info-row"><span class="label">最低</span><span class="value ${changeClass}">${kline.low.toFixed(2)}</span></div>
            <div class="info-row"><span class="label">收盘</span><span class="value ${changeClass}">${kline.close.toFixed(2)}</span></div>
            <div class="info-row"><span class="label">涨跌</span><span class="value ${changeClass}">${change >= 0 ? '+' : ''}${changePercent}%</span></div>
            <div class="info-row"><span class="label">成交量</span><span class="value">${this.formatVolume(kline.vol)}</span></div>
        `;
        
        infoEl.classList.add('visible');
    }
    
    /**
     * 隐藏十字光标信息
     */
    hideCrosshairInfo() {
        const infoEl = document.querySelector('.crosshair-info');
        if (infoEl) {
            infoEl.classList.remove('visible');
        }
    }
    
    /**
     * 格式化成交量
     */
    formatVolume(vol) {
        if (vol >= 100000000) {
            return (vol / 100000000).toFixed(2) + '亿';
        } else if (vol >= 10000) {
            return (vol / 10000).toFixed(2) + '万';
        }
        return vol.toString();
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        this.setupCanvas(this.mainCanvas);
        this.setupCanvas(this.subCanvas);
        this.updateCandleWidth();
        this.render();
    }
    
    /**
     * 设置Canvas尺寸
     */
    setupCanvas(canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }
    
    /**
     * 更新K线宽度
     */
    updateCandleWidth() {
        const rect = this.mainCanvas.parentElement.getBoundingClientRect();
        const availableWidth = rect.width - this.config.padding.left - this.config.padding.right;
        const totalWidth = availableWidth / this.viewState.visibleCount;
        this.config.candleWidth = Math.max(2, totalWidth - this.config.candleGap);
    }
    
    /**
     * 设置K线数据
     */
    setData(klines) {
        this.klines = klines;
        
        // 计算所有指标
        const close = klines.map(k => k.close_hfq);
        
        this.indicatorData = {
            ma5: Indicators.MA(close, 5),
            ma10: Indicators.MA(close, 10),
            ma20: Indicators.MA(close, 20),
            ma60: Indicators.MA(close, 60),
            macd: Indicators.MACD(close),
            kdj: Indicators.KDJ(klines),
            boll: Indicators.BOLL(close),
            custom1: Indicators.Custom1(klines),
            custom2: Indicators.Custom2(klines)
        };
        
        // 默认显示最新数据
        this.viewState.startIndex = Math.max(0, klines.length - this.viewState.visibleCount);
        
        this.handleResize();
    }
    
    /**
     * 设置当前副图指标
     */
    setIndicator(indicator) {
        this.currentIndicator = indicator;
        this.render();
    }
    
    /**
     * 渲染图表
     */
    render() {
        if (this.klines.length === 0) return;
        
        this.renderMainChart();
        this.renderSubChart();
    }
    
    /**
     * 渲染主图
     */
    renderMainChart() {
        const ctx = this.mainCtx;
        const rect = this.mainCanvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 获取可见数据
        const visibleKlines = this.klines.slice(
            this.viewState.startIndex,
            this.viewState.startIndex + this.viewState.visibleCount
        );
        
        if (visibleKlines.length === 0) return;
        
        // 计算价格范围（使用后复权价格）
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        
        visibleKlines.forEach((k, i) => {
            const globalIndex = this.viewState.startIndex + i;
            minPrice = Math.min(minPrice, k.low_hfq);
            maxPrice = Math.max(maxPrice, k.high_hfq);
            
            // 包含MA线
            [5, 10, 20, 60].forEach(period => {
                const maKey = `ma${period}`;
                const maValue = this.indicatorData[maKey][globalIndex];
                if (maValue !== null) {
                    minPrice = Math.min(minPrice, maValue);
                    maxPrice = Math.max(maxPrice, maValue);
                }
            });
        });
        
        // 添加边距
        const priceRange = maxPrice - minPrice;
        minPrice -= priceRange * 0.05;
        maxPrice += priceRange * 0.05;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const chartWidth = width - this.config.padding.left - this.config.padding.right;
        
        // 绘制网格
        this.drawGrid(ctx, width, height, minPrice, maxPrice, chartHeight);
        
        // 绘制K线
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        visibleKlines.forEach((kline, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const isUp = kline.close_hfq >= kline.open_hfq;
            const color = isUp ? this.config.colors.up : this.config.colors.down;
            
            // 计算Y坐标
            const openY = this.config.padding.top + (maxPrice - kline.open_hfq) / (maxPrice - minPrice) * chartHeight;
            const closeY = this.config.padding.top + (maxPrice - kline.close_hfq) / (maxPrice - minPrice) * chartHeight;
            const highY = this.config.padding.top + (maxPrice - kline.high_hfq) / (maxPrice - minPrice) * chartHeight;
            const lowY = this.config.padding.top + (maxPrice - kline.low_hfq) / (maxPrice - minPrice) * chartHeight;
            
            // 绘制影线
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();
            
            // 绘制实体
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));
            
            ctx.fillStyle = color;
            if (isUp) {
                // 阳线空心
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.strokeRect(x - this.config.candleWidth / 2, bodyTop, this.config.candleWidth, bodyHeight);
            } else {
                // 阴线实心
                ctx.fillRect(x - this.config.candleWidth / 2, bodyTop, this.config.candleWidth, bodyHeight);
            }
        });
        
        // 绘制MA线
        this.drawMALines(ctx, visibleKlines, minPrice, maxPrice, chartHeight, candleFullWidth);
        
        // 绘制十字光标
        if (this.viewState.hoveredIndex >= this.viewState.startIndex &&
            this.viewState.hoveredIndex < this.viewState.startIndex + this.viewState.visibleCount) {
            this.drawCrosshair(ctx, width, height, candleFullWidth);
        }
        
        // 绘制图例
        this.drawMainLegend(ctx);
    }
    
    /**
     * 绘制网格
     */
    drawGrid(ctx, width, height, minPrice, maxPrice, chartHeight) {
        ctx.strokeStyle = this.config.colors.grid;
        ctx.lineWidth = 1;
        
        // 水平线
        const priceSteps = 5;
        for (let i = 0; i <= priceSteps; i++) {
            const y = this.config.padding.top + (chartHeight / priceSteps) * i;
            ctx.beginPath();
            ctx.moveTo(this.config.padding.left, y);
            ctx.lineTo(width - this.config.padding.right, y);
            ctx.stroke();
            
            // 价格标签
            const price = maxPrice - (maxPrice - minPrice) * (i / priceSteps);
            ctx.fillStyle = this.config.colors.text;
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(price.toFixed(2), width - this.config.padding.right + 5, y + 4);
        }
    }
    
    /**
     * 绘制MA线
     */
    drawMALines(ctx, visibleKlines, minPrice, maxPrice, chartHeight, candleFullWidth) {
        const maConfigs = [
            { key: 'ma5', color: this.config.colors.ma5 },
            { key: 'ma10', color: this.config.colors.ma10 },
            { key: 'ma20', color: this.config.colors.ma20 },
            { key: 'ma60', color: this.config.colors.ma60 }
        ];
        
        maConfigs.forEach(({ key, color }) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            
            let started = false;
            visibleKlines.forEach((_, i) => {
                const globalIndex = this.viewState.startIndex + i;
                const value = this.indicatorData[key][globalIndex];
                
                if (value !== null) {
                    const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                    const y = this.config.padding.top + (maxPrice - value) / (maxPrice - minPrice) * chartHeight;
                    
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            
            ctx.stroke();
        });
    }
    
    /**
     * 绘制十字光标
     */
    drawCrosshair(ctx, width, height, candleFullWidth) {
        const localIndex = this.viewState.hoveredIndex - this.viewState.startIndex;
        const x = this.config.padding.left + localIndex * candleFullWidth + candleFullWidth / 2;
        
        ctx.strokeStyle = this.config.colors.crosshair;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(x, this.config.padding.top);
        ctx.lineTo(x, height - this.config.padding.bottom);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    /**
     * 绘制主图图例
     */
    drawMainLegend(ctx) {
        const legends = [
            { label: 'MA5', color: this.config.colors.ma5 },
            { label: 'MA10', color: this.config.colors.ma10 },
            { label: 'MA20', color: this.config.colors.ma20 },
            { label: 'MA60', color: this.config.colors.ma60 }
        ];
        
        ctx.font = '11px Arial';
        let x = this.config.padding.left + 10;
        const y = 15;
        
        legends.forEach(({ label, color }) => {
            // 颜色块
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 6, 12, 3);
            
            // 标签
            ctx.fillStyle = color;
            x += 15;
            ctx.fillText(label, x, y);
            x += ctx.measureText(label).width + 15;
        });
        
        // 显示当前悬停的MA值
        if (this.viewState.hoveredIndex >= 0 && this.viewState.hoveredIndex < this.klines.length) {
            const idx = this.viewState.hoveredIndex;
            const values = [
                { label: 'MA5', value: this.indicatorData.ma5[idx], color: this.config.colors.ma5 },
                { label: 'MA10', value: this.indicatorData.ma10[idx], color: this.config.colors.ma10 },
                { label: 'MA20', value: this.indicatorData.ma20[idx], color: this.config.colors.ma20 },
                { label: 'MA60', value: this.indicatorData.ma60[idx], color: this.config.colors.ma60 }
            ];
            
            x = this.config.padding.left + 10;
            const y2 = 30;
            
            values.forEach(({ label, value, color }) => {
                if (value !== null) {
                    ctx.fillStyle = color;
                    ctx.fillText(`${label}:${value.toFixed(2)}`, x, y2);
                    x += ctx.measureText(`${label}:${value.toFixed(2)}`).width + 15;
                }
            });
        }
    }
    
    /**
     * 渲染副图
     */
    renderSubChart() {
        const ctx = this.subCtx;
        const rect = this.subCanvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        switch (this.currentIndicator) {
            case 'vol':
                this.renderVolume(ctx, width, height);
                break;
            case 'macd':
                this.renderMACD(ctx, width, height);
                break;
            case 'kdj':
                this.renderKDJ(ctx, width, height);
                break;
            case 'boll':
                this.renderBOLL(ctx, width, height);
                break;
            case 'custom1':
                this.renderCustom1(ctx, width, height);
                break;
            case 'custom2':
                this.renderCustom2(ctx, width, height);
                break;
        }
    }
    
    /**
     * 渲染成交量
     */
    renderVolume(ctx, width, height) {
        const visibleKlines = this.klines.slice(
            this.viewState.startIndex,
            this.viewState.startIndex + this.viewState.visibleCount
        );
        
        if (visibleKlines.length === 0) return;
        
        // 计算成交量范围
        let maxVol = 0;
        visibleKlines.forEach(k => {
            maxVol = Math.max(maxVol, k.vol);
        });
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        // 绘制成交量柱
        visibleKlines.forEach((kline, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const isUp = kline.close_hfq >= kline.open_hfq;
            const color = isUp ? this.config.colors.up : this.config.colors.down;
            
            const barHeight = (kline.vol / maxVol) * chartHeight;
            const y = height - this.config.padding.bottom - barHeight;
            
            ctx.fillStyle = color;
            ctx.fillRect(x - this.config.candleWidth / 2, y, this.config.candleWidth, barHeight);
        });
        
        // 绘制图例
        ctx.fillStyle = this.config.colors.text;
        ctx.font = '11px Arial';
        ctx.fillText('VOL', this.config.padding.left + 10, 15);
        
        if (this.viewState.hoveredIndex >= this.viewState.startIndex &&
            this.viewState.hoveredIndex < this.viewState.startIndex + this.viewState.visibleCount) {
            const kline = this.klines[this.viewState.hoveredIndex];
            ctx.fillText(this.formatVolume(kline.vol), this.config.padding.left + 50, 15);
        }
    }
    
    /**
     * 渲染MACD
     */
    renderMACD(ctx, width, height) {
        const macd = this.indicatorData.macd;
        const visibleDif = macd.dif.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleDea = macd.dea.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleMacd = macd.macd.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        // 计算范围
        let min = Infinity, max = -Infinity;
        visibleDif.forEach((v, i) => {
            min = Math.min(min, v, visibleDea[i], visibleMacd[i]);
            max = Math.max(max, v, visibleDea[i], visibleMacd[i]);
        });
        
        const range = Math.max(Math.abs(min), Math.abs(max));
        min = -range * 1.1;
        max = range * 1.1;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        const zeroY = this.config.padding.top + chartHeight / 2;
        
        // 绘制零轴
        ctx.strokeStyle = this.config.colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.config.padding.left, zeroY);
        ctx.lineTo(width - this.config.padding.right, zeroY);
        ctx.stroke();
        
        // 绘制MACD柱状图
        visibleMacd.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const barHeight = Math.abs(value) / (max - min) * chartHeight;
            const y = value >= 0 ? zeroY - barHeight : zeroY;
            
            ctx.fillStyle = value >= 0 ? this.config.colors.up : this.config.colors.down;
            ctx.fillRect(x - this.config.candleWidth / 2, y, this.config.candleWidth, barHeight);
        });
        
        // 绘制DIF线
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        visibleDif.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制DEA线
        ctx.beginPath();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        visibleDea.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制图例
        this.drawSubLegend(ctx, [
            { label: 'DIF', color: '#ffffff' },
            { label: 'DEA', color: '#ffff00' },
            { label: 'MACD', color: this.config.colors.up }
        ]);
    }
    
    /**
     * 渲染KDJ
     */
    renderKDJ(ctx, width, height) {
        const kdj = this.indicatorData.kdj;
        const visibleK = kdj.k.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleD = kdj.d.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleJ = kdj.j.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        const min = 0;
        const max = 100;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        // 绘制参考线
        [20, 50, 80].forEach(level => {
            const y = this.config.padding.top + (max - level) / (max - min) * chartHeight;
            ctx.strokeStyle = this.config.colors.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.config.padding.left, y);
            ctx.lineTo(width - this.config.padding.right, y);
            ctx.stroke();
        });
        
        // 绘制K线
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        visibleK.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - Math.min(100, Math.max(0, value))) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制D线
        ctx.beginPath();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        visibleD.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - Math.min(100, Math.max(0, value))) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制J线
        ctx.beginPath();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        visibleJ.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - Math.min(100, Math.max(0, value))) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制图例
        this.drawSubLegend(ctx, [
            { label: 'K', color: '#ffffff' },
            { label: 'D', color: '#ffff00' },
            { label: 'J', color: '#ff00ff' }
        ]);
    }
    
    /**
     * 渲染BOLL
     */
    renderBOLL(ctx, width, height) {
        const boll = this.indicatorData.boll;
        const visibleMid = boll.mid.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleUpper = boll.upper.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleLower = boll.lower.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        // 同时显示K线
        const visibleKlines = this.klines.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        // 计算范围
        let min = Infinity, max = -Infinity;
        visibleKlines.forEach((k, i) => {
            min = Math.min(min, k.low_hfq);
            max = Math.max(max, k.high_hfq);
            if (visibleUpper[i] !== null) {
                min = Math.min(min, visibleLower[i]);
                max = Math.max(max, visibleUpper[i]);
            }
        });
        
        const range = max - min;
        min -= range * 0.05;
        max += range * 0.05;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        // 绘制K线
        visibleKlines.forEach((kline, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const isUp = kline.close_hfq >= kline.open_hfq;
            const color = isUp ? this.config.colors.up : this.config.colors.down;
            
            const openY = this.config.padding.top + (max - kline.open_hfq) / (max - min) * chartHeight;
            const closeY = this.config.padding.top + (max - kline.close_hfq) / (max - min) * chartHeight;
            const highY = this.config.padding.top + (max - kline.high_hfq) / (max - min) * chartHeight;
            const lowY = this.config.padding.top + (max - kline.low_hfq) / (max - min) * chartHeight;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();
            
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));
            
            if (isUp) {
                ctx.strokeRect(x - this.config.candleWidth / 2, bodyTop, this.config.candleWidth, bodyHeight);
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(x - this.config.candleWidth / 2, bodyTop, this.config.candleWidth, bodyHeight);
            }
        });
        
        // 绘制BOLL线
        const drawLine = (data, color) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            let started = false;
            data.forEach((value, i) => {
                if (value !== null) {
                    const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                    const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            ctx.stroke();
        };
        
        drawLine(visibleUpper, '#ffff00');
        drawLine(visibleMid, '#ffffff');
        drawLine(visibleLower, '#ff00ff');
        
        // 绘制图例
        this.drawSubLegend(ctx, [
            { label: 'UPPER', color: '#ffff00' },
            { label: 'MID', color: '#ffffff' },
            { label: 'LOWER', color: '#ff00ff' }
        ]);
    }
    
    /**
     * 渲染自定义指标1
     */
    renderCustom1(ctx, width, height) {
        const data = this.indicatorData.custom1;
        const visibleLong = data.longLine.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleShort = data.shortLine.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleMid = data.midLine.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleTop = data.topArea.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleBottom = data.bottomArea.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleGold = data.lowGoldCross.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        const min = 0;
        const max = 100;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        // 绘制参考线
        const refLines = [
            { value: 90, color: '#9966ff' },
            { value: 80, color: '#996699' },
            { value: 20, color: '#00ff00' },
            { value: 10, color: '#cc6633' }
        ];
        
        refLines.forEach(({ value, color }) => {
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            ctx.strokeStyle = color;
            ctx.lineWidth = value === 10 || value === 90 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(this.config.padding.left, y);
            ctx.lineTo(width - this.config.padding.right, y);
            ctx.stroke();
        });
        
        // 绘制顶部信号
        visibleTop.forEach((isTop, i) => {
            if (isTop) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - 101) / (max - min) * chartHeight;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(x - 10, y, 20, 4);
            }
        });
        
        // 绘制底部信号
        visibleBottom.forEach((isBottom, i) => {
            if (isBottom) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - (-2)) / (max - min) * chartHeight;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(x - 11, y - 4, 22, 4);
            }
        });
        
        // 绘制低位金叉信号
        visibleGold.forEach((value, i) => {
            if (value > 0) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 绘制长期线
        ctx.beginPath();
        ctx.strokeStyle = '#9900ff';
        ctx.lineWidth = 1;
        let started = false;
        visibleLong.forEach((value, i) => {
            if (value !== null) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();
        
        // 绘制短期线
        ctx.beginPath();
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        visibleShort.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制中期线
        ctx.beginPath();
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        visibleMid.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制图例
        this.drawSubLegend(ctx, [
            { label: '长期线', color: '#9900ff' },
            { label: '短期线', color: '#888888' },
            { label: '中期线', color: '#ffff00' }
        ]);
    }
    
    /**
     * 渲染自定义指标2
     */
    renderCustom2(ctx, width, height) {
        const data = this.indicatorData.custom2;
        const visiblePower = data.powerLine.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleColors = data.powerColors.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleBuy = data.buySignals.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        const visibleSell = data.sellSignals.slice(this.viewState.startIndex, this.viewState.startIndex + this.viewState.visibleCount);
        
        const min = 0;
        const max = 4;
        
        const chartHeight = height - this.config.padding.top - this.config.padding.bottom;
        const candleFullWidth = this.config.candleWidth + this.config.candleGap;
        
        // 绘制参考线
        const refLines = [
            { value: 3.5, color: '#ff75ff', label: '清仓' },
            { value: 3.2, color: '#c6c600', label: '阶段卖' },
            { value: 1.75, color: '#70db93', label: '界线', dash: true },
            { value: 0.5, color: '#ffff00', label: '关注' },
            { value: 0.2, color: '#70db93', label: '底部' }
        ];
        
        refLines.forEach(({ value, color, dash }) => {
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            ctx.strokeStyle = color;
            ctx.lineWidth = dash ? 2 : 1;
            if (dash) ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(this.config.padding.left, y);
            ctx.lineTo(width - this.config.padding.right, y);
            ctx.stroke();
            ctx.setLineDash([]);
        });
        
        // 绘制动力线（柱状图）
        for (let i = 1; i < visiblePower.length; i++) {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const currY = this.config.padding.top + (max - visiblePower[i]) / (max - min) * chartHeight;
            const prevY = this.config.padding.top + (max - visiblePower[i - 1]) / (max - min) * chartHeight;
            
            ctx.fillStyle = visibleColors[i] === 'up' ? this.config.colors.up : this.config.colors.down;
            ctx.fillRect(x - 1.5, Math.min(currY, prevY), 3, Math.abs(currY - prevY) || 1);
        }
        
        // 绘制动力线
        ctx.beginPath();
        ctx.strokeStyle = '#a8a8a8';
        ctx.lineWidth = 1;
        visiblePower.forEach((value, i) => {
            const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
            const y = this.config.padding.top + (max - value) / (max - min) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // 绘制买入信号
        visibleBuy.forEach((isBuy, i) => {
            if (isBuy) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - visiblePower[i] - 0.1) / (max - min) * chartHeight;
                this.drawArrow(ctx, x, y, 'up', '#ff0000');
            }
        });
        
        // 绘制卖出信号
        visibleSell.forEach((isSell, i) => {
            if (isSell) {
                const x = this.config.padding.left + i * candleFullWidth + candleFullWidth / 2;
                const y = this.config.padding.top + (max - visiblePower[i] + 0.1) / (max - min) * chartHeight;
                this.drawArrow(ctx, x, y, 'down', '#00ff00');
            }
        });
        
        // 绘制图例
        this.drawSubLegend(ctx, [
            { label: '动力线', color: '#a8a8a8' },
            { label: '清仓3.5', color: '#ff75ff' },
            { label: '关注0.5', color: '#ffff00' }
        ]);
    }
    
    /**
     * 绘制箭头
     */
    drawArrow(ctx, x, y, direction, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        if (direction === 'up') {
            ctx.moveTo(x, y - 8);
            ctx.lineTo(x - 5, y);
            ctx.lineTo(x + 5, y);
        } else {
            ctx.moveTo(x, y + 8);
            ctx.lineTo(x - 5, y);
            ctx.lineTo(x + 5, y);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 绘制副图图例
     */
    drawSubLegend(ctx, legends) {
        ctx.font = '11px Arial';
        let x = this.config.padding.left + 10;
        const y = 15;
        
        legends.forEach(({ label, color }) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 6, 12, 3);
            x += 15;
            ctx.fillText(label, x, y);
            x += ctx.measureText(label).width + 15;
        });
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockChart;
}