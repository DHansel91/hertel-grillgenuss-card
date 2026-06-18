/**
 * Hertel Grillgenuss Card für Home Assistant
 * Zeigt Hertel Grillgenuss Standorte sortiert nach Wochentagen.
 *
 * Installation: www/hertel-grillgenuss-card.js
 *
 * v2.0.0 – Umbau auf LitElement, Editor auf ha-form, getGridOptions
 */

const CARD_VERSION = "2.0.0";

const LitElement =
  window.LitElement ||
  Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace") || customElements.get("hui-view")
  );
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const loadHaComponents = async () => {
  if (customElements.get("ha-form")) return;
  try {
    if (window.loadCardHelpers) {
      const helpers = await window.loadCardHelpers();
      const card = helpers.createCardElement({ type: "entities", entities: [] });
      await card?.constructor?.getConfigElement?.();
    }
  } catch (e) {
    console.warn("Hertel-Card: ha-form konnte nicht vorgeladen werden", e);
  }
};
loadHaComponents();

const WEEKDAY_ABBR = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function jsDayToOrder(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}
function todayOrder() {
  return jsDayToOrder(new Date().getDay());
}
function todayAbbr() {
  return WEEKDAY_ABBR[todayOrder()];
}
function tomorrowAbbr() {
  return WEEKDAY_ABBR[(todayOrder() + 1) % 7];
}
function formatDate(order) {
  const today = new Date();
  const diff = (order - todayOrder() + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

const SVG_CLOCK = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const SVG_PIN = html`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;

// ── Card ───────────────────────────────────────────────────────────────────
class HertelGrillgenussCard extends LitElement {
  static get properties() {
    return { hass: {}, _config: { state: true } };
  }

  static getConfigElement() {
    return document.createElement("hertel-grillgenuss-card-editor");
  }
  static getStubConfig() {
    return { entity: "sensor.hertel_grillgenuss_standorte", filter: "all" };
  }

  setConfig(config) {
    if (!config.entity) throw new Error("entity required");
    this._config = config;
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, min_rows: 2 };
  }

  _getLocations() {
    if (!this.hass || !this._config?.entity) return [];
    const state = this.hass.states[this._config.entity];
    return state?.attributes?.locations || [];
  }

  _applyFilter(locations) {
    const f = this._config.filter || "all";
    const zip =
      this._config.zipcode ||
      this.hass?.states[this._config.entity]?.attributes?.search_zipcode ||
      "";
    if (f === "today") return locations.filter((l) => l.day === todayAbbr());
    if (f === "tomorrow") return locations.filter((l) => l.day === tomorrowAbbr());
    if (f === "week") {
      const ti = todayOrder();
      return locations.filter((l) => WEEKDAY_ABBR.indexOf(l.day) >= ti);
    }
    if (f === "plz" && zip) return locations.filter((l) => l.zipcode === zip);
    return locations;
  }

  _mapsUrl(loc) {
    const addr = encodeURIComponent(`${loc.hint}, ${loc.zipcode} ${loc.city}`);
    const isApple =
      /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) &&
      "ApplePaySession" in window;
    return isApple
      ? `https://maps.apple.com/?q=${addr}`
      : `https://maps.google.com/maps?q=${addr}`;
  }

  render() {
    if (!this._config) return html``;

    const c = this._config;
    const locations = this._getLocations();
    const filtered = this._applyFilter(locations)
      .slice()
      .sort((a, b) => WEEKDAY_ABBR.indexOf(a.day) - WEEKDAY_ABBR.indexOf(b.day));

    const title = c.title || "Hertel Grillgenuss";
    const icon = c.icon || "🍗";
    const hideHeader = c.hide_header === true;
    const todayDay = todayAbbr();

    let lastDay = null;
    const rows = filtered.map((loc) => {
      const isToday = loc.day === todayDay;
      const sameDay = loc.day === lastDay;
      lastDay = loc.day;

      const [dateDay = "", dateMon = ""] = formatDate(
        WEEKDAY_ABBR.indexOf(loc.day)
      ).split(" ");

      return html`
        <div class="loc-row ${sameDay ? "same-day" : ""}">
          <div class="date-badge ${isToday ? "today" : ""}">
            <span class="date-weekday">${loc.day}</span>
            <span class="date-day">${dateDay}</span>
            <span class="date-month">${dateMon}</span>
          </div>
          <a
            class="loc-body"
            href=${this._mapsUrl(loc)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="loc-left">
              <span class="loc-hint">${loc.hint}</span>
              <span class="loc-sub">${SVG_CLOCK} ${loc.time}</span>
              <span class="loc-sub"
                >${SVG_PIN} ${loc.zipcode} ${loc.city}${loc.address
                  ? " · " + loc.address
                  : ""}</span
              >
            </div>
            ${c.hide_distance
              ? ""
              : html`<span class="loc-dist">${loc.distance}</span>`}
          </a>
        </div>
      `;
    });

    return html`
      <ha-card>
        ${hideHeader
          ? ""
          : html`
              <div class="card-header">
                ${c.hide_icon
                  ? ""
                  : html`<div class="icon" aria-hidden="true">${icon}</div>`}
                <div class="header-text">
                  ${c.hide_title
                    ? ""
                    : html`<p class="card-title">${title}</p>`}
                  ${c.hide_count
                    ? ""
                    : html`<p class="card-subtitle">
                        ${filtered.length} von ${locations.length} Standorten
                      </p>`}
                </div>
              </div>
              <div class="divider"></div>
            `}
        <div class="content">
          ${filtered.length === 0
            ? html`
                <div class="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M16 3h2a2 2 0 0 1 2 2v4M8 12h8M8 8h4M8 16h4"/></svg>
                  <p>Keine Standorte gefunden</p>
                </div>
              `
            : rows}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        overflow: hidden;
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 12px;
      }
      .icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: #e8501a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .header-text {
        display: flex;
        flex-direction: column;
      }
      .card-title {
        font-size: 15px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin: 0;
      }
      .card-subtitle {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 2px 0 0;
      }
      .divider {
        height: 1px;
        background: var(--divider-color, rgba(0, 0, 0, 0.08));
      }
      .content {
        padding: 8px 0 10px;
      }
      .loc-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 16px;
      }
      .loc-row + .loc-row {
        border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.06));
      }
      .date-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        width: 42px;
        min-width: 42px;
        flex-shrink: 0;
      }
      .date-badge.today .date-weekday,
      .date-badge.today .date-day,
      .date-badge.today .date-month {
        color: #e8501a;
      }
      .date-weekday {
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color);
        line-height: 1;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .date-day {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-text-color);
        line-height: 1.1;
        text-align: center;
      }
      .date-month {
        font-size: 11px;
        color: var(--secondary-text-color);
        line-height: 1;
        text-align: center;
      }
      .same-day .date-badge {
        visibility: hidden;
      }
      .loc-body {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 1;
        min-width: 0;
        padding: 7px 10px;
        background: var(--secondary-background-color, #f5f5f5);
        border-left: 3px solid #e8501a;
        border-radius: 0 8px 8px 0;
        text-decoration: none;
        cursor: pointer;
        transition: filter 0.15s;
      }
      .loc-body:hover {
        filter: brightness(0.95);
      }
      .loc-left {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        min-width: 0;
      }
      .loc-hint {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .loc-sub {
        font-size: 12px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .loc-sub svg {
        flex-shrink: 0;
        opacity: 0.6;
      }
      .loc-dist {
        font-size: 12px;
        font-weight: 500;
        color: #e8501a;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 28px 16px;
        color: var(--secondary-text-color);
        gap: 8px;
      }
      .empty-state svg {
        opacity: 0.35;
      }
      .empty-state p {
        margin: 0;
        font-size: 14px;
      }
    `;
  }
}

customElements.define("hertel-grillgenuss-card", HertelGrillgenussCard);

// ── Visual editor (ha-form) ──────────────────────────────────────────────────
class HertelGrillgenussCardEditor extends LitElement {
  static get properties() {
    return { hass: {}, _config: { state: true } };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  _schema() {
    const c = this._config || {};
    const headerFields = [];
    if (!c.hide_header) {
      if (!c.hide_icon) {
        headerFields.push({ name: "icon", selector: { text: {} } });
      }
      if (!c.hide_title) {
        headerFields.push({ name: "title", selector: { text: {} } });
      }
    }

    return [
      { name: "entity", selector: { entity: { domain: "sensor" } } },
      {
        name: "filter",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "all", label: "Alle Standorte" },
              { value: "today", label: "Nur heute" },
              { value: "tomorrow", label: "Nur morgen" },
              { value: "week", label: "Diese Woche (ab heute)" },
              { value: "plz", label: "Nach PLZ filtern" },
            ],
          },
        },
      },
      ...(c.filter === "plz"
        ? [{ name: "zipcode", selector: { text: {} } }]
        : []),
      ...headerFields,
      {
        type: "grid",
        name: "",
        schema: [
          { name: "hide_header", selector: { boolean: {} } },
          { name: "hide_icon", selector: { boolean: {} } },
          { name: "hide_title", selector: { boolean: {} } },
          { name: "hide_count", selector: { boolean: {} } },
          { name: "hide_distance", selector: { boolean: {} } },
        ],
      },
    ];
  }

  _computeLabel = (schema) => {
    const labels = {
      entity: "Sensor Entity",
      filter: "Zeitraum-Filter",
      zipcode: "PLZ (leer = aus Sensor-Attribut search_zipcode)",
      icon: "Icon (Emoji oder Text)",
      title: "Name",
      hide_header: "Header verbergen",
      hide_icon: "Icon verbergen",
      hide_title: "Name verbergen",
      hide_count: "Standort-Anzahl verbergen",
      hide_distance: "Entfernung verbergen",
    };
    return labels[schema.name] ?? schema.name;
  };

  _valueChanged(ev) {
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...ev.detail.value } },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.hass || !this._config) return html``;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema()}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

customElements.define(
  "hertel-grillgenuss-card-editor",
  HertelGrillgenussCardEditor
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hertel-grillgenuss-card",
  name: "Hertel Grillgenuss Standorte",
  description: "Zeigt Hertel Grillgenuss Standorte sortiert nach Wochentagen.",
  preview: true,
  documentationURL: "https://github.com/DHansel91/hertel-grillgenuss-card",
});

console.info(
  `%c HERTEL-GRILLGENUSS-CARD %c v${CARD_VERSION} `,
  "color: white; background: #e8501a; font-weight: 700;",
  "color: #e8501a; background: white; font-weight: 700;"
);
