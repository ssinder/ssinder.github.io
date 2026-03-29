/**
 * 用户管理模块
 * 负责用户相关的功能
 */

class UserModule {
    /**
     * 构造函数
     */
    constructor() {
        this.currentUser = null;
        this.userToken = null;
        this.favorites = [];
    }

    /**
     * 初始化模块
     */
    init() {
        this._loadUserInfo();
        this._loadFavorites();
        this._bindEvents();
    }

    /**
     * 绑定事件
     */
    _bindEvents() {
        const userCenter = document.querySelector('.user-center');
        if (userCenter) {
            userCenter.addEventListener('click', () => this._showUserMenu());
        }
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @returns {Promise} 注册结果
     */
    async register(userData) {
        try {
            const response = await apiClient.post(
                CONFIG.API.ENDPOINTS.USER.REGISTER,
                userData
            );

            this.userToken = response.data.token;
            this.currentUser = {
                userId: response.data.userId,
                username: response.data.username
            };

            this._saveUserInfo();
            Utils.showToast('注册成功', 'success');

            return response.data;
        } catch (error) {
            console.error('注册失败:', error);
            Utils.showToast('注册失败: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise} 登录结果
     */
    async login(username, password) {
        try {
            const response = await apiClient.post(
                CONFIG.API.ENDPOINTS.USER.LOGIN,
                {
                    username: username,
                    password: password
                }
            );

            this.userToken = response.data.token;
            this.currentUser = {
                userId: response.data.userId,
                username: response.data.username,
                fullName: response.data.fullName
            };

            this._saveUserInfo();
            this._loadFavorites();
            Utils.showToast('登录成功', 'success');

            return response.data;
        } catch (error) {
            console.error('登录失败:', error);
            Utils.showToast('登录失败: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * 用户登出
     */
    logout() {
        this.currentUser = null;
        this.userToken = null;
        this.favorites = [];

        storage.remove(CONFIG.STORAGE.USER_TOKEN_KEY);
        storage.remove(CONFIG.STORAGE.USER_INFO_KEY);
        storage.remove(CONFIG.STORAGE.FAVORITES_KEY);

        Utils.showToast('已登出', 'info');
        this._updateUserUI();
    }

    /**
     * 获取用户信息
     * @returns {Promise} 用户信息
     */
    async getUserInfo() {
        try {
            const response = await apiClient.get(
                CONFIG.API.ENDPOINTS.USER.PROFILE,
                {},
                {
                    'Authorization': `Bearer ${this.userToken}`
                }
            );

            this.currentUser = response.data;
            this._saveUserInfo();

            return response.data;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            Utils.showToast('获取用户信息失败: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * 获取收藏列表
     * @returns {Promise} 收藏列表
     */
    async getFavorites() {
        try {
            const response = await apiClient.get(
                CONFIG.API.ENDPOINTS.USER.FAVORITES,
                {},
                {
                    'Authorization': `Bearer ${this.userToken}`
                }
            );

            this.favorites = response.data.favorites || [];
            this._saveFavorites();

            return this.favorites;
        } catch (error) {
            console.error('获取收藏列表失败:', error);
            Utils.showToast('获取收藏列表失败: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * 添加收藏
     * @param {string} datasetId - 数据集ID
     * @returns {Promise} 添加结果
     */
    async addFavorite(datasetId) {
        try {
            const response = await apiClient.post(
                CONFIG.API.ENDPOINTS.USER.FAVORITES,
                { datasetId: datasetId },
                {
                    'Authorization': `Bearer ${this.userToken}`
                }
            );

            this.favorites.push({
                favoriteId: response.data.favoriteId,
                datasetId: datasetId
            });

            this._saveFavorites();
            Utils.showToast('收藏成功', 'success');

            return response.data;
        } catch (error) {
            console.error('添加收藏失败:', error);
            Utils.showToast('添加收藏失败: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * 移除收藏
     * @param {string} favoriteId - 收藏ID
     */
    removeFavorite(favoriteId) {
        this.favorites = this.favorites.filter(fav => fav.favoriteId !== favoriteId);
        this._saveFavorites();
        Utils.showToast('已取消收藏', 'info');
    }

    /**
     * 检查是否已收藏
     * @param {string} datasetId - 数据集ID
     * @returns {boolean} 是否已收藏
     */
    isFavorite(datasetId) {
        return this.favorites.some(fav => fav.datasetId === datasetId);
    }

    /**
     * 显示用户菜单
     */
    _showUserMenu() {
        if (this.currentUser) {
            this._showUserDialog();
        } else {
            this._showLoginDialog();
        }
    }

    /**
     * 显示用户对话框
     */
    _showUserDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'user-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>用户中心</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="user-info">
                        <div class="user-avatar">用</div>
                        <div class="user-details">
                            <div class="user-name">${this.currentUser.fullName || this.currentUser.username}</div>
                            <div class="user-email">${this.currentUser.username}</div>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-secondary" id="showFavoritesBtn">我的收藏</button>
                        <button class="btn btn-secondary" id="showHistoryBtn">查询历史</button>
                        <button class="btn btn-danger" id="logoutBtn">退出登录</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('#logoutBtn').addEventListener('click', () => {
            this.logout();
            dialog.remove();
        });
    }

    /**
     * 显示登录对话框
     */
    _showLoginDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'user-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>用户登录</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <form id="loginForm">
                        <div class="form-group">
                            <label>用户名（邮箱）</label>
                            <input type="email" id="loginUsername" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary">登录</button>
                        <button type="button" class="btn btn-secondary" id="showRegisterBtn">注册</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('#loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = dialog.querySelector('#loginUsername').value;
            const password = dialog.querySelector('#loginPassword').value;

            try {
                await this.login(username, password);
                dialog.remove();
                this._updateUserUI();
            } catch (error) {
                console.error('登录失败:', error);
            }
        });

        dialog.querySelector('#showRegisterBtn').addEventListener('click', () => {
            dialog.remove();
            this._showRegisterDialog();
        });
    }

    /**
     * 显示注册对话框
     */
    _showRegisterDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'user-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>用户注册</h3>
                    <button class="dialog-close">&times;</button>
                </div>
                <div class="dialog-body">
                    <form id="registerForm">
                        <div class="form-group">
                            <label>用户名（邮箱）</label>
                            <input type="email" id="registerUsername" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <div class="form-group">
                            <label>姓名</label>
                            <input type="text" id="registerFullName">
                        </div>
                        <div class="form-group">
                            <label>机构</label>
                            <input type="text" id="registerInstitution">
                        </div>
                        <div class="form-group">
                            <label>研究领域</label>
                            <input type="text" id="registerResearchField">
                        </div>
                        <button type="submit" class="btn btn-primary">注册</button>
                        <button type="button" class="btn btn-secondary" id="showLoginBtn">返回登录</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.dialog-overlay').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('#registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: dialog.querySelector('#registerUsername').value,
                password: dialog.querySelector('#registerPassword').value,
                fullName: dialog.querySelector('#registerFullName').value,
                institution: dialog.querySelector('#registerInstitution').value,
                researchField: dialog.querySelector('#registerResearchField').value
            };

            try {
                await this.register(userData);
                dialog.remove();
                this._updateUserUI();
            } catch (error) {
                console.error('注册失败:', error);
            }
        });

        dialog.querySelector('#showLoginBtn').addEventListener('click', () => {
            dialog.remove();
            this._showLoginDialog();
        });
    }

    /**
     * 更新用户UI
     */
    _updateUserUI() {
        const userCenter = document.querySelector('.user-center');
        if (userCenter) {
            if (this.currentUser) {
                userCenter.textContent = this.currentUser.fullName ? this.currentUser.fullName.charAt(0) : '用';
            } else {
                userCenter.textContent = '用';
            }
        }
    }

    /**
     * 保存用户信息
     */
    _saveUserInfo() {
        if (this.userToken) {
            storage.set(CONFIG.STORAGE.USER_TOKEN_KEY, this.userToken);
        }
        if (this.currentUser) {
            storage.set(CONFIG.STORAGE.USER_INFO_KEY, this.currentUser);
        }
    }

    /**
     * 加载用户信息
     */
    _loadUserInfo() {
        this.userToken = storage.get(CONFIG.STORAGE.USER_TOKEN_KEY);
        this.currentUser = storage.get(CONFIG.STORAGE.USER_INFO_KEY);
        this._updateUserUI();
    }

    /**
     * 保存收藏列表
     */
    _saveFavorites() {
        storage.set(CONFIG.STORAGE.FAVORITES_KEY, this.favorites);
    }

    /**
     * 加载收藏列表
     */
    _loadFavorites() {
        this.favorites = storage.get(CONFIG.STORAGE.FAVORITES_KEY, []);
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return this.currentUser !== null && this.userToken !== null;
    }
}

// 创建全局用户模块实例
const userModule = new UserModule();

// 导出用户模块（兼容CommonJS和ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserModule, userModule };
}
