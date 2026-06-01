# COROS — Projekt-Scope (welche Endpunkte gebaut werden)

> **Was diese Datei ist:** das Manifest der Endpunkte, die dieses Projekt tatsächlich implementiert, mit ihrer Rolle (MCP-Tool / interne Client-Methode / optional / später / out of scope).
>
> **Was diese Datei NICHT ist:** eine Endpunkt-Doku. Methode, Transport, Header, Felder und Einheiten stehen ausschließlich in `coros-api-reference.md` — dort über denselben Pfad nachschlagen (`### METHODE /pfad`). Bei Widerspruch gewinnt die Reference.
>
> **Für Claude Code:** Was hier nicht als „Tool", „intern" oder „optional" steht, wird **nicht** gebaut. „Out of scope" ist eine bewusste Entscheidung, kein vergessener Endpunkt — nicht ungefragt hinzufügen.
>
> **v1 ist read-only.** Alle schreibenden Endpunkte und Workout-Builder (ehemals Phase 4) sind auf einen späteren Meilenstein verschoben. Die Encoding-Vorarbeit (Payload-Struktur, Strength-Encoding, sortNo-Schema) ist vollständig in `coros-api-reference.md` dokumentiert und wartet dort auf Implementierung.

## Rollen-Legende

| Rolle | Bedeutung |
|---|---|
| **Tool** | als MCP-Tool exponiert (Phase 6) + Client-Methode |
| **Intern** | Client-Methode, **kein** MCP-Tool — Abhängigkeit für andere Calls oder Auth |
| **Optional** | Client-Methode, nur bauen wenn ein Tool/Feature es konkret braucht |
| **Später** | bewusst auf eine spätere Ausbaustufe verschoben |
| **Out** | nicht im Projekt (Begründung unten) |

---

## In Scope

| Endpoint | M | Rolle | Client-Funktion | MCP-Tool |
|---|:--:|---|---|---|
| `/account/login` | POST | Intern | `login()` | — (Auth-Bootstrap) |
| `/account/logout` | GET | Intern | `logout()` | — (CLI `auth-clear`) |
| `/account/query` | GET | Intern | `getAccount()` | backt `check_auth` (Login-Status/Region) |
| `/team/user/teamlist` | GET | Intern | `getTeams()` | — (liefert `teamId` für `schedule/querysum`) |
| `/activity/query` | GET | **Tool** | `listActivities()` | `list_activities` |
| `/activity/detail/query` | POST | **Tool** | `getActivityDetail()` | `get_activity_detail` |
| `/analyse/dayDetail/query` | GET | **Tool** | `getDailyMetrics()` | `get_daily_metrics` (Kern: HRV, RHR, VO2max, TL) |
| `/dashboard/query` | GET | **Tool** | `getDashboard()` | `get_daily_metrics` (HRV-Detail/Recovery-Snapshot) |
| `/training/program/query` | POST | **Tool** | `listWorkoutTemplates()` | `list_workout_templates` (nur lesend) |
| `/training/schedule/query` | GET | **Tool** | `getTrainingSchedule()` | `list_planned_activities` |

### Versteckte Abhängigkeiten (nicht als verzichtbar einstufen)

- `account/query` sieht wie „nur Profil" aus, liefert aber FTP/LTHR/LTSP + Zonen — relevant für den späteren Workout-Builder-Meilenstein.
- `team/user/teamlist` liefert die `teamId`, die `schedule/querysum` als Param erwartet.
- `schedule/query` ist in v1 das Lese-Tool `list_planned_activities`; die Enrichment-Logik nach `schedule/update` (server-IDs nachschlagen) gehört zum späteren Schreib-Meilenstein.

---

## Optional (nur bauen, wenn ein Feature es braucht)

| Endpoint | M | Wozu |
|---|:--:|---|
| `/analyse/summary/query` | GET | Sport-Statistik/Verteilung für Date-Range |
| `/analyse/record/query` | GET | Distanz/Dauer/TL-Records für Date-Range |
| `/analyse/tl/query` | GET | Training-Load-Intensität (längerer Zeitraum) |
| `/analyse/query` | GET | nur falls Phase-3-Verifikation zeigt, dass `dayDetail/query` Fitness-Felder fehlen → Merge |
| `/dashboard/detail/query` | GET | Tages-Fitness-Kurve / Wochen-Records |
| `/training/program/detail` | GET | Template-Volldetails (Edit-Flows) |
| `/training/program/calculate` | POST | Preview-Aggregate ohne Speichern |
| `/training/program/estimate` | POST | Preview im Schedule-Kontext |
| `/training/schedule/querysum` | GET | Wochen-/Tagessummen Plan vs. tatsächlich |
| `/profile/public/query` | GET | Strength-Encoding-Kataloge — nur falls die Defaults aus `exercise/query` nicht reichen |

---

## Später (eigener Meilenstein: Schreib-Features / Workout-Builder)

| Endpoint | M | Grund |
|---|:--:|---|
| `/training/exercise/query` | GET | Übungskatalog — Builder-Abhängigkeit; Encoding-Vorarbeit in Reference |
| `/training/program/add` | POST | Workout-Templates erstellen; Payload-Struktur in Reference |
| `/training/program/delete` | POST | Workout-Templates löschen |
| `/training/schedule/update` | POST | Workouts planen / entfernen (dual-purpose: add + delete) |
| `/training/plan/query` | POST | Mehrwöchige Pläne |
| `/training/plan/add` | POST | dito |
| `/training/plan/detail` | GET | dito |

---

## Out of Scope (bewusst weggelassen)

| Endpoint | Grund |
|---|---|
| `/activity/detail/download` | Datei-Export — MCP gibt strukturierte Daten, nicht Dateien |
| `/activity/createExportTask` | Bulk-Datei-Export per Mail — out of scope |
| `/activity/fit/getImportSportList` | FIT-Import-Internals — irrelevant |
| `/activity/update` | Aktivität umbenennen — geringer Wert |
| `/account/update` | Profil/Settings ändern — riskant, kein Use Case |
| `/profile/private/query` | UI-Layout-Profile — für eine KI bedeutungslos |
| `/profile/private/save` | UI-Layout speichern — dito |
| `/genericmessage/countAll` | UI-Ungelesen-Badge |
| `/leavingmessage/list` | Aktivitäts-Kommentare |
| `/dashboard/queryCycleRecord` | Zyklus-Records — Nische, bei Bedarf nachziehen |
| `faq.coros.com` / `static.coros.com` / Sentry | Hilfs-Hosts / Telemetrie — keine auth'd API |

---

## Verhältnis zu den anderen Dateien

- `coros-api-reference.md` — Verhalten **aller** Endpunkte (vollständig, bleibt unangetastet).
- `coros-scope.md` (diese Datei) — **welche** davon gebaut werden, in welcher Rolle.
- `coros-roadmap.md` — **in welcher Reihenfolge**.
- `CLAUDE.md` — die Regeln, die in jeder Phase gelten.
