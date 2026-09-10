import { clearSessionCookie, revokeCurrentAppSession } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";

export async function POST() {
  try {
    await revokeCurrentAppSession();
    await clearSessionCookie();
    return ok({ loggedOut: true });
  } catch (error) {
    return fail(error);
  }
}
