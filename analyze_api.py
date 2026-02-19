import json
import os

try:
    file_path = r'e:\PycharmProjects\miniCRM\security-openapi.yaml'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # The file content looked like JSON in the view_file output, 
        # so we try JSON first and exclusively to avoid dependency issues.
        data = json.loads(content)
        print("Successfully parsed as JSON.")

    output_file = 'api_analysis.txt'
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("API Paths found:\n")
        paths = data.get('paths', {}).keys()
        count = 0
        for path in sorted(paths):
            outfile.write(path + "\n")
            count += 1
            
    print(f"Analysis complete. {count} paths written to {output_file}")

except json.JSONDecodeError as e:
    print(f"Failed to parse as JSON: {e}")
    print("Top of file content for debugging:")
    print(content[:500])
except Exception as e:
    print(f"An error occurred: {e}")
