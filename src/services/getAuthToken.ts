import { getAuth } from "firebase/auth";

async function getAuthToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return user.getIdToken();
}

export default getAuthToken;