export const translations = {
  fr: {
    appName: "mgscholar.ai",
    signUp: "S'inscrire",
    login: "Connexion",
    signUpNow: "S'inscrire maintenant",
    createAccount: "Créer un compte",
    joinPlatform:
      "Rejoignez mgscholar.ai et commencez à apprendre avec votre assistant intelligent",
    fullName: "Nom complet",
    fullNamePlaceholder: "Jean Smith",
    email: "E-mail",
    emailPlaceholder: "jean@example.com",
    password: "Mot de passe",
    passwordPlaceholder: "••••••••",
    subject: "Matière",
    subjectToLearn: "Matière à apprendre",
    selectSubject: "Choisir une matière",
    university: "Université",
    selectUniversity: "Choisir une université",
    branch: "Filière",
    selectBranch: "Choisir une filière",
    setupYourStudies: "Configurez vos études",
    setupYourStudiesDescription:
      "Sélectionnez votre université, votre filière et la matière que vous souhaitez apprendre pour personnaliser votre assistant IA.",
    continueToDashboard: "Commencer à apprendre",
    changeStudyContext: "Modifier",
    commercialLaw: "Droit commercial",
    civilLaw: "Droit civil",
    constitutionalLaw: "Droit constitutionnel",
    obligationsLaw: "Droit des obligations",
    familyLaw: "Droit de la famille",
    administrativeLaw: "Droit administratif",
    publicFinanceLaw: "Droit des finances publiques",
    businessLaw: "Droit des affaires",
    accounting: "Comptabilité",
    management: "Management",
    branchDroitPrive: "Droit privé",
    branchDroitPublic: "Droit public",
    branchEconomieGestion: "Sciences économiques et gestion",
    univMohammedV: "Université Mohammed V — Rabat",
    univHassanII: "Université Hassan II — Casablanca",
    univCadiAyyad: "Université Cadi Ayyad — Marrakech",
    univIbnZohr: "Université Ibn Zohr — Agadir",
    univSidiMohammed: "Université Sidi Mohammed Ben Abdellah — Fès",
    univAbdelmalekEssaadi: "Université Abdelmalek Essaâdi — Tétouan",
    createAccountButton: "Créer un compte",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    haveAccount: "Vous n'avez pas de compte?",
    signUpLink: "S'inscrire",
    loginLink: "Se connecter",
    welcomeBack: "Bon retour",
    loginDescription: "Connectez-vous à votre compte mgscholar.ai",
    forgotPassword: "Mot de passe oublié?",
    rememberMe: "Se souvenir de moi",
    welcome: "Bonjour, Mohamed",
    todaySubject: "Matière d'aujourd'hui : Droit commercial",
  },
};

export type Language = "fr";
export type TranslationKey = keyof (typeof translations)["fr"];

export function getTranslation(
  _language: Language,
  key: TranslationKey,
): string {
  return translations.fr[key];
}
