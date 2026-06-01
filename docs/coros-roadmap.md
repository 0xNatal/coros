# Coros TypeScript Client & MCP Server — Roadmap

> **Wie diese Datei nutzen:** Wenn dieser Chat voll wird, eröffne einen neuen Chat und füge `CLAUDE.md`, diese Roadmap, `coros-api-reference.md` und den cygnusb-Codebase (https://github.com/cygnusb/coros-mcp) als Referenz an. Diese Datei enthält die Reihenfolge und die Definition of Done — damit kann jeder (auch ein neuer Claude) dort weitermachen, wo wir aufgehört haben.

> **Rollen-Trennung (wichtig):** Diese Roadmap ist autoritativ **nur für die Reihenfolge** — welche Phase, welche Liefergegenstände, wann fertig. Sie beschreibt **keine** Endpunkt-Details. Alles über *Methode, Transport, Header, Felder, Einheiten* steht in `coros-api-reference.md`, und **die gewinnt bei jedem Widerspruch.** Referenz-Repos (cygnusb, xballoy) sind Muster-Vorlagen, nicht Wahrheit — ihre Logik immer gegen die Reference prüfen, bevor du sie portierst.

---

## Kontext

Ziel ist eine möglichst vollständige, stabile TypeScript-Bibliothek für die (inoffizielle) COROS Training Hub Web-API plus ein darauf aufsetzender MCP-Server, der einer KI wie Claude den Zugriff auf eigene Trainingsdaten erlaubt.

Vorgeschichte: Der Nutzer hatte zuvor xballoy/coros-api geforkt (TypeScript/NestJS, fokussiert auf Bulk-Export als FIT/GPX und Trainingsplan als ICS). Die Erweiterungen am Fork laufen als separate PRs gegen Upstream — andere Baustelle, nicht Teil dieser Roadmap.

Dieses Projekt ist ein **kompletter Neustart**, nicht eine Weiterentwicklung des Forks. Es übernimmt nur Muster und Wissen von xballoy, nicht den Code.

---

## Kernentscheidungen (bereits getroffen)

**Sprache & Stack:** TypeScript, Node ≥ 22 (aktuell 24), pnpm-Workspaces, Biome (Lint + Format), Vitest, zod für Validierung, native `fetch` statt Axios, commander für CLI, `@modelcontextprotocol/sdk` für MCP.

**Strictness:** TypeScript mit `strict: true` plus `noUncheckedIndexedAccess: true` und `noImplicitOverride: true`. Frischer Code, frische Standards.

**Nur Web-API, keine Mobile-API.** Bewusste Entscheidung: die Mobile-API gibt einem nur die Schlafphasen-Aufschlüsselung, und der Nutzer braucht das nicht — Trainings- und Erholungsdaten (inkl. HRV, Ruhepuls, VO2max) liegen alle in der Web-API. Vorteil: kein reverse-engineerter AES-Schlüssel, kein Phone-App-Logout, ein einziger Token mit ~24h TTL, schlankerer Code.

**Monorepo mit drei Paketen:**

```
coros/
├── packages/
│   ├── client/   # @coros/client  — pure API client, kein FS/Stdout/Prompts
│   ├── cli/      # @coros/cli     — auth, debug, admin tools
│   └── mcp/      # @coros/mcp     — MCP server für Claude/AI assistants
```

CLI ist nicht der Hauptzweck — sie existiert für **Auth-Bootstrap**, **Debugging** einzelner Endpunkte und **Wartung**. Der primäre Konsument ist der MCP-Server.

**Architektur-Invarianten:** stehen in `CLAUDE.md` und gelten in jeder Phase. Kurzfassung: `client` ist eine pure Bibliothek (kein FS/Stdin/Stdout/Prompts), `TokenStore` ist ein Interface (Implementierungen in cli/mcp), alle Responses zod-validiert (kein `any`), typisierte Errors werden nie geschluckt, Einheiten in Doc-Kommentaren dokumentiert.

---

## Aktueller Stand

Workspace-Grundgerüst steht. Drei Pakete sind angelegt, `pnpm build` läuft, Biome ist konfiguriert. Stubs in `src/index.ts` jedes Pakets. Leer ist alles Inhaltliche — Client-Endpunkte, Auth, CLI-Befehle, MCP-Tools.

---

## Arbeitsweise (für Claude Code)

Diese Regeln gelten in jeder Phase (Details in `CLAUDE.md`):

1. **Eine Phase nach der anderen, innerhalb der Phase einen Liefergegenstand nach dem anderen.** Nie vorgreifen.
2. **Vor dem Implementieren eines Endpunkts:** den genannten Reference-Abschnitt lesen und kurz zusammenfassen (Methode, Transport, Header, relevante Felder, Einheiten), erst dann Code.
3. **Verifizierungs-Marker beachten:** `✅` direkt drauf bauen · `🔁` bei Fehler hier zuerst Verdacht · `📖` vor dem Verlassen-darauf mit echtem Call verifizieren und berichten.
4. **Definition of Done = ausführbar.** Erst fertig, wenn ein Vitest-Test oder ein konkreter CLI-Befehl mit erwartetem Output es belegt.
5. **Stopp-Gate:** Nach jedem Liefergegenstand committen (build+lint+test grün), dann anhalten und auf Bestätigung warten. Bei echter Ambiguität fragen statt raten.

---

## Roadmap — Phasen in Implementierungsreihenfolge

### Phase 1: Client-Fundament

**Ziel:** Login funktioniert, Token wird verwaltet, ein erster echter API-Call läuft durch.

**Liefergegenstände im `client`-Paket:**

- `src/types.ts` — Region-Typ (`'eu' | 'us' | 'asia'`), Region→BaseURL-Mapping **und** Region→Cookie-Code-Mapping. Beide Werte stehen in der Reference, Abschnitt „Base-URLs (regional)" und „Header" (z. B. EU = `teameuapi.coros.com` + Cookie-Region `3`). ⚠️ Achtung: der Cookie-Region-Code (`3`=EU) weicht vom `userProfile.region` (`2`=EU) ab — beides aus der Reference übernehmen, nicht verwechseln.
- `src/errors.ts` — `CorosError` Basisklasse, `CorosAuthError`, `CorosApiError`, `CorosValidationError`.
- `src/token-store.ts` — `TokenStore` Interface (`get/set/clear/isValid`) plus `MemoryTokenStore`.
- `src/schemas/common.ts` — zod-Schema für das Response-Envelope. Shape und Erfolgs-Code stehen in der Reference, Abschnitt „Response-Envelope" (`{ apiCode, data, message, result }`, Erfolg = `result === "0000"`).
- `src/http.ts` — interne `request<T>(url, options, schema)`: natives fetch, Header-Injektion, Envelope-Auswertung, Response-Validierung gegen das Schema, Error-Mapping (`result != "0000"` → `CorosApiError` mit `message`). Header-Konventionen aus der Reference, Abschnitt „Header (authentifizierte Endpoints)".
- `src/auth/login.ts` — `login(email, password, region)`. **MD5-Pfad** verwenden (Reference, `POST /account/login`: MD5-`pwd` ist live-bestätigt als der einfache Weg für eigene Clients; ein selbst erzeugter bcrypt-Hash wird mit `result 1030` abgelehnt). Token + `userId` aus `data` in den Store legen.
- `src/client.ts` — `CorosClient` Klasse, Konstruktor nimmt `TokenStore` und optional Region.

**Reference-Anker:** `POST /account/login`, `GET /account/query`, Abschnitte „Base-URLs", „Header", „Response-Envelope". xballoys `login.request.ts` nur als Muster für die MD5-Body-Form.

**Definition of Done:** Ein Integrationstest (echte Credentials aus Env, geskippt wenn nicht gesetzt) ruft `new CorosClient(store).login(...)` auf, danach gibt `store.isValid()` true zurück und ein anschließender `account/query`-Call liefert ein zod-valides Profil. Build+lint+test grün, commit, **halt.**

---

### Phase 2: Read-Endpunkte (Aktivitäten + Plan)

**Ziel:** Die Endpunkte, die xballoy bereits hat, in der neuen Architektur. Vertrautes Territorium, dient als Lackmustest für die Client-Architektur.

**Liefergegenstände:**

- `src/endpoints/activities/list.ts` — `listActivities({ from, to, page?, size?, sportTypes? })` mit Pagination (rekursiv alle Seiten, `totalPage` aus der Response). Endpunkt `GET /activity/query`. ⚠️ `sportTypes` für den `modeList`-Param nutzt das **Lang-Schema** (Reference, „Zwei sportType-Schemata"). Identifier ist `labelIdStr`, nicht `labelId` (int-Rundung).
- `src/endpoints/activities/detail.ts` — `getActivityDetail(labelId, sportType)`. Endpunkt `POST /activity/detail/query` — ⚠️ Params in der **Query**, **leerer Body** (Reference beschreibt den Transport-Quirk). Die großen Zeitreihen-Felder (`frequencyList`, `graphList`, `lapGraphList`) nach dem Parsen strippen — im MCP-Kontext nicht brauchbar. `sportType` im Lang-Schema.
- `src/endpoints/training-schedule/query.ts` — `getTrainingSchedule({ from, to, supportRestExercise? })`. Endpunkt `GET /training/schedule/query`. ⚠️ `training/*`-Endpunkte schicken zusätzlich den `yfheader` mit (Reference, „Header") — sicherstellen, dass `http.ts` das unterstützt.
- `src/schemas/activity.ts` — zod-Schemas für Activity-Summary (aus `activity/query`) und Activity-Detail (aus `activity/detail/query`). Feldnamen/Typen/Einheiten aus den jeweiligen Reference-Abschnitten.
- `src/schemas/training-schedule.ts` — Schema für die `schedule/query`-Response.

**Reference-Anker:** `GET /activity/query`, `POST /activity/detail/query`, `GET /training/schedule/query`, „Zwei sportType-Schemata", „Maßeinheit-Quirks", „Header". xballoys `query-activities`/`download-activity-detail`/`query-training-schedule` nur als Pattern.

**Definition of Done:** Integrationstests: `listActivities` gibt eine typisierte, paginierte Liste zurück (Anzahl == `count`); `getActivityDetail` liefert Laps und Zonen, aber die drei Zeitreihen-Felder sind nicht enthalten. Einheiten-Konvertierung (cm→m, cs→s, calorie÷1000) in einem reinen Unit-Test gepinnt. Commit, **halt.**

---

### Phase 3: Daily Metrics (HRV, RHR, VO2max, Fitness-Trends)

**Ziel:** Die Daten, die ein moderner Trainingsdaten-Konsument wirklich will.

> ⚠️ **Offene Architektur-Frage zuerst klären — nicht raten.** Die ältere Annahme war: `dayDetail/query` liefert den langen Zeitraum, `analyse/query` füllt VO2max/LTHR für die jüngsten ~28 Tage nach (so macht es cygnusbs `fetch_daily_records()`). Die Reference hat das **korrigiert**: laut `GET /analyse/dayDetail/query` enthält dieser Endpunkt `vo2max`/`lthr`/`ltsp`/`staminaLevel`/`rhr` für die Date-Range bereits selbst. Bevor irgendeine Merge-Logik gebaut wird, ist der **erste Liefergegenstand ein Verifikations-Schritt** (siehe unten). Erst danach entscheiden, ob ein zweiter Call überhaupt nötig ist.

**Liefergegenstände (in dieser Reihenfolge):**

1. **Verifikation:** `coros debug daily-detail --weeks 2` (provisorisch in Phase 3, oder als Test) gegen `GET /analyse/dayDetail/query`. Prüfen, ob `vo2max`/`staminaLevel`/`lthr`/`ltsp` in den jüngsten Tagen befüllt sind. **Ergebnis berichten und anhalten** — die Antwort entscheidet, ob die nächsten Schritte einen oder zwei Endpunkte brauchen.
2. `src/endpoints/analyse/day-detail.ts` — Wrapper um `GET /analyse/dayDetail/query` (Params `startDay`/`endDay`, YYYYMMDD; max-Range-Grenze ggf. beim Call prüfen).
3. `src/endpoints/analyse/summary.ts` — `getTrainingSummary()`, Wrapper um `GET /analyse/query` (keine Params). Liefert per-Sport-Aggregat (`sportStatistic[]`), Verteilungs-Summaries (`summaryInfo`), `dayList`/`t7dayList`. Nützlich für MCP-Tool `get-training-summary` (Phase 6).
4. `src/endpoints/analyse/daily-metrics.ts` — High-Level `getDailyMetrics({ from, to })`, delegiert an `getDayDetail` (kein Merge nötig — Verifikation Schritt 1 hat gezeigt, dass alle Felder in `dayDetail/query` vorhanden sind).
5. `src/schemas/daily-record.ts` — `DailyRecord`-Schema mit allen Feldern aus dem `dayList`-Eintrag (Reference, `analyse/dayDetail/query`).
6. `src/schemas/training-summary.ts` — `TrainingSummary`-Schema für `analyse/query`-Response.

**Reference-Anker:** `GET /analyse/dayDetail/query`, `GET /analyse/query`, `GET /dashboard/query` (für HRV-Details), „Maßeinheit-Quirks". cygnusbs `fetch_daily_records()` **nur** als Muster — die Merge-Logik gegen das Verifikations-Ergebnis prüfen, nicht blind portieren.

**Definition of Done:** `getDailyMetrics({ from: '20260101', to: '20260301' })` gibt ein zod-valides `DailyRecord[]` zurück, in dem die Fitness-Felder so befüllt sind, wie es Schritt 1 empirisch ergeben hat. Commit, **halt.**

---

### Phase 4: Workout-CRUD und Scheduling (Schreiboperationen)

**Ziel:** Workouts erstellen, planen, löschen. Heikelster Teil — Schreibzugriff auf einen echten Account.

**Vorbereitung:** Test-Account oder klare Strategie, den echten Trainingsplan nicht zuzumüllen (siehe offene Fragen).

> **Tests zuerst.** cygnusbs `tests/test_workout_payloads.py` nach Vitest portieren, **bevor** die Payload-Builder entstehen. Die Builder werden gegen diese Tests gebaut.

**Liefergegenstände:**

- `src/endpoints/exercises/list.ts` — `listExercises(sportType = 4)`. Endpunkt `GET /training/exercise/query` (🔁, braucht `teamId`/`userId` — `teamId` ggf. aus `team/user/teamlist`).
- `src/endpoints/workouts/templates/list.ts` — `listWorkoutTemplates()`. Endpunkt `POST /training/program/query` (⚠️ Body ist nicht `{}`, siehe Reference; schickt `yfheader`).
- `src/payloads/cycling.ts` — `buildCyclingProgramPayload(...)` als **pure Funktion**. Repeat-Gruppen (`isGroup:true` + Sub-Steps via `groupId`) und das `sortNo`-Schema (`1<<24` top, `1<<16` sub) aus Reference `POST /training/program/add`.
- `src/payloads/strength.ts` — `buildStrengthProgramPayload(...)` als pure Funktion. ⚠️ Die Strength-Encoding-Regeln (kg×1000, `intensityDisplayUnit` 6/7, Bodyweight-`intensityCustom:1`, `restType:3` für Skip) sind in der Reference mit **📖** markiert = reverse-engineered. **Vor dem Verlassen-darauf an einem echten Call verifizieren.** cygnusbs `_build_strength_program_payload` als verlässlichste Vorlage, aber gegen die 📖-Marker und einen Live-Test prüfen.
- `src/endpoints/workouts/templates/save-*.ts` — `saveWorkoutTemplate(...)` / `saveStrengthWorkoutTemplate(...)`. Endpunkt `POST /training/program/add` → liefert `id` (String).
- `src/endpoints/workouts/templates/delete.ts` — `deleteWorkoutTemplate(id)`. Endpunkt `POST /training/program/delete` (⚠️ Body = flaches Array von ID-Strings, schickt `yfheader`).
- `src/endpoints/workouts/schedule/*.ts` — Inline-Scheduling (One-Off, kein Library-Eintrag) für Cycling/Strength/Template, plus `removeScheduledWorkout(...)`. Endpunkt `POST /training/schedule/update` ist **dual-purpose** (add/delete, Reference). ⚠️ Zwei Quirks aus der Reference übernehmen: die **Race Condition** (`idInPlan = maxIdInPlan + 1` aus vorherigem GET) und die **Enrichment-nach-POST** (Response liefert nicht die server-vergebenen `planId`/`planProgramId` → direkt danach `schedule/query` für den `happenDay` matchen).

**Reference-Anker:** `POST /training/program/add` (Payload-Struktur, sortNo, Strength-Encoding, Repeats), `POST /training/program/query`, `POST /training/program/delete`, `POST /training/schedule/update`, `GET /training/exercise/query`, „intensityType"/„exerciseType"/„sportType"-Tabellen. cygnusbs `coros_api.py` + `test_workout_payloads.py` als Muster.

**Definition of Done:** Alle Payload-Builder haben Vitest-Tests, die die JSON-Shape pinnen (portiert aus `test_workout_payloads.py`) und zod-validiert sind. Live-Test: ein Sweet-Spot-Workout für nächsten Dienstag platzieren und wieder entfernen. Commit, **halt.**

---

### Phase 5: CLI

**Ziel:** Auth einmalig setzen, Token-Status prüfen, einzelne Endpunkte debuggen, MCP-Server starten.

**Liefergegenstände im `cli`-Paket:**

- `src/token-store-env.ts` — liest `COROS_ACCESS_TOKEN`/`COROS_USER_ID`/`COROS_TOKEN_EXPIRES_AT`, read-only.
- `src/token-store-json-file.ts` — plain JSON, `mode 0o600`, kein Keyring/Encryption-Addon (Web-API-Token läuft in ~24 h ab — reicht).
- `src/token-store-chain.ts` — Chain: Env-Var → JSON-File.
- `src/commands/auth.ts` — interaktiver Login (prompts), schreibt in Chain-Store.
- `src/commands/auth-status.ts` — eingeloggt? wie lange gültig? welche Region?
- `src/commands/auth-clear.ts` — alle Stores leeren.
- `src/commands/debug.ts` — `coros debug <endpoint> --from --to` für API-Erkundung.
- `src/index.ts` — commander setup, `bin: { coros: ... }`.

**Reference-Anker:** `GET /account/logout` (vor lokalem Token-Löschen aufrufen). cygnusbs `cli.py` als grobe Struktur, Implementierung in TS mit commander.

**Definition of Done:** `coros auth` einmal, dann `coros auth-status` ohne Re-Login, und `coros debug daily-metrics --weeks 2` zeigt echte Daten. Commit, **halt.**

---

### Phase 6: MCP-Server

**Ziel:** Claude (oder ein anderer MCP-Host) kann die Coros-Daten konversationell abfragen und manipulieren.

**Liefergegenstände im `mcp`-Paket:**

- `src/server.ts` — `Server` aus `@modelcontextprotocol/sdk`, stdio transport, Tool-Registry.
- `src/auth-bootstrap.ts` — beim Start: erst Env-Vars (`COROS_EMAIL`+`COROS_PASSWORD`), sonst Token-Store, sonst Fehler.
- `src/tools/` — `get-help`, `get-daily-metrics`, `list-activities`, `get-activity-detail`, `list-workout-templates`, `save-workout-template`, `save-strength-workout-template`, `schedule-workout`, `schedule-strength-workout`, `schedule-workout-template`, `remove-scheduled-workout`, `list-planned-activities`, `list-exercises`, `check-auth`.

**Wichtige UX-Details (von cygnusb übernehmen):**

- **Save-vs-Schedule-Disambiguierung:** Tool-Descriptions weisen die KI an, im Zweifel zu fragen, ob ein wiederverwendbares Template oder ein One-Off gemeint ist. Save-Tools mit deutlichem Klartext-Warnhinweis (z. B. `WARNING: persists indefinitely`) — kein Emoji.
- **IDs für späteres Löschen:** Schedule-Antworten enthalten `plan_id`/`id_in_plan`/`plan_program_id`. Schlägt die Enrichment-GET fehl (siehe Phase 4), `warning`-Key in die Antwort setzen, damit Claude die IDs per `list_planned_activities` nachschlägt.
- **Auto-Retry bei Token-Expiry:** erster Call, bei Fehlschlag Re-Login aus Env-Vars, dann ein einziges Retry (cygnusbs `_run_with_auth`).

**Reference-Anker:** keine neuen Endpunkte — die Tools sind Wrapper um die Client-Funktionen aus Phasen 2–4. cygnusbs `server.py` als exhaustive Vorlage, inkl. der KI-gerichteten Doc-Strings.

**Definition of Done:** In Claude Desktop „zeig mir meine HRV-Trends der letzten 4 Wochen" → sinnvolle Antwort. „plane mir nächsten Dienstag einen 90-Minuten Sweet-Spot" → landet im Coros-Kalender. Commit, **halt.**

---

### Phase 7 (optional, später): Lokaler Cache

**Ziel:** Schnelle Antworten auf historische Anfragen, weniger API-Last. **Erst bauen, wenn der Bedarf real ist** (jede „letzte 8 Wochen HRV"-Frage dauert spürbar).

**Liefergegenstände in `@coros/cache`:** SQLite (`better-sqlite3`); Tabellen `daily_records`/`activities`/`sync_meta`; Cached-Fetch-Wrapper (Cache zuerst, nur fehlende Range holen, zurückschreiben); Stable-Window-Logik (letzte N Tage re-fetchen, `COROS_STABLE_DAYS` Default 2); Range-Resolver für Gaps; CLI `coros sync --from --to`.

**Reference-Anker:** keine — reine Client-Komposition. cygnusbs `cache/`-Verzeichnis + `tests/test_cache_sync.py` als Vorlage.

**Definition of Done:** Range-Resolver-Logik (historische Gaps + Tail-Gaps + beides) in Unit-Tests gepinnt, aus `test_cache_sync.py` portiert. Commit, **halt.**

---

### Phase 8: Polish & optional Publishing

Wenn alles steht: Rate-Limiting bei Bulk-Schedule-Operationen; bessere Fehlermeldungen (`result`-Codes mit Texten mappen); deaktivierbare Logging-Schicht im Client; npm-Publishing überlegen (`@coros-mcp/*` o. Ä.); README je Paket; CI mit GitHub Actions (Lint+Test gegen mehrere Node-Versionen).

---

## Referenzmaterial

**`coros-api-reference.md`** — die autoritative Endpunkt-Spec. Bei jedem Endpunkt zuerst hier nachsehen.

**cygnusb/coros-mcp** (Python, MIT) — reichste *Muster*-Quelle für API-Verhalten. `coros_api.py` (Endpunkt-Quirks, gegen die Reference prüfen), `models.py` (Pydantic → zod-Vorlage), `server.py` (MCP-Tool-Defs + Doc-Strings), `tests/test_workout_payloads.py` (Payload-Shapes, nach Vitest portieren), `tests/test_cache_sync.py` (Cache, Phase 7).

**xballoy/coros-api** (TypeScript) — näherliegender Stil: `api/`-Bruno-Collection (Request/Response-Shapes), `src/coros/` (Endpunkt-Patterns in TS).

**MCP TS SDK:** https://github.com/modelcontextprotocol/typescript-sdk

---

## Offene Fragen / spätere Entscheidungen

- **Daily-Metrics-Architektur:** ein Call oder Merge? → Verifikations-Schritt in Phase 3 entscheidet.
- **Token-Storage:** Keyring + Encrypted-File-Fallback oder nur Encrypted-File mit maschinengebundenem Key? → Entscheidung in Phase 5.
- **Caching ja/nein:** erst bei realem Bedarf (Phase 7).
- **npm-Publishing:** privat oder öffentlich? Falls öffentlich: Versionierung/Changelog/Release-Workflow.
- **Test-Account:** vor Phase 4 klären.
- **Region-Abdeckung:** EU + US sicher, Asia Vermutung — bei Asia-Nutzer `teamcnapi.coros.com` einmal verifizieren.

---

## Was bewusst nicht zur Roadmap gehört

- **Mobile-API** — Schlafphasen rechtfertigen den Trade-off nicht. Falls je doch: AES-Logik in cygnusbs `coros_api.py` (`login_mobile`), MIT, ~50 Zeilen, mit `node:crypto` 1:1 übersetzbar.
- **FIT-/GPX-/ICS-Export à la xballoy** — anderer Use Case (Dateien für Drittsysteme). MCP gibt strukturierte Daten, nicht Dateien. Falls je nötig: separater CLI-Befehl auf Client-Basis.
- **GUI / Web-Dashboard** — out of scope.

---

## Status-Tracker

- [x] Phase 1 — Client-Fundament (Login, TokenStore, http)
- [x] Phase 2 — Read-Endpunkte (Activities + Training Schedule)
- [x] Phase 3 — Daily Metrics (Verifikation → HRV, RHR, VO2max)
- [ ] Phase 4 — Workouts (Payload-Tests → Templates + Schedule + Remove)
- [ ] Phase 5 — CLI (Auth + Debug)
- [ ] Phase 6 — MCP-Server
- [ ] Phase 7 — Cache (optional)
- [ ] Phase 8 — Polish & Publishing