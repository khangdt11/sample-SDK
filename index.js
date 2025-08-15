const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const { ok } = require('assert');

app.use(express.json());

// -----------------------------
// Config Publishers Information
const Publishers =
{
    1: {
        pub_rank: 'VIP'
    },

    2: {
        pub_rank: 'Medium'
    }
}
//------------------------------
// Using CORS
app.use(cors());
// Provide Widget.js for pub
app.get('/sdk/:version/Adhub-SDK.js', (req, res) => {
    const { version } = req.params;
    const filePath = path.join(__dirname, 'sdk', version, 'Adhub-SDK.js');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.log(`SDK version ${version} not found!`);
            res.status(404).send('SDK version not found');
        }
    })

})

app.get('/api/publishers/:id', (req, res) => {
    const id = req.params.id;

    const pubInfo = Publishers[id];
    if (pubInfo) {
        res.json(pubInfo);
    } else {
        res.status(404).json({ error: 'Publisher not found!!' });
    }


});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Widget server is running at http://localhost:${PORT}`);
});