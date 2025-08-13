/**
 * Instant Language Switching System
 * Provides instant switching between English and Hausa without page reloads
 */

class InstantLanguageSwitch {
    constructor() {
        this.currentLang = this.getCurrentLanguage();
        this.translations = {};
        this.isLoading = false;
        this.cache = new Map();
        
        // Initialize the system
        this.init();
    }

    getCurrentLanguage() {
        // Get from session storage first, then from DOM, fallback to 'en'
        return sessionStorage.getItem('current_lang') || 
               document.documentElement.lang || 
               'en';
    }

    async init() {
        try {
            // Preload both language translations
            await this.preloadTranslations();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI to show current language
            this.updateLanguageUI();
            
            console.log('Instant Language Switch initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Instant Language Switch:', error);
            // Fallback to original behavior
            this.fallbackToOriginal();
        }
    }

    async preloadTranslations() {
        const languages = ['en', 'ha'];
        const promises = languages.map(lang => this.loadTranslations(lang));
        
        try {
            await Promise.all(promises);
        } catch (error) {
            console.warn('Some translations failed to preload:', error);
        }
    }

    async loadTranslations(lang) {
        if (this.cache.has(lang)) {
            this.translations[lang] = this.cache.get(lang);
            return;
        }

        try {
            const response = await fetch(`/api/translations/${lang}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load ${lang} translations`);
            }

            const translations = await response.json();
            this.translations[lang] = translations;
            this.cache.set(lang, translations);
            
        } catch (error) {
            console.warn(`Failed to load ${lang} translations:`, error);
            // Use fallback translations for critical UI elements
            this.translations[lang] = this.getFallbackTranslations(lang);
        }
    }

    getFallbackTranslations(lang) {
        const fallbacks = {
            'en': {
                'general_language_toggle': 'Switch Language',
                'general_english': 'English',
                'general_hausa': 'Hausa',
                'general_loading': 'Loading...',
                'general_error': 'Error',
                'general_success': 'Success'
            },
            'ha': {
                'general_language_toggle': 'Canja Harshe',
                'general_english': 'Turanci',
                'general_hausa': 'Hausa',
                'general_loading': 'Ana Loda...',
                'general_error': 'Kuskure',
                'general_success': 'Nasara'
            }
        };
        return fallbacks[lang] || fallbacks['en'];
    }

    setupEventListeners() {
        // Override the original toggleLanguage function
        window.toggleLanguage = () => this.toggleLanguage();
        
        // Listen for custom language change events
        document.addEventListener('languageChanged', (event) => {
            this.handleLanguageChange(event.detail.language);
        });
    }

    async toggleLanguage() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const newLang = this.currentLang === 'en' ? 'ha' : 'en';
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Switch language instantly on client-side
            await this.switchLanguageInstantly(newLang);
            
            // Update server-side session in background
            this.updateServerSession(newLang);
            
        } catch (error) {
            console.error('Language switch failed:', error);
            this.showError('Failed to switch language');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async switchLanguageInstantly(newLang) {
        // Ensure translations are loaded
        if (!this.translations[newLang]) {
            await this.loadTranslations(newLang);
        }

        // Update current language
        this.currentLang = newLang;
        
        // Store in session storage
        sessionStorage.setItem('current_lang', newLang);
        
        // Update document language attribute
        document.documentElement.lang = newLang;
        
        // Update all translatable elements
        this.updateAllTranslations();
        
        // Update language toggle buttons
        this.updateLanguageUI();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: newLang }
        }));
    }

    updateAllTranslations() {
        const translatableElements = document.querySelectorAll('[data-translate]');
        
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update specific UI elements
        this.updateSpecificElements();
    }

    updateSpecificElements() {
        // Update language toggle buttons
        const languageTexts = document.querySelectorAll('#languageText, #navLanguageText');
        const newLangText = this.currentLang === 'en' ? 'ENGLISH' : 'HAUSA';
        languageTexts.forEach(text => {
            if (text) text.textContent = newLangText;
        });

        // Update tooltips
        const languageToggles = document.querySelectorAll('#languageToggle, #navLanguageToggle');
        const tooltipText = this.getTranslation('general_language_toggle_tooltip') || 'Toggle language';
        languageToggles.forEach(toggle => {
            if (toggle) {
                toggle.setAttribute('data-bs-title', tooltipText);
                toggle.setAttribute('aria-label', tooltipText);
            }
        });

        // Update form labels and placeholders
        this.updateFormElements();
        
        // Update navigation items
        this.updateNavigationItems();
    }

    updateFormElements() {
        // Update common form elements
        const formElements = [
            { selector: 'input[placeholder]', attr: 'placeholder' },
            { selector: 'label[data-translate]', attr: 'textContent' },
            { selector: 'button[data-translate]', attr: 'textContent' }
        ];

        formElements.forEach(({ selector, attr }) => {
            document.querySelectorAll(selector).forEach(element => {
                const key = element.getAttribute('data-translate');
                if (key) {
                    const translation = this.getTranslation(key);
                    if (translation) {
                        if (attr === 'textContent') {
                            element.textContent = translation;
                        } else {
                            element.setAttribute(attr, translation);
                        }
                    }
                }
            });
        });

        // Handle elements with data-translate-placeholder attribute
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    }

    updateNavigationItems() {
        // Update navigation items that use translation keys
        document.querySelectorAll('.nav-link[data-translate]').forEach(link => {
            const key = link.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                const textSpan = link.querySelector('.nav-text') || link;
                textSpan.textContent = translation;
            }
        });
    }

    getTranslation(key, defaultValue = null) {
        const translations = this.translations[this.currentLang] || {};
        return translations[key] || defaultValue || key;
    }

    updateLanguageUI() {
        const languageTexts = document.querySelectorAll('#languageText, #navLanguageText');
        const newLangText = this.currentLang === 'en' ? 'ENGLISH' : 'HAUSA';
        
        languageTexts.forEach(text => {
            if (text) text.textContent = newLangText;
        });
    }

    async updateServerSession(newLang) {
        try {
            const response = await fetch(`/set_language/${newLang}`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (!response.ok) {
                console.warn('Failed to update server session language');
            }
        } catch (error) {
            console.warn('Failed to sync language with server:', error);
        }
    }

    showLoadingState() {
        const languageToggles = document.querySelectorAll('#languageToggle, #navLanguageToggle');
        languageToggles.forEach(toggle => {
            if (toggle) {
                toggle.disabled = true;
                const icon = toggle.querySelector('i');
                if (icon) {
                    icon.className = 'bi bi-arrow-repeat spin';
                }
            }
        });
    }

    hideLoadingState() {
        const languageToggles = document.querySelectorAll('#languageToggle, #navLanguageToggle');
        languageToggles.forEach(toggle => {
            if (toggle) {
                toggle.disabled = false;
                const icon = toggle.querySelector('i');
                if (icon) {
                    icon.className = 'bi bi-globe';
                }
            }
        });
    }

    showError(message) {
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getCsrfToken() {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : '';
    }

    fallbackToOriginal() {
        // If instant switching fails, fall back to original page reload method
        console.log('Falling back to original language switching method');
        
        window.toggleLanguage = async function() {
            const languageTexts = document.querySelectorAll('#languageText, #navLanguageText');
            if (!languageTexts.length) return;
            
            const currentLang = languageTexts[0].textContent.toLowerCase() === 'english' ? 'en' : 'ha';
            const newLang = currentLang === 'en' ? 'ha' : 'en';
            
            try {
                const response = await fetch(`/set_language/${newLang}`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                
                if (response.ok) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Language switch failed:', error);
            }
        };
    }
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .language-toggle {
        transition: all 0.2s ease;
    }
    
    .language-toggle:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.instantLanguageSwitch = new InstantLanguageSwitch();
    });
} else {
    window.instantLanguageSwitch = new InstantLanguageSwitch();
}

// Export for use in other scripts
window.InstantLanguageSwitch = InstantLanguageSwitch;