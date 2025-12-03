# Security Policy

## Supported Versions

I release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

I take the security of BrowserPort seriously. If you believe you have found a security vulnerability, please report it responsibly.

### Please do NOT:

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### How to Report:

**Option 1: GitHub Security Advisories (Recommended)**

- Go to the [Security tab](https://github.com/jcyrus/BrowserPort/security/advisories) of this repository
- Click "Report a vulnerability"
- Fill out the private advisory form
- This keeps the report private and allows us to collaborate on a fix

**Option 2: Direct Message on GitHub**

- Send a private message to [@jcyrus](https://github.com/jcyrus) on GitHub
- Include "SECURITY" in the subject line

**Option 3: Email**

- If you have my email address from commits or other sources, you can email me directly
- Include "BrowserPort Security" in the subject line

### What to Include:

Please provide as much information as possible:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect:

- **Acknowledgment**: I will acknowledge receipt of your vulnerability report within 48-72 hours
- **Updates**: I will keep you informed about my progress
- **Timeline**: I aim to address critical vulnerabilities within 7-14 days (this is a solo project, so timelines may vary)
- **Credit**: If you wish, I will publicly credit you for the discovery once the vulnerability is fixed

## Security Considerations

BrowserPort is a desktop application that:

- **Intercepts HTTP/HTTPS protocol links** - The app registers as a protocol handler for `http://` and `https://` URLs
- **Executes browser processes** - The app launches external browser applications with user-provided URLs
- **Runs with user privileges** - No elevated permissions are required or requested

### Built-in Security Features

- **Context Isolation**: Renderer process runs with `contextIsolation: true`
- **Sandbox**: Renderer process runs in a sandboxed environment
- **No Node Integration**: Renderer has `nodeIntegration: false`
- **Secure IPC**: All communication between main and renderer uses contextBridge
- **Input Validation**: URLs are validated before being passed to browsers

### Known Limitations

- The app trusts the operating system's browser installations
- URLs are passed directly to browsers without content filtering
- No built-in malware or phishing protection (relies on the chosen browser)

## Security Best Practices for Users

1. **Download only from official sources**: GitHub Releases
2. **Verify signatures**: Check that the application is properly signed (macOS)
3. **Keep updated**: Install security updates promptly
4. **Review permissions**: The app should only request protocol handler registration

## Disclosure Policy

When I receive a security report, I will:

1. Confirm the vulnerability and determine its impact
2. Develop and test a fix
3. Prepare a security advisory
4. Release a patched version
5. Publish the security advisory with credit to the reporter (if desired)

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.

---

**Last Updated**: 2025-12-03
