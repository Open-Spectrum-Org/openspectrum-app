# OpenSpectrum — Local-First Data Persistence Architecture

## 1. Objective

OpenSpectrum is a Progressive Web App (PWA) designed to help neurodivergent parents and caregivers record daily observations and updates about a child or person they care for.

At present, application data exists primarily in memory and is lost when the application/emulator is restarted.

The next feature is to introduce **persistent local storage** while keeping the application fundamentally local-first.

The immediate goal is:

> **Persist OpenSpectrum's profile and logging data reliably on the user's device using IndexedDB, accessed through Dexie.**

The application should continue to feel like a mobile app even when running as a PWA in a browser.

HIPAA compliance, encryption, cloud storage, authentication, and multi-device synchronization are **future concerns**. Do not attempt to implement those as part of this feature.

---

# 2. Core Data Model

There are two fundamentally different types of persistent data.

## 2.1 Profile Data

Profile data represents the relatively stable/current state of the child or person being tracked.

Examples:

* Name
* Date of birth
* Age / derived age
* Relevant demographic information
* Communication information
* Diagnoses or conditions, if the application currently collects them
* Preferences
* Caregiver information
* Other metadata associated with the person

Profile information changes relatively slowly.

The important conceptual distinction is:

> **Profile data represents the current state.**

We generally want one current profile record rather than an ever-growing collection of profile snapshots.

Example:

```text
Profile
---------
id
name
dateOfBirth
...
createdAt
updatedAt
```

---

## 2.2 Logging Data

Logging data represents observations and events recorded over time.

Examples might include:

* Daily observations
* Behavior observations
* Mood
* Sleep
* Food/meals
* Activities
* Incidents
* Notes
* Other structured observations

Logging data grows much more rapidly than profile data.

The important conceptual distinction is:

> **Log data represents history.**

New records should normally be added rather than replacing previous records.

Example:

```text
Log
---------
id
profileId
timestamp
type
data
createdAt
updatedAt
```

The exact fields should be determined from the application's existing logging functionality. Do not invent new clinical concepts merely for the persistence layer.

---

# 3. Persistence Architecture

Use:

**Dexie + IndexedDB**

Dexie should provide the application's abstraction over the browser's native IndexedDB implementation.

The architecture should be:

```text
                    OpenSpectrum UI
                           |
                           v
                 Application / State
                           |
                           v
                  Repository Layer
                    /           \
                   /             \
          ProfileRepository    LogRepository
                   \             /
                    \           /
                       Dexie
                         |
                         v
                     IndexedDB
                         |
                         v
                    User Device
```

The UI/application code should **not directly manipulate IndexedDB**.

All persistence should go through a repository/data-access layer.

This separation is important because it gives us flexibility later if the application needs:

* Cloud synchronization
* Multiple devices
* Backup
* Caregiver sharing
* A server-side database
* Another storage implementation

The initial implementation should not require any of these.

---

# 4. Why Dexie + IndexedDB

IndexedDB is a natural persistence mechanism for a PWA because it:

* Is built into modern browsers
* Persists across page reloads
* Persists across application restarts
* Works without a network connection
* Allows structured data
* Can store substantially more data than localStorage
* Is appropriate for a local-first application

Dexie provides a much cleaner developer experience than using IndexedDB's low-level API directly.

Do **not** use `localStorage` as the primary application database.

Do **not** introduce SQLite/WASM unless a later architectural decision establishes a compelling reason to do so.

---

# 5. Repository Layer

Introduce a persistence abstraction between the application and Dexie.

Conceptually:

```text
UI
 |
 v
Application logic
 |
 v
Repositories
 |
 v
Dexie
 |
 v
IndexedDB
```

At minimum, create repositories along these lines:

```text
ProfileRepository
    getProfile()
    saveProfile()
    updateProfile()

LogRepository
    getLogs()
    getLogsForDate()
    getLogsForProfile()
    addLog()
    updateLog()
    deleteLog()       // only if the existing product behavior requires deletion
```

The exact API can be adapted to the existing application architecture.

The important requirement is that application components should not know that IndexedDB exists.

---

# 6. Database Structure

Create a Dexie database for OpenSpectrum.

Conceptually:

```text
OpenSpectrumDB

profiles
--------
id
name
dateOfBirth
...
createdAt
updatedAt

logs
----
id
profileId
timestamp
type
data
createdAt
updatedAt
```

Use appropriate indexes for the queries the application actually performs.

Likely useful indexes include:

* `id`
* `profileId`
* `timestamp`
* `type`
* `createdAt`

Do not blindly index every field.

Indexes should support real application queries.

---

# 7. IDs

Use stable unique IDs for:

* Profiles
* Log entries
* Caregivers/devices, if introduced into the model

IDs should be generated locally and should not depend on array positions or timestamps alone.

Prefer UUIDs or another robust collision-resistant identifier.

This is especially important because future versions may need to merge records originating on different devices.

---

# 8. Timestamps

Persistent records should have explicit timestamps.

At minimum, distinguish:

```text
createdAt
updatedAt
```

For logging records, also maintain the timestamp representing **when the observation/event occurred**.

These are not necessarily the same thing.

For example:

```text
eventTimestamp = August 18, 2026 9:30 AM
createdAt       = August 18, 2026 10:02 AM
updatedAt       = August 18, 2026 10:02 AM
```

This distinction will become important if multiple caregivers or devices are introduced later.

---

# 9. Log Data Should Be Historical

Treat logging records primarily as historical events.

For example:

```text
Aug 15
  Sleep observation

Aug 16
  Meal observation
  Behavior observation

Aug 17
  Sleep observation
  Daily note

Aug 18
  Activity observation
```

Adding today's observation should not overwrite yesterday's data.

If an existing log entry is edited, update that record and its `updatedAt` timestamp.

Future versions may introduce a complete audit/change history, but that is not required for this feature.

---

# 10. Application Startup

When OpenSpectrum starts:

```text
Application starts
       |
       v
Initialize Dexie
       |
       v
Load profile
       |
       v
Load relevant logs
       |
       v
Populate application state
       |
       v
Render application
```

The application should gracefully handle:

* No profile exists
* No logs exist
* Existing profile exists
* Existing logs exist
* Database initialization failure
* Corrupt/unexpected records
* Schema upgrades

The first launch should simply produce an empty state rather than an error.

---

# 11. Persistence Behavior

The user should not have to explicitly "save" every change unless the current UI already requires that behavior.

Prefer:

```text
User enters information
       |
       v
Application state changes
       |
       v
Repository persists change
       |
       v
IndexedDB
```

The UI should continue to feel responsive.

Avoid unnecessary database writes caused by every keystroke where possible. For text-entry fields, use an appropriate save strategy such as saving on completion, blur, explicit save, or debounced persistence.

For discrete logging actions, persistence can generally happen immediately.

---

# 12. Multiple Caregivers / Multiple Devices

The initial architecture should assume:

> **One primary device owns the local dataset.**

However, OpenSpectrum should be designed so that additional caregiver devices can eventually contribute data.

For example:

```text
             Primary Device
             IndexedDB
                  |
        +---------+---------+
        |                   |
        v                   v
   Parent A             Parent B
   Device               Device
```

There are several possible future models.

### Model A — Primary Device + API

The primary device remains the authoritative local store.

Other caregiver devices communicate through an API.

```text
Parent A Device
       |
       |
       v
Primary / Server API
       |
       v
Primary Dataset
       ^
       |
Parent B Device
```

This is a future architecture, not part of the initial implementation.

### Model B — Multiple Devices Contribute Records

Each device could create records locally and eventually synchronize them to the primary device.

This is why stable IDs and timestamps should be established now.

For example:

```text
Device A creates:

log-123

Device B creates:

log-456

                ↓

          synchronization

                ↓

        Primary dataset

       log-123
       log-456
```

The records should not depend on sequential database IDs such as:

```text
1
2
3
4
```

because independent devices could easily generate conflicting IDs.

---

# 13. Future Synchronization Considerations

Do not implement synchronization now.

However, the database design should avoid making synchronization unnecessarily difficult later.

Future synchronization will probably require metadata such as:

```text
id
profileId
createdAt
updatedAt
sourceDeviceId
syncStatus
```

These fields do not all need to be implemented immediately.

At minimum, implement stable IDs and meaningful timestamps now.

A future synchronization layer might look like:

```text
                Local Database
                     |
                     v
              Sync Manager
                     |
              +------+------+
              |             |
          Push changes   Pull changes
              |             |
              +------+------+
                     |
                     v
                  API
                     |
                     v
              Shared dataset
```

The persistence layer should make this possible without requiring a rewrite.

---

# 14. Primary Device Concept

Eventually, one device may be designated as the **primary device** for a child.

For example:

```text
Child
 |
 +-- Primary Device
 |      |
 |      +-- Full local dataset
 |
 +-- Caregiver Device
 |      |
 |      +-- Contributes/view data
 |
 +-- Caregiver Device
        |
        +-- Contributes/view data
```

The primary device should not necessarily be thought of as a "server" in the first implementation.

It is simply the device containing the authoritative local copy.

The API/synchronization mechanism can be introduced later.

---

# 15. Privacy Boundary

This implementation is **not a HIPAA-compliant implementation**.

HIPAA compliance is explicitly deferred.

For this phase, the design goal is simply:

> **Keep sensitive application data local to the user's device and do not send it to a backend unnecessarily.**

Do not:

* Commit user data to the Git repository
* Store user data in source files
* Hard-code sample PII into production code
* Send persistent user data to analytics
* Send persistent user data to a backend unless the existing application explicitly requires it

Development/test fixtures should use synthetic data.

Future HIPAA/privacy work can address:

* Encryption at rest
* Authentication
* Authorization
* Secure synchronization
* Backup
* Data export/deletion
* Audit logging
* Device security
* Server-side handling
* Business Associate Agreements where applicable
* Formal HIPAA assessment

None of those should block this persistence implementation.

---

# 16. Testing Requirements

Persistence must be tested in the actual browser/PWA environment.

Do not rely exclusively on unit tests with a mocked database.

At minimum, verify:

### Profile persistence

1. Create a profile.
2. Refresh the page.
3. Confirm the profile remains.
4. Close/reopen the application.
5. Confirm the profile remains.
6. Modify the profile.
7. Refresh.
8. Confirm the modification remains.

### Log persistence

1. Create a log.
2. Refresh.
3. Confirm the log remains.
4. Create several logs.
5. Close/reopen the application.
6. Confirm all logs remain.
7. Edit a log.
8. Confirm the edit persists.
9. Verify older logs have not been overwritten.

### Relationship testing

Verify that:

```text
Profile A
    |
    +-- Log 1
    +-- Log 2
    +-- Log 3
```

and:

```text
Profile B
    |
    +-- Log 4
    +-- Log 5
```

remain properly associated.

### Empty-state testing

A completely new browser/device should produce:

```text
No profile
No logs
```

without errors.

### Database upgrade testing

Dexie schema versioning should be established from the beginning so that future schema changes can be migrated safely.

---

# 17. Development Environment

The implementation should work in:

* Local development browser
* Desktop Chrome/Edge
* PWA mode
* Mobile browser
* Mobile/emulator environment currently used by the project

The coding agent should first determine the existing project framework and build setup before adding dependencies.

Do not unnecessarily introduce another framework or state-management system.

---

# 18. Migration From Current In-Memory Data

The existing application currently loses data when the emulator/browser is restarted.

The implementation should identify where that state currently lives.

Then replace the persistence boundary rather than rewriting the application's UI.

Conceptually:

### Current

```text
UI
 |
 v
In-memory state
 |
 X
Restart = data lost
```

### New

```text
UI
 |
 v
Application state
 |
 v
Repository
 |
 v
Dexie
 |
 v
IndexedDB
 |
 ✓
Restart = data remains
```

The goal is to make this change with minimal disruption to the existing user experience.

---

# 19. Error Handling

Database failures should not cause the entire application to crash.

Handle cases such as:

* IndexedDB unavailable
* Storage quota exceeded
* Database initialization failure
* Failed write
* Failed read
* Schema migration failure

The UI should provide a useful error state where appropriate.

Do not silently pretend data was saved if the persistence operation failed.

For sensitive logging applications, data loss is particularly undesirable.

---

# 20. Data Export

Data export is **not required for v1**, but the data model should not make it difficult later.

Eventually, users may want to export:

* Profile data
* Logs
* All OpenSpectrum data

Potential future formats include JSON or CSV.

Do not implement this unless needed by the current product requirements.

---

# 21. Suggested Implementation Sequence

Implement in this order:

### Phase 1 — Understand Existing State

* Identify where profile state currently lives.
* Identify where logging state currently lives.
* Identify the current data structures.
* Identify existing TypeScript types/interfaces.
* Identify how the application loads and initializes state.

### Phase 2 — Database

* Add Dexie.
* Create the OpenSpectrum database.
* Define schema/version.
* Define profile table.
* Define logs table.
* Add appropriate indexes.

### Phase 3 — Repository Layer

Create:

```text
ProfileRepository
LogRepository
```

with clean application-facing APIs.

### Phase 4 — Profile Persistence

Replace the current in-memory profile persistence with the repository.

Verify that profiles survive application restart.

### Phase 5 — Log Persistence

Replace the current in-memory logging persistence.

Verify that logs survive application restart.

### Phase 6 — Startup Hydration

On application startup:

```text
IndexedDB
   ↓
Repositories
   ↓
Application state
   ↓
UI
```

### Phase 7 — Testing

Test persistence in the browser and emulator.

Explicitly test refresh/restart scenarios.

### Phase 8 — Future-Proofing Review

Before considering this feature complete, verify that the schema has:

* Stable IDs
* Appropriate timestamps
* Profile/log separation
* Profile-to-log relationships
* Dexie schema versioning
* No unnecessary server dependency

---

# 22. Definition of Done

This feature is complete when:

* [ ] Dexie is integrated into OpenSpectrum.
* [ ] IndexedDB is the persistent local database.
* [ ] Profile data persists locally.
* [ ] Logging data persists locally.
* [ ] Logs are associated with the appropriate profile.
* [ ] Data survives page refresh.
* [ ] Data survives application/PWA restart.
* [ ] Data survives emulator restart.
* [ ] Existing UI behavior remains substantially unchanged.
* [ ] The UI does not directly access IndexedDB.
* [ ] Persistence occurs through a repository/data-access layer.
* [ ] Database schema versioning is established.
* [ ] Stable IDs are used.
* [ ] Appropriate timestamps are stored.
* [ ] Database errors are handled gracefully.
* [ ] Tests cover profile persistence.
* [ ] Tests cover log persistence.
* [ ] Tests cover multiple logs and profile relationships.
* [ ] No real PII is committed to the repository.
* [ ] No backend is required for the v1 persistence implementation.

---

# 23. Explicitly Out of Scope

Do **not** implement these as part of this feature:

* HIPAA certification/compliance
* Cloud database
* User authentication
* Caregiver authentication
* Multi-device synchronization
* Conflict resolution
* Server-side storage
* Encryption-at-rest architecture
* Cloud backup
* Analytics involving user data
* Clinician access
* Data sharing
* Data export

These are future architectural possibilities.

The database and repository design should **leave room for them**, but they should not complicate the initial local-first implementation.

---

# 24. Guiding Principle

The most important architectural principle for this feature is:

> **OpenSpectrum should be local-first: the user's data belongs on their device, persistence should be reliable, and the application should not require a server to function.**

The initial implementation should be simple:

```text
              OpenSpectrum
                   |
             Local-first
                   |
            +------+------+
            |             |
         Profile         Logs
        current state    history
            |             |
            +------+------+
                   |
                Dexie
                   |
               IndexedDB
                   |
             User Device
```

Build this cleanly now, while preserving a clear path toward a future model where multiple caregiver devices can contribute to or view a shared dataset through an API/synchronization layer.
