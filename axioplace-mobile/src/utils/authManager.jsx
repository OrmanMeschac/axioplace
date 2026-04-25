/**
 * authManager.js — Module singleton pour permettre à l'intercepteur 401 de
 * déclencher le logout React sans créer de dépendance circulaire.
 *
 * Usage:
 *   - AuthContext appelle `setLogoutCallback(logoutFn)` à l'initialisation
 *   - api.js appelle `triggerLogout()` dans l'intercepteur 401
 */

let _logoutCallback = null;

export const setLogoutCallback = (cb) => {
    _logoutCallback = cb;
};

export const triggerLogout = () => {
    if (_logoutCallback) {
        _logoutCallback();
    }
};
