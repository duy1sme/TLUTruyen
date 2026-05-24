/**
 * ComicsWeb — Auth Module
 * Xử lý đăng nhập, đăng ký, đăng xuất với json-server-auth
 */
const Auth = {
  /**
   * Đăng nhập
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object>} { accessToken, user }
   */
  async login(email, password) {
    const res = await fetch(`${CONFIG.API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err || 'Email hoặc mật khẩu không đúng');
    }

    const data = await res.json();
    localStorage.setItem(CONFIG.JWT_KEY, data.accessToken);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    return data;
  },

  /**
   * Đăng ký
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @returns {Promise<object>}
   */
  async register(email, password, displayName = '') {
    const res = await fetch(`${CONFIG.API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        role: 'user',
        avatar: '',
        coins: 100, // Khởi tạo 100 xu
        createdAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err || 'Đăng ký thất bại');
    }

    const data = await res.json();
    localStorage.setItem(CONFIG.JWT_KEY, data.accessToken);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
    return data;
  },

  /** Đăng xuất — xoá token và user khỏi localStorage */
  logout() {
    localStorage.removeItem(CONFIG.JWT_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  /** Lấy thông tin user đang đăng nhập */
  getCurrentUser() {
    const raw = localStorage.getItem(CONFIG.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /** Kiểm tra đã đăng nhập chưa */
  isLoggedIn() {
    return !!localStorage.getItem(CONFIG.JWT_KEY);
  },

  /** Kiểm tra có phải admin không */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /** Lấy JWT token */
  getToken() {
    return localStorage.getItem(CONFIG.JWT_KEY);
  },
};
