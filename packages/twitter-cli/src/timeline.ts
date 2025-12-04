import { getAuthHeader } from "./auth";

const USERS_ME_URL = "https://api.x.com/2/users/me";
const USERS_TWEETS_URL = "https://api.x.com/2/users";

export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
}

export interface TimelineResponse {
  data: Tweet[];
  meta: {
    result_count: number;
    next_token?: string;
    previous_token?: string;
    oldest_id?: string;
    newest_id?: string;
  };
}

interface UserResponse {
  data: User;
}

export async function getCurrentUser(): Promise<User> {
  const authHeader = await getAuthHeader();

  const response = await fetch(USERS_ME_URL, {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get current user: ${error}`);
  }

  const data = (await response.json()) as UserResponse;
  return data.data;
}

export interface TimelineOptions {
  limit?: number;
  paginationToken?: string;
  sinceId?: string;
  untilId?: string;
  startTime?: string;
  endTime?: string;
  excludeReplies?: boolean;
  excludeRetweets?: boolean;
}

export async function getUserTimeline(
  userId: string,
  options: TimelineOptions = {},
): Promise<TimelineResponse> {
  const authHeader = await getAuthHeader();

  const params = new URLSearchParams({
    "tweet.fields": "created_at,public_metrics",
    max_results: Math.min(options.limit || 10, 100).toString(),
  });

  if (options.paginationToken) {
    params.append("pagination_token", options.paginationToken);
  }
  if (options.sinceId) {
    params.append("since_id", options.sinceId);
  }
  if (options.untilId) {
    params.append("until_id", options.untilId);
  }
  if (options.startTime) {
    params.append("start_time", options.startTime);
  }
  if (options.endTime) {
    params.append("end_time", options.endTime);
  }

  const excludes: string[] = [];
  if (options.excludeReplies) {
    excludes.push("replies");
  }
  if (options.excludeRetweets) {
    excludes.push("retweets");
  }
  if (excludes.length > 0) {
    params.append("exclude", excludes.join(","));
  }

  const url = `${USERS_TWEETS_URL}/${userId}/tweets?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get timeline: ${error}`);
  }

  return response.json() as Promise<TimelineResponse>;
}

export async function getMyTimeline(
  options: TimelineOptions = {},
): Promise<TimelineResponse> {
  const user = await getCurrentUser();
  return getUserTimeline(user.id, options);
}

export async function getTweet(tweetId: string): Promise<Tweet> {
  const authHeader = await getAuthHeader();

  const params = new URLSearchParams({
    "tweet.fields": "created_at,public_metrics",
  });

  const url = `https://api.x.com/2/tweets/${tweetId}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get tweet: ${error}`);
  }

  const data = (await response.json()) as { data: Tweet };
  return data.data;
}
