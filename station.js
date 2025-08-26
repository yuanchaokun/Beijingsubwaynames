// 站点详情页面脚本
document.addEventListener('DOMContentLoaded', function() {
    initializeStationPage();
});

let currentStation = null;
let currentMode = 'random';
let currentLine = null;

async function initializeStationPage() {
    // 解析URL参数
    const params = parseURLParams();
    
    if (!params.id) {
        // 如果没有站点ID，跳转回首页
        window.location.href = 'index.html';
        return;
    }
    
    // 设置当前状态
    currentMode = params.mode || 'random';
    currentLine = params.line || null;
    
    // 获取站点数据
    currentStation = getStationById(parseInt(params.id));
    
    if (!currentStation) {
        showError('站点信息未找到');
        return;
    }
    
    // 渲染站点信息
    renderStationInfo();
    
    // 初始化导航按钮
    setupNavigationButtons();
    
    // 初始化地图
    await initializeMap();
    
    // 高亮显示当前站点
    highlightCurrentStation();
}

function parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id'),
        mode: urlParams.get('mode'),
        line: urlParams.get('line')
    };
}

function renderStationInfo() {
    // 设置页面标题
    document.getElementById('page-title').textContent = `${currentStation.name} - 北京地铁站名探索`;
    
    // 设置站点名称
    document.getElementById('station-name').textContent = currentStation.name;
    
    // 渲染线路标识
    renderLineBadges();
    
    // 设置站名来源
    document.getElementById('station-origin').textContent = currentStation.origin || '暂无相关信息';
    
    // 设置历史故事
    document.getElementById('station-history').textContent = currentStation.history || '暂无相关信息';
}

function renderLineBadges() {
    const lineBadgesContainer = document.getElementById('line-badges');
    lineBadgesContainer.innerHTML = '';
    
    currentStation.lines.forEach(lineName => {
        const badge = document.createElement('span');
        badge.className = 'line-badge';
        badge.textContent = lineName;
        badge.style.backgroundColor = getLineColor(lineName);
        lineBadgesContainer.appendChild(badge);
    });
}

function getLineColor(lineName) {
    return lineInfo[lineName]?.color || '#666';
}

function setupNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevText = document.getElementById('prev-text');
    const nextText = document.getElementById('next-text');
    
    if (currentMode === 'random') {
        // 随机模式
        prevText.textContent = '再来一个';
        nextText.textContent = '选择其他';
        
        prevBtn.addEventListener('click', () => {
            const randomStation = getRandomStation();
            goToStation(randomStation, 'random');
        });
        
        nextBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
    } else if (currentMode === 'line' && currentLine) {
        // 线路模式
        const lineStations = getStationsByLine(currentLine);
        const currentIndex = lineStations.findIndex(station => station.id === currentStation.id);
        
        if (currentIndex !== -1) {
            // 设置按钮文本为"上一站"和"下一站"
            prevText.textContent = '上一站';
            nextText.textContent = '下一站';
            
            // 获取上一站和下一站
            const prevStation = getPrevStation(currentStation, currentLine);
            const nextStation = getNextStation(currentStation, currentLine);
            
            // 绑定点击事件
            prevBtn.addEventListener('click', () => {
                if (prevStation) {
                    goToStation(prevStation, 'line', currentLine);
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (nextStation) {
                    goToStation(nextStation, 'line', currentLine);
                }
            });
            
            // 如果到达线路端点，禁用对应按钮
            if (!prevStation) {
                prevBtn.disabled = true;
                prevBtn.style.opacity = '0.5';
                prevBtn.style.cursor = 'not-allowed';
            }
            
            if (!nextStation) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
            }
        }
        
    } else if (currentMode === 'search') {
        // 搜索模式
        prevText.textContent = '返回搜索';
        nextText.textContent = '随机站点';
        
        prevBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        nextBtn.addEventListener('click', () => {
            const randomStation = getRandomStation();
            goToStation(randomStation, 'random');
        });
    }
}

async function initializeMap() {
    try {
        // 显示加载状态
        showMapLoading();
        
        // 初始化SVG地图
        const success = await initializeSVGMap();
        
        if (!success) {
            showMapError();
        }
        
    } catch (error) {
        console.error('地图初始化失败:', error);
        showMapError();
    }
}

function showMapLoading() {
    const mapContainer = document.getElementById('svg-map-container');
    mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <p>地图加载中...</p>
        </div>
    `;
    
    // 添加旋转动画
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function showMapError() {
    const mapContainer = document.getElementById('svg-map-container');
    mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
            <p style="font-size: 2rem; margin-bottom: 1rem;">🗺️</p>
            <p>地图加载失败</p>
            <button onclick="initializeMap()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>
        </div>
    `;
}

function highlightCurrentStation() {
    if (typeof highlightStationOnMap === 'function') {
        // 延迟一点时间确保SVG完全加载
        setTimeout(() => {
            const success = highlightStationOnMap(currentStation.name);
            if (!success) {
                console.warn(`无法在地图上高亮显示站点: ${currentStation.name}`);
            }
        }, 500);
    }
}

function goToStation(station, mode, lineName = null) {
    // 构建URL参数
    const params = new URLSearchParams({
        id: station.id,
        mode: mode
    });
    
    if (lineName) {
        params.append('line', lineName);
    }
    
    // 跳转到新站点
    window.location.href = `station.html?${params.toString()}`;
}

function showError(message) {
    document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #666; font-family: 'Noto Serif SC', serif;">
            <p style="font-size: 2rem; margin-bottom: 1rem;">😔</p>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">${message}</p>
            <button onclick="window.location.href='index.html'" style="padding: 1rem 2rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 1rem;">返回首页</button>
        </div>
    `;
}

// 添加键盘导航支持
document.addEventListener('keydown', function(event) {
    if (currentMode === 'line' && currentLine) {
        if (event.key === 'ArrowLeft') {
            // 上一站
            const prevStation = getPrevStation(currentStation, currentLine);
            if (prevStation) {
                goToStation(prevStation, 'line', currentLine);
            }
        } else if (event.key === 'ArrowRight') {
            // 下一站
            const nextStation = getNextStation(currentStation, currentLine);
            if (nextStation) {
                goToStation(nextStation, 'line', currentLine);
            }
        }
    } else if (event.key === ' ') {
        // 空格键：随机站点
        event.preventDefault();
        const randomStation = getRandomStation();
        goToStation(randomStation, 'random');
    }
});

// 添加移动端手势支持
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchend', function(event) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 只处理水平滑动，且滑动距离足够
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
        if (currentMode === 'line' && currentLine) {
            if (deltaX > 0) {
                // 右滑：上一站
                const prevStation = getPrevStation(currentStation, currentLine);
                if (prevStation) {
                    goToStation(prevStation, 'line', currentLine);
                }
            } else {
                // 左滑：下一站
                const nextStation = getNextStation(currentStation, currentLine);
                if (nextStation) {
                    goToStation(nextStation, 'line', currentLine);
                }
            }
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});
