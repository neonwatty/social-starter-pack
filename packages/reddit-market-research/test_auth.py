import praw

reddit = praw.Reddit("market_research")  # Reads from praw.ini

# Verify authentication
print(f"Authenticated as: {reddit.user.me()}")

# Quick test - fetch top post from weddingplanning
subreddit = reddit.subreddit("weddingplanning")
top_post = next(iter(subreddit.hot(limit=1)))
print(f"Top post: {top_post.title}")
