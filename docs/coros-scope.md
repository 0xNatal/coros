# COROS — Projekt-Scope (welche Endpunkte gebaut werden)

> **Was diese Datei ist:** das Manifest der Endpunkte, die dieses Projekt tatsächlich implementiert, mit ihrer Rolle (MCP-Tool / interne Client-Methode / optional / später / out of scope).
>
> **Was diese Datei NICHT ist:** eine Endpunkt-Doku. Methode, Transport, Header, Felder und Einheiten stehen ausschließlich in `coros-api-reference.md` — dort über denselben Pfad nachschlagen (`### METHODE /pfad`). Bei Widerspruch gewinnt die Reference.
>
> **Für Claude Code:** Was hier nicht als „Tool", „intern" oder „optional" steht, wird **nicht** gebaut. „Out of scope" ist eine bewusste Entscheidung, kein vergessener Endpunkt — nicht ungefragt hinzufügen.

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
| `/account/query` | GET | Intern | `getAccount()` | backt `check_auth` (Login-Status/Region); liefert FTP/LTHR/LTSP + Zonen zum Bauen von Workouts |
| `/team/user/teamlist` | GET | Intern | `getTeams()` | — (liefert `teamId` für `exercise/query` + `schedule/querysum`) |
| `/activity/query` | GET | **Tool** | `listActivities()` | `list_activities` |
| `/activity/detail/query` | POST | **Tool** | `getActivityDetail()` | `get_activity_detail` |
| `/analyse/dayDetail/query` | GET | **Tool** | `getDailyMetrics()` | `get_daily_metrics` (Kern: HRV, RHR, VO2max, TL) |
| `/dashboard/query` | GET | **Tool** | `getDashboard()` | speist `get_daily_metrics` (HRV-Detail/Recovery); ggf. eigener HRV-Snapshot |
| `/training/exercise/query` | GET | Intern | `listExercises()` | `list_exercises` (Übungskatalog für Strength) |
| `/training/program/query` | POST | **Tool** | `listWorkoutTemplates()` | `list_workout_templates` |
| `/training/program/add` | POST | **Tool** | `saveWorkoutTemplate()` / `saveStrengthWorkoutTemplate()` | `save_workout_template` / `save_strength_workout_template` |
| `/training/program/delete` | POST | Intern | `deleteWorkoutTemplate()` | — (Client-Methode ab Phase 4; kein MCP-Tool in v1) |
| `/training/schedule/query` | GET | **Tool** | `getTrainingSchedule()` | `list_planned_activities` **+** Enrichment nach POST (server-IDs nachschlagen) |
| `/training/schedule/update` | POST | **Tool** | `scheduleWorkout()` / `scheduleStrengthWorkout()` / `scheduleWorkoutTemplate()` / `removeScheduledWorkout()` | `schedule_workout` / `schedule_strength_workout` / `schedule_workout_template` / `remove_scheduled_workout` |

### Versteckte Abhängigkeiten (nicht als verzichtbar einstufen)

- `account/query` sieht wie „nur Profil" aus, ist aber die Quelle für FTP/LTHR/LTSP + Zonen → ohne sie kein vernünftiger Workout-Builder.
- `team/user/teamlist` liefert die `teamId`, die `exercise/query` und `schedule/querysum` als Param erwarten.
- `schedule/query` ist auch ohne Tool-Rolle nötig: nach `schedule/update` kommen die server-vergebenen `planId`/`planProgramId` nicht in der POST-Response zurück — die holt man hierüber (Enrichment).

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

## Später (eigene Ausbaustufe)

| Endpoint | M | Grund |
|---|:--:|---|
| `/training/plan/query` | POST | Mehrwöchige Pläne — v1 fokussiert One-Off-Scheduling |
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
