# API examples

These examples are illustrative contracts, not captured database records. IDs,
cookies, CSRF values and keys are placeholders. Emails use `example.test`.

```sh
BASE_URL='<BASE_URL>'
```

## Valid requests for every endpoint

```sh
curl -i "$BASE_URL/health"
curl -i "$BASE_URL/health/live"
curl -i "$BASE_URL/health/ready"
curl -i "$BASE_URL/agents"
curl -i "$BASE_URL/agents/<AGENT_ID>"
curl -i "$BASE_URL/ailments?q=focus"
curl -i "$BASE_URL/ailments/<AILMENT_ID>"
curl -i "$BASE_URL/ailments/<AILMENT_ID>/therapies"
curl -i "$BASE_URL/therapies"
curl -i "$BASE_URL/therapies/<THERAPY_ID>"
curl -i "$BASE_URL/therapies/<THERAPY_ID>/availability?from=2030-01-01T00%3A00%3A00Z&to=2030-02-01T00%3A00%3A00Z"
curl -i "$BASE_URL/appointments/booking-context/<SLOT_ID>"
curl -i -X POST "$BASE_URL/appointments" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: <IDEMPOTENCY_KEY>' \
  --data '{"availabilitySlotId":"<SLOT_ID>","agentId":"<AGENT_ID>","visitorName":"Example Visitor","visitorEmail":"visitor@example.test"}'
curl -i "$BASE_URL/appointments/<APPOINTMENT_ID>"
curl -i -X POST "$BASE_URL/auth/sign-in" \
  -H 'Origin: <TRUSTED_ORIGIN>' -H 'Content-Type: application/json' \
  --data '{"email":"person@example.test","password":"<PASSWORD>","returnTo":"/agent/dashboard"}'
curl -i "$BASE_URL/auth/session" \
  -H 'Cookie: agentclinic_session=<SESSION_COOKIE>; agentclinic_csrf=<CSRF_TOKEN>'
curl -i -X POST "$BASE_URL/auth/sign-out" \
  -H 'Origin: <TRUSTED_ORIGIN>' \
  -H 'Cookie: agentclinic_session=<SESSION_COOKIE>' \
  -H 'X-AgentClinic-CSRF: <CSRF_TOKEN>'
curl -i "$BASE_URL/agent/appointments/upcoming" \
  -H 'Cookie: agentclinic_session=<SESSION_COOKIE>'
curl -i -X POST "$BASE_URL/agent/appointments/<APPOINTMENT_ID>/cancel" \
  -H 'Origin: <TRUSTED_ORIGIN>' -H 'Cookie: agentclinic_session=<SESSION_COOKIE>' \
  -H 'X-AgentClinic-CSRF: <CSRF_TOKEN>'
curl -i "$BASE_URL/agents/<AGENT_ID>/appointments/upcoming" \
  -H 'Cookie: agentclinic_session=<SESSION_COOKIE>'
curl -i -X POST "$BASE_URL/agents/<AGENT_ID>/appointments/<APPOINTMENT_ID>/cancel" \
  -H 'Origin: <TRUSTED_ORIGIN>' -H 'Cookie: agentclinic_session=<SESSION_COOKIE>' \
  -H 'X-AgentClinic-CSRF: <CSRF_TOKEN>'
curl -i "$BASE_URL/staff/appointments?status=PENDING,CONFIRMED&agentId=<AGENT_ID>" \
  -H 'Cookie: agentclinic_session=<SESSION_COOKIE>'
curl -i -X POST "$BASE_URL/staff/appointments/<APPOINTMENT_ID>/confirm" \
  -H 'Origin: <TRUSTED_ORIGIN>' -H 'Cookie: agentclinic_session=<SESSION_COOKIE>' \
  -H 'X-AgentClinic-CSRF: <CSRF_TOKEN>'
curl -i -X POST "$BASE_URL/staff/appointments/<APPOINTMENT_ID>/cancel" \
  -H 'Origin: <TRUSTED_ORIGIN>' -H 'Cookie: agentclinic_session=<SESSION_COOKIE>' \
  -H 'X-AgentClinic-CSRF: <CSRF_TOKEN>' -H 'Content-Type: application/json' \
  --data '{"reasonCode":"SCHEDULE_CHANGE"}'
```

## Successful JSON examples

```json
{ "status": "ok" }
```

Collections return arrays, including `[]`. Representative catalog records:

```json
{"id":"<AGENT_ID>","name":"Example Agent","model":"Example model","summary":"Fictional catalog summary."}
{"id":"<AILMENT_ID>","name":"Example Ailment","summary":"Fictional summary.","description":"Fictional description."}
{"id":"<THERAPY_ID>","name":"Example Therapy","summary":"Fictional summary.","description":"Fictional description.","ailments":[{"id":"<AILMENT_ID>","name":"Example Ailment"}]}
```

Availability and booking:

```json
{"id":"<SLOT_ID>","therapyId":"<THERAPY_ID>","startsAt":"2030-01-10T15:00:00.000Z","durationMinutes":60,"endsAt":"2030-01-10T16:00:00.000Z"}
{"slotId":"<SLOT_ID>","therapy":{"id":"<THERAPY_ID>","name":"Example Therapy"},"startsAt":"2030-01-10T15:00:00.000Z","endsAt":"2030-01-10T16:00:00.000Z","durationMinutes":60,"displayTimeZone":"America/Sao_Paulo"}
{"id":"<APPOINTMENT_ID>","status":"PENDING","therapy":{"id":"<THERAPY_ID>","name":"Example Therapy"},"agent":{"id":"<AGENT_ID>","name":"Example Agent"},"startsAt":"2030-01-10T15:00:00.000Z","endsAt":"2030-01-10T16:00:00.000Z","durationMinutes":60,"displayTimeZone":"America/Sao_Paulo","createdAt":"2030-01-01T12:00:00.000Z"}
```

Authentication and protected output:

```json
{
  "accountId": "<ACCOUNT_ID>",
  "email": "person@example.test",
  "role": "AGENT",
  "agent": { "id": "<AGENT_ID>", "name": "Example Agent" },
  "expiresAt": "2030-01-01T20:00:00.000Z",
  "csrfToken": "<CSRF_TOKEN>",
  "returnTo": "/agent/dashboard"
}
```

```json
{
  "id": "<APPOINTMENT_ID>",
  "status": "CONFIRMED",
  "therapy": { "id": "<THERAPY_ID>", "name": "Example Therapy" },
  "startsAt": "2030-01-10T15:00:00.000Z",
  "endsAt": "2030-01-10T16:00:00.000Z",
  "durationMinutes": 60,
  "cancellationEligible": true,
  "cancellationDeadline": "2030-01-09T15:00:00.000Z",
  "displayTimeZone": "America/Sao_Paulo"
}
```

```json
{
  "id": "<APPOINTMENT_ID>",
  "status": "PENDING",
  "agent": { "id": "<AGENT_ID>", "name": "Example Agent" },
  "therapy": { "id": "<THERAPY_ID>", "name": "Example Therapy" },
  "startsAt": "2030-01-10T15:00:00.000Z",
  "endsAt": "2030-01-10T16:00:00.000Z",
  "durationMinutes": 60,
  "displayTimeZone": "America/Sao_Paulo",
  "createdAt": "2030-01-01T12:00:00.000Z",
  "lastStatusChangedAt": "2030-01-01T12:00:00.000Z",
  "confirmationAllowed": true,
  "cancellationAllowed": true
}
```

## Failure examples and endpoint applicability

Every UUID endpoint can return this validation class:

```json
{
  "message": "Validation failed (uuid v 4 is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

Query/body endpoints (`/ailments`, availability, booking POST, sign-in, Staff
queue/cancel) also return 400 for the exact validation rules in the contracts.

```json
{
  "message": "Invalid appointment request fields",
  "error": "Bad Request",
  "statusCode": 400
}
```

Every protected Agent/Staff endpoint returns 401 without a valid session and
403 for the wrong role. Every protected mutation also returns 403 for missing/
untrusted Origin or invalid CSRF.

```json
{
  "message": "Authentication required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

```json
{ "message": "CSRF validation failed", "error": "Forbidden", "statusCode": 403 }
```

Resource GETs and mutation targets return a corresponding 404. Agent ownership
mismatch intentionally uses the same Appointment response:

```json
{ "message": "Appointment not found", "error": "Not Found", "statusCode": 404 }
```

Booking context/creation and appointment transitions can return 409:

```json
{
  "message": "This slot is no longer available",
  "error": "Conflict",
  "statusCode": 409
}
```

Sign-in may return generic 401 or throttled 429:

```json
{
  "message": "Email or password is incorrect",
  "error": "Unauthorized",
  "statusCode": 401
}
```

```json
{
  "message": "Sign-in temporarily unavailable",
  "error": "Too Many Requests",
  "statusCode": 429
}
```

Readiness failure is specific:

```json
{ "status": "unavailable" }
```

Unexpected failures never expose internals:

```json
{
  "statusCode": 500,
  "code": "INTERNAL_ERROR",
  "message": "Unable to complete request",
  "requestId": "<REQUEST_ID>"
}
```

Not-found/conflict are not applicable to health, collection-only catalog GETs,
session/sign-out, or Staff queue unless their explicit inputs trigger another
documented class. Authentication failure is not applicable to public endpoints.
