import os
import json
import hashlib

# Configuration
DATA_DIR = '.'
OUTPUT_FILE = 'versions.json'
MANAGED_PATHS = [
    'items/',
    'hideout/',
    'quests/',
    'images/',
    'projects.json',
    'trades.json',
    'maps.json'
]

def git_blob_sha(file_path):
    """Calculates the Git blob SHA1 of a file."""
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Git blob header: "blob <size>\0"
    header = f"blob {len(content)}\0".encode('utf-8')
    store = header + content
    
    sha1 = hashlib.sha1()
    sha1.update(store)
    return sha1.hexdigest()

def generate_manifest():
    manifest = {}
    
    print(f"Scanning {DATA_DIR} for managed paths...")
    
    for relative_start in MANAGED_PATHS:
        # Determine if it's a file or directory in the DATA_DIR
        local_path = os.path.join(DATA_DIR, relative_start)
        
        # Remove trailing slash for path processing
        clean_relative = relative_start.rstrip('/')
        
        if os.path.isfile(local_path):
            # It's a specific file
            print(f"Processing file: {relative_start}")
            sha = git_blob_sha(local_path)
            manifest[clean_relative] = sha
            
        elif os.path.isdir(local_path):
            # It's a directory, walk it
            print(f"Processing directory: {relative_start}")
            for root, dirs, files in os.walk(local_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # Compute path relative to DATA_DIR (to match repo structure)
                    # e.g., data/items/foo.json -> items/foo.json
                    rel_path = os.path.relpath(file_path, DATA_DIR).replace('\\', '/')
                    
                    sha = git_blob_sha(file_path)
                    manifest[rel_path] = sha
        else:
            print(f"Warning: Path not found locally: {local_path}")

    # Sort manifest by key for consistent output
    sorted_manifest = dict(sorted(manifest.items()))
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(sorted_manifest, f, indent=2)
        
    print(f"\nSuccess! Generated {OUTPUT_FILE} with {len(manifest)} entries.")
    print("Please commit and push this file to the root of your repository.")

if __name__ == "__main__":
    generate_manifest()
