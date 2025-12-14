#!/bin/bash
# Quick secret setup for Claude Code web sessions
# Run: source scripts/setup-secrets.sh

echo "Paste your secrets (get from Doppler dashboard):"
echo ""

read -p "REDDIT_CLIENT_ID: " REDDIT_CLIENT_ID
read -p "REDDIT_CLIENT_SECRET: " REDDIT_CLIENT_SECRET
read -p "REDDIT_USERNAME: " REDDIT_USERNAME
read -sp "REDDIT_PASSWORD: " REDDIT_PASSWORD
echo ""

cat > .env << EOF
REDDIT_CLIENT_ID=$REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET=$REDDIT_CLIENT_SECRET
REDDIT_USERNAME=$REDDIT_USERNAME
REDDIT_PASSWORD=$REDDIT_PASSWORD
EOF

echo "Created .env with Reddit credentials"
