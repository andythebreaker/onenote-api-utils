import sys

def generate_php_code(port):
    php_code = f"""<?php

$target = "127.0.0.1:{port}";
$request_uri = $_SERVER['REQUEST_URI'];
$proxy_path = "/{port}.php";

// Remove the proxy script part from the request URI
$target_url = str_replace($proxy_path, '', $request_uri);
$final_url = "http://$target$target_url";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $final_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Forward request headers
$headers = [];
foreach (getallheaders() as $name => $value) {{
    $headers[] = "$name: $value";
}}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward request method and body
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
if ($method == 'POST' || $method == 'PUT' || $method == 'PATCH') {{
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}}

// Execute the request
$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);
curl_close($ch);

// Send response headers
foreach (explode("\\r\\n", $response_headers) as $header) {{
    if (!empty($header) && (stripos($header, 'Transfer-Encoding') === false || stripos($header, 'Set-Cookie') !== false)) {{
        header($header, false);
    }}
}}

// Send response body
http_response_code($http_code);
echo $response_body;
?>"""
    return php_code

def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith('--port='):
        print("Usage: python generate_php.py --port=<port>")
        sys.exit(1)

    port = sys.argv[1].split('=')[1]
    php_code = generate_php_code(port)
    file_name = f"{port}.php"

    with open(file_name, 'w') as file:
        file.write(php_code)

    print(f"PHP code generated and saved to {file_name}")

if __name__ == "__main__":
    main()