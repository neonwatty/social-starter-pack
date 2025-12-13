#!/usr/bin/env python3
"""
Reddit Market Research Tool

Usage:
    python reddit_monitor.py search --keywords "AI,startup" --subreddits "SaaS+startups"
    python reddit_monitor.py search --keywords-file keywords.txt --subreddits "startups"
    python reddit_monitor.py search --keywords "help,tool" -s "programming" --json
    python reddit_monitor.py search --keywords "bug,issue" --output results.csv
    python reddit_monitor.py monitor --keywords "help" --subreddits "webdev"
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime
from typing import TYPE_CHECKING

import praw

if TYPE_CHECKING:
    from praw.reddit import Reddit

_reddit: Reddit | None = None


def get_reddit() -> Reddit:
    """Get or create Reddit client (lazy initialization)."""
    global _reddit
    if _reddit is None:
        _reddit = praw.Reddit("market_research")
    return _reddit


MAX_BODY_LENGTH = 200


def truncate_text(text: str, max_length: int = MAX_BODY_LENGTH) -> str:
    """Truncate text to max_length, adding ellipsis if truncated."""
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


def load_keywords_from_file(filepath: str) -> list[str]:
    """Load keywords from a file, one per line."""
    with open(filepath, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def check_relevance(text: str, keywords: list[str]) -> bool:
    """Check if text contains any of the keywords."""
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)


def normalize_subreddits(subreddits: str) -> str:
    """Convert comma-separated subreddits to plus-separated format.

    Reddit API expects subreddits joined with '+', not ','.
    This auto-converts common user mistakes.
    """
    return subreddits.replace(",", "+")


def search_reddit(
    subreddits: str,
    keywords: list[str],
    time_filter: str = "month",
    limit: int = 25,
    sort: str = "new",
) -> list[dict[str, str | int]]:
    """
    Search Reddit for posts matching keywords.

    Returns list of dicts with: title, body, subreddit, score, comments, url, created, author
    """
    subreddit = get_reddit().subreddit(subreddits)
    results: list[dict[str, str | int]] = []

    for keyword in keywords:
        try:
            for post in subreddit.search(keyword, sort=sort, time_filter=time_filter, limit=limit):
                results.append(
                    {
                        "title": post.title,
                        "body": truncate_text(post.selftext),
                        "subreddit": str(post.subreddit),
                        "score": post.score,
                        "comments": post.num_comments,
                        "url": f"https://reddit.com{post.permalink}",
                        "created": datetime.fromtimestamp(post.created_utc).isoformat(),
                        "author": str(post.author) if post.author else "[deleted]",
                    }
                )
        except Exception as e:
            error_msg = str(e)
            print(f"Error searching for '{keyword}': {e}", file=sys.stderr)
            if "404" in error_msg:
                print(
                    "  Hint: Ensure subreddits are plus-separated (e.g., 'startups+SaaS'), not comma-separated",
                    file=sys.stderr,
                )

    # Deduplicate by URL
    seen: set[str] = set()
    unique_results: list[dict[str, str | int]] = []
    for r in results:
        url = str(r["url"])
        if url not in seen:
            seen.add(url)
            unique_results.append(r)

    # Sort by engagement (score + comments)
    unique_results.sort(key=lambda x: int(x["score"]) + int(x["comments"]), reverse=True)

    return unique_results


def monitor_reddit(subreddits: str, keywords: list[str]) -> None:
    """Stream new posts and alert on matches (runs continuously)."""
    print(f"Monitoring r/{subreddits} for: {', '.join(keywords)}")
    print("-" * 60)

    subreddit = get_reddit().subreddit(subreddits)

    for submission in subreddit.stream.submissions(skip_existing=True):
        title = submission.title
        selftext = submission.selftext if submission.selftext else ""

        if check_relevance(title, keywords) or check_relevance(selftext, keywords):
            result = {
                "title": title,
                "body": truncate_text(selftext),
                "subreddit": str(submission.subreddit),
                "score": submission.score,
                "comments": submission.num_comments,
                "url": f"https://reddit.com{submission.permalink}",
                "created": datetime.now().isoformat(),
                "author": str(submission.author) if submission.author else "[deleted]",
            }
            print(json.dumps(result))
            sys.stdout.flush()


def get_subreddit_flairs(subreddit_name: str) -> list[dict[str, str | bool]]:
    """
    Get available post flairs for a subreddit.

    Args:
        subreddit_name: Name of the subreddit (without r/)

    Returns:
        List of dicts with: id, text, editable

    Raises:
        Exception: For Reddit API errors (403 if flairs not accessible)
    """
    reddit = get_reddit()
    subreddit = reddit.subreddit(subreddit_name)

    try:
        flairs = []
        for flair in subreddit.flair.link_templates:
            flairs.append(
                {
                    "id": flair["id"],
                    "text": flair["text"],
                    "editable": flair.get("text_editable", False),
                }
            )
        return flairs
    except Exception as e:
        error_msg = str(e).lower()
        if "403" in error_msg or "forbidden" in error_msg:
            raise Exception(
                f"Cannot access flairs for r/{subreddit_name}. "
                "Subreddit may not allow flair listing or require moderator access."
            ) from e
        elif "404" in error_msg or "not found" in error_msg:
            raise Exception(f"Subreddit r/{subreddit_name} not found.") from e
        else:
            raise


def post_to_reddit(
    subreddit_name: str,
    title: str,
    url: str | None = None,
    body: str | None = None,
    flair_id: str | None = None,
    flair_text: str | None = None,
) -> dict[str, str]:
    """
    Post a submission to Reddit.

    Args:
        subreddit_name: Name of the subreddit (without r/)
        title: Post title
        url: URL for link posts (can be combined with body)
        body: Text body (for text posts, or optional body for link posts)
        flair_id: Flair template ID (from get_subreddit_flairs)
        flair_text: Custom flair text (if flair is editable)

    Returns:
        Dict with: id, title, url, permalink, flair

    Raises:
        ValueError: If neither url nor body is provided
        Exception: For Reddit API errors
    """
    if not url and not body:
        raise ValueError("Must specify either url (for link post) or body (for text post).")

    reddit = get_reddit()
    subreddit = reddit.subreddit(subreddit_name)

    try:
        if url:
            # Link post (optionally with body text - requires PRAW 7.8.2+)
            submission = subreddit.submit(
                title=title,
                url=url,
                selftext=body or "",
                flair_id=flair_id,
                flair_text=flair_text,
            )
        else:
            # Text/self post
            submission = subreddit.submit(
                title=title,
                selftext=body,
                flair_id=flair_id,
                flair_text=flair_text,
            )

        return {
            "id": submission.id,
            "title": submission.title,
            "url": f"https://reddit.com{submission.permalink}",
            "permalink": submission.permalink,
            "flair": submission.link_flair_text or "",
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "403" in error_msg or "forbidden" in error_msg:
            raise Exception(
                f"Not allowed to post to r/{subreddit_name}. "
                "Check subreddit rules or account permissions."
            ) from e
        elif "404" in error_msg or "not found" in error_msg:
            raise Exception(f"Subreddit r/{subreddit_name} not found.") from e
        elif "ratelimit" in error_msg or "rate limit" in error_msg:
            raise Exception("Reddit rate limit exceeded. Please wait before posting again.") from e
        else:
            raise


def output_results(
    results: list[dict[str, str | int]],
    output_format: str = "text",
    output_file: str | None = None,
    limit: int | None = None,
) -> None:
    """Output results in specified format."""
    if limit:
        results = results[:limit]

    if output_format == "json":
        output = json.dumps(results, indent=2)
        if output_file:
            with open(output_file, "w") as f:
                f.write(output)
            print(f"Saved {len(results)} results to {output_file}", file=sys.stderr)
        else:
            print(output)

    elif output_format == "csv" or (output_file and output_file.endswith(".csv")):
        fieldnames = ["title", "body", "subreddit", "score", "comments", "url", "created", "author"]
        if output_file:
            with open(output_file, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(results)
            print(f"Saved {len(results)} results to {output_file}", file=sys.stderr)
        else:
            writer = csv.DictWriter(sys.stdout, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)

    else:  # text format
        print(f"Found {len(results)} relevant posts:\n")
        for r in results:
            print(f"[{r['score']} upvotes, {r['comments']} comments] r/{r['subreddit']}")
            print(f"  Title: {r['title']}")
            if r.get("body"):
                print(f"  Body: {r['body']}")
            print(f"  URL: {r['url']}")
            print(f"  Author: u/{r['author']}")
            print()


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Reddit Market Research Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python reddit_monitor.py search -s "startups+SaaS" -k "AI tool,help,recommendation"
  python reddit_monitor.py search -s "webdev" --keywords-file keywords.txt --json
  python reddit_monitor.py search -s "programming" -k "bug,issue" --time week --limit 50
  python reddit_monitor.py search -s "fitness" -k "app,tracking" --output results.csv
  python reddit_monitor.py monitor -s "startups" -k "looking for,need help"
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search historical posts")
    search_parser.add_argument(
        "--subreddits",
        "-s",
        required=True,
        help="Subreddits to search (use + to separate, NOT commas). Example: 'startups+SaaS+indiehackers'",
    )
    search_parser.add_argument(
        "--keywords",
        "-k",
        help="Keywords to search (comma-separated). Example: 'AI tool,automation,help'",
    )
    search_parser.add_argument(
        "--keywords-file",
        help="Load keywords from file (one per line)",
    )
    search_parser.add_argument(
        "--time",
        "-t",
        choices=["hour", "day", "week", "month", "year", "all"],
        default="month",
        help="Time filter for search. Default: month",
    )
    search_parser.add_argument(
        "--sort",
        choices=["relevance", "hot", "top", "new", "comments"],
        default="new",
        help="Sort order. Default: new",
    )
    search_parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=20,
        help="Max results to display. Default: 20",
    )
    search_parser.add_argument(
        "--json",
        "-j",
        action="store_true",
        help="Output as JSON",
    )
    search_parser.add_argument(
        "--output",
        "-o",
        help="Save results to file (CSV or JSON based on extension)",
    )

    # Monitor command
    monitor_parser = subparsers.add_parser("monitor", help="Monitor new posts in real-time")
    monitor_parser.add_argument(
        "--subreddits",
        "-s",
        required=True,
        help="Subreddits to monitor (use + to separate, NOT commas). Example: 'startups+SaaS'",
    )
    monitor_parser.add_argument(
        "--keywords",
        "-k",
        help="Keywords to match (comma-separated). Example: 'help,looking for,recommendation'",
    )
    monitor_parser.add_argument(
        "--keywords-file",
        help="Load keywords from file (one per line)",
    )

    # Post command
    post_parser = subparsers.add_parser("post", help="Post a submission to Reddit")
    post_parser.add_argument(
        "--subreddit",
        "-s",
        required=True,
        help="Subreddit to post to (without r/ prefix). Example: 'coolgithubprojects'",
    )
    post_parser.add_argument(
        "--title",
        "-t",
        required=True,
        help="Post title",
    )
    post_parser.add_argument(
        "--url",
        "-u",
        help="URL for link posts (can be combined with --body)",
    )
    post_parser.add_argument(
        "--body",
        "-b",
        help="Text body (for text posts, or optional body for link posts)",
    )
    post_parser.add_argument(
        "--flair-id",
        help="Flair template ID (use 'flairs' command to list available flairs)",
    )
    post_parser.add_argument(
        "--flair-text",
        help="Custom flair text (only for editable flairs)",
    )
    post_parser.add_argument(
        "--json",
        "-j",
        action="store_true",
        help="Output result as JSON",
    )

    # Flairs command
    flairs_parser = subparsers.add_parser("flairs", help="List available flairs for a subreddit")
    flairs_parser.add_argument(
        "--subreddit",
        "-s",
        required=True,
        help="Subreddit to get flairs for (without r/ prefix)",
    )
    flairs_parser.add_argument(
        "--json",
        "-j",
        action="store_true",
        help="Output as JSON",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Handle post command (doesn't need keywords)
    if args.command == "post":
        try:
            result = post_to_reddit(
                subreddit_name=args.subreddit,
                title=args.title,
                url=args.url,
                body=args.body,
                flair_id=args.flair_id,
                flair_text=args.flair_text,
            )

            if args.json:
                print(json.dumps(result, indent=2))
            else:
                print("Post submitted successfully!")
                print(f"  Title: {result['title']}")
                print(f"  URL: {result['url']}")
                if result.get("flair"):
                    print(f"  Flair: {result['flair']}")

        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"Failed to post: {e}", file=sys.stderr)
            return 1

        return 0

    # Handle flairs command (doesn't need keywords)
    if args.command == "flairs":
        try:
            flairs = get_subreddit_flairs(args.subreddit)

            if args.json:
                print(json.dumps(flairs, indent=2))
            else:
                if not flairs:
                    print(f"No flairs available for r/{args.subreddit}")
                else:
                    print(f"Available flairs for r/{args.subreddit}:\n")
                    for flair in flairs:
                        editable = " (editable)" if flair["editable"] else ""
                        print(f"  [{flair['id']}] {flair['text']}{editable}")

        except Exception as e:
            print(f"Failed to get flairs: {e}", file=sys.stderr)
            return 1

        return 0

    # Parse keywords from --keywords or --keywords-file (for search/monitor)
    keywords: list[str] = []
    if hasattr(args, "keywords_file") and args.keywords_file:
        keywords = load_keywords_from_file(args.keywords_file)
    if hasattr(args, "keywords") and args.keywords:
        keywords.extend([k.strip() for k in args.keywords.split(",")])

    if not keywords:
        print("Error: Must provide --keywords or --keywords-file", file=sys.stderr)
        return 1

    # Normalize subreddits (convert commas to plus signs)
    subreddits = normalize_subreddits(args.subreddits)

    if args.command == "search":
        results = search_reddit(
            subreddits=subreddits,
            keywords=keywords,
            time_filter=args.time,
            limit=50,  # Fetch more, then limit display
            sort=args.sort,
        )

        output_format = "json" if args.json else "text"
        if args.output and args.output.endswith(".json"):
            output_format = "json"

        output_results(results, output_format, args.output, args.limit)

    elif args.command == "monitor":
        monitor_reddit(subreddits, keywords)

    return 0


if __name__ == "__main__":
    sys.exit(main())
