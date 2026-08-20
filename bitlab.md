<div align="center">

# 🦊 HTB: Bitlab

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Recon%20%2B%20Foothold%20Path-yellow?style=flat-square)
![Track](https://img.shields.io/badge/Track-VIP-purple?style=flat-square)

`hackthebox` `linux` `gitlab` `credential-leak` `js-deobfuscation`

</div>

---

> **TL;DR** — GitLab is exposed on port 80. Directory brute-forcing turns up a non-standard `/clave` route, and an obfuscated JS bookmarklet on the login page autofills valid-looking GitLab credentials. This writeup documents recon through credential discovery — the notes stop before proof capture, so treat the login as the next step to verify, not a confirmed foothold.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | February 21, 2026 |
| 🏁 **Status** | 🟡 Credentials recovered — login not yet verified in notes |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000
```

Only two ports answered — everything else (65,533 of them) came back `filtered`:

| Port | Service |
|:---:|---|
| `22` | OpenSSH 7.6p1 (Ubuntu 4ubuntu0.3) |
| `80` | nginx → GitLab sign-in |

### Directory enumeration

```bash
feroxbuster -u http://<TARGET_IP>/ -w raft-medium-directories.txt -b 502
```

Standard GitLab routes came back as expected (`/explore`, `/explore/groups`, `/explore/snippets`, `/users/sign_in`, `/search`, `/help`) — plus one that doesn't belong: `/clave`, with `/test` redirecting into it.

> 💡 `/clave` is Spanish for "key" or "password." A non-standard route with that name, sitting next to a GitLab install, is worth investigating before anything else.

### robots.txt

```bash
curl -s http://<TARGET_IP>/robots.txt
```

Disallowed paths include `/admin`, `/api`, `/users`, `/snippets/new`, `/projects/new` — not a vulnerability by itself, but it maps the app's route surface for free.

---

## 🔑 Credential Discovery — Obfuscated Login Bookmarklet

Something on the login page (a JS bookmarklet, deobfuscated during review) autofills the GitLab login form directly:

```javascript
document.getElementById("user_login").value = "clave";
document.getElementById("user_password").value = "11des0081x";
```

> ⚠️ **Root cause:** a credential pair hardcoded into client-side JavaScript. Anything shipped to the browser is available to the browser's owner — hardcoding secrets there is equivalent to publishing them.

That also explains the `/clave` route from the directory scan — same word, and very likely the same account/feature.

### Next steps (as of these notes)

1. Attempt GitLab login: `clave : 11des0081x`
2. If successful, enumerate accessible projects, groups, snippets, and any exposed CI/CD variables or tokens
3. Test credential reuse on SSH: `ssh clave@<TARGET_IP>`
4. Search any accessible repos/snippets for further leakage — common patterns worth grepping for: `id_rsa`, `.env`, `config.yml`, `secrets.yml`, `gitlab.rb`, `database.yml`, `token`, `apikey`, `password`

---

## 📦 Evidence Index

| ID | Description | Command |
|---|---|---|
| `EV-001` | Full nmap scan | `nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000` |
| `EV-002` | Directory enumeration | `feroxbuster -u http://<TARGET_IP> -b 502` |

## 🛠️ Remediation (for what's confirmed so far)

| Finding | Fix |
|---|---|
| Hardcoded credentials in client-side JS | Remove immediately, rotate the account, audit for other client-side secrets, and add secret-scanning to CI. |
| Non-standard route (`/clave`) revealing intent via naming | Don't name debug/test routes after the secrets they relate to — it turns directory brute-forcing into a credential hint engine. |
| GitLab reachable unauthenticated on plain HTTP | Enforce HTTPS, disable public sign-up if not needed, and keep GitLab patched against known CVEs for the deployed version. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

⚠️ *This one's a work in progress — update with the confirmed foothold and privesc chain once verified.*

</div>
