import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Site, SitesResponse } from "./types";

function getWebmastersClient(auth: OAuth2Client) {
  return google.webmasters({ version: "v3", auth });
}

export async function listSites(auth: OAuth2Client): Promise<Site[]> {
  const webmasters = getWebmastersClient(auth);

  const response = await webmasters.sites.list();
  const data = response.data as SitesResponse;

  return data.siteEntry || [];
}

export async function getSite(auth: OAuth2Client, siteUrl: string): Promise<Site | null> {
  const webmasters = getWebmastersClient(auth);

  try {
    const response = await webmasters.sites.get({ siteUrl });
    return response.data as Site;
  } catch {
    return null;
  }
}
