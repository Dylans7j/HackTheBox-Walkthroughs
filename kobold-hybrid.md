# Kobold — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Linux |
| Difficulty | Not verified |
| Assessment date | 2026-03-21 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The notes report unauthenticated MCP Inspector process execution as ben and root-owned file access using a privileged Docker daemon.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/kobold-hybrid/{scans,screenshots}
nmap -sV -p 22,80,443,3552 -oA evidence/kobold-hybrid/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

22 SSH; 80 HTTP; 443 HTTPS/MCP Inspector; 3552 reported as taserver. Service labels are fingerprints rather than confirmed product identities.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

The Inspector API reportedly accepted caller-selected process configuration without authentication, returning an execution context as ben. The cited CVE and fixed release require primary-source verification before publication.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

ben was recorded in the docker group. A container with host filesystem access read a root-owned objective. This demonstrates privileged host-data access, not a verified root shell or an independent container escape.

In an already authorized session, record identity without reading objective contents:

```bash
id
hostname
sudo -l
```

These are proposed identity-verification commands, not a claim of rerunning the assessment. Windows privilege enumeration does not prove successful elevation; Linux sudo policy alone does not prove a root session.

> **EV-003 — Evidence placeholder:** add policy/permission evidence and the resulting identity or access proof. Never include flags, tokens, private keys, hashes of credentials, or password values.

## 7. Evidence register and limitations

| ID | Required artifact | Current status |
| --- | --- | --- |
| EV-001 | Service inventory and timestamped scan excerpt | Text observations available; original artifact review pending |
| EV-002 | Initial-access behavior and identity proof | Existing narrative reviewed; sanitized artifact pending |
| EV-003 | Privilege boundary and impact proof | Reported in narrative; original artifact review pending |

Root-owned file access reported. Repository review notes an unchecked proof field and unfinished source report.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/kobold-hybrid.md), reviewed at blob SHA `8572cba7ce306126cfaeacebf925405e5873b876`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | Unauthenticated process-launch API | Remove public exposure; authenticate and authorize tooling operations; allow only trusted process configurations. |
| F-002 | Root-equivalent Docker access | Limit daemon access to trusted administrators or use rootless operation; review socket and group permissions. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

Inspector requests followed by unexpected child processes; Docker API activity and sensitive host bind mounts. Tune for approved development and administration.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)
