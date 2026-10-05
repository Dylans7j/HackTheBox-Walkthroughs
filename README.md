# Hack The Box — Security Assessments

Evidence-led reports by Dylan Senez / d4rkgunn3r, using the Layover report's summary, scope, methodology, numbered analysis, impact, evidence, and remediation structure.

## Review inventory

| Report | Documentation status |
| --- | --- |
| [Bizness](./bizness.md) | Recorded outcome; original evidence review pending |
| [Browsed](./browsed.md) | Recorded outcome; original evidence review pending |
| [Devel](./devel.md) | Incomplete access/privilege proof |
| [Facts](./facts.md) | Recorded outcome; original evidence review pending |
| [Job](./job.md) | Recorded outcome; original evidence review pending |
| [Love](./love.md) | Recorded outcome; original evidence review pending |
| [Kobold](./kobold-hybrid.md) | Recorded outcome; original evidence review pending |
| [Overwatch](./overwatch.md) | Recorded outcome; original evidence review pending |
| [Principal](./principal.md) | Recorded outcome; original evidence review pending |
| [Pterodactyl](./pterodactyl.md) | Recorded outcome; original evidence review pending |

All proposed revisions require current platform-permission and redaction review before publication. Love's prior evidence review supports SYSTEM; this editorial pass did not independently rerun it. Devel's Rooted source status does not fill gaps in its narrative.

## Reporting standard

1. Executive summary
2. Scope and authorization
3. Methodology and reproducibility
4. Reconnaissance and service analysis
5. Recorded initial-access path
6. Privilege escalation and impact validation
7. Evidence register and limitations
8. Findings and remediation
9. Detection opportunities
10. Remediation validation
11. Lessons learned and remaining work

Keep secrets, authentication hashes, tokens, keys, VPN data, and flags out of public copies. Place evidence immediately after the supported step, with an evidence ID and caption. A placeholder is not a screenshot. Do not present version fingerprints, status fields, or suggested exploit methods as confirmed compromise.

Commands support discovery and evidence verification; exploit payloads and credential-extraction/elevation recipes are summarized. Every finding should state the observed behavior, prerequisites, demonstrated impact, root cause, limitations, and a specific corrective action. CVE attribution and fixes require primary-source verification.

See [source and screenshot review](./EVIDENCE-REVIEW.md) and [publication queue](./PUBLICATION-QUEUE.md). The [SOC-Lab](https://github.com/Dylans7j/SOC-Lab) provides companion defensive investigations.

