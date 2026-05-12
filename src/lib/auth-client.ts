import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

export async function signInWithGoogle(callbackURL = "/dashboard") {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
}

export async function signOut() {
  return authClient.signOut();
}
