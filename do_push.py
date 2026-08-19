#!/usr/bin/env python3
import subprocess
import os

os.chdir('/workspaces/x402-Pay')

# Stage all changes
subprocess.run(['git', 'add', '-A'], check=True)

# Commit
commit_msg = """refactor: clean up repository - remove unnecessary markdown files and create professional README

Changes:
- Delete hackathon and status report markdown files from root
- Consolidate documentation into professional README
- Mark x402 integration as completed
- Update feature status matrix
- Restructure for enterprise-grade presentation"""

subprocess.run(['git', 'commit', '-m', commit_msg], check=True)

# Push
subprocess.run(['git', 'push', 'origin', 'main'], check=True)

print("✅ Successfully pushed to main branch!")
