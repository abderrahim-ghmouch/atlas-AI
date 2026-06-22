export type Subject = {
  id: string;
  labelKey: string;
};

export type Branch = {
  id: string;
  labelKey: string;
  subjects: Subject[];
};

export type University = {
  id: string;
  labelKey: string;
  branches: Branch[];
};

export const universities: University[] = [
  {
    id: "mohammed-v",
    labelKey: "univMohammedV",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
          { id: "obligations", labelKey: "obligationsLaw" },
          { id: "family-law", labelKey: "familyLaw" },
        ],
      },
      {
        id: "droit-public",
        labelKey: "branchDroitPublic",
        subjects: [
          { id: "constitutional-law", labelKey: "constitutionalLaw" },
          { id: "administrative-law", labelKey: "administrativeLaw" },
          { id: "public-finance", labelKey: "publicFinanceLaw" },
        ],
      },
      {
        id: "economie-gestion",
        labelKey: "branchEconomieGestion",
        subjects: [
          { id: "business-law", labelKey: "businessLaw" },
          { id: "accounting", labelKey: "accounting" },
          { id: "management", labelKey: "management" },
        ],
      },
    ],
  },
  {
    id: "hassan-ii",
    labelKey: "univHassanII",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
          { id: "obligations", labelKey: "obligationsLaw" },
        ],
      },
      {
        id: "droit-public",
        labelKey: "branchDroitPublic",
        subjects: [
          { id: "constitutional-law", labelKey: "constitutionalLaw" },
          { id: "administrative-law", labelKey: "administrativeLaw" },
        ],
      },
    ],
  },
  {
    id: "cadi-ayyad",
    labelKey: "univCadiAyyad",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
          { id: "family-law", labelKey: "familyLaw" },
        ],
      },
      {
        id: "droit-public",
        labelKey: "branchDroitPublic",
        subjects: [
          { id: "constitutional-law", labelKey: "constitutionalLaw" },
          { id: "administrative-law", labelKey: "administrativeLaw" },
        ],
      },
    ],
  },
  {
    id: "ibn-zohr",
    labelKey: "univIbnZohr",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
        ],
      },
      {
        id: "economie-gestion",
        labelKey: "branchEconomieGestion",
        subjects: [
          { id: "business-law", labelKey: "businessLaw" },
          { id: "accounting", labelKey: "accounting" },
        ],
      },
    ],
  },
  {
    id: "sidi-mohammed",
    labelKey: "univSidiMohammed",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
          { id: "obligations", labelKey: "obligationsLaw" },
        ],
      },
      {
        id: "droit-public",
        labelKey: "branchDroitPublic",
        subjects: [
          { id: "constitutional-law", labelKey: "constitutionalLaw" },
          { id: "administrative-law", labelKey: "administrativeLaw" },
        ],
      },
    ],
  },
  {
    id: "abdelmalek-essaadi",
    labelKey: "univAbdelmalekEssaadi",
    branches: [
      {
        id: "droit-prive",
        labelKey: "branchDroitPrive",
        subjects: [
          { id: "commercial-law", labelKey: "commercialLaw" },
          { id: "civil-law", labelKey: "civilLaw" },
        ],
      },
      {
        id: "droit-public",
        labelKey: "branchDroitPublic",
        subjects: [
          { id: "constitutional-law", labelKey: "constitutionalLaw" },
          { id: "public-finance", labelKey: "publicFinanceLaw" },
        ],
      },
    ],
  },
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
