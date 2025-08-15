(function (global) {
    const Adhub = {
        events: {
            _handlers: {},
            on(event, handler) {
                if (!this._handlers[event]) this._handlers[event] = [];
                this._handlers[event].push(handler);
            },
            emit(event, data) {
                (this._handlers[event] || []).forEach(handler => handler(data));
            }
        }
    };

    // Immediately announce SDK is loaded
    Adhub.events.emit("SDK_READY", {
        timestamp: Date.now(),
        message: "Adhub SDK loaded successfully"
    });

    async function fetchPubInfo(id) {
        try {
            const res = await fetch('http://localhost:3000/api/publishers/' + id);
            const data = await res.json();
            return data.pub_rank;
        } catch (err) {
            console.error("Fetch error:", err);
            return "N/A";
        }
    }

    // Hàm render widget mới
    Adhub.renderWidget = async function (element, config) {
        if (!element) return;

        Adhub.events.emit("SLOT_RENDER_START", {
            timestamp: Date.now(),
            slotId: element.id
        });

        const shadow = element.attachShadow({ mode: 'open' });

        const style = `
            :host {
                all: initial;
                display: inline-block;
                font-family: system-ui, Arial, sans-serif;
                line-height: 1.4;
            }
            .widget {
                padding: 12px 16px;
                border-radius: 8px;
                background: linear-gradient(135deg, #4f46e5, #3b82f6);
                color: white;
                font-size: 16px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: inline-flex;
                flex-direction: column;
                gap: 4px;
                min-width: 220px;
                user-select: none;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
            }
            .time {
                font-size: 14px;
                opacity: 0.9;
            }`;

        shadow.innerHTML = `
            <style>${style}</style>
            <div class="widget">
                <div class="greeting" id="greeting">
                    Hello ${config.publisherName}
                    <p>Loading...</p>
                </div>
                <div class="time" id="time">--:--:--</div>
            </div>
        `;

        const pubRank = await fetchPubInfo(config.pub_id);
        shadow.querySelector("#greeting p").textContent = `${pubRank}`;

        function updateTime() {
            const now = new Date();
            shadow.getElementById('time').textContent = now.toLocaleTimeString();
        }
        updateTime();
        setInterval(updateTime, 1000);

        Adhub.events.emit("SLOT_RENDERED", {
            timestamp: Date.now(),
            slotId: element.id,
            pubRank
        });
    };

    function start(config) {
        if (!config || !config.containerIds || !config.publisherName) {
            console.error(`Adhub: Please provide containerIds and publisherName!`);
            return;
        }

        Adhub.events.emit("CONFIG_LOADED", {
            timestamp: Date.now(),
            config: config
        });

        const ids = Array.isArray(config.containerIds) ? config.containerIds : [config.containerIds];
        Adhub.hostEls = ids.map(id => document.getElementById(id));

        Adhub.hostEls.forEach(async (element) => {
            if (!element) {
                console.error(`Adhub: Element with ID "${element?.id || 'unknown'}" not found`);
                return;
            }
            if (!element.shadowRoot) {
                await Adhub.renderWidget(element, config);
            }
        });
    }

    Adhub.init = function (config) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => start(config));
        } else {
            start(config);
        }
    };

    if (global.__AdhubConfig) {
        Adhub.init(global.__AdhubConfig);
    }

    global.Adhub = Adhub;
}(window));
