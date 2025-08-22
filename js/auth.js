/**************************************
 * S-MONEY — Gestion de l'authentification
 **************************************/

const countries = [
    { name: 'RD Congo', code: '+243' }, { name: 'Congo-Brazzaville', code: '+242' }, { name: 'Rwanda', code: '+250' }, { name: 'Burundi', code: '+257' }, { name: 'Tanzanie', code: '+255' }, { name: 'Kenya', code: '+254' }, { name: 'Ouganda', code: '+256' }, { name: 'Côte d\'Ivoire', code: '+225' }, { name: 'Sénégal', code: '+221' }, { name: 'Mali', code: '+223' }, { name: 'Cameroun', code: '+237' }, { name: 'Gabon', code: '+241' }, { name: 'France', code: '+33' }, { name: 'Belgique', code: '+32' }, { name: 'Canada', code: '+1' }, { name: 'États-Unis', code: '+1' }, { name: 'Maroc', code: '+212' }, { name: 'Algérie', code: '+213' }, { name: 'Tunisie', code: '+216' }, { name: 'Afrique du Sud', code: '+27' }
];

/**
 * Remplit les listes déroulantes de pays et d'indicatifs sur la page d'inscription.
 */
function populateCountrySelects() {
    const countrySelect = $('#reg-country');
    const dialSelect = $('#reg-dial');

    if (countrySelect && dialSelect) {
        countries.forEach(c => {
            const option = document.createElement('option');
            option.value = c.name;
            option.textContent = c.name;
/**
 * Gère la soumission du formulaire de retrait.
 */
function handleWithdrawal(e, amount, currency) {
    e.preventDefault();
    const msgDiv = $('#withdrawal-msg');
    const db = loadDB();
    const userId = db.sessions.currentUserId;
    const user = db.users.find(u => u.id === userId);

    if (!user) {
        msgDiv.textContent = 'Utilisateur non trouvé.';
        msgDiv.className = 'help error';
        return;
    }

    if (currency === 'USD') {
        if (user.balanceUSD < amount) {
            msgDiv.textContent = 'Solde USD insuffisant.';
            msgDiv.className = 'help error';
            return;
        }
        user.balanceUSD -= amount;
    } else if (currency === 'CDF') {
        if (user.balanceCDF < amount) {
            msgDiv.textContent = 'Solde CDF insuffisant.';
            msgDiv.className = 'help error';
            return;
        }
        user.balanceCDF -= amount;
    } else {
        msgDiv.textContent = 'Devise non supportée.';
        msgDiv.className = 'help error';
        return;
    }

    saveDB(db);

    msgDiv.textContent = `Retrait de ${amount} ${currency} effectué avec succès.`;
    msgDiv.className = 'help success';

    // Mise à jour de l'affichage des soldes (si nécessaire)
    // updateBalanceDisplay(user);
}

// Exemple d'appel (à adapter à ton formulaire)
// const formWithdrawal = $('#form-withdrawal');
// if (formWithdrawal) {
//     formWithdrawal.addEventListener('submit', (e) => {
//         const amount = parseFloat($('#withdrawal-amount').value.trim());
//         const currency = $('#withdrawal-currency').value; // 'USD' ou 'CDF'
//         handleWithdrawal(e, amount, currency);
//     });
// }

// Fonction hypothétique pour mettre à jour l'affichage des soldes
// function updateBalanceDisplay(user) {
//     $('#balance-usd').textContent = user.balanceUSD;
//     $('#balance-cdf').textContent = user.balanceCDF;
// }




            countrySelect.appendChild(option);

            const dialOption = document.createElement('option');
            dialOption.value = c.code;
            dialOption.textContent = `${c.name} (${c.code})`;
            dialSelect.appendChild(dialOption);
        });
    }
}

/**
 * Gère la soumission du formulaire de connexion.
 */
function handleLogin(e) {
    e.preventDefault();
    const identifier = $('#login-identifier').value.trim();
    const password = $('#login-password').value.trim();
    const msgDiv = $('#login-msg');
    const db = loadDB();

    const user = db.users.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);

    if (user) {
        db.sessions.currentUserId = user.id;
        saveDB(db);
        msgDiv.textContent = 'Connexion réussie ! Redirection...';
        msgDiv.className = 'help success';
        setTimeout(() => {
            window.location.href = 'dashboard/index.html'; // Redirection vers le tableau de bord
        }, 1000);
    } else {
        msgDiv.textContent = 'Identifiant ou mot de passe incorrect.';
        msgDiv.className = 'help error';
    }
}

/**
 * Gère la soumission du formulaire d'inscription.
 */
function handleRegister(e) {
    e.preventDefault();
    const msgDiv = $('#register-msg');

    const newUser = {
        id: genId('user'),
        lastname: $('#reg-lastname').value.trim(),
        firstname: $('#reg-firstname').value.trim(),
        gender: $('#reg-gender').value,
        country: $('#reg-country').value,
        phone: $('#reg-dial').value + $('#reg-phone').value.trim(),
        email: $('#reg-email').value.trim().toLowerCase(),
        password: $('#reg-pass').value.trim(),
        sponsorCode: $('#reg-sponsor').value.trim(),
        refCode: genId('ref'),
        balanceUSD: 0,
        balanceCDF: 0,
        bonusUSD: 0,
        createdAt: nowISO()
    };
    const password2 = $('#reg-pass2').value.trim();
    const db = loadDB();

    // --- Validations ---
    if (newUser.password.length < 6) {
        msgDiv.textContent = 'Le mot de passe doit faire au moins 6 caractères.';
        msgDiv.className = 'help error';
        return;
    }
    if (newUser.password !== password2) {
        msgDiv.textContent = 'Les mots de passe ne correspondent pas.';
        msgDiv.className = 'help error';
        return;
    }
    if (db.users.some(u => u.email === newUser.email)) {
        msgDiv.textContent = 'Cet email est déjà utilisé.';
        msgDiv.className = 'help error';
        return;
    }
    if (db.users.some(u => u.phone === newUser.phone)) {
        msgDiv.textContent = 'Ce numéro de téléphone est déjà utilisé.';
        msgDiv.className = 'help error';
        return;
    }

    // --- Sauvegarde ---
    db.users.push(newUser);
    db.sessions.currentUserId = newUser.id; // Connexion automatique après inscription
    saveDB(db);

    msgDiv.textContent = 'Inscription réussie ! Redirection vers votre tableau de bord...';
    msgDiv.className = 'help success';
    setTimeout(() => {
        window.location.href = 'dashboard/index.html'; // Redirection
    }, 1500);
}

/**
 * Gère la soumission du formulaire de mot de passe oublié.
 */
function handleForgotPassword(e) {
    e.preventDefault();
    const identifier = $('#forgot-identifier').value.trim();
    const msgDiv = $('#forgot-msg');
    const db = loadDB();
    const user = db.users.find(u => u.email === identifier || u.phone === identifier);

    if (user) {
        // Pour une vraie application, on enverrait un email/SMS.
        // Ici, on simule en affichant un message de succès.
        msgDiv.textContent = 'Si un compte existe, un lien de récupération a été envoyé (simulation).';
        msgDiv.className = 'help success';
    } else {
        // On affiche le même message pour ne pas révéler si un utilisateur existe ou non.
        msgDiv.textContent = 'Si un compte existe, un lien de récupération a été envoyé (simulation).';
        msgDiv.className = 'help success';
    }
}


// --- Initialisation des écouteurs d'événements ---
document.addEventListener('DOMContentLoaded', () => {
    // Si l'utilisateur est déjà connecté, on le redirige vers le tableau de bord
    const path = window.location.pathname;
    if (currentUser() && (path.includes('login.html') || path.includes('register.html') || path.includes('forgot-password.html'))) {
        window.location.href = 'dashboard/index.html';
        return; // Arrêter l'exécution pour éviter d'attacher des listeners inutiles
    }

    const formLogin = $('#form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', handleLogin);
    }

    const formRegister = $('#form-register');
    if (formRegister) {
        populateCountrySelects(); // Remplir les pays uniquement sur la page d'inscription
        formRegister.addEventListener('submit', handleRegister);
    }

    const formForgot = $('#form-forgot');
    if (formForgot) {
        formForgot.addEventListener('submit', handleForgotPassword);
    }
});
