import { Gender } from "@prisma/client";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    name: string;
    role: string;
    adminLevel: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    dateOfBirth: string | null;
    gender: Gender | null;
    residentialAddress: string | null;
  };
}
