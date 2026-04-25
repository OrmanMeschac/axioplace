import React from 'react';

const PolitiqueConfidentialite = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl pt-24 text-gray-800">
            <h1 className="text-4xl font-extrabold mb-8 text-primary">Politique de Confidentialité</h1>
            <p className="mb-8 text-lg font-medium text-gray-600">Dernière mise à jour : 15 Avril 2026</p>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">1. Introduction</h2>
                <p className="mb-4 leading-relaxed">
                    Axioplace ("nous", "notre", "nos") s'engage à protéger la vie privée des utilisateurs de sa plateforme. Cette politique de confidentialité explique comment nous recueillons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web et utilisez nos applications mobiles.
                </p>
                <p className="leading-relaxed">
                    En tant que marketplace de petites annonces (à l'instar de plateformes reconnues telles que leboncoin ou seloger), la transparence est au centre de notre relation de confiance.
                </p>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">2. Données que nous collectons</h2>
                <p className="mb-4 font-semibold">Nous pouvons collecter des informations vous concernant de diverses manières. Celles-ci incluent :</p>
                <ul className="list-disc pl-6 space-y-3 mb-4 text-gray-700">
                    <li><strong className="text-gray-900">Données de création de compte :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, et informations de connexion.</li>
                    <li><strong className="text-gray-900">Données liées à vos annonces :</strong> Titres, descriptions, prix, localisation, et les photographies incluses dans vos annonces. <em>Notez que ces informations sont destinées à être rendues publiques sur la plateforme.</em></li>
                    <li><strong className="text-gray-900">Données de communication :</strong> Messages échangés via notre système de messagerie interne entre acheteurs et vendeurs. Nous sommes susceptibles d'analyser ces communications à des fins de modération et de prévention contre la fraude.</li>
                    <li><strong className="text-gray-900">Données techniques :</strong> Adresse IP, type de navigateur, système d'exploitation, données d'utilisation (pages visitées, temps passé) via les cookies et technologies similaires.</li>
                </ul>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">3. Utilisation de vos données</h2>
                <p className="mb-4">Vos données sont utilisées dans le but de :</p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Faciliter la publication et la gestion de vos annonces.</li>
                    <li>Assurer la mise en relation sécurisée entre vendeurs et acheteurs.</li>
                    <li>Améliorer, personnaliser et développer notre plateforme.</li>
                    <li>Gérer la modération (ex: traitement des signalements pour annonces frauduleuses ou illicites).</li>
                    <li>Vous envoyer des notifications (ex: nouveaux messages, mises à jour de sécurité).</li>
                </ul>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">4. Partage et diffusion des données spécifiques aux marketplaces</h2>
                <p className="mb-4 leading-relaxed">
                    Par la nature même d'Axioplace, certaines de vos données sont <strong>publiquement visibles</strong> :
                </p>
                <ul className="list-disc pl-6 space-y-3 mb-4 text-gray-700">
                    <li>Le contenu de vos annonces (textes, prix, photos, localisation approximative).</li>
                    <li>Le pseudonyme ou nom associé à votre profil vendeur et vos évaluations/avis.</li>
                </ul>
                <p className="leading-relaxed">
                    Nous ne vendons ni ne louons vos données personnelles à des tiers. Les partages externes se limitent à nos prestataires techniques (hébergement, envoi de mails), sous obligation stricte de confidentialité, ainsi qu'aux autorités administratives ou judiciaires si la loi l'exige (ex: enquête pour fraude).
                </p>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">5. Lutte contre la fraude et Modération</h2>
                <p className="leading-relaxed">
                    Afin d'assurer la sécurité de nos utilisateurs, nous utilisons des systèmes automatisés et manuels pour détecter les comportements suspects, les annonces illicites et les fraudes. Cela peut impliquer l'analyse du contenu de vos annonces et de vos messages internes. Si nos outils ou notre équipe de modération détectent une violation grave de nos CGU, nous nous réservons le droit de suspendre votre compte et de conserver les données associées pour des raisons légales et de sécurité.
                </p>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">6. Vos droits (RGPD)</h2>
                <p className="mb-4 leading-relaxed">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-3 mb-4 text-gray-700">
                    <li>Droit d'accès et de rectification de vos données depuis votre espace "Profil".</li>
                    <li>Droit à l'effacement (droit à l'oubli) de vos données ou de votre compte.</li>
                    <li>Droit à la limitation et à l'opposition au traitement.</li>
                    <li>Droit à la portabilité de vos données.</li>
                </ul>
                <p>Pour exercer ces droits, vous pouvez nous contacter via la page de contact ou modifier directement vos paramètres dans votre compte.</p>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">7. Cookies</h2>
                <p className="leading-relaxed">
                    Nous utilisons des cookies pour maintenir votre session active, mémoriser vos préférences et mesurer l'audience de notre site de manière anonyme. Vous pouvez configurer votre navigateur pour refuser ces cookies, ce qui pourrait limiter certaines fonctionnalités (notamment la connexion à votre compte).
                </p>
            </section>

            <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-secondary">8. Nous contacter</h2>
                <p className="leading-relaxed">
                    Pour toute question ou préoccupation concernant cette politique de confidentialité, veuillez nous contacter à l'adresse support@axioplace.com.
                </p>
            </section>

        </div>
    );
};

export default PolitiqueConfidentialite;
