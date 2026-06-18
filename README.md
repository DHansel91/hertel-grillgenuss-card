# Hertel Grillgenuss Card

[![Validate](https://github.com/DHansel91/hertel-grillgenuss-card/actions/workflows/validate.yml/badge.svg)](https://github.com/DHansel91/hertel-grillgenuss-card/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/DHansel91/hertel-grillgenuss-card?sort=semver)](https://github.com/DHansel91/hertel-grillgenuss-card/releases)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Zeigt die Standorte von **Hertel Grillgenuss** sortiert nach Wochentagen als
Lovelace-Card in Home Assistant.

## Features

- Standorte gruppiert/gefiltert nach Wochentag
- Filter: heute, morgen, gesamte Woche oder nach PLZ
- Visual Editor zur Konfiguration

## Installation

### HACS (empfohlen)

1. HACS → **Frontend** → ⋮ → **Custom repositories**
2. Repository-URL `https://github.com/DHansel91/hertel-grillgenuss-card` eintragen, Kategorie **Lovelace/Plugin**
3. „Hertel Grillgenuss Card" installieren

### Manuell

1. `hertel-grillgenuss-card.js` nach `config/www/` kopieren
2. In Home Assistant → **Einstellungen → Dashboards → Ressourcen** hinzufügen:
   - URL: `/local/hertel-grillgenuss-card.js`
   - Typ: **JavaScript-Modul**

## Konfiguration

| Option    | Typ    | Standard | Beschreibung                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| `type`    | string | –        | `custom:hertel-grillgenuss-card`                         |
| `entity`  | string | –        | Sensor mit den Standorten (`attributes.locations`)       |
| `filter`  | string | `"all"`  | `all`, `today`, `tomorrow`, `week` oder `plz`            |
| `zipcode` | string | –        | PLZ-Filter (nur bei `filter: plz`)                       |

### Beispiel

```yaml
type: custom:hertel-grillgenuss-card
entity: sensor.hertel_grillgenuss_standorte
filter: today
```

## Lizenz

[MIT](LICENSE)
