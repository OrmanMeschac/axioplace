import { Link } from 'react-router-dom';
import {
    FileText, ChevronDown, ChevronUp, Shield, AlertTriangle, Scale,
    Globe, BookOpen, UserCheck, Megaphone, Users, Landmark, Ban,
    ShieldOff, Gavel,
} from 'lucide-react';
import { useState } from 'react';

const SECTIONS = [
    {
        id: 1,
        Icon: BookOpen,
        title: 'Objet et définitions',
        content: [
            { type: 'p', text: "Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme Axioplace, accessible via le site web et les applications mobiles iOS et Android (ci-après « la Plateforme »)." },
            { type: 'h', text: 'Définitions' },
            { type: 'list', items: [
                "Axioplace : Désigne la plateforme de petites annonces en ligne exploitée sous la marque Axioplace, dont le siège est établi en République du Congo.",
                "Utilisateur : Toute personne physique ou morale qui accède à la Plateforme, qu'elle soit inscrite ou non.",
                "Vendeur / Annonceur : Tout utilisateur qui publie une annonce sur la Plateforme.",
                "Acheteur / Visiteur : Tout utilisateur qui consulte des annonces et/ou entre en contact avec un Vendeur.",
                "Annonce : Offre de vente, de location, de service ou d'échange publiée par un Utilisateur sur la Plateforme.",
            ]},
            { type: 'p', text: "En accédant à la Plateforme, l'Utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes CGU dans leur intégralité." },
        ],
    },
    {
        id: 2,
        Icon: UserCheck,
        title: "Conditions d'accès et inscription",
        content: [
            { type: 'h', text: "Accès à la Plateforme" },
            { type: 'p', text: "L'accès en lecture à la Plateforme est libre et gratuit. La création d'un compte est requise pour publier des annonces et utiliser la messagerie interne." },
            { type: 'h', text: "Conditions d'éligibilité" },
            { type: 'list', items: [
                "Être âgé d'au moins 18 ans ou disposer d'une autorisation parentale.",
                "Disposer d'une adresse email valide.",
                "Fournir des informations exactes, complètes et à jour lors de l'inscription.",
            ]},
            { type: 'h', text: "Responsabilité du compte" },
            { type: 'p', text: "L'Utilisateur est seul responsable de la confidentialité de ses identifiants. Tout accès à la Plateforme depuis son compte est présumé effectué par lui-même. Axioplace ne saurait être tenu responsable des dommages résultant d'un accès non autorisé dû à une négligence de l'Utilisateur." },
            { type: 'h', text: "Compte unique" },
            { type: 'p', text: "Chaque Utilisateur ne peut créer qu'un seul compte. La création de comptes multiples à des fins frauduleuses entraîne la suspension immédiate et définitive de l'ensemble des comptes concernés." },
        ],
    },
    {
        id: 3,
        Icon: Megaphone,
        title: "Règles de publication d'annonces",
        content: [
            { type: 'h', text: "Contenu autorisé" },
            { type: 'p', text: "Les annonces doivent correspondre à une offre réelle, légale et conforme aux lois en vigueur en République du Congo." },
            { type: 'h', text: "Contenu strictement interdit" },
            { type: 'list', items: [
                "Les armes, munitions, explosifs et matériel de guerre.",
                "Les stupéfiants, drogues et substances illicites.",
                "Les animaux protégés ou dont le commerce est réglementé.",
                "Les produits contrefaits ou portant atteinte à des droits de propriété intellectuelle.",
                "Les contenus à caractère pornographique, violent, haineux ou discriminatoire.",
                "Les faux documents officiels, billets de banque ou pièces d'identité.",
                "Toute offre visant à escroquer, tromper ou porter préjudice à un autre Utilisateur.",
            ]},
            { type: 'h', text: "Exactitude des annonces" },
            { type: 'p', text: "L'Annonceur garantit que le contenu de son annonce (description, photos, prix) est exact. Les photos doivent représenter fidèlement le bien ou service proposé." },
        ],
    },
    {
        id: 4,
        Icon: Users,
        title: 'Responsabilités des utilisateurs',
        content: [
            { type: 'h', text: "Responsabilité de l'Annonceur" },
            { type: 'p', text: "L'Annonceur est seul responsable du contenu de ses annonces et des transactions qui en découlent. Axioplace agit uniquement en tant qu'intermédiaire technique et ne participe pas aux transactions entre Utilisateurs." },
            { type: 'h', text: "Responsabilité de l'Acheteur" },
            { type: 'p', text: "L'Acheteur est invité à exercer sa vigilance avant toute transaction : vérifier l'identité du Vendeur, inspecter le bien avant paiement et ne jamais effectuer de virement sans avoir reçu le bien." },
            { type: 'h', text: "Fraude et escroquerie" },
            { type: 'p', text: "Tout comportement frauduleux doit être signalé via le système de signalement de la Plateforme. Axioplace se réserve le droit de signaler aux autorités compétentes tout Utilisateur dont le comportement est constitutif d'une infraction pénale." },
        ],
    },
    {
        id: 5,
        Icon: Landmark,
        title: 'Propriété intellectuelle',
        content: [
            { type: 'h', text: "Droits d'Axioplace" },
            { type: 'p', text: "La Plateforme, ses fonctionnalités, son design, ses algorithmes, sa charte graphique, ses logos, et l'ensemble des contenus produits par Axioplace sont la propriété exclusive d'Axioplace et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction non autorisée est strictement interdite." },
            { type: 'h', text: "Droits des Utilisateurs sur leurs contenus" },
            { type: 'p', text: "En publiant du contenu sur la Plateforme, l'Utilisateur accorde à Axioplace une licence non-exclusive, mondiale et gratuite d'utiliser, reproduire et afficher ce contenu dans le cadre du fonctionnement et de la promotion de la Plateforme." },
        ],
    },
    {
        id: 6,
        Icon: Ban,
        title: 'Suspension et suppression de compte',
        content: [
            { type: 'h', text: "Motifs de suspension" },
            { type: 'list', items: [
                "Violation des présentes CGU.",
                "Publication d'annonces illicites ou frauduleuses.",
                "Comportement abusif, harcelant ou menaçant envers d'autres Utilisateurs.",
                "Création de comptes multiples.",
                "Usurpation d'identité.",
                "Tentative de contournement des systèmes de sécurité de la Plateforme.",
            ]},
            { type: 'h', text: "Effets de la suppression" },
            { type: 'p', text: "En cas de suppression de compte, toutes les annonces associées seront automatiquement désactivées. Les données seront conservées pendant la durée légale requise et pourront être transmises aux autorités judiciaires si nécessaire." },
        ],
    },
    {
        id: 7,
        Icon: ShieldOff,
        title: "Limitation de responsabilité d'Axioplace",
        content: [
            { type: 'h', text: "Rôle d'intermédiaire" },
            { type: 'p', text: "Axioplace est un prestataire de service technique qui met en relation des Utilisateurs. Axioplace n'est pas partie aux transactions entre Utilisateurs et n'assume aucune responsabilité quant à la qualité, la sécurité ou la légalité des biens ou services proposés." },
            { type: 'h', text: "Disponibilité de la Plateforme" },
            { type: 'p', text: "Axioplace s'efforce d'assurer la disponibilité de la Plateforme 24h/24 et 7j/7, mais ne garantit pas l'absence d'interruptions dues à des opérations de maintenance ou à des causes extérieures (force majeure, actes malveillants de tiers, etc.)." },
            { type: 'h', text: "Limitation des dommages" },
            { type: 'p', text: "En aucun cas Axioplace ne pourra être tenu responsable de dommages indirects, pertes de données, pertes de profit ou atteinte à l'image découlant de l'utilisation ou de l'impossibilité d'utilisation de la Plateforme." },
        ],
    },
    {
        id: 8,
        Icon: Gavel,
        title: 'Loi applicable et juridiction',
        content: [
            { type: 'h', text: "Droit applicable" },
            { type: 'p', text: "Les présentes CGU sont régies et interprétées conformément aux lois en vigueur en République du Congo." },
            { type: 'h', text: "Résolution amiable" },
            { type: 'p', text: "En cas de litige entre un Utilisateur et Axioplace, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. L'Utilisateur peut adresser sa réclamation via la page de contact de la Plateforme." },
            { type: 'h', text: "Juridiction compétente" },
            { type: 'p', text: "À défaut de résolution amiable dans un délai de 30 jours, tout litige relatif à la validité, l'interprétation ou l'exécution des présentes CGU sera soumis à la compétence exclusive des tribunaux de Brazzaville, République du Congo." },
            { type: 'h', text: "Modifications des CGU" },
            { type: 'p', text: "Axioplace se réserve le droit de modifier les présentes CGU à tout moment. La poursuite de l'utilisation de la Plateforme après notification des modifications vaut acceptation des nouvelles CGU." },
        ],
    },
];

function renderContent(items) {
    return items.map((block, i) => {
        if (block.type === 'p')    return <p key={i} className="text-gray-600 leading-relaxed text-sm mb-3">{block.text}</p>;
        if (block.type === 'h')    return <p key={i} className="font-bold text-gray-800 text-sm mt-4 mb-1.5">{block.text}</p>;
        if (block.type === 'list') return (
            <ul key={i} className="space-y-1.5 mb-3 pl-2">
                {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-axio-jaune flex-shrink-0 mt-1.5" />
                        {item}
                    </li>
                ))}
            </ul>
        );
        return null;
    });
}

function Section({ section, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    const { Icon } = section;
    return (
        <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${open ? 'border-axio-jaune/50 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-6 text-left group"
                id={`cgu-article-${section.id}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${open ? 'bg-axio-jaune text-gray-900' : 'bg-gray-100 text-gray-500 group-hover:bg-axio-jaune/10 group-hover:text-axio-jaune'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Article {section.id}</p>
                        <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{section.title}</h3>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${open ? 'bg-axio-jaune/10 text-axio-jaune' : 'bg-gray-100 text-gray-400'}`}>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            {open && (
                <div className="px-6 pb-6 border-t border-gray-50">
                    <div className="pt-4">
                        {renderContent(section.content)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CGU() {
    return (
        <div className="min-h-screen bg-[#f6f7f9]">

            {/* ── Hero — style Login (image + gradient jaune→vert + blur) ── */}
            <div className="relative overflow-hidden py-20">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://i.pinimg.com/originals/3c/05/71/3c05716d80249529424e1a05b9f414c1.jpg')" }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFC533]/85 to-[#009543]/85 backdrop-blur-[1px]" />
                </div>
                <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/20">
                        <FileText className="w-3.5 h-3.5" />
                        Document légal officiel
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
                        Conditions Générales{' '}
                        <span className="text-axio-jaune">d'Utilisation</span>
                    </h1>
                    <p className="text-white/80 text-base max-w-xl mx-auto leading-relaxed mb-4">
                        Veuillez lire attentivement ces conditions avant d'utiliser la plateforme Axioplace.
                    </p>
                    <p className="text-white/60 text-sm">Version 1.0 — Dernière mise à jour : 23 avril 2026</p>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-12">

                {/* Bandeaux informatifs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {[
                        { Icon: Shield,        color: 'border-axio-vert/30 bg-axio-vert/5',   iconColor: 'text-axio-vert',  title: 'Protection garantie',     sub: 'Droits et recours des utilisateurs' },
                        { Icon: AlertTriangle, color: 'border-axio-jaune/30 bg-axio-jaune/5', iconColor: 'text-axio-jaune', title: 'Contenu modéré',           sub: 'Zéro tolérance pour la fraude' },
                        { Icon: Scale,         color: 'border-gray-200 bg-white',             iconColor: 'text-gray-500',   title: 'Droit congolais',         sub: 'Juridiction : Brazzaville' },
                    ].map(({ Icon, color, iconColor, title, sub }) => (
                        <div key={title} className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}>
                            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{title}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Note importante */}
                <div className="bg-axio-jaune/10 border border-axio-jaune/30 rounded-2xl p-5 mb-10">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-axio-jaune flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 text-sm leading-relaxed">
                            <strong className="text-gray-900">Important :</strong> En créant un compte ou en utilisant les services d'Axioplace, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez cesser d'utiliser la Plateforme immédiatement.
                        </p>
                    </div>
                </div>

                {/* Articles en accordéon */}
                <div className="space-y-3">
                    {SECTIONS.map((section, i) => (
                        <Section key={section.id} section={section} defaultOpen={i === 0} />
                    ))}
                </div>

                {/* Pied de page légal */}
                <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-3">
                    <Globe className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-gray-600 text-sm leading-relaxed max-w-xl mx-auto">
                        Ces CGU constituent l'intégralité de l'accord entre vous et Axioplace concernant l'utilisation de la Plateforme.
                        Pour toute question, consultez notre{' '}
                        <Link to="/contact" className="text-axio-vert font-semibold hover:underline">page de contact</Link>.
                    </p>
                    <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Axioplace — Brazzaville, République du Congo</p>
                </div>
            </div>
        </div>
    );
}
