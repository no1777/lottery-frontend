// ============================================================
//  国际化 (i18n) 模块
// ============================================================

const I18n = {
    currentLocale: 'zh',
    translations: {},
    fallbackLocale: 'zh',

    async init(locale) {
        const saved = localStorage.getItem('locale');
        this.currentLocale = saved || locale || navigator.language || 'zh';
        if (this.currentLocale.startsWith('vi')) this.currentLocale = 'vi';
        else this.currentLocale = 'zh';
        await this.loadTranslations(this.currentLocale);
        return this.currentLocale;
    },

    async loadTranslations(locale) {
        try {
            const response = await fetch(`/locales/${locale}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.translations = await response.json();
        } catch (e) {
            console.warn('加载语言失败，使用中文备用:', e);
            if (locale !== 'zh') {
                const fallback = await fetch('/locales/zh.json');
                this.translations = await fallback.json();
                this.currentLocale = 'zh';
            }
        }
    },

    async setLocale(locale) {
        if (locale === this.currentLocale) return;
        await this.loadTranslations(locale);
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);
        document.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));
        this.updateAll();
        // 刷新数据
        if (typeof loadCurrentDraw === 'function') await loadCurrentDraw();
        if (typeof loadHistory === 'function') await loadHistory();
        if (typeof loadFrequency === 'function') await loadFrequency();
    },

    t(key, params = {}) {
        let text = this.translations[key] || key;
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
        return text;
    },

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

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = this.t(key);
        });

        const title = document.querySelector('title');
        if (title) {
            title.textContent = this.t('app_title');
        }

        // 更新语言切换按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.classList.toggle('active', lang === this.currentLocale);
            if (lang === 'zh') btn.textContent = '中';
            else if (lang === 'vi') btn.textContent = '越';
        });
    }
};

window.__ = (key, params) => I18n.t(key, params);
window.I18n = I18n;
