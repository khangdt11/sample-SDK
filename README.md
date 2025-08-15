## This is a sample JavaScript SDK to render the timer widgets
---
Code inject to Publisher site
```JavaScript
<script>
        window.__AdhubConfig = {
           containerIds: ['time-widget', 'time-widget-1'], 
           publisherName: 'Publisher 1',
           pub_id: 1,
        };
</script>

<div id="time-widget"></div>
<div id="time-widget-1"></div>
<script src="http://localhost:3000/sdk/v1/Adhub-SDK.js"  async></script>    
```

--- 
Code Tracking event Client Side
```JavaScript
window.Adhub = window.Adhub || { event: { on: () => { } } };



document.addEventListener("DOMContentLoaded", () => {
    Adhub.events.on("SDK_READY", data => {
        console.log("EVENT: SDK_READY", data);
    });

    Adhub.events.on("CONFIG_LOADED", data => {
        console.log("EVENT: CONFIG_LOADED", data);
    });

    Adhub.events.on("SLOT_RENDER_START", data => {
        console.log("EVENT: SLOT_RENDER_START", data);
    });

    Adhub.events.on("SLOT_RENDERED", data => {
        console.log("EVENT: SLOT_RENDERED", data);
    });
});
```
