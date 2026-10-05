# Principal — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Linux |
| Difficulty | Medium |
| Assessment date | 2026-03-27 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The notes report authentication acceptance of a forged token, sensitive settings disclosure, service-account SSH access, and misuse of an exposed SSH certificate-authority key.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/principal/{scans,screenshots}
nmap -sV -p 22,8080 -oA evidence/principal/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

22 OpenSSH 9.6p1; 8080 Jetty; a response header identifies pac4j-jwt/6.0.3. A public JWKS endpoint is not itself a vulnerability.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

The existing narrative reports unsigned inner-token acceptance and privileged API access, followed by a disclosed service credential accepted for SSH. CVE attribution and affected releases require primary-source verification.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

The service account reportedly could read an SSH user-CA signing key. A certificate issued using that key was accepted for root authentication. The trust boundary failed at CA-key custody and permitted principal mapping.

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

Root authentication reported; private key, credential, and token contents excluded.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/principal.md), reviewed at blob SHA `aab1003dc065a11bce7d52fc45d407978ee4d99e`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | Token verification failure | Require valid signatures and approved algorithms; validate issuer, audience, expiry, and role mapping; apply supported vendor fixes. |
| F-002 | Secrets in settings API | Remove secrets from responses; authorize configuration access and rotate exposed credentials. |
| F-003 | SSH CA key exposure | Revoke compromised trust, rotate the CA, restrict principals, and isolate signing material from application accounts. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

Token-validation anomalies; sensitive settings access; service-account logons; unusual SSH certificate principals/key IDs. Tune for legitimate automated deployment.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)
