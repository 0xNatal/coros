# COROS Web API — Endpoint-Referenz (inoffiziell)

> Reverse-engineered, **nicht** offiziell dokumentiert oder unterstützt. Stand: 2026-05-31.
> Quellen: HAR-Capture des EU-Web-Clients (`trainingeu.coros.com`), Live-Validierung (EU-Account), Community-Repos.
> Bei Brüchen durch COROS-Updates: gegen einen echten Call prüfen.

## Wie diese Datei zu benutzen ist (für Claude Code)

- **Diese Datei ist die alleinige Wahrheit (Single Source of Truth) für alles, was Endpunkte tun:** HTTP-Methode, Transport (Body vs. Query-Param), Header, Request/Response-Felder, Einheiten. Bei Widerspruch zur Roadmap oder zu Referenz-Repos (cygnusb, xballoy) **gewinnt diese Datei.**
- **Vor dem Implementieren eines Endpunkts:** dessen Detail-Abschnitt lesen, plus die „Konventionen"-Sektion (gilt für alle authentifizierten Endpunkte und wird pro Endpunkt nicht wiederholt).
- **Verifizierungs-Marker als Vertrauensstufe behandeln** (Legende unten): `✅` direkt drauf bauen · `🔁` bei Fehler zuerst hier Verdacht schöpfen · `📖` vor dem Drauf-Verlassen mit einem echten Call verifizieren.

### Endpunkt-Template (Konvention)

Jeder Detail-Eintrag folgt diesem Schema; Felder, die dem Default entsprechen, werden weggelassen:

```
### METHODE /pfad  <Verif-Marker>
**Zweck:** …
**Auth/Header:** nur wenn abweichend vom Default (Default: accessToken + Cookie; training/* zusätzlich yfheader)
**Transport:** nur wenn abweichend (Default: JSON-Body bei POST, Query bei GET)
**Params / Request:** …
**Response:** Schlüsselfelder + Einheiten-Quirks
**Notes:** Quirks, Race Conditions, Sentinels
```

## Verifizierungs-Legende

| Marker | Bedeutung |
|:--:|---|
| ✅ | Im aktuellen HAR-Capture gesehen (Request-Body/Query + Response-Shape) |
| 🔁 | In früherem Capture oder Live-Run bestätigt, **nicht** im aktuellen HAR |
| 📖 | Nur aus Repo/alter Doc — vor Gebrauch verifizieren |

⚠️ Das HAR liefert Query-Keys, Request-Bodies und Response-*Shapes* (Feldnamen + Typen), **keine Header und keine konkreten Werte**. Header-Konventionen und Einheiten-Quirks stammen daher aus Repos/Live-Run und sind entsprechend markiert.

---

# Konventionen (gelten für alle authentifizierten Endpunkte)

## Base-URLs (regional)

| Region | URL | Cookie-Region-Code |
|---|---|:--:|
| EU | `https://teameuapi.coros.com` | `3` |
| US | `https://teamapi.coros.com` | (analog, verifizieren) |
| Asia / China | `https://teamcnapi.coros.com` | (analog, verifizieren) |

Login geht auf jedem Host, aber der Token gilt nur für den jeweiligen Host. Immer die regionale URL nutzen. ⚠️ Der Cookie-Region-Code (`3`=EU) weicht vom `userProfile.region` im Profil (`2`=EU) ab — nicht verwechseln.

## Header (Default, authentifizierte Endpoints) ✅

Minimal funktionierend, aus echtem `activity/query`-Call verifiziert:
```
accessToken: <32-Zeichen-Token>
Cookie: CPL-coros-token=<gleicher Token>; CPL-coros-region=3   # 3 = EU
Content-Type: application/json
```
- **`accessToken` allein reicht für Reads** wie `activity/query` — `yfheader` ist hier **nicht** nötig (entgegen früherer Repo-Annahme).
- Token steht doppelt: `accessToken`-Header **und** `CPL-coros-token`-Cookie.
- **`yfheader: {"userId":"<user_id>"}` schicken die `training/*`-Endpoints mit** (z. B. `program/query` ✅). Bei Reads wie `activity/query`/`account/query` nicht nötig. Im Zweifel immer mitsenden — schadet nicht.

**Content-Type-Ausnahmen (pro Endpunkt vermerkt):**
- `POST /account/update` → **multipart/form-data**
- `POST /activity/detail/query`, `/activity/detail/download` → Params in der **Query**, **leerer Body** (`content-length: 0`, Header `content-type: application/x-www-form-urlencoded`)

## Response-Envelope ✅

Erfolg: `{ apiCode, data, message, result }` — `result == "0000"`, `data` enthält die Nutzdaten.
Fehler: `{ result, tlogId, message }` — `apiCode` und `data` fehlen, `tlogId` ist eine Server-seitige Trace-ID (live verifiziert 2026-06-01).
Client-seitig: `apiCode` und `data` als optional behandeln; result-Check kommt vor data-Parse. **Ausnahmen ohne Envelope:** Login-Hilfshosts `faq.coros.com`, `static.coros.com`, Sentry.

---

# Referenz-Tabellen (gelten überall)

## ⚠️ Zwei sportType-Schemata (häufigste Fehlerquelle)

**Kurz-Schema** — in Workout-/Exercise-Payloads (`program`/`plan`/`schedule`):

| ID | Sport |
|--:|---|
| 0 | Group/None (Gruppen-Header) |
| 1 | Running |
| 2 | Cycling/Bike |
| 4 | Strength (auch in `exercise/query`) |
| 5 | Running-Variante (Bedeutung unklar) |

> Im Capture belegt: 0/1/2/5 in Payloads, 4 für `exercise/query`. Über 5 hinaus mit Vorsicht.

**Lang-Schema** — in `activity/query` `modeList` und Aktivitätslisten:

| ID | Sport | ID | Sport | ID | Sport |
|--:|---|--:|---|--:|---|
| 100 | Running | 204 | MTB | 500 | Ski |
| 102 | Trail Running | 205 | E-MTB | 501 | Snowboard |
| 103 | Track Running | 299 | Helmet Riding | 502 | XC Ski |
| 104 | Hiking | 300 | Pool Swim | 503 | Ski Touring |
| 105 | Mountain Climbing | 301 | Open Water | 700 | Rowing |
| 106 | Climbing | 400 | Cardio (Gym) | 701 | Indoor Rower |
| 200 | Road Bike | 401 | GPS Cardio | 702 | Whitewater |
| 201 | Indoor Cycling | 402 | Strength | 704 | Flatwater |
| 202 | E-Bike | 403 | Yoga | 800 | Indoor Climb |
| 203 | Gravel Bike | | | 801 | Bouldering |

Weiter: 900 Walking, 901 Jump Rope, 902 Climb Stairs, 9807 Bike Commute, 10000 Triathlon, 10001 Multisport, 10003 Outdoor Climb.

## intensityType (Workout-Builder)

| ID | Bedeutung | im HAR |
|--:|---|:--:|
| 1 | Weight | ✅ (Strength) |
| 2 | Heart Rate | ✅ |
| 3 | Pace | – |
| 4 | Speed | ✅ |
| 5 | None | – |
| 6 | Power (Watt) | – |
| 7 | Cadence | – |

## exerciseType

| ID | Bedeutung |
|--:|---|
| 0 | Gruppen-Header (`isGroup:true`) |
| 1 | Warmup |
| 2 | Work / Interval |
| 3 | Cooldown |
| 4 | Recovery/Cooldown-Variante |

## Metrik-Typ-Codes (`graphList`/`zoneList` `type`) ✅

Geteilter Enum für Graph- und Zonen-Metriken in `activity/detail/query`:

| type | Metrik | type | Metrik |
|--:|---|--:|---|
| 109 | cadence | 145 | groundTime |
| 124 | cadenceLength | 147 | verticalVibration |
| 126 | heart (HR) | 148 | verticalStrideRatio |
| 127 | heartLevel | 154 | slope |
| 130 | speed/pace | 173 | adjustedPace |
| 132 | altitude | | |
| 134 | power | | |

`orderType: 2` = invertierte Metrik (Pace: kleiner = schneller, `yScaleArr` absteigend). `maxXSecond` = X-Achsen-Ende in Centisekunden.

## Maßeinheit-Quirks 📖

| Feld / Kontext | Einheit | Hinweis |
|---|---|---|
| `calorie` (pro Aktivität) | physikal. cal | ✅ ÷1000 = kcal (`522145` → 522 kcal) |
| `runCalorie` (Profil-Aggregat) | kcal | feldabhängig — nicht ÷1000 |
| Distanz in Listen/Dashboard/Analyse | Meter | ✅ `7999.08` = 8 km (≠ cm in `detail/query`!) |
| `avgSpeed`/`avgPace` (Lauf) | s/km | ✅ `441.64` ≈ 7:22/km |
| Distanz in `detail/query` (Samples/Laps/Summary) | **cm** | ✅ `799908` = 7999.08 m |
| Distanz in Workout-Payloads | **cm** | ✅ via Detail bestätigt (Rohwerte meter-skalig ×100) |
| Timestamps in `detail/query` | **Centisekunden** (Unix-Sek. ×100) | ✅ `178020965100` = 1780209651 s |
| GPS `gpsLat`/`gpsLon` | Grad ×10⁷ (E7) | ✅ `462979233` = 46.2979233° |
| `altitude` (Samples) | Meter | ✅ `652` (Visp ~650 m) |
| `weather` `temperature`/`humidity` | ×10 | ✅ `192` = 19.2 °C, `570` = 57 % |
| Sentinel „keine Daten" | `65535` | `kLoss`/`naLoss`/`sweatLoss` |
| HRV (`*SleepHrv*`) | RMSSD ms | |
| LTHR | bpm | |
| LTSP / `avgPace` | s/km | |
| Cadence | step/min | |
| `startTime`/`endTime` | UTC-Unix-Sek. (int, 10-stellig) | ✅ int, **nicht** String |
| `startTimezone`/`endTimezone` | 15-Min-Einheiten ab UTC | ✅ `8` = UTC+2; `32` = UTC+8 |

---

# Übersichtstabelle (alle Endpoints)

### Auth & Account

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/account/login` | POST | Login → `accessToken` + `userId` + Profil | ✅ |
| `/account/logout` | GET | Server-seitige Session-Invalidierung | 📖 |
| `/account/query` | GET | Vollprofil inkl. aller Trainingszonen (FTP/LTHR/LTSP) | ✅ |
| `/account/update` | POST | Profil/Settings ändern (multipart) → frisches Profil | ✅ |
| `/profile/private/query` | GET | Nutzer-Layout-/Anzeigeprofile | ✅ |
| `/profile/private/save` | POST | Layout-/Anzeigeprofile speichern | ✅ |
| `/profile/public/query` | GET | Globale Kataloge + Strength-Profil | ✅ |
| `/team/user/teamlist` | GET | Teams des Nutzers | ✅ |
| `/genericmessage/countAll` | GET | Ungelesene-Zähler (UI-Badge) | ✅ |
| `/leavingmessage/list` | GET | Kommentare zu einer Aktivität | ✅ |

### Dashboard, Daily, HRV & Analyse

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/dashboard/query` | GET | Tages-/HRV-Übersicht + Fitness-Scores + Recovery | ✅ |
| `/dashboard/detail/query` | GET | Wochen-Records + Tages-Fitness (VO2max/LTHR/LTSP/Stamina) | ✅ |
| `/dashboard/queryCycleRecord` | GET | Zyklus-/Perioden-Records | ✅ |
| `/analyse/query` | GET | Analyse-Aggregat: Tages-Fitness + Records + Intensität | ✅ |
| `/analyse/summary/query` | GET | Sport-Statistik + Summary für Date-Range | ✅ |
| `/analyse/dayDetail/query` | GET | Tages-Metriken (voll) für Date-Range | ✅ |
| `/analyse/record/query` | GET | Distanz/Dauer/TL-Records für Date-Range | ✅ |
| `/analyse/tl/query` | GET | Training-Load-Intensität für Date-Range | ✅ |

### Aktivitäten

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/activity/query` | GET | Aktivitätsliste, paginiert | ✅ |
| `/activity/detail/query` | POST | Volldetails (Laps, Zonen, Graphen, GPS-Samples) | ✅ |
| `/activity/detail/download` | POST | Einzel-Aktivität exportieren → `fileUrl` | ✅ |
| `/activity/update` | POST | Aktivität umbenennen/bearbeiten | ✅ |
| `/activity/fit/getImportSportList` | POST | Sport-Definitionen für FIT-Import | ✅ |
| `/activity/createExportTask` | POST | Bulk-Export per E-Mail (Task) | 🔁 |

### Übungskatalog

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/training/exercise/query` | GET | Übungskatalog je Sportart (Strength etc.) | 🔁 |

### Workout-Templates (Programs)

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/training/program/query` | POST | Gespeicherte Templates auflisten | ✅ |
| `/training/program/detail` | GET | Template-Volldetails | 🔁 |
| `/training/program/add` | POST | Template erstellen → `id` | ✅ |
| `/training/program/calculate` | POST | Aggregate berechnen ohne Speichern (Preview) | 🔁 |
| `/training/program/estimate` | POST | Preview im Schedule-Kontext | 🔁 |
| `/training/program/delete` | POST | Templates löschen | ✅ |

### Trainingsplan (Schedule & Plan)

| Endpoint | Methode | Zweck | Verif. |
|---|:--:|---|:--:|
| `/training/schedule/query` | GET | Kalender-Workouts im Range | ✅ |
| `/training/schedule/update` | POST | Kalender-Workout hinzufügen **oder** löschen | ✅ |
| `/training/schedule/querysum` | GET | Wochen-/Tagessummen (Plan vs. tatsächlich) | ✅ |
| `/training/plan/query` | POST | Mehrwöchige Pläne auflisten | 🔁 |
| `/training/plan/add` | POST | Mehrwöchigen Plan erstellen → `id` | ✅ |
| `/training/plan/detail` | GET | Plan-Volldetails | 🔁 |

### Hilfs-Hosts (nicht die auth'd API)

| Host / Endpoint | Zweck | Verif. |
|---|---|:--:|
| `faq.coros.com` `/openapi/v1/grayUser/find` | Feature-Flag-/Gray-Release-Check (eigenes `sign`-Auth) | ✅ |
| `static.coros.com` `/.../profile/*_prod.json` | Statische Kataloge (= `profile/public/query`) | ✅ |
| `sentry-v2.coros.com` `/api/20/envelope/` | Telemetrie — **ignorieren** | ✅ |

---

# Detail-Referenz

## Auth & Account

### POST /account/login ✅
**Zweck:** Web-Login, liefert Token + Profil.
**Auth:** keine.
**Request (Web-Client, bcrypt):**
```json
{ "account": "you@example.com", "accountType": 2, "p1": "<bcrypt-hash>", "p2": "<bcrypt-salt>" }
```
`p1` = voller 60-Zeichen-bcrypt-Hash, `p2` = Salt (erste 29 Zeichen).
**Request (MD5-Pfad, funktioniert weiterhin) 📖:**
```json
{ "account": "you@example.com", "accountType": 2, "pwd": "<md5(password) hex>" }
```
**Response 📖:** `data.accessToken`, `data.userId`, vollständiges Profil inkl. `zoneData` (= `account/query`). Token-TTL ~24 h. (Response-Body im HAR redacted.)
**Notes:** Live-Validierung 2026-05-31: MD5-`pwd` → `result 0000`. Ein selbst erzeugter bcrypt-Hash mit Zufalls-Salt wird mit `result 1030` abgelehnt (Pepper/Pre-Processing vermutet). **Für eigene Clients ist der MD5-Pfad der einfache Weg.**

### GET /account/logout 📖
**Zweck:** Session server-seitig invalidieren.
**Params:** keine.
**Notes:** Vor lokalem Token-Löschen aufrufen.

### GET /account/query ✅
**Zweck:** **Wichtigster Read-Endpoint für einen Workout-Builder** — Vollprofil + alle Trainingszonen.
**Params:** keine.
**Response `data` (live-verifiziert 2026-06-01):**
- Persönlich: `email`, `nickname`, `userId` (String), `birthday` `19970330` (YYYYMMDD), `sex` `0`, `countryCode` `"CH"`, `stature` `187` (cm), `weight` `85` (kg), `unit` `0` (0=metrisch/1=imperial), `temperatureUnit` `0` (0=°C), `hrZoneType` `3` (aktives HR-Zonensystem; `3` = **LTHR-basiert**), `displayFitness2` `1`, `isCompetitionTestUser` `0`, `newMessageCount` `0`, `deviceCustomNameList[]`.
- `userProfile{}`: `language` `"en-US"`, `region` `2` (EU), `facade`, `gender`, `age`, `showActivityMap`, `stature`, `weight`, `allowCoachEditing`, `allowMembersView`, `allowsTeamViewHistorical`, `autoTrainingLoadData`, `acceptTeamInvitation` (alle Anzeige-Flags als int).
- Performance: `maxHr` `192`, `rhr` `46`.
- `accessToken` (identisch zum Auth-Token — kein Refresh nötig).
- **`zoneData`** (`*Range` = `[min,max]`-Eingabegrenzen, `*Default` = Werks-Defaults):
  - **Power:** `ftp` `180` (W), `ftpRange` `[60,495]`, `cyclePowerZone[]` (7 Zonen; `{index, power, ratio}`; `ratio` = **% FTP**), `cyclePowerZoneDefault[]` (gleiche Shape).
  - **HR (LTHR):** `lthr` `160` (bpm), `lthrRange` `[104,216]`, `lthrZone[]` (6 Zonen; `{hr, index, ratio}`; `ratio` = **% LTHR**: `{hr:128, ratio:80}` = 80 % × 160). Kein `lthrZoneDefault`.
  - **HR (max):** `maxHr` `192`, `maxHrRange` `[120,240]`, `maxHrZone[]` (6 Zonen; `{hr, index, ratio}`; `ratio` = **% maxHr**: `{hr:192, ratio:100}`).
  - **HR (Reserve/Karvonen):** `rhr` `46`, `rhrRange` `[30,120]`, `rhrZone[]` (6 Zonen; `{hr, index, ratio}`; `ratio` = % HRR: `{hr:132, ratio:59}` = 46 + 59 % × (192−46)).
  - **Pace:** `ltsp` `285` (s/km), `ltspRange` `[159,769]`, `ltspZone[]` (7 Zonen; `{index, pace, ratio}`; `ratio` = **% Schwellen-*Geschwindigkeit*** invers: Threshold `{pace:285, ratio:100}`, langsam `{pace:370, ratio:77}`), `ltspZoneDefault[]`.
  - `weightMetricRange` `[10,300]` (kg), `weightImperialRange` `[22,660]` (lb).
- `climbConfig[]` (`{gradeIndex, gradeSystemVersion, gradingSystem, sportType, updateTime}`).
- `runScoreList[]` (variable Länge — nur Einträge mit Daten, `type` 1–7; je `{avgPace, distance, distanceRatio, distanceTargetTotal, distanceTotal, duration, durationRatio, durationTargetTotal, durationTotal, trainingLoadRatio, trainingLoadTargetTotal, trainingLoadTotal, type}`). Accounts ohne Aktivitäten können 7 Nulleinträge zurückliefern.
- `sportDataSummary{}`: `{count, modelValidState, userFirstViewTimestamp?}` — `userFirstViewTimestamp` nur wenn `count > 0`.
- `ltspZone[].ratio` ist **float** (z. B. `68.3`, `79.1`) — kein int.

Einmal cachen (~1 h), dann FTP/LTHR/LTSP + Zonen für den Builder bereit. „Z2-Ride" → `cyclePowerZone[1..2]`; „Schwellenlauf" → `ltspZone[3]`.

### POST /account/update ✅
**Zweck:** Profil/Settings ändern.
**Transport:** ⚠️ **multipart/form-data**, eine Property je Feld.
```
Content-Disposition: form-data; name="language"

en-US
```
**Response:** das vollständige Account-Profil (gleiche Shape wie `account/query`) — frischer Stand direkt zurück.

### GET /profile/private/query ✅
**Zweck:** Welche Kacheln/Spalten in welcher Reihenfolge angezeigt werden.
**Params:** keine.
**Response `data`:** `activityProfileList[]` (`columnProfileList[]` mit `dataName`/`display`/`orderOfDisplay`), `analyseProfileList[]`, `dashboardProfileList[]`, `customModeProfile{}`, `activityDetailLapList[]`, `teamUserViewProfile{}`.

### POST /profile/private/save ✅
**Zweck:** Anzeige-/Layout-Profile speichern.
**Request:** `{ "activityProfileList": [{ "sportType": 0, "columnProfileList": [{ "key": "", "dataName": "Date", "display": 1, "orderOfDisplay": 2, "orderOfDefault": 2 }, ...] }] }`
**Response:** das vollständige Private-Profil (wie `profile/private/query`).

### GET /profile/public/query ✅
**Zweck:** Globale Kataloge + Strength-Encoding-Regeln.
**Params:** `type`, `language`, `releaseType`. ⚠️ EU-Web-Client nutzt `?type=2&language=en-US&releaseType=1` → liefert `activityStrengthProfile`. Mit `type=0` fehlt es. `releaseType=1` = EU-prod.
**Response `data`:** `activityModeProfileList[]` (`{key, sportType[], modeList[]}`), `activitySourceDataProfile[]`, `activityStrengthProfile{}` (`intensitys[]`, `targets[]`, `rests[]`, `sportConfigures[]`, `muscleHeatMap{}`, `minSets`/`maxSets`).

### GET /team/user/teamlist ✅
**Zweck:** Teams des Nutzers.
**Params:** keine.
**Response:** `data.teamList[]`. Für Solo leer — aber `teamId` aus diesem Call brauchst du ggf. für `exercise/query` / `schedule/querysum`.

### GET /genericmessage/countAll ✅
**Zweck:** Ungelesene-Badge.
**Params:** keine.
**Response `data`:** `count`, `messageCount`, `teamMessageCount`.

### GET /leavingmessage/list ✅
**Zweck:** Kommentare/Nachrichten zu einer Aktivität.
**Params:** `dataId` (= `labelId`), `type`.
**Notes:** Response trägt im leeren Fall kein `data`.

---

## Dashboard, Daily, HRV & Analyse

### GET /dashboard/query ✅
**Zweck:** Tages-Übersicht: Fitness-Scores, Recovery, HRV, Lauf-Bestzeiten.
**Params:** keine.
**Response `data.summaryInfo` (echte Werte):**
- Fitness-Scores (0–100): `aerobicEnduranceScore` `64`, `anaerobicCapacityScore` `64.1`, `anaerobicEnduranceScore` `63.9`, `lactateThresholdCapacityScore` `63.9` (je + `*Change`-Delta); `staminaLevel` `64.1`, `staminaLevelChange`, `staminaLevelRanking` `12.56` (Perzentil).
- Recovery: `recoveryPct` `85`, `recoveryState` `3`, `fullRecoveryHours` `24`.
- Schwellen: `lthr` `172`/`lthrZone[]`, `ltsp` `384`/`ltspZone[]`, `rhr` `63`, `cycleLevelHr`/`runningLevelHr` `148`, `fitnessMaxHr` `195`.
- `recordDetailList[]` — Lauf-Bestzeiten, je Block ein `type` (Zeitfenster), darin `recordList[]` mit `record` (Zeit in s) je Distanz-`type`: **4**=10 k, **5**=5 k, **6**=3 k, **7**=1 k, **8**=1 mi (1609.34 m), **9**=2 mi, **10**=3 mi, **11**=5 mi; **101**=längster Lauf (`record`=Distanz). ⚠️ **`labelId` ist als int gerundet (Präzisionsverlust) — überall `labelIdStr` nehmen.**
- `sleepHrvData`: `lastSleepHrvBase` `45` (RMSSD ms), `lastSleepHrvSd` `3.5`, `lastSleepHrvIntervalList` `[5,38,42,49]`, `sleepHrvIntervalBase` `5`, `sleepHrvIntervalPercentList` `[90,97,103,105]`, `remainWearDays`, `sleepHrvFirstDay`, `sleepHrvList[]` (`{happenDay, sleepHrvIntervalList[]}`).

### GET /dashboard/detail/query ✅
**Zweck:** Wochen-Records (Distanz/Dauer/TL) + Tages-Fitness-Kurve + jüngste Aktivitäten.
**Params:** keine.
**Response `data`:**
- `currentWeekRecord` (laufende Woche) & `record` — je `distanceRecord`/`durationRecord`/`tlRecord` mit `{count, percentage, totalTarget, totalValue, type, detailList[]}`. `detailList`-Eintrag pro Tag: `happenDay`, `timestamp` (Unix-Sek., Tagesbeginn), `value`, plus Aufteilung in Intensitätsbänder `periodLow/Medium/HighValue` + `…Pct`. ⚠️ **Distanz hier in Metern** (`7999.08`) — anders als die cm in `activity/detail/query`; Dauer in s.
- `detailList[]` — Tages-Fitness-Kurve: `ati`/`cti` (akut/chronisch), `tib` (Balance, kann negativ), `t7d`/`t28d` (7-/28-Tage-Load-Summe), `ct7dMaxFixed`/`ct7dMin` (CTL-Band), `trainingLoad`, `tiredRate`/`tiredRateNew`/`tiredRateStateNew`, `staminaLevel`/`staminaLevel7d`, `vo2max`, `lthr`, `ltsp`, `performance`. Nur Aktivitätstage befüllt, Ruhetage `0`.
- `sportDataList[]` — jüngste Aktivitäten (Mini-Liste, `labelId` als String, `avgSpeed` s/km, `distance` m, `totalElevation`, `trainingLoad`).
- `summaryInfo{}` — `ati` `57`, `cti` `49`, `tiredRateNew` `8` (+`State`), `trainingLoadRatio` `1.16` (+`State`), `recomendTlInDays`. `targetList[]`.

### GET /dashboard/queryCycleRecord ✅
**Zweck:** Zyklus-/Perioden-Records.
**Params:** keine.
**Response:** `data.allRecordList[]` → `{recordList[], type}`.

### GET /analyse/query ✅
**Zweck:** Großes Analyse-Aggregat (Trends, Verteilungen).
**Params:** keine.
**Response `data`:**
- `dayList[]` **und** `t7dayList[]` — pro Tag voll: `happenDay`, `timestamp`, `distance`/`distanceTarget`, `duration`/`durationTarget`, `trainingLoad`/`trainingLoadTarget`, `trainingLoadRatio`(+`State`/`ZoneList`), `ati`, `cti`, `ct7dMaxFixed`/`ct7dMin`, `tib`, `t7d`, `t28d`, `performance`, `recomendTlMax`/`Min`, `tiredRate`/`tiredRateNew`(+`ZoneList`/`StateNew`), **`vo2max`, `lthr`, `ltsp`, `staminaLevel`, `staminaLevel7d`, `rhr`, `sleepHrvIntervalList[]`**.
- `record` (Distanz/Dauer/TL, wochenbasiert: `firstDayOfWeek*`/`lastDayInWeek*`), `tlIntensity` (gleiche Struktur).
- `sportStatistic[]` (je Sport: `count`/`distance`/`duration`/`avgHr`/`avgPace`/`trainingLoad`).
- `summaryInfo` (Verteilungs-Listen: `hrTimeAreaList`, `tlAreaList`, `disAreaList`, …), `weekList[]`, `trainingWeekStageList[]`, `sportDataSummary`.

**Notes:** ✅ Korrigiert — `vo2max`/`lthr`/`ltsp`/`staminaLevel` **sind** enthalten (die frühere „gibt es nicht"-Notiz war ein Account-ohne-Fitness-Artefakt). Kein Mobile-Pfad nötig.
⚠️ `sportStatistic`, `dayList`, `t7dayList` können **absent** sein (nicht `null`) für Accounts ohne Aktivitäten — alle Felder als `.optional()` im Schema halten.

### GET /analyse/summary/query ✅
**Zweck:** Sport-Statistik + Verteilungs-Summary für einen Zeitraum.
**Params:** `startDay`, `endDay` (YYYYMMDD).
**Response `data`:** `sportStatistic[]`, `summaryInfo{}` (= die `summaryInfo`-Sektion aus `analyse/query`, aber Date-Range-gefiltert).

### GET /analyse/dayDetail/query ✅
**Zweck:** Tages-Metriken (voll) für einen Zeitraum — das Date-Range-Pendant zu den `dayList`-Einträgen.
**Params:** `startDay`, `endDay` (YYYYMMDD, live-verifiziert 2026-06-01).
**Response `data`:** `dayList[]`, `weekList[]`, `trainingWeekStageList[]`.

`dayList[]`-Eintrag — vollständige Key-Liste (live-verifiziert 2026-06-01, 15 Tage, EU-Account):
`happenDay` (int YYYYMMDD), `timestamp` (UTC-Unix-s), `distance` (m), `distanceTarget`, `duration` (s), `durationTarget`, `trainingLoad`, `trainingLoadTarget`, `trainingLoadRatio`, `trainingLoadRatioState`, `trainingLoadRatioZoneList[]`, `ati`, `cti`, `ct7dMaxFixed`, `ct7dMin`, `tib`, `t7d`, `t28d`, `performance`, `recomendTlMax`, `recomendTlMin`, `tiredRate`, `tiredRateNew`, `tiredRateNewZoneList[]`, `tiredRateStateNew`, `sleepHrvIntervalList[]`, **`vo2max`** (mL/kg/min), **`staminaLevel`** (0–100 float), **`staminaLevel7d`**, **`lthr`** (bpm), **`ltsp`** (s/km), **`rhr`** (bpm).

⚠️ **Fitness-Felder sind sparse** — nur auf Tagen befüllt, an denen eine qualifizierende Aktivität oder Messung vorliegt. Im 15-Tage-Test: `vo2max`/`staminaLevel`/`lthr`/`ltsp` je 6/15 Tagen, `rhr` 4/15 Tagen. Bei `rhr` fehlt der Wert an trainingsfreien Tagen ohne ausreichende Schlaf-Messung.

**Notes:** ✅ Live-verifiziert 2026-06-01 (15 Tage, EU-Account). **Dieser Endpunkt enthält alle Fitness-Felder für die ganze Range selbst. `analyse/query` (no params) ist damit nicht nötig — kein Merge-Call erforderlich.**

### GET /analyse/record/query ✅
**Zweck:** Distanz/Dauer/TL-Records für einen Zeitraum.
**Params:** `startDay`, `endDay`.
**Response `data.record`:** `distanceRecord`/`durationRecord`/`tlRecord` (wochenbasiert).

### GET /analyse/tl/query ✅
**Zweck:** Training-Load-Intensität für einen (längeren) Zeitraum.
**Params:** `startDay`, `endDay`.
**Response `data.tlIntensity`:** `{count, percentage, totalTarget, totalValue, type, detailList[]}`.

---

## Aktivitäten

### GET /activity/query ✅
**Zweck:** Aktivitätsliste, paginiert. **Der Einstiegspunkt** — liefert die `labelId` für alle Detail-Calls (`activity/detail/query`, `activity/detail/download`, `activity/update`; in `leavingmessage/list` als `dataId`).
**Params:** `modeList` (Komma-Liste **Lang-Schema**, leer = alle), `pageNumber` (1-basiert), `size`.
**Response `data`:** `count` (Gesamtzahl), `pageNumber`, `totalPage` (= ceil(count/size)), `dataList[]`.
⚠️ **Wenn `count == 0`**: `pageNumber`, `totalPage` und `dataList` fehlen komplett in der Response (live-verifiziert 2026-06-01 mit Account ohne Aktivitäten). Client muss diese Felder als optional behandeln.

Aktivitätsfelder (live-verifiziert 2026-06-01, 8-km-Lauf):
- `labelId` **(str)** `"477872651163959602"` — die ID für alle Detail-Calls. **Kein `labelIdStr`-Feld in dieser Response** (anders als `dashboard/query` wo `labelId` als int kommt; hier immer String).
- `name` `"Visp Laufen"`, `device` `"COROS PACE 3"`, `deviceId` `"76F383"`, `imageUrl` (Karten-Snapshot), `imageUrlType` `1`.
- `sportType` `100` (**Lang-Schema** — diesen Wert an `detail/query`/`download` übergeben); zusätzlich `mode`/`subMode` `8`/`1` (= Outdoor Run, Partner-Schema), `deviceSportMode` `0`.
- `startTime`/`endTime` `1780209651` — **int, UTC-Unix-Sekunden (10-stellig)**, *nicht* String; `endTime − startTime = totalTime`. `startTimezone`/`endTimezone` `8` = 15-Min-Einheiten → 8×15 = **UTC+2**.
- `distance` `7999.08` = **Meter** (≈8 km), float; `totalTime`/`workoutTime` `3533` = **Sekunden**; `date` `20260531` (YYYYMMDD, Lokalzeit).
- `avgSpeed` `441.64` = **s/km** (Lauf-Pace, nicht m/s); `adjustedPace` `438`; `avgHr` `152` (optional, fehlt bei manchen Aktivitäten); `avgPower` `143`, `np` `0`; `avgCadence`/`cadence` `168`, `step` `9930`; `avg5x10s` `442`, `avgStrkRate` `168`, `best`/`best500m`/`bestKm`/`bestLen` `418`.
- `calorie` `522145` → **÷1000 = 522 kcal** (int); `trainingLoad` `125`; `ascent` `29`, `descent`/`totalDescent` `30`, `downhillDesc`/`downhillDist`/`downhillTime`; `unitType` `2`.
- Weitere Sport-spezifische Felder via passthrough: `bodyTemperature` `0`, `isRunTest` `0`, `isShowMs` `0`, `lengths` `8`, `max2s` `0`, `maxSlope` `0`, `maxSpeed` `0`, `pitch` `0`, `sets` `0`, `speedType` `3`, `swolf` `0`, `total`, `totalFishingTime` `0`, `totalReps` `0`, `waterTemperature` `3500`, `hasMessage` `0`.

### POST /activity/detail/query ✅
**Zweck:** Volldetails einer Aktivität — Samples, Laps, Zonen, Graphen, Wetter, Geräte.
**Auth:** nur `accessToken` (+ Cookies), kein `yfheader`.
**Transport:** POST, alle Params in der **Query**, **leerer Body** (`content-length: 0`, Header `content-type: application/x-www-form-urlencoded`).
**Params:** `labelId`, `sportType` (Lang-Schema, z. B. `100`), `screenW`, `screenH` (nur fürs Graph-Rendering).
**Response `data`:**
- `summary{}` — Headline-Werte (live-verifiziert 2026-06-01, 8-km-Lauf): `distance` `799908` (cm → ÷100 = **7999.08 m**), `totalTime`/`workoutTime` `353261` (cs → ÷100 = **3532.61 s**), `calories` `522145` (÷1000 = **522.145 kcal**), `avgHr` `152`/`maxHr` `164`, `avgPower` `143`/`maxPower` `212`, `avgSpeed` `441.64` (s/km), `avgStepLen` `81`, `elevGain` `29`/`totalDescent` `30` (m), `trainingLoad` `125`, **`currentVo2Max` `45`**, `aerobicEffect` `3.2`/`aerobicEffectState` `3`/`anaerobicEffect` `2.6`/`anaerobicEffectState` `2`, `staminaLevel7d` `100`, `performance` `2`, `timezone` `8` (= UTC+2), `planId`/`programId` `"0"` (kein Plan), `userId`. ⚠️ `65535` = Sentinel „keine Daten" (`kLoss`/`naLoss`/`sweatLoss`).
- `lapList[]` — **3 Gruppen** (live): `type 2` = Auto-Laps (1 km, `lapDistance` 100000 cm), `type 11` = 5-km-Splits, `type -1` = Gesamt-Aktivität. Jede Gruppe hat `lapItemList[]`.
- `frequencyList[]` — Sample-Reihe (1 Hz). Pro Punkt: `timestamp` (cs), `gpsLat`/`gpsLon` (E7), `distance` (kumulativ, cm), `heart`, `speed`/`adjustedPace` (s/km), `cadence`/`cadenceLength`, `power`, `altitude` (m), `slope`, `groundTime` (ms), `verticalVibration`/`verticalStrideRatio`. `level`/`levelMap` = Datenqualitäts-Flags. **Groß — bei Bedarf strippen.**
- `graphList[]` — vor-aggregierte Graphen je Metrik: `key` + `type` (siehe Metrik-Typ-Codes) + `graphItem{avg, max, min, sum, count, asc, desc, maxXSecond, xScaleArr, yScaleArr, clrLocation, orderType}`.
- `lapList[]` — mehrere Lap-Sichten, unterschieden durch `type`: **`2`** = Auto-Laps (`lapDistance` 100000 cm = 1 km), **`11`** = 5-km-Splits, **`-1`** = Gesamt-Aktivität. Je Lap `lapItemList[]` mit Distanz/Zeit/HR/Power/Pace/Cadence/Elevation; `exerciseNameKey` (z. B. `"S4208"`).
- `zoneList[]` — Zeit-in-Zone je Metrik (`type` wie oben): `zoneItemList[]` mit `leftScope`/`rightScope`, `percent`, `second`, `zoneIndex`. Hier HR (`126`, bpm), speed (`130`) & adjustedPace (`173`) — deren Scopes in **ms/km** (= `account/query` `ltspZone.pace` ×1000, z. B. `385000` = 385 s/km).
- `weather{}` — Werte **×10**: `temperature` `192` (= 19.2 °C), `humidity` `570` (= 57 %), `bodyFeelTemp`, `windSpeed`, Icon-URLs.
- `deviceList[]`/`usedDeviceList[]` (Watch + HR-Gurt), `userInfo{}` (`nickname`, `sex`, `userId`), `sportFeelInfo{}`, `pauseList[]`, `lapGraphList[]`.

### POST /activity/detail/download ✅
**Zweck:** **Einzel**-Aktivität als Datei exportieren (der echte Web-Download-Pfad).
**Transport:** ⚠️ POST mit Query-Params.
**Params:** `labelId`, `sportType`, `fileType` (z. B. `4`).
**Response:** `data.fileUrl` (direkter Download-Link).

### POST /activity/update ✅
**Zweck:** Aktivität bearbeiten (z. B. umbenennen).
**Request:** `{ "type": 1, "labelId": "<id>", "name": "Neuer Name" }`.
**Response:** nur Envelope (kein `data`).

### POST /activity/fit/getImportSportList ✅
**Zweck:** Sport-Definitionen für FIT-Import.
**Request:** `{ "size": 10 }`.
**Response:** `data[]`.

### POST /activity/createExportTask 🔁
**Zweck:** **Bulk**-Export per E-Mail (asynchroner Task).
**Auth:** ⚠️ `accessToken` hier als Query-Param.
**Request:** `{ "fileType": 4, "email": "..." }`.
**Response `data`:** `{ id, userId, email, exportFileType, status, createTime, updateTime }` — `id`/`status` zum Pollen.
**Notes:** Für einzelne Aktivitäten ist `activity/detail/download` (✅) der direktere Weg.

---

## Übungskatalog

### GET /training/exercise/query 🔁
**Zweck:** Übungskatalog je Sportart.
**Params:** `sportType` (`4` = Strength), `teamId`, `userId`.
**Response `data[]`:** Übungsobjekte mit `id`, `name` (T-Code), `overview` (sid-Key), `muscle[]`/`muscleRelevance[]`/`part[]`, `equipment[]`, `animationId`/`videoInfos[]`/`thumbnailUrl`, Defaults (`sets`, `restType`/`restValue`, `targetType`/`targetValue`, `intensityType`).
**Notes:** Metadaten müssen beim Erstellen eines Strength-Workouts in den Payload.

---

## Workout-Templates (Programs)

### POST /training/program/query ✅
**Zweck:** Gespeicherte Workout-Templates auflisten. Sendet `yfheader`.
**Request (⚠️ Body ist nicht `{}`):**
```json
{ "name": "", "supportRestExercise": 1, "startNo": 0, "limitSize": 10, "sportType": 0 }
```
Paginiert (`startNo`/`limitSize`), filterbar (`name`, `sportType` 0=alle).
**Response `data[]`** (echtes Lauf-Intervall-Template „W11 10km"): je Template `id` (str), `name`, `sportType` `1`, `access` `1` (privat), `targetType` `5`/`targetValue` `560000` (cm), `totalSets` `10`, `exerciseNum` `4`, `estimatedType` `6`/`estimatedValue` `147` (= TL), `estimatedDistance` `560000` (cm), `estimatedTime` `1380` (s), `referExercise{hrType:3, intensityType:2, valueType:1}`, `exerciseBarChart[]` (eine Zeile je expandiertem Step für die UI), `exercises[]` (die Bausteine — Struktur identisch zu `program/add`, siehe dort).

### GET /training/program/detail 🔁
**Zweck:** Template-Volldetails.
**Params:** `id`, `supportRestExercise`.
**Response:** `data` = volles Programm-Objekt + `officalConfig`, `exerciseBarChart[]`.

### POST /training/program/add 🔁
**Zweck:** Template erstellen.
**Response:** `data: "<workout_id>"` (String).

**Programm-Top-Level (Auswahl):** `name`, `sportType`, `access` (1=privat), `distance`, `duration`, `exerciseNum`, `totalSets`, `trainingLoad`, `referExercise{intensityType, hrType, valueType}`, `exercises[]`, `exerciseBarChart[]`.

**Exercise-Felder (Auswahl):** `id`, `name` (T-Code), `overview` (sid-Key), `exerciseType`, `sportType`, `sets`, `sortNo`, `groupId`, `isGroup`, `restType`/`restValue`, `targetType`/`targetValue`, `intensityType`/`intensityValue`/`intensityPercent`/`intensityDisplayUnit`/`intensityCustom`, `isIntensityPercent`, `hrType`, `equipment[]`, `part[]`.

**Repeat-Gruppen (Intervalle):** ein Header mit `isGroup:true`, `sets:<repeat>`, danach Sub-Steps mit `groupId:"<header.id>"`.

**`sortNo`-Schema:** Top-Level `16777216 * topIndex` (`1<<24`), Sub-Steps `groupSort + 65536 * subIndex` (`1<<16`).

**Strength-Encoding 📖** (alle 📖 — vor dem Verlassen-darauf an einem echten Call verifizieren):
- Bodyweight: `intensityValue:""`, `intensityCustom:1`, `intensityDisplayUnit:"6"`
- kg: `intensityValue: round(kg*1000)`, `intensityDisplayUnit:"6"`, `intensityCustom:0`
- lbs: `intensityValue: round(lbs*0.45359237*1000)`, `intensityPercent: round(lbs*1_000_000)`, `intensityDisplayUnit:"7"`
- Rest: skip → `restType:3, restValue:0`; Sekunden → `restType:1, restValue:<s>`
- `intensityType:1`, `targetType:2`=Zeit / `3`=Reps, jede Übung `status:1`.

### POST /training/program/calculate 🔁
**Zweck:** Aggregate **ohne** Speichern berechnen (Live-Preview).
**Request:** voller Payload, aber `id:"0"`, Exercise-`id` als kleine Integer.
**Response `data`:** `planDistance`/`actualDistance`, `planDuration`/`actualDuration`, `planElevGain`/`actualElevGain`, `planSets`, `planTrainingLoad`/`actualTrainingLoad`, `exerciseBarChart[]`.

### POST /training/program/estimate 🔁
**Zweck:** Wie `calculate`, aber im Schedule-Kontext.
**Request:** `{ entity:{happenDay, idInPlan, sortNo, dayNo, sortNoInPlan, sortNoInSchedule}, program:{<voller Payload>} }`.
**Response `data`:** `{ distance, duration, pitch, sets, planHybridTotalSets, trainingLoad }`.

### POST /training/program/delete ✅
**Zweck:** Templates löschen. Sendet `yfheader`.
**Request:** flaches Array von Programm-ID-**Strings**, z. B. `["477881708182684047"]`.
**Response:** nur Envelope (kein `data`).

---

## Trainingsplan (Schedule & Plan)

### GET /training/schedule/query ✅
**Zweck:** Geplante Workouts im Kalender.
**Params:** `startDate`, `endDate` (YYYYMMDD), `supportRestExercise`.
**Response `data` (live-verifiziert 2026-06-01):**
- `id` (Plan-ID, String)
- `maxIdInPlan` **String** (z. B. `"5"`) — trotz numerischem Inhalt als String; vor Scheduling mit `parseInt` umwandeln
- `maxPlanProgramId` **String** — gleiche Besonderheit
- `startDay`/`endDay` **Integer** YYYYMMDD (z. B. `20260101`) — **nicht** String!
- `totalDay`, `pbVersion` (int), `executeStatus`
- `programs[]`, `weekStages[]` (`firstDayInWeek`, `stage`, `trainSum{plan*/actual*}`, `sumByType[]`)
- `sportDatasInPlan[]`/`sportDatasNotInPlan[]`
**Notes:** `entities[]`/`score` erscheinen im Live-Run (Account mit Plan), in diesem leeren-Plan-HAR nicht.

### POST /training/schedule/update 🔁
**Zweck:** Kalender-Workout **hinzufügen oder löschen** (Dual-Purpose).
**Hinzufügen:**
```json
{
  "entities": [{ "happenDay": "20260531", "idInPlan": <maxIdInPlan+1>, "sortNoInSchedule": 1 }],
  "programs": [{ "...voller Payload...", "idInPlan": <derselbe Wert> }],
  "versionObjects": [{ "id": <idInPlan>, "status": 1 }],
  "pbVersion": 2
}
```
**Löschen:** `versionObjects:[{ id, planProgramId, planId, status:3 }]`, `pbVersion:2`.
**Notes:**
- ⚠️ **Race Condition:** `idInPlan = maxIdInPlan + 1` aus vorherigem GET — parallele Inline-Schedules auf denselben Tag können kollidieren.
- ⚠️ **Enrichment nach POST:** Response liefert **nicht** die server-vergebenen IDs (`planId`, `planProgramId`). Strategie: direkt danach `schedule/query` für den `happenDay`, Entity per `idInPlan` matchen.

### GET /training/schedule/querysum ✅
**Zweck:** Wochen-/Tagessummen (Plan vs. tatsächlich).
**Params:** `startDate`, `endDate`, `teamId` (auch leer), `userId`.
**Response `data`:** `dayTrainSums[]` (`happenDay`, `dayTrainSum{actual*/plan*}`, `sumByType[]`), `weekTrains[]` (`firstDayInWeek`, `weekTrainSum`, `sumByType[]`, `weekEventTags[]` für Events/Ziele), `todayTrainingSum`.

### POST /training/plan/query 🔁
**Zweck:** Mehrwöchige Pläne auflisten.
**Request:** `{ "name":"", "statusList":[0], "startNo":0, "limitSize":10 }`.

### POST /training/plan/add 🔁
**Zweck:** Mehrwöchigen Plan erstellen.
**Request:** `name`, `overview`, `entities[]` (`{happenDay (kann ""), idInPlan, dayNo, sortNoInSchedule}` — `dayNo` = Offset ab Planstart), `programs[]` (volle Programm-Objekte, je eigenes `idInPlan`), `versionObjects[]`, `pbVersion`.
**Response:** `data:"<plan_id>"` (String).
**Notes:** 💡 Bei `estimatedType:6` gilt `estimatedValue == trainingLoad`, `estimatedDistance == distance`, `estimatedTime == duration`.

### GET /training/plan/detail 🔁
**Zweck:** Plan-Volldetails.
**Params:** `id`, `region`, `supportRestExercise`.
**Response `data` (Auswahl):** `id`, `name`, `totalDay`/`totalWeeks`/`minWeeks`/`maxWeeks`, `region`, `totalDistance`/`totalDuration`/`totalTrainingLoad`, `entities[]` (`{dayNo, idInPlan, planId, planProgramId, sortNo, executeStatus, exerciseBarChart[]}`), `programs[]`, `weekStages[]`, `competitions[]`, `eventTags[]`, `officalConfig{}`.

---

## Hilfs-Hosts

- **`faq.coros.com` `GET /openapi/v1/grayUser/find`** ✅ — Feature-Flag-/Gray-Release-Check. Query `app_id`, `readonly`, `sign`, `user_id`. Eigenes `sign`-Auth, **kein** `0000`-Envelope.
- **`static.coros.com` `/coros-traininghub-v2/static/profile/*_prod.json`** ✅ — statische Kataloge (Query `t` = Cache-Buster): `activitySourceDataProfile`, `activityModeProfileList`, `activityStrengthProfile`, `activityExportFileTypes` (mappt Sport-ID → erlaubte Export-`fileType`s). Inhaltlich = `profile/public/query`.
- **`sentry-v2.coros.com` `POST /api/20/envelope/`** ✅ — Telemetrie. **Ignorieren.**

---

# Cross-Referenz: offizielle Partner-API (`open.coros.com`)

COROS hat eine **offizielle** Partner-API (OAuth 2.0, Doc V2.0.6) — anderer Host, OAuth statt `accessToken`, **nur für genehmigte Firmen-Partner**. Für Einzelnutzer **kein Ersatz**, aber wertvoll als Einheiten-Referenz:
- Kalorien/Pace/Cadence/Power/HR/Gewicht/Distanz wie oben bestätigt.
- Timezone: 15-Minuten-System (`32` = UTC+8).
- ⚠️ Drittes sportType-Schema (`mode`/`subMode`) — **nicht** mit den Web-Schemata verwechseln.
- Rate-Limit dort: 1000/min. Web-API-Fehlercodes können abweichen (`1030` = Credentials).

---

*Diese Referenz beschreibt eine inoffizielle, undokumentierte API. Sie kann sich jederzeit ohne Vorankündigung ändern. Nutzung auf eigenes Risiko und nur mit dem eigenen Account.*
