import { Gender } from "@prisma/client";

export type UserDemographicsFields = {
  dateOfBirth: Date | null;
  gender: Gender | null;
  residentialAddress: string | null;
};

export function mapUserDemographics(user: UserDemographicsFields): {
  dateOfBirth: string | null;
  gender: Gender | null;
  residentialAddress: string | null;
} {
  return {
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    gender: user.gender ?? null,
    residentialAddress: user.residentialAddress ?? null,
  };
}

export function parseOptionalDateOfBirth(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value.trim() === "") {
    return null;
  }
  return new Date(value);
}

export function normalizeOptionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
