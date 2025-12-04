import { getValidToken, loadTokens, saveTokens } from "./auth.js";

const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_VERSION = "202411";

export interface UserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export interface LinkedInProfile {
  urn: string;
  id: string;
  name: string;
  email?: string;
  picture?: string;
}

function getHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

export async function getUserInfo(): Promise<LinkedInProfile> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const response = await fetch(USERINFO_URL, {
    method: "GET",
    headers: getHeaders(accessToken),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Token expired. Please run: linkedin-cli auth");
    }
    throw new Error(`Failed to get user info: ${error}`);
  }

  const data = (await response.json()) as UserInfo;

  const profile: LinkedInProfile = {
    id: data.sub,
    urn: `urn:li:person:${data.sub}`,
    name: data.name,
    email: data.email,
    picture: data.picture,
  };

  // Cache the URN in tokens
  const tokens = loadTokens();
  if (tokens) {
    tokens.user_urn = profile.urn;
    saveTokens(tokens);
  }

  return profile;
}

export async function getUserUrn(): Promise<string> {
  // First check if we have cached URN
  const tokens = loadTokens();
  if (tokens?.user_urn) {
    return tokens.user_urn;
  }

  // Fetch and cache it
  const profile = await getUserInfo();
  return profile.urn;
}

export { getHeaders, LINKEDIN_VERSION };
