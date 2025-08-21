/**************************************
 * S-MONEY — Moteur principal & Utilitaires
 **************************************/

const DB_KEY = 's_money_db_v1';
const REFERRAL_PERCENT = 5;

const defaultDB = { users: [], sessions: { currentUserId: null }, investments: [], referrals: [] };

// Sélecteur simplifié
const $ = (sel) => document.querySelector(sel);

// Formatteur de nombres
const fmt = new Intl.NumberFormat('fr-FR');

/**
 * Charge la base de données depuis le localStorage.
 * @returns {object} La base de données.
 */
function loadDB() {
    try {
        return JSON.parse(localStorage.getItem(DB_KEY)) || JSON.parse(JSON.stringify(defaultDB));
    } catch (e) {
        console.error("Erreur de chargement de la DB, réinitialisation.", e);
        return JSON.parse(JSON.stringify(defaultDB));
    }
}

/**
 * Sauvegarde la base de données dans le localStorage.
 * @param {object} db - L'objet de la base de données à sauvegarder.
 */
function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * Génère un identifiant unique.
 * @param {string} prefix - Le préfixe pour l'ID.
 * @returns {string} Un ID unique.
 */
function genId(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/**
 * @returns {string} La date actuelle au format ISO.
 */
function nowISO() {
    return new Date().toISOString();
}

/**
 * Récupère l'utilisateur actuellement connecté.
 * @returns {object|null} L'objet utilisateur ou null si personne n'est connecté.
 */
function currentUser() {
    const db = loadDB();
    if (!db.sessions.currentUserId) return null;
    return db.users.find(u => u.id === db.sessions.currentUserId) || null;
}
