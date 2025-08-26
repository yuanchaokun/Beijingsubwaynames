// 首页主要功能脚本
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容已加载');
    console.log('stationData是否存在:', typeof stationData !== 'undefined');
    console.log('站点数据:', stationData);
    
    // 初始化页面
    initializeHomePage();
});

function initializeHomePage() {
    console.log('开始初始化首页...');
    
    // 绑定选项卡点击事件
    bindOptionEvents();
    
    // 初始化模态框
    initializeModals();
    
    console.log('首页初始化完成');
}

function bindOptionEvents() {
    // 检查元素是否存在并添加调试信息
    console.log('开始绑定按钮事件...');
    
    // 随机站点
    const randomBtn = document.getElementById('random-station');
    if (randomBtn) {
        console.log('找到随机站点按钮');
        randomBtn.addEventListener('click', function() {
            console.log('点击了随机站点按钮');
            try {
                const randomStation = getRandomStation();
                console.log('随机站点:', randomStation);
                goToStationPage(randomStation, 'random');
            } catch (error) {
                console.error('随机站点错误:', error);
                alert('发生错误: ' + error.message);
            }
        });
    } else {
        console.error('未找到随机站点按钮');
    }

    // 选择线路
    const lineBtn = document.getElementById('select-line');
    if (lineBtn) {
        console.log('找到选择线路按钮');
        lineBtn.addEventListener('click', function() {
            console.log('点击了选择线路按钮');
            try {
                showLineModal();
            } catch (error) {
                console.error('选择线路错误:', error);
                alert('发生错误: ' + error.message);
            }
        });
    } else {
        console.error('未找到选择线路按钮');
    }

    // 搜索站点 - 现在直接使用搜索框
    const searchBtn = document.getElementById('search-station');
    if (searchBtn) {
        console.log('找到搜索站点卡片');
        // 移除点击事件，因为现在直接使用搜索框
    } else {
        console.error('未找到搜索站点卡片');
    }
    
    // 初始化搜索联想功能
    initializeSearchSuggestions();
    
    console.log('按钮事件绑定完成');
}

function initializeModals() {
    // 获取模态框元素
    const lineModal = document.getElementById('line-modal');
    const searchModal = document.getElementById('search-modal');
    
    // 关闭按钮事件
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === lineModal || event.target === searchModal) {
            closeAllModals();
        }
    });
    
    // 搜索功能
    initializeSearch();
}

function showLineModal() {
    const modal = document.getElementById('line-modal');
    const lineList = document.getElementById('line-list');
    
    // 清空线路列表
    lineList.innerHTML = '';
    
    // 获取所有线路并生成列表
    const lines = getAllLines();
    lines.forEach(lineName => {
        const lineItem = createLineItem(lineName);
        lineList.appendChild(lineItem);
    });
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 添加显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function createLineItem(lineName) {
    const lineItem = document.createElement('div');
    lineItem.className = 'line-item';
    lineItem.textContent = lineName;
    
    // 设置线路颜色
    const lineColor = lineInfo[lineName]?.color || '#666';
    lineItem.style.backgroundColor = lineColor;
    
    // 添加点击事件
    lineItem.addEventListener('click', function() {
        selectLine(lineName);
    });
    
    return lineItem;
}

function selectLine(lineName) {
    // 获取该线路的所有站点
    const stations = getStationsByLine(lineName);
    
    if (stations.length > 0) {
        // 跳转到第一个站点，并传递线路信息
        goToStationPage(stations[0], 'line', lineName);
    }
    
    closeAllModals();
}

function showSearchModal() {
    const modal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    
    // 清空搜索框和结果
    searchInput.value = '';
    document.getElementById('search-results').innerHTML = '';
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 添加显示动画
    setTimeout(() => {
        modal.classList.add('show');
        searchInput.focus();
    }, 10);
}

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', performSearch);
    
    // 输入框回车事件
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // 实时搜索（输入时）
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 0) {
            performSearch();
        } else {
            searchResults.innerHTML = '';
        }
    });
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    const searchResults = document.getElementById('search-results');
    
    if (query.length === 0) {
        searchResults.innerHTML = '<p class="no-results">请输入站点名称</p>';
        return;
    }
    
    const results = searchStations(query);
    
    // 清空之前的结果
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">未找到相关站点</p>';
        return;
    }
    
    // 显示搜索结果
    results.forEach(station => {
        const resultItem = createSearchResultItem(station);
        searchResults.appendChild(resultItem);
    });
}

function createSearchResultItem(station) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    // 创建站点信息
    const stationName = document.createElement('h4');
    stationName.textContent = station.name;
    stationName.style.margin = '0 0 0.5rem 0';
    stationName.style.color = '#2c3e50';
    
    const lineInfo = document.createElement('div');
    lineInfo.className = 'line-badges';
    lineInfo.style.display = 'flex';
    lineInfo.style.gap = '0.25rem';
    lineInfo.style.flexWrap = 'wrap';
    
    station.lines.forEach(lineName => {
        const lineBadge = document.createElement('span');
        lineBadge.className = 'line-badge';
        lineBadge.textContent = lineName;
        lineBadge.style.padding = '0.25rem 0.5rem';
        lineBadge.style.borderRadius = '10px';
        lineBadge.style.color = 'white';
        lineBadge.style.fontSize = '0.8rem';
        lineBadge.style.backgroundColor = getLineColor(lineName);
        lineInfo.appendChild(lineBadge);
    });
    
    item.appendChild(stationName);
    item.appendChild(lineInfo);
    
    // 添加点击事件
    item.addEventListener('click', function() {
        goToStationPage(station, 'search');
        closeAllModals();
    });
    
    return item;
}

function getLineColor(lineName) {
    return lineInfo[lineName]?.color || '#666';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
}

// 新的搜索函数
function searchStation() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        alert('请输入站点名称');
        return;
    }
    
    console.log('搜索查询:', query);
    console.log('stationData长度:', stationData.length);
    
    const results = searchStations(query);
    console.log('搜索结果:', results);
    
    if (results.length === 0) {
        alert('未找到相关站点');
        return;
    }
    
    // 直接跳转到第一个结果
    console.log('直接跳转到站点:', results[0].name);
    goToStationPage(results[0], 'search');
}

function showSearchResultsModal(results) {
    // 创建结果选择模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h3>找到多个站点，请选择：</h3>
        <div class="search-results-list">
            ${results.map(station => `
                <div class="search-result-item" data-station-id="${station.id}">
                    <h4>${station.name}</h4>
                    <div class="line-badges">
                        ${station.lines.map(line => `<span class="line-badge" style="background-color: ${getLineColor(line)}">${line}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 绑定关闭事件
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 绑定点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 绑定结果点击事件
    modal.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const stationId = parseInt(item.dataset.stationId);
            const station = getStationById(stationId);
            if (station) {
                goToStationPage(station, 'search');
            }
            document.body.removeChild(modal);
        });
    });
}

// 搜索联想功能
function initializeSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // 创建联想下拉框
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // 添加到body，避免被其他元素遮挡
    document.body.appendChild(suggestionsContainer);
    
    // 输入事件
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        const suggestions = getSearchSuggestions(query);
        
        if (suggestions.length > 0) {
            showSuggestions(suggestions, suggestionsContainer, searchInput);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // 窗口大小改变时重新定位
    window.addEventListener('resize', function() {
        if (suggestionsContainer.style.display === 'block') {
            const searchInputRect = searchInput.getBoundingClientRect();
            suggestionsContainer.style.top = (searchInputRect.bottom + 5) + 'px';
            suggestionsContainer.style.left = searchInputRect.left + 'px';
            suggestionsContainer.style.width = searchInputRect.width + 'px';
        }
    });
    
    // 失去焦点时隐藏联想
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 300);
    });
    
    // 获得焦点时显示联想
    searchInput.addEventListener('focus', function() {
        const query = this.value.trim();
        if (query.length > 0) {
            const suggestions = getSearchSuggestions(query);
            if (suggestions.length > 0) {
                showSuggestions(suggestions, suggestionsContainer, searchInput);
            }
        }
    });
}

function getSearchSuggestions(query) {
    if (!query || query.length === 0) return [];
    
    const lowerQuery = query.toLowerCase();
    const suggestions = [];
    
    console.log('搜索查询:', query);
    console.log('stationData长度:', stationData.length);
    
    // 从站点数据中搜索
    stationData.forEach(station => {
        if (station.name.toLowerCase().includes(lowerQuery)) {
            suggestions.push({
                type: 'station',
                name: station.name,
                lines: station.lines,
                data: station
            });
        }
    });
    
    console.log('找到的联想结果:', suggestions.length);
    console.log('联想结果:', suggestions.map(s => s.name));
    
    // 限制结果数量，增加到50个
    return suggestions.slice(0, 50);
}

function showSuggestions(suggestions, container, input) {
    container.innerHTML = '';
    
    console.log('显示联想结果数量:', suggestions.length);
    
    // 计算搜索框的位置
    const searchInputRect = input.getBoundingClientRect();
    container.style.top = (searchInputRect.bottom + 5) + 'px';
    container.style.left = searchInputRect.left + 'px';
    container.style.width = searchInputRect.width + 'px';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <div class="suggestion-content">
                <span class="suggestion-name">${suggestion.name}</span>
                <div class="suggestion-lines">
                    ${suggestion.lines.map(line => `<span class="line-badge" style="background-color: ${getLineColor(line)}">${line}</span>`).join('')}
                </div>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击联想项:', suggestion.name);
            input.value = suggestion.name;
            container.style.display = 'none';
            // 延迟执行搜索，避免事件冲突
            setTimeout(() => {
                searchStation();
            }, 100);
        });
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        
        container.appendChild(item);
        console.log('添加联想项:', index + 1, suggestion.name);
    });
    
    container.style.display = 'block';
    console.log('联想容器显示状态:', container.style.display);
    console.log('联想容器内容数量:', container.children.length);
}

function goToStationPage(station, mode, lineName = null) {
    // 构建URL参数
    const params = new URLSearchParams({
        id: station.id,
        mode: mode
    });
    
    if (lineName) {
        params.append('line', lineName);
    }
    
    // 跳转到站点页面
    window.location.href = `station.html?${params.toString()}`;
}

// 添加模态框CSS动画支持
const style = document.createElement('style');
style.textContent = `
    .modal {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .modal.show {
        opacity: 1;
    }
    
    .modal-content {
        transform: translateY(-50px);
        transition: transform 0.3s ease;
    }
    
    .modal.show .modal-content {
        transform: translateY(0);
    }
    
    .no-results {
        text-align: center;
        color: #7f8c8d;
        padding: 2rem;
        font-style: italic;
    }
    
    .search-result-item {
        transition: background-color 0.2s ease;
    }
    
    .search-result-item:hover {
        background-color: #f8f9fa;
    }
`;
document.head.appendChild(style);
