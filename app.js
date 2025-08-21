/**************************************
 * S-MONEY — Logique de l'application principale
 **************************************/

/**
 * Point d'entrée principal pour les pages de l'application.
 */
document.addEventListener('DOMContentLoaded', () => {
    const user = currentUser();

    // Gardien d'authentification : si personne n'est connecté, on redirige vers la page de connexion.
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Initialise les éléments communs à toutes les pages (topbar, sidebar, footer)
    setupCommonUI(user);

    // Exécute la logique spécifique à la page actuelle
    const path = window.location.pathname;
    if (path.endsWith('/') || path.endsWith('/index.html')) {
        setupDashboardPage(user);
    } else if (path.endsWith('/history.html')) {
        setupHistoryPage(user);
    } else if (path.endsWith('/profile.html')) {
        setupProfilePage(user);
    } else if (path.endsWith('/security.html')) {
        setupSecurityPage(user);
    }
});

/**
 * Configure les éléments d'interface utilisateur partagés sur toutes les pages de l'application.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function setupCommonUI(user) {
    $('#hi-user').textContent = `Salut, ${user.firstname || user.email}`;
    $('#btn-logout').addEventListener('click', logout);
    $('#btn-open-menu').addEventListener('click', () => {
        $('#sidebar').classList.toggle('open');
    });
    $('#year').textContent = new Date().getFullYear();
}

/**
 * Gère la déconnexion de l'utilisateur.
 */
function logout() {
    const db = loadDB();
    db.sessions.currentUserId = null;
    saveDB(db);
    window.location.href = '/login.html';
}

/**
 * Configure la logique de la page du tableau de bord.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function setupDashboardPage(user) {
    $('#dash-username').textContent = user.firstname || user.email;
    $('#my-ref-code').textContent = user.refCode;
    $('#inv-name').value = `${user.firstname} ${user.lastname}`; // Pré-remplir le nom

    refreshBalances(user);

    $('#form-invest').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#inv-name').value.trim();
        const currency = $('#inv-currency').value;
        const amount = parseFloat($('#inv-amount').value);
        const note = $('#inv-note').value.trim();

        if (!name || isNaN(amount) || amount <= 0) {
            alert("Veuillez remplir correctement les champs Nom et Montant.");
            return;
        }

        const db = loadDB();
        const newInvestment = {
            id: genId('inv'),
            userId: user.id,
            date: nowISO(),
            name, currency, amount, note,
            status: 'En attente'
        };

        db.investments.push(newInvestment);
        saveDB(db);
        showModal(newInvestment);
        $('#form-invest').reset();
        $('#inv-name').value = `${user.firstname} ${user.lastname}`; // Re-remplir après reset
    });
}

/**
 * Met à jour les soldes affichés sur le tableau de bord.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function refreshBalances(user) {
    const db = loadDB();
    let totalUSD = 0, totalCDF = 0, totalBonus = 0;

    db.investments.filter(inv => inv.userId === user.id).forEach(inv => {
        if (inv.currency === 'USD') totalUSD += inv.amount;
        else if (inv.currency === 'CDF') totalCDF += inv.amount;
    });

    const userReferrals = db.referrals.filter(ref => ref.sponsorId === user.id);
    totalBonus = userReferrals.reduce((sum, ref) => sum + (ref.amount * REFERRAL_PERCENT / 100), 0);

    $('#balance-total').textContent = `$ ${fmt.format(totalUSD + totalBonus)}`;
    $('#balance-cdf').textContent = `CDF ${fmt.format(totalCDF)}`;
    $('#ref-bonus').textContent = `$ ${fmt.format(totalBonus)}`;
}

/**
 * Configure la logique de la page d'historique.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function setupHistoryPage(user) {
    const db = loadDB();
    const tableBody = $('#history-table tbody');
    tableBody.innerHTML = '';

    const userInvestments = db.investments.filter(inv => inv.userId === user.id).reverse();

    if (userInvestments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted);">Aucun investissement trouvé.</td></tr>';
        return;
    }

    userInvestments.forEach(inv => {
        const row = document.createElement('tr');
        const date = new Date(inv.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
        row.innerHTML = `
            <td data-label="Date">${date}</td>
            <td data-label="Nom">${inv.name}</td>
            <td data-label="Devise">${inv.currency}</td>
            <td data-label="Montant">${fmt.format(inv.amount)}</td>
            <td data-label="Note">${inv.note || '-'}</td>
            <td data-label="Statut" style="color: var(--warning);">${inv.status}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Configure la logique de la page de profil.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function setupProfilePage(user) {
    $('#pf-lastname').value = user.lastname || '';
    $('#pf-firstname').value = user.firstname || '';
    $('#pf-gender').value = user.gender || '';
    $('#pf-country').value = user.country || '';
    $('#pf-phone').value = user.phone || '';
    $('#pf-email').value = user.email || '';
    $('#pf-refcode').value = user.refCode || '';

    $('#form-profile').addEventListener('submit', (e) => {
        e.preventDefault();
        const db = loadDB();
        const userToUpdate = db.users.find(u => u.id === user.id);
        if (!userToUpdate) return;

        userToUpdate.lastname = $('#pf-lastname').value.trim();
        userToUpdate.firstname = $('#pf-firstname').value.trim();
        userToUpdate.gender = $('#pf-gender').value;
        userToUpdate.country = $('#pf-country').value.trim();
        userToUpdate.phone = $('#pf-phone').value.trim();
        userToUpdate.email = $('#pf-email').value.trim();

        saveDB(db);
        const msgDiv = $('#profile-msg');
        msgDiv.textContent = 'Profil mis à jour avec succès !';
        msgDiv.className = 'help success';
    });
}

/**
 * Configure la logique de la page de sécurité.
 * @param {object} user - L'objet de l'utilisateur connecté.
 */
function setupSecurityPage(user) {
    $('#form-password').addEventListener('submit', (e) => {
        e.preventDefault();
        const msgDiv = $('#sec-msg');
        const oldPass = $('#sec-old').value;
        const newPass = $('#sec-new').value;
        const newPass2 = $('#sec-new2').value;

        const db = loadDB();
        const userToUpdate = db.users.find(u => u.id === user.id);

        if (oldPass !== userToUpdate.password) {
            msgDiv.textContent = 'Le mot de passe actuel est incorrect.';
            msgDiv.className = 'help error';
            return;
        }
        if (newPass.length < 6) {
            msgDiv.textContent = 'Le nouveau mot de passe doit faire au moins 6 caractères.';
            msgDiv.className = 'help error';
            return;
        }
        if (newPass !== newPass2) {
            msgDiv.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
            msgDiv.className = 'help error';
            return;
        }

        userToUpdate.password = newPass;
        saveDB(db);
        msgDiv.textContent = 'Mot de passe changé avec succès !';
        msgDiv.className = 'help success';
        e.target.reset();
    });
}

/**
 * Affiche la modale de récapitulatif d'investissement.
 * @param {object} investment - L'objet d'investissement.
 */
function showModal(investment) {
    const modal = $('#modal');
    $('#modal-content').innerHTML = `
        <div class="card">
            <p><strong>Date:</strong> ${new Date(investment.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
            <p><strong>Nom:</strong> ${investment.name}</p>
            <p><strong>Montant:</strong> ${fmt.format(investment.amount)} ${investment.currency}</p>
            <p><strong>Note:</strong> ${investment.note || 'Aucune'}</p>
            <div style="height:10px"></div>
            <p>Pour finaliser, contactez-nous sur WhatsApp avec les détails de cette transaction.</p>
            <div class="help">Numéro: <strong>0995391926</strong></div>
        </div>
    `;

    $('#btn-wa').onclick = () => {
        const message = `Bonjour S-MONEY, je souhaite finaliser mon investissement. ID: ${investment.id}, Montant: ${fmt.format(investment.amount)} ${investment.currency}.`;
        window.open(`https://wa.me/243995391926?text=${encodeURIComponent(message)}`, '_blank');
    };

    $('#btn-download').onclick = () => handleDownload(investment);
    $('#modal-close').onclick = () => modal.classList.remove('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
    modal.classList.add('open');
}

/**
 * Gère le téléchargement du reçu au format PNG.
 * @param {object} investment - L'objet d'investissement.
 */
function handleDownload(investment) {
    // Cette fonction nécessite la librairie html2canvas, qui doit être incluse dans le HTML.
    const receiptDiv = $('#receipt-content');
    receiptDiv.style.display = 'block';
    receiptDiv.innerHTML = `<h3>S‑MONEY - Reçu</h3><p>Date: ${new Date(investment.date).toLocaleString('fr-FR')}</p><p>Nom: ${investment.name}</p><p>Montant: ${fmt.format(investment.amount)} ${investment.currency}</p><p>ID: ${investment.id}</p>`;

    html2canvas(receiptDiv, { scale: 2, backgroundColor: 'white' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `reçu-smoney-${investment.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        receiptDiv.style.display = 'none';
    });
}