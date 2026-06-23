export type Subject = {
  id: string;
  labelKey: string;
  semester: number; // 1 to 6
};

export type Branch = {
  id: string;
  labelKey: string;
  subjects: Subject[];
};

export type University = {
  id: string;
  labelKey: string;
  logo?: string;
  branches: Branch[];
};

// Define standard Moroccan university branches with semesters S1 to S6
const standardBranches: Branch[] = [
  {
    id: "droit-prive",
    labelKey: "branchDroitPrive",
    subjects: [
      // S1
      { id: "intro-droit", labelKey: "subjIntroDroit", semester: 1 },
      { id: "droit-musulman", labelKey: "subjDroitMusulman", semester: 1 },
      { id: "methode-juridique", labelKey: "subjMethodeJuridique", semester: 1 },
      // S2
      { id: "theorie-obligations", labelKey: "subjTheorieObligations", semester: 2 },
      { id: "droit-famille", labelKey: "subjDroitFamille", semester: 2 },
      { id: "droit-penal", labelKey: "subjDroitPenal", semester: 2 },
      // S3
      { id: "droit-commercial", labelKey: "subjDroitCommercial", semester: 3 },
      { id: "droit-social", labelKey: "subjDroitSocial", semester: 3 },
      { id: "penal-special", labelKey: "subjPenalSpecial", semester: 3 },
      // S4
      { id: "droits-reels", labelKey: "subjDroitsReels", semester: 4 },
      { id: "droit-societes", labelKey: "subjDroitSocietes", semester: 4 },
      { id: "droit-affaires", labelKey: "subjDroitAffaires", semester: 4 },
      // S5
      { id: "contrats-nommes", labelKey: "subjContratsNommes", semester: 5 },
      { id: "criminologie", labelKey: "subjCriminologie", semester: 5 },
      { id: "assurances", labelKey: "subjAssurances", semester: 5 },
      // S6
      { id: "proc-civile", labelKey: "subjProcCivile", semester: 6 },
      { id: "proc-penale", labelKey: "subjProcPenale", semester: 6 },
      { id: "droit-int-prive", labelKey: "subjDroitIntPrive", semester: 6 },
    ],
  },
  {
    id: "droit-public",
    labelKey: "branchDroitPublic",
    subjects: [
      // S1
      { id: "intro-droit-public", labelKey: "subjIntroDroitPublic", semester: 1 },
      { id: "droit-constitutionnel", labelKey: "subjDroitConstit", semester: 1 },
      { id: "regimes-politiques", labelKey: "subjRegimesPol", semester: 1 },
      // S2
      { id: "droit-admin", labelKey: "subjDroitAdmin", semester: 2 },
      { id: "org-administrative", labelKey: "subjOrgAdmin", semester: 2 },
      { id: "finances-publiques", labelKey: "subjFinancesPub", semester: 2 },
      // S3
      { id: "act-admin", labelKey: "subjActAdmin", semester: 3 },
      { id: "droit-int-public", labelKey: "subjDroitIntPublic", semester: 3 },
      { id: "systemes-constitutionnels", labelKey: "subjSystConstit", semester: 3 },
      // S4
      { id: "contentieux-admin", labelKey: "subjContentieuxAdmin", semester: 4 },
      { id: "droits-homme", labelKey: "subjDroitsHomme", semester: 4 },
      { id: "relations-int", labelKey: "subjRelationsInt", semester: 4 },
      // S5
      { id: "admin-locale", labelKey: "subjAdminLocale", semester: 5 },
      { id: "droit-services-pub", labelKey: "subjServicesPub", semester: 5 },
      { id: "politiques-publiques", labelKey: "subjPolPubliques", semester: 5 },
      // S6
      { id: "droit-fiscal", labelKey: "subjDroitFiscal", semester: 6 },
      { id: "droit-urbanisme", labelKey: "subjDroitUrbanisme", semester: 6 },
      { id: "histoire-idees-pol", labelKey: "subjHistoireIdeesPol", semester: 6 },
    ],
  },
  {
    id: "economie-gestion",
    labelKey: "branchEconomieGestion",
    subjects: [
      // S1
      { id: "micro-1", labelKey: "subjMicro1", semester: 1 },
      { id: "macro-1", labelKey: "subjMacro1", semester: 1 },
      { id: "compta-1", labelKey: "subjCompta1", semester: 1 },
      // S2
      { id: "micro-2", labelKey: "subjMicro2", semester: 2 },
      { id: "macro-2", labelKey: "subjMacro2", semester: 2 },
      { id: "compta-2", labelKey: "subjCompta2", semester: 2 },
      // S3
      { id: "monetaire", labelKey: "subjMonetaire", semester: 3 },
      { id: "analytique", labelKey: "subjAnalytique", semester: 3 },
      { id: "statistique", labelKey: "subjStatistique", semester: 3 },
      // S4
      { id: "analyse-fin", labelKey: "subjAnalyseFin", semester: 4 },
      { id: "societes-compta", labelKey: "subjSocietesCompta", semester: 4 },
      { id: "econometrie", labelKey: "subjEconometrie", semester: 4 },
      // S5
      { id: "gestion-fin", labelKey: "subjGestionFin", semester: 5 },
      { id: "grh", labelKey: "subjGrh", semester: 5 },
      { id: "marketing", labelKey: "subjMarketing", semester: 5 },
      // S6
      { id: "audit", labelKey: "subjAudit", semester: 6 },
      { id: "controle-gestion", labelKey: "subjControleGestion", semester: 6 },
      { id: "recherche-op", labelKey: "subjRechercheOp", semester: 6 },
    ],
  },
  {
    id: "sciences-maths-info",
    labelKey: "branchSciencesMathsInfo",
    subjects: [
      // S1
      { id: "analyse-1", labelKey: "subjAnalyse1", semester: 1 },
      { id: "algebre-1", labelKey: "subjAlgebre1", semester: 1 },
      { id: "physique-1", labelKey: "subjPhysique1", semester: 1 },
      // S2
      { id: "analyse-2", labelKey: "subjAnalyse2", semester: 2 },
      { id: "algebre-2", labelKey: "subjAlgebre2", semester: 2 },
      { id: "prog-c", labelKey: "subjProgC", semester: 2 },
      // S3
      { id: "prog-cpp", labelKey: "subjProgCpp", semester: 3 },
      { id: "struct-donnees", labelKey: "subjStructDonnees", semester: 3 },
      { id: "merise", labelKey: "subjMerise", semester: 3 },
      // S4
      { id: "sql", labelKey: "subjSql", semester: 4 },
      { id: "reseaux", labelKey: "subjReseaux", semester: 4 },
      { id: "systeme-expl", labelKey: "subjSystemeExpl", semester: 4 },
      // S5
      { id: "java", labelKey: "subjJava", semester: 5 },
      { id: "genie-logiciel", labelKey: "subjGenieLogiciel", semester: 5 },
      { id: "web-dyn", labelKey: "subjWebDyn", semester: 5 },
      // S6
      { id: "ia", labelKey: "subjIa", semester: 6 },
      { id: "securite", labelKey: "subjSecurite", semester: 6 },
      { id: "pfe", labelKey: "subjPfe", semester: 6 },
    ],
  },
];

// Define all 12 Moroccan Public Universities
export const universities: University[] = [
  { id: "mohammed-v", labelKey: "univMohammedV", logo: "Mohammed_V_University_Logo.png", branches: standardBranches },
  { id: "hassan-ii", labelKey: "univHassanII", logo: "Logo_UHIIC.png", branches: standardBranches },
  { id: "cadi-ayyad", labelKey: "univCadiAyyad", branches: standardBranches },
  { id: "ibn-zohr", labelKey: "univIbnZohr", logo: "universite-ibn-zohr-agadir-maroc-logo-png_seeklogo-315828.webp", branches: standardBranches },
  { id: "sidi-mohammed", labelKey: "univSidiMohammed", branches: standardBranches },
  { id: "abdelmalek-essaadi", labelKey: "univAbdelmalekEssaadi", branches: standardBranches },
  { id: "moulay-ismail", labelKey: "univMoulayIsmail", branches: standardBranches },
  { id: "ibn-tofail", labelKey: "univIbnTofail", branches: standardBranches },
  { id: "chouaib-doukkali", labelKey: "univChouaibDoukkali", logo: "universite-chouaib-doukkali-maroc-logo.webp", branches: standardBranches },
  { id: "hassan-1er", labelKey: "univHassan1er", logo: "universite-hassan-1er-settat-logo-png_seeklogo-315574.webp", branches: standardBranches },
  { id: "sultan-moulay-slimane", labelKey: "univSultanMoulaySlimane", logo: "universite-sultan-moulay-slimane-beni-mella-logo-png_seeklogo-315877.webp", branches: standardBranches },
  { id: "mohamed-1er", labelKey: "univMohamed1er", logo: "universite-mohammed-i-oujda-logo-png_seeklogo-646985.webp", branches: standardBranches },
];

export function getUniversityById(id: string): University | undefined {
  return universities.find((u) => u.id === id);
}

export function getBranchById(universityId: string, branchId: string): Branch | undefined {
  return getUniversityById(universityId)?.branches.find((b) => b.id === branchId);
}

export function getSubjectById(
  universityId: string,
  branchId: string,
  subjectId: string,
): Subject | undefined {
  return getBranchById(universityId, branchId)?.subjects.find((s) => s.id === subjectId);
}
