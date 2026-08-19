#!/bin/bash
cd /workspaces/x402-Pay
git add -A
git commit -m "refactor: clean up repository - remove unnecessary markdown files and create professional README

Changes:
- Delete hackathon and status report markdown files from root
- Consolidate documentation into professional README
- Mark x402 integration as completed
- Update feature status matrix
- Restructure for enterprise-grade presentation"
git push origin main
echo "Push complete!"
