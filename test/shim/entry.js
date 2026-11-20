const React = require('react'); const RD = require('react-dom'); const RDC = require('react-dom/client');
window.React = React; window.ReactDOM = Object.assign({}, RD, { createRoot: RDC.createRoot });
