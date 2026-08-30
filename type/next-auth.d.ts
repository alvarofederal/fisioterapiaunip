import {DefaultSession} from "next-auth"

declare module "next-auth" {
    interface Session {
        user: User & DefaultSession["user"]
    }

    interface User {
        id: string
        name: string | null
        urlNameProfessional: string | null
        email: string | null
        emailVerified: null | string | boolean
        image: string | null
        stripeCustomerId: string | null
        times: string[]
        address: string[]
        phone: string | null
        status: boolean
        role: string | null
        typeProfile: string | null
        createdAt: string | null
        updatedAt: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string
    }
}
