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
                print("  Hint: Ensure subreddits are plus-separated (e.g., 'startups+SaaS'), not comma-separated", file=sys.stderr)

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

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Parse keywords from --keywords or --keywords-file
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
