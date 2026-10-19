import { AuthVerifyFlow } from "../enums/auth-verify-flow.enum";

export type AuthOtpStarted = {
  request_type: AuthVerifyFlow;
  security: string;
  otp_code?: string;
};
