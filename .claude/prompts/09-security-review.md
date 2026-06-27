# Prompt: Security Review

```text
Perform a security review for <CHANGE_OR_AREA>.

Do not edit files first.

Check:
- secrets exposure
- auth/authz
- input validation
- unsafe logging
- injection risks
- database query safety
- external integration risks
- dependency risks
- CI/CD and deployment risks

Return findings by severity and suggest minimal safe fixes.
Do not read or print secrets.
```
