import os

OLD_URL = "https://localhost:43010"
NEW_URL = "https://diagmindtw.com/48001.php"

EXCLUDED_DIR = "node_modules"
TEXT_EXTENSIONS = {".txt", ".md", ".html", ".htm", ".js", ".css", ".json", ".xml", ".yml", ".yaml", ".sh", ".php", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".tsx", ".ts", ".jsx",".jade",".pug"}

def replace_in_file(file_path):
    if not any(file_path.endswith(ext) for ext in TEXT_EXTENSIONS):
        return  # Skip non-text files
    
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        
        if OLD_URL in content:
            content = content.replace(OLD_URL, NEW_URL)
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(content)
            print(f"Updated: {file_path}")
    except Exception as e:
        print(f"Skipping {file_path}: {e}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if EXCLUDED_DIR in dirs:
            dirs.remove(EXCLUDED_DIR)  # Skip node_modules
        
        for file in files:
            file_path = os.path.join(root, file)
            replace_in_file(file_path)

if __name__ == "__main__":
    process_directory(os.getcwd())

