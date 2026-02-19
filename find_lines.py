import sys

def find_lines(filename, search_terms):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for term in search_terms:
            print(f"--- Searching for: {term} ---")
            for i, line in enumerate(lines):
                if term in line:
                    print(f"Line {i+1}: {line.strip()}")
                    # Print context
                    start = max(0, i)
                    end = min(len(lines), i + 20)
                    # only print first match detail
                    break 
            print("\n")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_lines(r'e:\PycharmProjects\miniCRM\security-openapi.yaml', [
        '/security/projects/{project}/users/{username}/sessions',
        '/security/projects/{project}/users'
    ])
