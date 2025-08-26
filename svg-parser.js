// SVG地图解析和处理脚本
class SVGMapManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.currentScale = 1;
        this.minScale = 0.3;
        this.maxScale = 4;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.stationElements = new Map();
        this.highlightedStation = null;
    }

    async loadSVG() {
        try {
            // 加载SVG文件
            const response = await fetch('Beijing-Subway-Plan.svg');
            const svgText = await response.text();
            
            // 解析SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            this.svg = svgDoc.documentElement;
            
            // 设置SVG属性
            this.setupSVG();
            
            // 添加到容器
            this.container.innerHTML = '';
            this.container.appendChild(this.svg);
            
            // 解析站点元素
            this.parseStationElements();
            
            // 调试：列出所有站点
            this.listAllStations();
            
            // 绑定事件
            this.bindEvents();
            
            return true;
        } catch (error) {
            console.error('加载SVG失败:', error);
            this.showError();
            return false;
        }
    }

    setupSVG() {
        // 设置SVG基本属性
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.cursor = 'grab';
        this.svg.style.transformOrigin = 'center';
        
        // 保存原始viewBox
        const originalViewBox = this.svg.getAttribute('viewBox');
        if (originalViewBox) {
            this.svg.setAttribute('data-original-viewbox', originalViewBox);
        }
        
        // 确保SVG有正确的viewBox
        if (!this.svg.getAttribute('viewBox')) {
            const bbox = this.svg.getBBox();
            const viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
            this.svg.setAttribute('viewBox', viewBox);
            this.svg.setAttribute('data-original-viewbox', viewBox);
        }
        
        console.log('SVG设置完成，原始viewBox:', this.svg.getAttribute('data-original-viewbox'));
    }

    parseStationElements() {
        // 查找所有可能的站点元素
        const circles = this.svg.querySelectorAll('circle');
        const texts = this.svg.querySelectorAll('text');
        
        console.log(`找到 ${circles.length} 个circle元素，${texts.length} 个text元素`);
        
        // 解析circle元素（站点图标）
        circles.forEach(circle => {
            const id = circle.getAttribute('id');
            const r = parseFloat(circle.getAttribute('r') || '0');
            
            // 查找半径在合理范围内的circle（通常是站点）
            if (r > 2 && r < 15) {
                this.stationElements.set(`circle_${id || 'unknown'}`, circle);
            }
        });
        
        // 解析text元素（站点名称）
        texts.forEach(text => {
            const textContent = text.textContent?.trim();
            if (textContent && textContent.length > 0 && textContent.length < 10) {
                // 检查是否是已知的站点名称
                if (stationData.some(station => station.name === textContent)) {
                    this.stationElements.set(textContent, text);
                }
            }
        });
        
        console.log(`解析完成，共找到 ${this.stationElements.size} 个站点元素`);
        
        // 输出所有找到的站点名称
        this.stationElements.forEach((element, key) => {
            if (element.tagName.toLowerCase() === 'text') {
                console.log(`找到站点文本: ${key}`);
            }
        });
    }

    highlightStation(stationName) {
        // 清除之前的高亮
        this.clearHighlight();
        
        console.log(`开始高亮站点: ${stationName}`);
        
        // 直接在所有text元素中查找
        const allTexts = this.svg.querySelectorAll('text');
        let foundElement = null;
        
        allTexts.forEach(text => {
            const textContent = text.textContent?.trim();
            if (textContent === stationName) {
                foundElement = text;
                console.log(`找到站点文本元素: ${stationName}`);
            }
        });
        
        if (!foundElement) {
            console.warn(`未找到站点 "${stationName}" 的SVG元素`);
            return false;
        }
        
        // 高亮显示站点
        this.applyHighlight(foundElement);
        
        // 显示全图，不进行局部放大
        this.showFullMap();
        this.highlightedStation = stationName;
        
        return true;
    }
    
    showFullMap() {
        // 恢复原始viewBox显示全图
        const originalViewBox = this.svg.getAttribute('data-original-viewbox');
        if (originalViewBox) {
            this.svg.setAttribute('viewBox', originalViewBox);
            console.log('显示全图');
        }
    }

    findStationElements(stationName) {
        const elements = [];
        
        console.log(`查找站点: ${stationName}`);
        
        // 直接匹配站点名称
        if (this.stationElements.has(stationName)) {
            const element = this.stationElements.get(stationName);
            elements.push(element);
            console.log(`直接匹配找到: ${stationName}`);
        }
        
        // 如果没有直接匹配，尝试模糊匹配
        if (elements.length === 0) {
            this.stationElements.forEach((element, key) => {
                if (key.includes(stationName) || stationName.includes(key)) {
                    elements.push(element);
                    console.log(`模糊匹配找到: ${key}`);
                }
            });
        }
        
        // 如果还是没找到，尝试在所有text元素中查找
        if (elements.length === 0) {
            const allTexts = this.svg.querySelectorAll('text');
            allTexts.forEach(text => {
                const textContent = text.textContent?.trim();
                if (textContent === stationName) {
                    elements.push(text);
                    console.log(`在所有文本中找到: ${stationName}`);
                }
            });
        }
        
        console.log(`最终找到 ${elements.length} 个匹配元素`);
        return elements;
    }

    applyHighlight(element) {
        console.log('应用高亮到元素:', element);
        console.log('元素类型:', element.tagName);
        console.log('元素内容:', element.textContent);
        
        // 获取元素的位置信息
        const bbox = element.getBBox();
        const transform = element.getAttribute('transform') || '';
        
        console.log('元素边界框:', bbox);
        console.log('元素transform:', transform);
        
        // 创建高亮覆盖层，不修改原元素
        this.createHighlightOverlay(element, bbox, transform);
        
        console.log('高亮应用完成');
    }
    
    createHighlightOverlay(element, bbox, transform) {
        // 移除之前的高亮覆盖层
        this.removeHighlightOverlay();
        
        // 创建新的高亮覆盖层
        const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        
        // 复制原元素的所有属性
        const originalAttributes = element.attributes;
        for (let i = 0; i < originalAttributes.length; i++) {
            const attr = originalAttributes[i];
            overlay.setAttribute(attr.name, attr.value);
        }
        
        // 设置高亮样式
        overlay.style.fill = '#ff0000';
        overlay.style.fontWeight = 'bold';
        overlay.style.filter = 'drop-shadow(0 0 15px #ff0000)';
        overlay.style.animation = 'earthquakeWave 3s infinite';
        overlay.style.pointerEvents = 'none'; // 不阻挡交互
        
        // 复制文本内容
        overlay.textContent = element.textContent;
        
        // 添加到SVG中
        this.svg.appendChild(overlay);
        
        // 保存引用以便后续移除
        this.highlightOverlay = overlay;
        
        console.log('创建高亮覆盖层完成');
    }
    
    removeHighlightOverlay() {
        if (this.highlightOverlay) {
            this.highlightOverlay.remove();
            this.highlightOverlay = null;
        }
    }
    
    addPulseAnimation() {
        // 检查是否已经添加了动画样式
        if (document.getElementById('pulse-animation-style')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'pulse-animation-style';
        style.textContent = `
            @keyframes earthquakeWave {
                0% { 
                    opacity: 1; 
                    filter: drop-shadow(0 0 15px #ff0000);
                }
                25% { 
                    opacity: 0.9; 
                    filter: drop-shadow(0 0 25px #ff0000);
                }
                50% { 
                    opacity: 1; 
                    filter: drop-shadow(0 0 20px #ff0000);
                }
                75% { 
                    opacity: 0.8; 
                    filter: drop-shadow(0 0 30px #ff0000);
                }
                100% { 
                    opacity: 1; 
                    filter: drop-shadow(0 0 15px #ff0000);
                }
            }
        `;
        document.head.appendChild(style);
    }

    clearHighlight() {
        // 移除高亮覆盖层
        this.removeHighlightOverlay();
        
        // 清除所有高亮类
        const highlighted = this.svg.querySelectorAll('.highlighted-station');
        highlighted.forEach(element => {
            element.classList.remove('highlighted-station');
        });
        
        this.highlightedStation = null;
        console.log('清除高亮完成');
    }

    // 移除focusOnElement函数，不再需要局部放大功能
    
    applyTransformImmediate() {
        if (this.svg) {
            // 直接设置变换，无过渡动画
            this.svg.style.transition = 'none';
            this.svg.style.transformOrigin = 'center';
            this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`;
            
            // 强制重绘
            this.svg.offsetHeight;
            
            console.log(`立即应用变换: translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`);
        }
    }

    bindEvents() {
        // 绑定缩放控制按钮
        this.bindZoomControls();
        
        // 绑定拖拽事件
        this.bindDragEvents();
        
        // 绑定滚轮缩放
        this.bindWheelZoom();
    }

    bindZoomControls() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const resetBtn = document.getElementById('reset-view');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
        }
    }

    bindDragEvents() {
        this.svg.addEventListener('mousedown', (e) => this.startDrag(e));
        this.svg.addEventListener('mousemove', (e) => this.drag(e));
        this.svg.addEventListener('mouseup', () => this.endDrag());
        this.svg.addEventListener('mouseleave', () => this.endDrag());
        
        // 移动端支持
        this.svg.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        this.svg.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.drag(e.touches[0]);
        });
        this.svg.addEventListener('touchend', () => this.endDrag());
    }

    bindWheelZoom() {
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.currentScale + delta));
            
            if (newScale !== this.currentScale) {
                this.currentScale = newScale;
                this.applyTransform();
            }
        });
    }

    startDrag(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.svg.style.cursor = 'grabbing';
    }

    drag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMousePos.x;
        const deltaY = e.clientY - this.lastMousePos.y;
        
        this.translateX += deltaX;
        this.translateY += deltaY;
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.applyTransform();
    }

    endDrag() {
        this.isDragging = false;
        this.svg.style.cursor = 'grab';
    }

    zoomIn() {
        if (this.currentScale < this.maxScale) {
            this.currentScale = Math.min(this.maxScale, this.currentScale + 0.2);
            this.applyTransform();
        }
    }

    zoomOut() {
        if (this.currentScale > this.minScale) {
            this.currentScale = Math.max(this.minScale, this.currentScale - 0.2);
            this.applyTransform();
        }
    }

    resetView() {
        // 恢复原始viewBox
        const originalViewBox = this.svg.getAttribute('data-original-viewbox');
        if (originalViewBox) {
            this.svg.setAttribute('viewBox', originalViewBox);
        }
        
        this.currentScale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
        this.clearHighlight();
        console.log('重置视图完成');
    }

    applyTransform() {
        if (this.svg) {
            // 确保变换原点在中心
            this.svg.style.transformOrigin = 'center';
            this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`;
            console.log(`应用变换: translate(${this.translateX}px, ${this.translateY}px) scale(${this.currentScale})`);
        }
    }

    showError() {
        this.container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">📍</p>
                <p>地图加载失败</p>
                <p style="font-size: 0.9rem; color: #999;">请检查网络连接</p>
            </div>
        `;
    }
    
    // 调试函数：列出所有站点名称
    listAllStations() {
        const allTexts = this.svg.querySelectorAll('text');
        const stations = [];
        
        allTexts.forEach(text => {
            const textContent = text.textContent?.trim();
            if (textContent && textContent.length > 0 && textContent.length < 10) {
                stations.push(textContent);
            }
        });
        
        console.log('SVG中的所有文本元素:', stations);
        return stations;
    }
}

// 全局SVG管理器实例
let svgManager = null;

// 初始化SVG地图
function initializeSVGMap() {
    svgManager = new SVGMapManager('svg-map-container');
    return svgManager.loadSVG();
}

// 高亮显示站点
function highlightStationOnMap(stationName) {
    if (svgManager) {
        return svgManager.highlightStation(stationName);
    }
    return false;
}
