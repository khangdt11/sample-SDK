```javascript
(function (global) {

    var AdhubSDK = {};

    AdhubSDK.init = function (config) {
        if (!config || !config.containerId) {
            console.error("AdhubSDK: containerId is required");
            return;
        }

        const hostEl = document.getElementById(config.containerId);
        if (!hostEl) {
            console.error("AdhubSDK: container element not found");
            return;
        }

        // create shadow root
        const shadow = hostEl.attachShadow({ mode: 'open' });

        // template html + css (shadow DOM encapsulated)
        const tpl = document.createElement('template');
        tpl.innerHTML = `
            <style>
                :host {
                    all: initial; /* reset inherited styles for predictability */
                    display: inline-block;
                    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
                    line-height: 1;
                }

                .widget {
                    margin: 10px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    align-items: flex-start;
                    justify-content: center;
                    padding: 12px 14px;
                    min-width: 250px;
                    min-height: 90px;
                    border-radius: 12px;
                    box-shadow: 0 6px 18px rgba(14,22,34,0.12), inset 0 1px 0 rgba(255,255,255,0.02);
                    background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.9));
                    color: #0b1220;
                    user-select: none;
                    -webkit-font-smoothing: antialiased;
                    transition: transform .12s ease, box-shadow .12s ease;
                }

                .widget:active { transform: translateY(1px); }

                /* header row: timezone label */
                .tz {
                    font-size: 12px;
                    font-weight: 600;
                    opacity: 0.85;
                    letter-spacing: 0.2px;
                }

                /* main time */
                .time {
                    font-size: 20px;
                    font-weight: 700;
                    display: block;
                    background: linear-gradient(90deg, #1f6feb, #6f4ef5);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    padding: 2px 0;
                }

                /* small note */
                .note {
                    font-size: 11px;
                    opacity: 0.7;
                }

                /* decorative dot/pulse */
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #4ade80;
                    box-shadow: 0 0 0 rgba(74, 222, 128, 0.45);
                    animation: pulse 2s infinite;
                    margin-left: 8px;
                    flex-shrink: 0;
                }

                .row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    justify-content: space-between;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.45); }
                    70% { box-shadow: 0 0 0 12px rgba(74, 222, 128, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
                }

                /* dark mode */
                @media (prefers-color-scheme: dark) {
                    .widget {
                        background: linear-gradient(180deg, rgba(18,20,28,0.85), rgba(10,12,18,0.7));
                        color: #e6eef8;
                        box-shadow: 0 8px 20px rgba(3,6,12,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
                    }
                    .note, .tz { opacity: 0.85; }
                    .dot { background: #34d399; }
                }

                /* compact variant */
                :host([compact]) .widget {
                    padding: 8px 10px;
                    border-radius: 8px;
                    min-width: 160px;
                }

                /* small screens */
                @media (max-width: 360px) {
                    .time { font-size: 16px; }
                }

                /* accessibility focus */
                .widget:focus {
                    outline: 3px solid rgba(31,111,235,0.18);
                    outline-offset: 2px;
                }
            </style>

            <div class="widget" role="region" aria-label="Time widget" tabindex="0">
                <div class="row">
                    <div>
                        <div class="tz" id="tz">Time Zone</div>
                        <div class="note" id="note">Displaying time for IP-based location</div>
                    </div>
                    <div class="dot" aria-hidden="true"></div>
                </div>
                <div class="time" id="time" aria-live="polite" aria-atomic="true">--:--:--</div>
            </div>
        `;

        shadow.appendChild(tpl.content.cloneNode(true));

        const tzEl = shadow.getElementById('tz');
        const timeEl = shadow.getElementById('time');
        const noteEl = shadow.getElementById('note');

        // helper to update time using timezone
        function makeUpdater(timezone) {
            return function update() {
                const now = new Date();
                // show timezone name + formatted time
                try {
                    timeEl.textContent = now.toLocaleString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } catch (e) {
                    // fallback: local time if timezone invalid
                    timeEl.textContent = now.toLocaleTimeString();
                }
            };
        }

        // try IP-based timezone first; fallback to browser tz
        fetch('https://ipapi.co/json/')
            .then(res => {
                if (!res.ok) throw new Error('ipapi failed');
                return res.json();
            })
            .then(data => {
                const tz = data && data.timezone ? data.timezone : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
                tzEl.textContent = tz;
                noteEl.textContent = data && data.city ? `${data.city}, ${data.country_name}` : 'IP-based location';
                // initial update + interval
                const updater = makeUpdater(tz);
                updater();
                const iv = setInterval(updater, 1000);
                // expose to config for potential stop
                if (config && config._internals) config._internals._interval = iv;
            })
            .catch(err => {
                // fallback: use browser timezone
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                tzEl.textContent = tz + ' (local)';
                noteEl.textContent = 'Using browser timezone (IP lookup failed)';
                const updater = makeUpdater(tz);
                updater();
                const iv = setInterval(updater, 1000);
                if (config && config._internals) config._internals._interval = iv;
            });

    };

    window.AdhubSDK = AdhubSDK;

}(window));

```
