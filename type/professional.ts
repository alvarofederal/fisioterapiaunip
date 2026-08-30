export type ProfessionalBase = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    phone: string | null;
    specialty: string | null;
    registration: string | null;
    presentation: string | null;
    urlNameProfessional: string | null;
    typeProfile: string | null;
};

export type ProfessionalWithSchedule = ProfessionalBase & {
    addresses: string[];
    services: {
        id: string;
        name: string;
        duration: number;
        price: number;
    }[];
};

export type ProfessionalInfo = ProfessionalBase & {
    addresses: string[];
};

export type ProfessionalWaitlist = ProfessionalBase;