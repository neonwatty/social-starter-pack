import * as crypto from "crypto";

export interface OAuth1Credentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

interface OAuthParams {
  oauth_consumer_key: string;
  oauth_token: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_nonce: string;
  oauth_version: string;
  oauth_signature?: string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function createSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>,
): string {
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");

  return [
    method.toUpperCase(),
    percentEncode(url.split("?")[0]),
    percentEncode(paramString),
  ].join("&");
}

function createSignature(
  baseString: string,
  apiSecret: string,
  tokenSecret: string,
): string {
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(tokenSecret)}`;
  const hmac = crypto.createHmac("sha1", signingKey);
  hmac.update(baseString);
  return hmac.digest("base64");
}

export function createOAuth1Header(
  method: string,
  url: string,
  credentials: OAuth1Credentials,
  additionalParams: Record<string, string> = {},
): string {
  const oauthParams: OAuthParams = {
    oauth_consumer_key: credentials.apiKey,
    oauth_token: credentials.accessToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: generateTimestamp(),
    oauth_nonce: generateNonce(),
    oauth_version: "1.0",
  };

  // Parse URL query params
  const urlObj = new URL(url);
  const urlParams: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    urlParams[key] = value;
  });

  // Combine all params for signature
  const allParams: Record<string, string> = {
    ...urlParams,
    ...additionalParams,
    ...oauthParams,
  };

  // Create signature
  const baseString = createSignatureBaseString(method, url, allParams);
  const signature = createSignature(
    baseString,
    credentials.apiSecret,
    credentials.accessTokenSecret,
  );

  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const headerParams = Object.entries(oauthParams)
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ");

  return `OAuth ${headerParams}`;
}

export async function oauth1Fetch(
  url: string,
  options: RequestInit,
  credentials: OAuth1Credentials,
  bodyParams?: Record<string, string>,
): Promise<Response> {
  const method = options.method || "GET";

  const authHeader = createOAuth1Header(
    method,
    url,
    credentials,
    bodyParams || {},
  );

  const headers = new Headers(options.headers);
  headers.set("Authorization", authHeader);

  return fetch(url, {
    ...options,
    headers,
  });
}
