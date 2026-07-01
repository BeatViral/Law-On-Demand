import type { AdminUser, Attorney, ClientUser, LegalCategory } from "./types";

export const legalCategories: LegalCategory[] = [
  {
    id: "cat_dui",
    name: "DUI / DWI",
    slug: "dui-dwi",
    defaultFeeModel: "retainer",
    active: true,
    urgency: "Roadside, arrest, booking, license risk",
    accent: "signal"
  },
  {
    id: "cat_stop",
    name: "Traffic Stop",
    slug: "traffic-stop",
    defaultFeeModel: "retainer",
    active: true,
    urgency: "Stopped now, questioning, citation risk",
    accent: "cobalt"
  },
  {
    id: "cat_infraction",
    name: "Traffic Infraction",
    slug: "traffic-infraction",
    defaultFeeModel: "retainer",
    active: true,
    urgency: "Tickets, points, court date",
    accent: "amberlaw"
  },
  {
    id: "cat_auto",
    name: "Auto Accident",
    slug: "auto-accident",
    defaultFeeModel: "contingency",
    active: true,
    urgency: "Crash scene, insurance, injury triage",
    accent: "cyanfire"
  },
  {
    id: "cat_injury",
    name: "Personal Injury",
    slug: "personal-injury",
    defaultFeeModel: "contingency",
    active: true,
    urgency: "Medical care, evidence, claim review",
    accent: "verdict"
  },
  {
    id: "cat_criminal",
    name: "Criminal Defence",
    slug: "criminal-defence",
    defaultFeeModel: "retainer",
    active: true,
    urgency: "Arrest, interview, charges, bail",
    accent: "signal"
  },
  {
    id: "cat_family",
    name: "Family Law",
    slug: "family-law",
    defaultFeeModel: "custom",
    active: true,
    urgency: "Custody, divorce, protective order",
    accent: "cobalt"
  },
  {
    id: "cat_contract",
    name: "Contract Law",
    slug: "contract-law",
    defaultFeeModel: "custom",
    active: true,
    urgency: "Review, breach, negotiation",
    accent: "amberlaw"
  },
  {
    id: "cat_other",
    name: "Other Legal Help",
    slug: "other-legal-help",
    defaultFeeModel: "custom",
    active: true,
    urgency: "Fast triage to the right attorney",
    accent: "graphite"
  }
];

export const demoClient: ClientUser = {
  id: "client_demo",
  role: "client",
  name: "Avery Johnson",
  email: "avery.client@example.com",
  phone: "+1 555 0134",
  preferredLanguage: "English",
  locationPermission: true,
  stripeCustomerId: "cus_demo_client",
  defaultPaymentMethodId: "pm_demo_visa",
  emergencyContact: "+1 555 0199"
};

export const demoAdmin: AdminUser = {
  id: "admin_demo",
  role: "admin",
  name: "Maya Admin",
  email: "admin@lawyerondemand.test",
  phone: "+1 555 0110"
};

export const attorneys: Attorney[] = [
  {
    id: "atty_sarah",
    userId: "user_sarah",
    name: "Sarah Mitchell",
    email: "sarah@mitchelldefence.example",
    phone: "+1 555 0201",
    firmName: "Mitchell Defence Group",
    barLicenseNumber: "CA-482901",
    licenseStatus: "approved",
    profilePhotoUrl: "",
    shortBio: "DUI defence attorney focused on fast roadside guidance and license protection.",
    fullBio:
      "Sarah Mitchell has 14 years of criminal defence experience, with a dedicated focus on DUI, DWI, implied consent, field sobriety, and license suspension matters. Her practice is built around urgent response, clear client communication, and careful transition from preliminary guidance into formal representation only after engagement terms are accepted.",
    yearsExperience: 14,
    languages: ["English", "Spanish"],
    jurisdictions: ["California", "Nevada"],
    officeAddress: "525 W 8th St, Los Angeles, CA",
    serviceZipCodes: ["90012", "90015", "90017", "90210"],
    availabilityStatus: "online",
    rating: 4.9,
    subscriptionStatus: "active",
    premiumListingLevel: "featured",
    integrationPreference: "clio",
    practiceAreas: [
      {
        legalCategoryId: "cat_dui",
        feeModel: "retainer",
        retainerRequired: true,
        retainerAmount: 2500,
        contingencyPercentage: null,
        preliminaryGuidanceMinutes: 5
      },
      {
        legalCategoryId: "cat_stop",
        feeModel: "retainer",
        retainerRequired: true,
        retainerAmount: 1500,
        contingencyPercentage: null,
        preliminaryGuidanceMinutes: 4
      }
    ]
  },
  {
    id: "atty_james",
    userId: "user_james",
    name: "James Carter",
    email: "james@cartertraffic.example",
    phone: "+1 555 0202",
    firmName: "Carter Traffic Law",
    barLicenseNumber: "NY-711204",
    licenseStatus: "approved",
    profilePhotoUrl: "",
    shortBio: "Traffic court lawyer handling citations, license points, and urgent stop questions.",
    fullBio:
      "James Carter represents drivers in traffic infraction, reckless driving, and suspended-license matters. He is known for practical first-step guidance, efficient document review, and a clear retainer process when formal representation is appropriate.",
    yearsExperience: 11,
    languages: ["English"],
    jurisdictions: ["New York", "New Jersey"],
    officeAddress: "88 Court St, Brooklyn, NY",
    serviceZipCodes: ["10001", "10007", "11201", "11217"],
    availabilityStatus: "online",
    rating: 4.8,
    subscriptionStatus: "active",
    premiumListingLevel: "premium",
    integrationPreference: "mycase",
    practiceAreas: [
      {
        legalCategoryId: "cat_infraction",
        feeModel: "retainer",
        retainerRequired: true,
        retainerAmount: 750,
        contingencyPercentage: null,
        preliminaryGuidanceMinutes: 6
      },
      {
        legalCategoryId: "cat_stop",
        feeModel: "retainer",
        retainerRequired: true,
        retainerAmount: 950,
        contingencyPercentage: null,
        preliminaryGuidanceMinutes: 5
      }
    ]
  },
  {
    id: "atty_elena",
    userId: "user_elena",
    name: "Elena Rodriguez",
    email: "elena@rodriguezinjury.example",
    phone: "+1 555 0203",
    firmName: "Rodriguez Injury Law",
    barLicenseNumber: "TX-309477",
    licenseStatus: "approved",
    profilePhotoUrl: "",
    shortBio: "Auto accident attorney focused on evidence preservation and medical-care next steps.",
    fullBio:
      "Elena Rodriguez helps injury victims after vehicle crashes, rideshare collisions, and uninsured motorist incidents. Her practice typically uses contingency fee agreements, so clients can begin the engagement process without an upfront retainer after the attorney accepts the matter.",
    yearsExperience: 16,
    languages: ["English", "Spanish"],
    jurisdictions: ["Texas"],
    officeAddress: "1900 Main St, Dallas, TX",
    serviceZipCodes: ["75201", "75204", "75219", "75001"],
    availabilityStatus: "online",
    rating: 5,
    subscriptionStatus: "active",
    premiumListingLevel: "priority_queue",
    integrationPreference: "lawmatics",
    practiceAreas: [
      {
        legalCategoryId: "cat_auto",
        feeModel: "contingency",
        retainerRequired: false,
        retainerAmount: null,
        contingencyPercentage: 33,
        preliminaryGuidanceMinutes: 7
      },
      {
        legalCategoryId: "cat_injury",
        feeModel: "contingency",
        retainerRequired: false,
        retainerAmount: null,
        contingencyPercentage: 33,
        preliminaryGuidanceMinutes: 7
      }
    ]
  },
  {
    id: "atty_michael",
    userId: "user_michael",
    name: "Michael Grant",
    email: "michael@grantdefence.example",
    phone: "+1 555 0204",
    firmName: "Grant Criminal Defence",
    barLicenseNumber: "FL-884217",
    licenseStatus: "approved",
    profilePhotoUrl: "",
    shortBio: "Criminal defence attorney for arrest, questioning, bail, and first-appearance issues.",
    fullBio:
      "Michael Grant represents clients in felony, misdemeanor, and pre-charge investigations. His preliminary guidance calls are designed to protect immediate rights and determine whether a formal retainer should be offered by the firm.",
    yearsExperience: 19,
    languages: ["English"],
    jurisdictions: ["Florida", "Georgia"],
    officeAddress: "200 S Biscayne Blvd, Miami, FL",
    serviceZipCodes: ["33131", "33132", "33139", "30303"],
    availabilityStatus: "online",
    rating: 4.9,
    subscriptionStatus: "active",
    premiumListingLevel: "featured",
    integrationPreference: "filevine",
    practiceAreas: [
      {
        legalCategoryId: "cat_criminal",
        feeModel: "retainer",
        retainerRequired: true,
        retainerAmount: 5000,
        contingencyPercentage: null,
        preliminaryGuidanceMinutes: 5
      }
    ]
  },
  {
    id: "atty_priya",
    userId: "user_priya",
    name: "Priya Shah",
    email: "priya@shahinjury.example",
    phone: "+1 555 0205",
    firmName: "Shah Personal Injury",
    barLicenseNumber: "IL-650118",
    licenseStatus: "approved",
    profilePhotoUrl: "",
    shortBio: "Personal injury attorney for urgent claim intake, photos, treatment, and next steps.",
    fullBio:
      "Priya Shah handles personal injury, premises liability, and serious accident cases. Her firm commonly works on contingency, which means no upfront retainer is required when the attorney accepts the signed engagement.",
    yearsExperience: 12,
    languages: ["English", "Hindi", "Gujarati"],
    jurisdictions: ["Illinois", "Indiana"],
    officeAddress: "1 N LaSalle St, Chicago, IL",
    serviceZipCodes: ["60601", "60602", "60603", "60611"],
    availabilityStatus: "online",
    rating: 4.9,
    subscriptionStatus: "active",
    premiumListingLevel: "premium",
    integrationPreference: "zapier",
    practiceAreas: [
      {
        legalCategoryId: "cat_injury",
        feeModel: "contingency",
        retainerRequired: false,
        retainerAmount: null,
        contingencyPercentage: 33,
        preliminaryGuidanceMinutes: 8
      },
      {
        legalCategoryId: "cat_auto",
        feeModel: "contingency",
        retainerRequired: false,
        retainerAmount: null,
        contingencyPercentage: 33,
        preliminaryGuidanceMinutes: 8
      }
    ]
  }
];

export const adminStats = {
  totalUsers: 1324,
  totalAttorneys: 86,
  onlineAttorneys: attorneys.filter((attorney) => attorney.availabilityStatus === "online").length,
  totalCalls: 4219,
  totalSignedAgreements: 740,
  totalRetainedCases: 518,
  totalRetainerPayments: 336,
  pendingAttorneyApprovals: 12,
  pendingAcceptanceCases: 18
};

export function getCategoryBySlug(slug: string) {
  return legalCategories.find((category) => category.slug === slug);
}

export function getCategoryById(id: string) {
  return legalCategories.find((category) => category.id === id);
}

export function getAttorneyById(id: string) {
  return attorneys.find((attorney) => attorney.id === id);
}

export function getAvailableAttorneys(categoryId: string) {
  return attorneys
    .filter((attorney) => {
      const matchesPractice = attorney.practiceAreas.some((area) => area.legalCategoryId === categoryId);
      return attorney.licenseStatus === "approved" && attorney.availabilityStatus === "online" && matchesPractice;
    })
    .sort((a, b) => {
      const rank = { priority_queue: 4, featured: 3, premium: 2, basic: 1 };
      return rank[b.premiumListingLevel] - rank[a.premiumListingLevel] || b.rating - a.rating;
    });
}
