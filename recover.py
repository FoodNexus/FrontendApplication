import os
import json
import urllib.parse
import shutil
from pathlib import Path

history_dir = Path("/home/amine/.config/Code/User/History")
app_prefix = "file:///home/amine/FrontendApplication/"

for entry_dir in history_dir.iterdir():
    if not entry_dir.is_dir(): continue
    entries_file = entry_dir / "entries.json"
    if not entries_file.exists(): continue
    
    try:
        data = json.loads(entries_file.read_text())
        resource = data.get("resource", "")
        if resource.startswith(app_prefix):
            file_path = urllib.parse.unquote(resource.replace("file://", ""))
            
            # We want to restore files that were deleted in either module
            if ("gestion-receveur" in file_path or "gestion-donneur-matching" in file_path) and not os.path.exists(file_path):
                entries = data.get("entries", [])
                if entries:
                    latest = entries[-1]["id"]
                    source_file = entry_dir / latest
                    
                    # Create target directory if it doesn't exist
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    shutil.copy2(source_file, file_path)
                    print(f"Restored: {file_path}")
    except Exception as e:
        pass
