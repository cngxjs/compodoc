import I18nEngine from '../../app/engines/i18n.engine';

/** Translate a key using the i18n engine. Equivalent to {{t "key"}} in Handlebars. */
export const t = (key: string, params?: Record<string, string>): string =>
    I18nEngine.exists(key) ? I18nEngine.translate(key.toLowerCase(), params) : key;
