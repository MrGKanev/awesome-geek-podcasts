import re
import requests
from tqdm import tqdm

def get_urls_from_readme(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        urls = re.findall(r'(https?://\S+)', content)
        return urls

def clean_urls(urls):
    cleaned_urls = []
    for url in urls:
        # Remove any trailing non-url characters like parentheses, brackets, etc.
        cleaned_url = re.sub(r'[^\w\s:/.-]', '', url.split()[0])
        cleaned_urls.append(cleaned_url)
    return cleaned_urls

def check_urls(urls):
    invalid_urls = []
    with tqdm(total=len(urls), desc="Checking URLs", unit="URL", position=0, leave=True) as pbar:
        with open('url_check_logs.txt', 'a') as log_file:
            for url in urls:
                try:
                    response = requests.get(url)
                    if response.status_code != 200:
                        invalid_urls.append(url)
                        log_file.write(f"URL: {url} | Status Code: {response.status_code}\n")
                except requests.exceptions.RequestException as e:
                    log_file.write(f"Error occurred while checking URL {url}: {e}\n")
                    invalid_urls.append(url)
                pbar.update(1)
    return invalid_urls

def main():
    file_path = 'readme.md'  # Replace this with the path to your readme file
    urls = get_urls_from_readme(file_path)
    cleaned_urls = clean_urls(urls)
    invalid_urls = check_urls(cleaned_urls)

    if invalid_urls:
        print("The following URLs did not return a 200 status code. Check 'url_check_logs.txt' for details:")
        for url in invalid_urls:
            print(url)
    else:
        print("All URLs in the readme.md file returned a 200 status code.")

if __name__ == "__main__":
    main()
