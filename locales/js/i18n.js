// ============================================================
//  国际化 (i18n) 模块
// ============================================================

const I18n = {
    currentLocale: 'zh',
    translations: {},
    fallbackLocale: 'zh',

    // 初始化
    async init(locale) {
        // 从 localStorage 读取保存的语言
        const saved = localStorage.getItem('locale');
        this.currentLocale = saved || locale || navigator.language || 'zh';
        // 标准化语言代码
        if (this.currentLocale.startsWith('vi')) this.currentLocale = 'vi';
        else this.currentLocale = 'zh';
        await this.loadTranslations(this.currentLocale);
        return this.currentLocale;
    },

    // 加载语言文件
    async loadTranslations(locale) {
        try {
            const response = await fetch(`/locales/${locale}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.translations = await response.json();
        } catch (e) {
            console.warn(`加载语言 ${locale} 失败，使用中文备用:`, e);
            // 如果加载失败，尝试加载中文
            if (locale !== 'zh') {
                const fallback = await fetch('/locales/zh.json');
                this.translations = await fallback.json();
                this.currentLocale = 'zh';
            }
        }
    },

    // 切换语言
    async setLocale(locale) {
        if (locale === this.currentLocale) return;
        await this.loadTranslations(locale);
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);
        // 触发语言切换事件
        document.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));
        // 刷新页面文字
        this.updateAll();
    },

    // 获取翻译
    t(key, params = {}) {
        let text = this.translations[key] || key;
        // 替换参数
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
        return text;
    },

    // 更新所有带 data-i18n 属性的元素
    updateAll() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });

        // 更新带 data-i18n-html 属性的元素（HTML内容）
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = this.t(key);
        });

        // 更新下拉菜单
        document.querySelectorAll('[data-i18n-select]').forEach(el => {
            const key = el.getAttribute('data-i18n-select');
            el.options.forEach(opt => {
                const optKey = opt.getAttribute('data-i18n');
                if (optKey) {
                    opt.textContent = this.t(optKey);
                }
            });
        });

        // 更新标题
        const title = document.querySelector('title');
        if (title) {
            title.textContent = this.t('app_title');
        }

        // 更新语言切换按钮文本
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === 'zh') btn.textContent = this.t('language_zh');
            else if (lang === 'vi') btn.textContent = this.t('language_vi');
        });
    }
};

// 全局挂载
window.__ = (key, params) => I18n.t(key, params);
window.I18n = I18n;
