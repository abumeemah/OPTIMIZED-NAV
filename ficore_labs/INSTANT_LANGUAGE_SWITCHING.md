# Instant Language Switching

This document describes the instant language switching feature implemented for FiCore Labs to enable seamless switching between English and Hausa without page reloads.

## Features

- **Instant Switching**: Language changes happen immediately without page reloads
- **Cached Translations**: All translations are preloaded and cached for optimal performance
- **Smooth Animations**: Visual feedback during language switching
- **Fallback Support**: Graceful degradation to original page-reload method if needed
- **Server Sync**: Background synchronization with server session

## Implementation

### Core Components

1. **InstantLanguageSwitch Class** (`static/js/instant-language-switch.js`)
   - Manages client-side language switching
   - Preloads and caches translations
   - Updates DOM elements with translation attributes
   - Provides visual feedback and animations

2. **API Endpoints** (`api_routes.py`)
   - `/api/translations/<lang>` - Serves all translations for a language
   - `/api/translations/module/<module>/<lang>` - Serves module-specific translations
   - `/api/language/current` - Returns current session language
   - `/api/language/set/<lang>` - Sets language without page reload

3. **CSS Enhancements** (`static/css/instant-language-switch.css`)
   - Smooth transitions and animations
   - Loading states and visual feedback
   - Toast notifications
   - Mobile and accessibility optimizations

### Usage

#### Adding Translation Attributes to HTML Elements

To make an element translatable with instant switching, add the `data-translate` attribute:

```html
<span data-translate="general_welcome">Welcome</span>
<button data-translate="general_save">Save</button>
<label data-translate="general_name">Name</label>
```

For form placeholders, use `data-translate-placeholder`:

```html
<input type="text" placeholder="Enter your name" data-translate-placeholder="general_enter_your_name">
```

#### JavaScript Events

The system dispatches custom events that you can listen to:

```javascript
document.addEventListener('languageChanged', function(event) {
    const newLanguage = event.detail.language;
    console.log('Language changed to:', newLanguage);
    // Your custom logic here
});
```

### Translation Structure

Translations are organized by modules in the `translations/` directory:

```
translations/
├── general_features/
│   ├── general_translations.py
│   └── admin_translations.py
├── trader/
│   ├── debtors_translations.py
│   ├── creditors_translations.py
│   └── ...
└── startup/
    ├── funds_translations.py
    └── ...
```

Each translation file follows this structure:

```python
TRANSLATIONS = {
    'en': {
        'key_name': 'English translation',
        # ...
    },
    'ha': {
        'key_name': 'Hausa translation',
        # ...
    }
}
```

### Performance Optimizations

1. **Preloading**: Both English and Hausa translations are loaded on page initialization
2. **Caching**: Translations are cached in memory to avoid repeated API calls
3. **Background Sync**: Server session is updated in the background without blocking UI
4. **Selective Updates**: Only elements with translation attributes are updated

### Browser Support

- Modern browsers with ES6+ support
- Graceful fallback for older browsers
- Accessibility features (reduced motion, high contrast)
- Mobile-optimized interface

### Demo

Visit `/general/language-demo` to see the instant language switching in action with various UI elements and form components.

## Configuration

### Adding New Translations

1. Add the translation key to the appropriate module file in `translations/`
2. Provide both English (`en`) and Hausa (`ha`) translations
3. Add `data-translate` attributes to HTML elements
4. The instant switching will automatically pick up new translations

### Customizing Animations

Modify `static/css/instant-language-switch.css` to customize:
- Transition durations
- Animation effects
- Loading states
- Toast notification styles

### Error Handling

The system includes comprehensive error handling:
- Network failures fall back to original page-reload method
- Missing translations show the translation key as fallback
- Loading states provide user feedback
- Console logging for debugging

## Testing

To test the instant language switching:

1. Navigate to any page with translatable content
2. Click the language toggle button in the header
3. Observe immediate language changes without page reload
4. Check browser console for any errors
5. Test with slow network conditions to verify loading states

## Troubleshooting

### Common Issues

1. **Translations not updating**: Check that elements have `data-translate` attributes
2. **Slow switching**: Verify translations are being cached properly
3. **Server sync issues**: Check API endpoints are responding correctly
4. **Missing translations**: Add missing keys to translation files

### Debug Mode

Enable debug logging by setting:
```javascript
window.instantLanguageSwitch.debug = true;
```

This will log detailed information about translation loading and switching operations.