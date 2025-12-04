# autocomplete-cli

Query autocomplete suggestions from Google, YouTube, Bing, Amazon, and DuckDuckGo.

## Installation

```bash
npm install -g @neonwatty/autocomplete-cli
```

## Commands

```
autocomplete google <query>      Google suggestions
autocomplete youtube <query>     YouTube suggestions
autocomplete bing <query>        Bing suggestions
autocomplete amazon <query>      Amazon suggestions
autocomplete duckduckgo <query>  DuckDuckGo suggestions
```

## Options

All commands support these options:

```
-l, --lang <code>      Language code (en, de, es, fr, etc.)
-c, --country <code>   Country code (us, uk, de, in, etc.)
-d, --delay <ms>       Delay between API calls (default: 100)
-e, --expand           Expand with alphabet suffixes (a-z)
-q, --questions        Expand with question words (who, what, why, etc.)
-p, --prefix <list>    Custom prefixes (comma-separated)
-f, --format <type>    Output format: text, json, csv (default: text)
```

## Examples

Basic query:
```bash
autocomplete google "best coffee"
```

Expand with alphabet suffixes:
```bash
autocomplete youtube "how to" --expand
# Returns: "how to a...", "how to b...", etc.
```

Question expansion:
```bash
autocomplete google "python" --questions
# Returns: "why python", "what python", "how python", etc.
```

JSON output for scripting:
```bash
autocomplete amazon "laptop" --format json
```

Multiple sources with custom delay:
```bash
autocomplete bing "marketing tips" --delay 200 --format csv
```

Localized results:
```bash
autocomplete google "rezepte" --lang de --country de
```
