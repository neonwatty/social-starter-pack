import { getAuthHeader } from "./auth";

const TWEETS_URL = "https://api.x.com/2/tweets";

export interface TweetOptions {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
  quoteTweetId?: string;
}

export interface TweetResponse {
  data: {
    id: string;
    text: string;
  };
}

export interface DeleteResponse {
  data: {
    deleted: boolean;
  };
}

export async function createTweet(
  options: TweetOptions,
): Promise<TweetResponse> {
  const authHeader = await getAuthHeader();

  const body: Record<string, unknown> = {
    text: options.text,
  };

  if (options.mediaIds && options.mediaIds.length > 0) {
    body.media = {
      media_ids: options.mediaIds,
    };
  }

  if (options.replyToTweetId) {
    body.reply = {
      in_reply_to_tweet_id: options.replyToTweetId,
    };
  }

  if (options.quoteTweetId) {
    body.quote_tweet_id = options.quoteTweetId;
  }

  const response = await fetch(TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create tweet: ${error}`);
  }

  return response.json() as Promise<TweetResponse>;
}

export async function deleteTweet(tweetId: string): Promise<DeleteResponse> {
  const authHeader = await getAuthHeader();
  const url = `${TWEETS_URL}/${tweetId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete tweet: ${error}`);
  }

  return response.json() as Promise<DeleteResponse>;
}

export async function replyToTweet(
  tweetId: string,
  text: string,
  mediaIds?: string[],
): Promise<TweetResponse> {
  return createTweet({
    text,
    replyToTweetId: tweetId,
    mediaIds,
  });
}

export async function quoteTweet(
  tweetId: string,
  text: string,
  mediaIds?: string[],
): Promise<TweetResponse> {
  return createTweet({
    text,
    quoteTweetId: tweetId,
    mediaIds,
  });
}

export async function createThread(tweets: string[]): Promise<TweetResponse[]> {
  const responses: TweetResponse[] = [];
  let lastTweetId: string | undefined;

  for (const text of tweets) {
    const response = await createTweet({
      text,
      replyToTweetId: lastTweetId,
    });
    responses.push(response);
    lastTweetId = response.data.id;
  }

  return responses;
}
