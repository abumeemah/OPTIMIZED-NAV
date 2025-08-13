"""
API Routes for instant language switching and other AJAX endpoints
"""

from flask import Blueprint, jsonify, request, session
from translations import get_all_translations, get_module_translations
import logging

# Set up logger
logger = logging.getLogger('ficore_app')

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/translations/<lang>', methods=['GET'])
def get_translations_api(lang):
    """
    API endpoint to get all translations for a specific language
    Supports both 'en' and 'ha' languages
    """
    try:
        # Validate language
        if lang not in ['en', 'ha']:
            return jsonify({'error': 'Invalid language code'}), 400
        
        # Get all translations for the language
        all_translations = get_all_translations()
        
        # Flatten translations from all modules for the requested language
        flattened_translations = {}
        
        for module_name, module_translations in all_translations.items():
            lang_translations = module_translations.get(lang, {})
            flattened_translations.update(lang_translations)
        
        # Add some common UI translations that might not be in modules
        common_translations = {
            'general_language_toggle_tooltip': 'Toggle to switch between available languages' if lang == 'en' else 'Danna don canza harshe',
            'general_language_changed': 'Language updated successfully' if lang == 'en' else 'An sabunta harshe cikin nasara',
            'general_loading': 'Loading...' if lang == 'en' else 'Ana loda...',
            'general_error': 'Error' if lang == 'en' else 'Kuskure',
            'general_success': 'Success' if lang == 'en' else 'Nasara'
        }
        
        flattened_translations.update(common_translations)
        
        logger.info(f"Served {len(flattened_translations)} translations for language '{lang}'", 
                   extra={'session_id': session.get('sid', 'no-session-id')})
        
        return jsonify(flattened_translations)
        
    except Exception as e:
        logger.error(f"Error serving translations for language '{lang}': {str(e)}", 
                    extra={'session_id': session.get('sid', 'no-session-id')})
        return jsonify({'error': 'Failed to load translations'}), 500

@api_bp.route('/translations/module/<module_name>/<lang>', methods=['GET'])
def get_module_translations_api(module_name, lang):
    """
    API endpoint to get translations for a specific module and language
    """
    try:
        # Validate language
        if lang not in ['en', 'ha']:
            return jsonify({'error': 'Invalid language code'}), 400
        
        # Get module translations
        module_translations = get_module_translations(module_name, lang)
        
        if not module_translations:
            return jsonify({'error': f'Module "{module_name}" not found'}), 404
        
        logger.info(f"Served {len(module_translations)} translations for module '{module_name}', language '{lang}'", 
                   extra={'session_id': session.get('sid', 'no-session-id')})
        
        return jsonify(module_translations)
        
    except Exception as e:
        logger.error(f"Error serving module translations for '{module_name}', language '{lang}': {str(e)}", 
                    extra={'session_id': session.get('sid', 'no-session-id')})
        return jsonify({'error': 'Failed to load module translations'}), 500

@api_bp.route('/language/current', methods=['GET'])
def get_current_language():
    """
    API endpoint to get the current session language
    """
    try:
        current_lang = session.get('lang', 'en')
        return jsonify({
            'language': current_lang,
            'display_name': 'English' if current_lang == 'en' else 'Hausa'
        })
    except Exception as e:
        logger.error(f"Error getting current language: {str(e)}", 
                    extra={'session_id': session.get('sid', 'no-session-id')})
        return jsonify({'error': 'Failed to get current language'}), 500

@api_bp.route('/language/set/<lang>', methods=['POST'])
def set_language_api(lang):
    """
    API endpoint to set language without page reload
    """
    try:
        # Validate language
        if lang not in ['en', 'ha']:
            return jsonify({'error': 'Invalid language code'}), 400
        
        # Update session
        session['lang'] = lang
        session.modified = True
        
        logger.info(f"Language set to '{lang}' via API", 
                   extra={'session_id': session.get('sid', 'no-session-id')})
        
        return jsonify({
            'success': True,
            'language': lang,
            'display_name': 'English' if lang == 'en' else 'Hausa'
        })
        
    except Exception as e:
        logger.error(f"Error setting language to '{lang}': {str(e)}", 
                    extra={'session_id': session.get('sid', 'no-session-id')})
        return jsonify({'error': 'Failed to set language'}), 500

# Error handlers for API blueprint
@api_bp.errorhandler(404)
def api_not_found(error):
    return jsonify({'error': 'API endpoint not found'}), 404

@api_bp.errorhandler(500)
def api_internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500