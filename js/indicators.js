/**
 * 技术指标计算模块
 */

const Indicators = {
    /**
     * 计算简单移动平均线 (SMA/MA)
     * @param {number[]} data - 价格数据
     * @param {number} period - 周期
     * @returns {number[]} MA值数组
     */
    MA: function(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += data[i - j];
                }
                result.push(sum / period);
            }
        }
        return result;
    },

    /**
     * 计算指数移动平均线 (EMA)
     * @param {number[]} data - 价格数据
     * @param {number} period - 周期
     * @returns {number[]} EMA值数组
     */
    EMA: function(data, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                result.push(data[0]);
            } else if (i < period - 1) {
                // 前period-1个使用SMA
                let sum = 0;
                for (let j = 0; j <= i; j++) {
                    sum += data[j];
                }
                result.push(sum / (i + 1));
            } else if (i === period - 1) {
                // 第period个使用SMA作为初始EMA
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += data[j];
                }
                result.push(sum / period);
            } else {
                result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
            }
        }
        return result;
    },

    /**
     * 计算EXPMA (同EMA)
     */
    EXPMA: function(data, period) {
        return this.EMA(data, period);
    },

    /**
     * 计算EXPMEMA - 指数平滑移动平均
     */
    EXPMEMA: function(data, period) {
        return this.EMA(data, period);
    },

    /**
     * 计算SMA (通达信版本，带权重)
     * SMA(X,N,M) = (M*X+(N-M)*REF(SMA,1))/N
     */
    SMA_TDX: function(data, n, m) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                result.push(data[0]);
            } else {
                result.push((m * data[i] + (n - m) * result[i - 1]) / n);
            }
        }
        return result;
    },

    /**
     * 计算DMA - 动态移动平均
     * DMA(X,A) = A*X + (1-A)*REF(DMA,1)
     */
    DMA: function(data, weights) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                result.push(data[0]);
            } else {
                const a = Math.min(Math.max(weights[i] || weights, 0), 1);
                result.push(a * data[i] + (1 - a) * result[i - 1]);
            }
        }
        return result;
    },

    /**
     * 获取N周期内最高值 (HHV)
     */
    HHV: function(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            let max = data[i];
            for (let j = Math.max(0, i - period + 1); j <= i; j++) {
                if (data[j] > max) max = data[j];
            }
            result.push(max);
        }
        return result;
    },

    /**
     * 获取N周期内最低值 (LLV)
     */
    LLV: function(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            let min = data[i];
            for (let j = Math.max(0, i - period + 1); j <= i; j++) {
                if (data[j] < min) min = data[j];
            }
            result.push(min);
        }
        return result;
    },

    /**
     * 获取前N周期的值 (REF)
     */
    REF: function(data, n) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < n) {
                result.push(data[0]);
            } else {
                result.push(data[i - n]);
            }
        }
        return result;
    },

    /**
     * 统计N周期内满足条件的次数 (COUNT)
     */
    COUNT: function(condition, period) {
        const result = [];
        for (let i = 0; i < condition.length; i++) {
            let count = 0;
            for (let j = Math.max(0, i - period + 1); j <= i; j++) {
                if (condition[j]) count++;
            }
            result.push(count);
        }
        return result;
    },

    /**
     * 交叉判断 (CROSS)
     * A上穿B
     */
    CROSS: function(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            if (i === 0) {
                result.push(false);
            } else {
                result.push(a[i - 1] <= b[i - 1] && a[i] > b[i]);
            }
        }
        return result;
    },

    /**
     * 过滤信号 (FILTER)
     * 过滤连续出现的信号，N周期内只保留第一个
     */
    FILTER: function(condition, period) {
        const result = [];
        let lastSignal = -period;
        for (let i = 0; i < condition.length; i++) {
            if (condition[i] && (i - lastSignal >= period)) {
                result.push(true);
                lastSignal = i;
            } else {
                result.push(false);
            }
        }
        return result;
    },

    /**
     * 平均绝对偏差 (AVEDEV)
     */
    AVEDEV: function(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(0);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) {
                    sum += data[j];
                }
                const avg = sum / period;
                let devSum = 0;
                for (let j = i - period + 1; j <= i; j++) {
                    devSum += Math.abs(data[j] - avg);
                }
                result.push(devSum / period);
            }
        }
        return result;
    },

    /**
     * 计算MACD指标
     * @param {number[]} close - 收盘价数组
     * @param {number} short - 短期EMA周期，默认12
     * @param {number} long - 长期EMA周期，默认26
     * @param {number} signal - 信号线周期，默认9
     * @returns {Object} {dif, dea, macd}
     */
    MACD: function(close, short = 12, long = 26, signal = 9) {
        const emaShort = this.EMA(close, short);
        const emaLong = this.EMA(close, long);
        
        const dif = [];
        for (let i = 0; i < close.length; i++) {
            dif.push(emaShort[i] - emaLong[i]);
        }
        
        const dea = this.EMA(dif, signal);
        
        const macd = [];
        for (let i = 0; i < close.length; i++) {
            macd.push((dif[i] - dea[i]) * 2);
        }
        
        return { dif, dea, macd };
    },

    /**
     * 计算KDJ指标
     * @param {Object[]} klines - K线数据
     * @param {number} n - RSV周期，默认9
     * @param {number} m1 - K值平滑周期，默认3
     * @param {number} m2 - D值平滑周期，默认3
     * @returns {Object} {k, d, j}
     */
    KDJ: function(klines, n = 9, m1 = 3, m2 = 3) {
        const high = klines.map(k => k.high_hfq);
        const low = klines.map(k => k.low_hfq);
        const close = klines.map(k => k.close_hfq);
        
        const hhv = this.HHV(high, n);
        const llv = this.LLV(low, n);
        
        const rsv = [];
        for (let i = 0; i < close.length; i++) {
            if (hhv[i] === llv[i]) {
                rsv.push(50);
            } else {
                rsv.push((close[i] - llv[i]) / (hhv[i] - llv[i]) * 100);
            }
        }
        
        const k = this.SMA_TDX(rsv, m1, 1);
        const d = this.SMA_TDX(k, m2, 1);
        const j = [];
        for (let i = 0; i < k.length; i++) {
            j.push(3 * k[i] - 2 * d[i]);
        }
        
        return { k, d, j };
    },

    /**
     * 计算BOLL指标
     * @param {number[]} close - 收盘价数组
     * @param {number} n - 周期，默认20
     * @param {number} k - 标准差倍数，默认2
     * @returns {Object} {mid, upper, lower}
     */
    BOLL: function(close, n = 20, k = 2) {
        const mid = this.MA(close, n);
        const upper = [];
        const lower = [];
        
        for (let i = 0; i < close.length; i++) {
            if (i < n - 1) {
                upper.push(null);
                lower.push(null);
            } else {
                let sum = 0;
                for (let j = i - n + 1; j <= i; j++) {
                    sum += Math.pow(close[j] - mid[i], 2);
                }
                const std = Math.sqrt(sum / n);
                upper.push(mid[i] + k * std);
                lower.push(mid[i] - k * std);
            }
        }
        
        return { mid, upper, lower };
    },

    /**
     * 计算RSI指标
     */
    RSI: function(close, period = 6) {
        const result = [];
        for (let i = 0; i < close.length; i++) {
            if (i < period) {
                result.push(50);
            } else {
                let gainSum = 0;
                let lossSum = 0;
                for (let j = i - period + 1; j <= i; j++) {
                    const change = close[j] - close[j - 1];
                    if (change > 0) {
                        gainSum += change;
                    } else {
                        lossSum -= change;
                    }
                }
                if (gainSum + lossSum === 0) {
                    result.push(50);
                } else {
                    result.push(gainSum / (gainSum + lossSum) * 100);
                }
            }
        }
        return result;
    },

    /**
     * 计算WR指标 (威廉指标)
     */
    WR: function(klines, period = 10) {
        const high = klines.map(k => k.high_hfq);
        const low = klines.map(k => k.low_hfq);
        const close = klines.map(k => k.close_hfq);
        
        const hhv = this.HHV(high, period);
        const llv = this.LLV(low, period);
        
        const result = [];
        for (let i = 0; i < close.length; i++) {
            if (hhv[i] === llv[i]) {
                result.push(50);
            } else {
                result.push((hhv[i] - close[i]) / (hhv[i] - llv[i]) * 100);
            }
        }
        return result;
    },

    /**
     * 计算CCI指标
     */
    CCI: function(klines, period = 14) {
        const typ = klines.map(k => (k.high_hfq + k.low_hfq + k.close_hfq) / 3);
        const ma = this.MA(typ, period);
        const avedev = this.AVEDEV(typ, period);
        
        const result = [];
        for (let i = 0; i < typ.length; i++) {
            if (avedev[i] === 0) {
                result.push(0);
            } else {
                result.push((typ[i] - ma[i]) / (0.015 * avedev[i]));
            }
        }
        return result;
    },

    /**
     * 自定义指标1 - 多空趋势指标
     * 基于通达信公式实现
     */
    Custom1: function(klines) {
        const high = klines.map(k => k.high_hfq);
        const low = klines.map(k => k.low_hfq);
        const close = klines.map(k => k.close_hfq);
        
        // HHV和LLV计算
        const hhv34 = this.HHV(high, 34);
        const llv34 = this.LLV(low, 34);
        const hhv14 = this.HHV(high, 14);
        const llv14 = this.LLV(low, 14);
        
        // 计算基础值
        const baseA = [];
        const baseB = [];
        const baseD = [];
        
        for (let i = 0; i < close.length; i++) {
            const range34 = hhv34[i] - llv34[i];
            const range14 = hhv14[i] - llv14[i];
            
            if (range34 === 0) {
                baseA.push(0);
                baseD.push(0);
            } else {
                baseA.push(-100 * (hhv34[i] - close[i]) / range34);
                baseD.push(-100 * (hhv34[i] - close[i]) / range34);
            }
            
            if (range14 === 0) {
                baseB.push(0);
            } else {
                baseB.push(-100 * (hhv14[i] - close[i]) / range14);
            }
        }
        
        // A = MA(baseA, 19)
        const A = this.MA(baseA, 19);
        // D = EMA(baseD, 4)
        const D = this.EMA(baseD, 4);
        
        // 长期线 = A + 100
        const longLine = A.map(v => v !== null ? v + 100 : null);
        // 短期线 = B + 100
        const shortLine = baseB.map(v => v + 100);
        // 中期线 = D + 100
        const midLine = D.map(v => v + 100);
        
        // 计算顶部区域和底部区域信号
        const topArea = [];
        const bottomArea = [];
        const lowGoldCross = [];
        
        for (let i = 0; i < close.length; i++) {
            // 顶部区域判断
            const midPrev = i > 0 ? midLine[i - 1] : midLine[i];
            const shortPrev = i > 0 ? shortLine[i - 1] : shortLine[i];
            const shortPrev2 = i > 1 ? shortLine[i - 2] : shortLine[i];
            
            const isTop = (midLine[i] < midPrev && midPrev > 80) &&
                         (shortPrev > 95 || shortPrev2 > 95) &&
                         longLine[i] > 60 &&
                         shortLine[i] < 83.5 &&
                         shortLine[i] < midLine[i] &&
                         shortLine[i] < longLine[i] + 4;
            topArea.push(isTop);
            
            // 底部区域判断
            const isBottom = (longLine[i] < 12 && midLine[i] < 8 && 
                            (shortLine[i] < 7.2 || shortPrev < 5) &&
                            (midLine[i] > midPrev || shortLine[i] > shortPrev)) ||
                           (longLine[i] < 8 && midLine[i] < 7 && shortLine[i] < 15 && shortLine[i] > shortPrev) ||
                           (longLine[i] < 10 && midLine[i] < 7 && shortLine[i] < 1);
            bottomArea.push(isBottom);
            
            // 低位金叉判断
            const longPrev = i > 0 ? longLine[i - 1] : longLine[i];
            const isLowGold = longLine[i] < 15 && longPrev < 15 &&
                            midLine[i] < 18 && shortLine[i] > shortPrev &&
                            (shortPrev < 5 || shortPrev2 < 5) &&
                            (midLine[i] >= longLine[i] || shortPrev < 1);
            
            // 检查金叉
            const crossUp = i > 0 && shortLine[i - 1] <= longLine[i - 1] && shortLine[i] > longLine[i];
            lowGoldCross.push(isLowGold && crossUp && shortLine[i] > midLine[i] ? 50 : 0);
        }
        
        // 过滤顶部信号
        const filteredTop = this.FILTER(topArea, 4);
        
        return {
            longLine,      // 长期线 (紫色)
            shortLine,     // 短期线 (灰色)
            midLine,       // 中期线 (黄色)
            topArea: filteredTop,      // 顶部区域信号
            bottomArea,    // 底部区域信号
            lowGoldCross,  // 低位金叉信号
            // 水平参考线
            line80: 80,
            line20: 20,
            line10: 10,
            line90: 90
        };
    },

    /**
     * 自定义指标2 - 动力线指标
     * 基于通达信公式实现
     */
    Custom2: function(klines) {
        const high = klines.map(k => k.high_hfq);
        const low = klines.map(k => k.low_hfq);
        const close = klines.map(k => k.close_hfq);
        const open = klines.map(k => k.open_hfq);
        
        // VAR2 = LLV(LOW, 10)
        const var2 = this.LLV(low, 10);
        // VAR3 = HHV(HIGH, 25)
        const var3 = this.HHV(high, 25);
        
        // 动力线 = EMA((CLOSE-VAR2)/(VAR3-VAR2)*4, 4)
        const powerBase = [];
        for (let i = 0; i < close.length; i++) {
            const range = var3[i] - var2[i];
            if (range === 0) {
                powerBase.push(0);
            } else {
                powerBase.push((close[i] - var2[i]) / range * 4);
            }
        }
        const powerLine = this.EMA(powerBase, 4);
        
        // 计算动力线颜色（上涨红色，下跌绿色）
        const powerColors = [];
        for (let i = 0; i < powerLine.length; i++) {
            const prev = i > 0 ? powerLine[i - 1] : powerLine[i];
            powerColors.push(powerLine[i] > prev ? 'up' : 'down');
        }
        
        // 计算各种信号
        const signals = {
            crossUp05: [],    // 上穿0.5(关注)
            crossDown35: [],  // 下穿3.5(清仓)
            crossUp02: [],    // 上穿0.2(底部)
            crossDown32: []   // 下穿3.2(阶段卖)
        };
        
        for (let i = 0; i < powerLine.length; i++) {
            const prev = i > 0 ? powerLine[i - 1] : powerLine[i];
            signals.crossUp05.push(prev <= 0.5 && powerLine[i] > 0.5);
            signals.crossDown35.push(prev >= 3.5 && powerLine[i] < 3.5);
            signals.crossUp02.push(prev <= 0.2 && powerLine[i] > 0.2);
            signals.crossDown32.push(prev >= 3.2 && powerLine[i] < 3.2);
        }
        
        // 过滤信号
        const filteredUp05 = this.FILTER(signals.crossUp05, 20);
        const filteredDown35 = this.FILTER(signals.crossDown35, 20);
        const filteredUp02 = this.FILTER(signals.crossUp02, 20);
        const filteredDown32 = this.FILTER(signals.crossDown32, 20);
        
        // 计算买点信号
        // 星K买点
        const starK = [];
        for (let i = 0; i < close.length; i++) {
            if (i < 2) {
                starK.push(false);
                continue;
            }
            const a3 = Math.abs(close[i-2] - open[i-2]) / open[i-2] < 0.012;
            const a2 = (open[i-1] - close[i-1]) / open[i-1] < 0.008;
            const a1 = Math.abs(close[i] - open[i]) / open[i] < 0.012;
            
            const b1 = close[i-2] > open[i-2] ? open[i-2] : close[i-2];
            const b2 = close[i-1] < open[i-1] ? open[i-1] : close[i-1];
            const b3 = close[i] > open[i] ? open[i] : close[i];
            
            const ma5 = this.MA(close.slice(0, i+1), 5);
            const b4 = b1 > b2 && b3 > b2 && close[i-1] < (ma5[ma5.length-1] || close[i]);
            
            starK.push(a3 && a2 && a1 && b4);
        }
        
        // 准备上买点
        const varo5 = this.LLV(low, 27);
        const varo6 = this.HHV(high, 34);
        const varo7Base = [];
        for (let i = 0; i < close.length; i++) {
            const range = varo6[i] - varo5[i];
            if (range === 0) {
                varo7Base.push(0);
            } else {
                varo7Base.push((close[i] - varo5[i]) / range * 4);
            }
        }
        const varo7 = this.EMA(varo7Base, 4).map(v => v * 25);
        
        const buildArea = varo7.map(v => v < 10);
        const buildCount = this.COUNT(buildArea, 3);
        
        // VAR1计算
        const hhv5 = this.HHV(high, 5);
        const llv5 = this.LLV(low, 5);
        const var1Base = [];
        for (let i = 0; i < close.length; i++) {
            const range = hhv5[i] - llv5[i];
            if (range === 0) {
                var1Base.push(50);
            } else {
                var1Base.push((close[i] - llv5[i]) / range * 100);
            }
        }
        const sma1 = this.SMA_TDX(var1Base, 5, 1);
        const sma2 = this.SMA_TDX(sma1, 3, 1);
        const var1 = [];
        for (let i = 0; i < sma1.length; i++) {
            var1.push(4 * sma1[i] - 3 * sma2[i]);
        }
        
        const riseSignal = this.CROSS(var1, var1.map(() => 8));
        
        const readyUp = [];
        for (let i = 0; i < close.length; i++) {
            const inBuild = buildArea[i] || (i > 0 && buildArea[i-1]);
            readyUp.push(inBuild && riseSignal[i]);
        }
        
        // 出手买点
        const ema2 = this.EMA(close, 2);
        const ema10 = this.EMA(close, 10);
        const diff = [];
        for (let i = 0; i < close.length; i++) {
            diff.push(ema2[i] - ema10[i]);
        }
        const diffEma = this.EMA(diff, 2);
        const ma20 = this.MA(close, 20);
        
        const shootSignal = [];
        for (let i = 0; i < close.length; i++) {
            if (i === 0) {
                shootSignal.push(false);
                continue;
            }
            const crossDiff = diff[i-1] <= diffEma[i-1] && diff[i] > diffEma[i];
            const belowZero = diffEma[i] < 0;
            const crossMa20 = close[i-1] <= ma20[i-1] && close[i] > ma20[i];
            shootSignal.push(crossDiff && belowZero && crossMa20);
        }
        const filteredShoot = this.FILTER(shootSignal, 90);
        
        // 强势买点
        const wr1 = this.WR(klines, 10);
        const kdj = this.KDJ(klines);
        const macd = this.MACD(close);
        const cci = this.CCI(klines);
        const rsi1 = this.RSI(close, 6);
        const rsi2 = this.RSI(close, 12);
        
        const ma20_2 = this.MA(close, 20);
        const ma40 = this.MA(close, 40);
        const ma60 = this.MA(close, 60);
        
        const strongSignal = [];
        for (let i = 0; i < close.length; i++) {
            const d1 = wr1[i] < 5;
            const d2 = i > 0 && kdj.k[i-1] <= kdj.d[i-1] && kdj.k[i] > kdj.d[i] && kdj.k[i] < 50;
            const d3 = i > 0 && macd.dif[i-1] <= macd.dea[i-1] && macd.dif[i] > macd.dea[i];
            const d4 = cci[i] > -100 && cci[i] < -90;
            const d5 = i > 0 && rsi1[i-1] <= rsi2[i-1] && rsi1[i] > rsi2[i] && rsi1[i] < 50;
            
            const aaa = close[i] > open[i];
            const bbb = aaa && close[i] > ma20_2[i] && close[i] > ma40[i] && close[i] > ma60[i];
            const ccc = bbb && open[i] < ma40[i] && open[i] < ma60[i];
            const xg1 = ccc && (close[i] - open[i]) > 0.0618 * close[i];
            
            const aa1 = d1 && d2;
            const aa2 = d2 && d3;
            const aa3 = d1 && d3;
            const xg2 = aa1 || aa2 || aa3;
            
            strongSignal.push(xg1 && xg2 ? 1 : 0);
        }
        
        // 底部买点
        const ww = [];
        for (let i = 0; i < close.length; i++) {
            ww.push(Math.abs((2*close[i] + high[i] + low[i])/4 - ma20_2[i]) / (ma20_2[i] || 1));
        }
        const mm = this.DMA(close, ww);
        const channel4 = mm.map(v => (1 - 7/100) * v);
        
        const var4 = this.EXPMA(close, 9);
        const ldn = this.EXPMA(var4.map(v => v * 0.86), 5);
        
        const typ = klines.map(k => (k.high_hfq + k.low_hfq + k.close_hfq) / 3);
        const maTYP = this.MA(typ, 14);
        const avedevTYP = this.AVEDEV(typ, 14);
        const cciVal = [];
        for (let i = 0; i < typ.length; i++) {
            if (avedevTYP[i] === 0) {
                cciVal.push(0);
            } else {
                cciVal.push((typ[i] - maTYP[i]) / (0.015 * avedevTYP[i]));
            }
        }
        
        // TR计算
        const tr = [];
        for (let i = 0; i < close.length; i++) {
            if (i === 0) {
                tr.push(high[i] - low[i]);
            } else {
                tr.push(Math.max(
                    high[i] - low[i],
                    Math.abs(high[i] - close[i-1]),
                    Math.abs(close[i-1] - low[i])
                ));
            }
        }
        const ttrr = this.EXPMEMA(tr, 14);
        
        // DMP, DMM计算
        const dmp = [];
        const dmm = [];
        for (let i = 0; i < close.length; i++) {
            if (i === 0) {
                dmp.push(0);
                dmm.push(0);
            } else {
                const hd = high[i] - high[i-1];
                const ld = low[i-1] - low[i];
                dmp.push(hd > 0 && hd > ld ? hd : 0);
                dmm.push(ld > 0 && ld > hd ? ld : 0);
            }
        }
        const dmpEma = this.EXPMEMA(dmp, 14);
        const dmmEma = this.EXPMEMA(dmm, 14);
        
        const pdi = [];
        const mdi = [];
        for (let i = 0; i < close.length; i++) {
            pdi.push(ttrr[i] === 0 ? 0 : dmpEma[i] * 100 / ttrr[i]);
            mdi.push(ttrr[i] === 0 ? 0 : dmmEma[i] * 100 / ttrr[i]);
        }
        
        const adxBase = [];
        for (let i = 0; i < close.length; i++) {
            const sum = mdi[i] + pdi[i];
            adxBase.push(sum === 0 ? 0 : Math.abs(mdi[i] - pdi[i]) / sum * 100);
        }
        const adx = this.EXPMEMA(adxBase, 6);
        
        const bottomBuy = [];
        for (let i = 0; i < close.length; i++) {
            bottomBuy.push(
                close[i] <= channel4[i] &&
                close[i] <= ldn[i] &&
                cciVal[i] < -100 &&
                adx[i] >= 60 &&
                mdi[i] >= pdi[i] &&
                close[i] > open[i]
            );
        }
        
        return {
            powerLine,      // 动力线
            powerColors,    // 动力线颜色
            // 水平参考线
            line35: 3.5,    // 清仓线
            line32: 3.2,    // 阶段卖线
            line175: 1.75,  // 界线
            line05: 0.5,    // 关注线
            line02: 0.2,    // 底部线
            // 信号
            buySignals: filteredUp05.map((v, i) => v || filteredUp02[i]),
            sellSignals: filteredDown35.map((v, i) => v || filteredDown32[i]),
            starK,
            readyUp,
            shootSignal: filteredShoot,
            strongSignal,
            bottomBuy
        };
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Indicators;
}