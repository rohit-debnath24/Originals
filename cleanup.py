#!/usr/bin/env python3
import os
import subprocess

# Files to remove
files_to_remove = [
    "docs/X402_COMPLETE_IMPLEMENTATION.md",
    "docs/X402_INTEGRATION.md",
    "docs/advanced-x402.txt",
    "docs/x402-Guide(Buyer).txt",
    "docs/x402-Guide(Seller).txt"
]

for file in files_to_remove:
    full_path = f"/workspaces/x402-Pay/{file}"
    if os.path.exists(full_path):
        os.remove(full_path)
        print(f"✓ Deleted: {file}")
    else:
        print(f"✗ Not found: {file}")

print("\nCleanup complete!")
