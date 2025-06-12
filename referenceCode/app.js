import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import routes from './routes/index.js';
import callback from './routes/callback.js';

// Load the environment variables
import ENV from './lib/envar.js';

// For test use
import test from './routes/test.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();

// Middleware to add port parameter to all res.render calls
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, options, callback) {
        if (!options) {
            options = {};
        }
        options.PORT = ENV.PORT;
        options.DEV = ENV.DEV; 
        originalRender.call(this, view, options, callback);
    };
    next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/callback', callback);
app.use('/test', test);
// Serve static files from the "assets" directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// catch 404 and forwarding to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {
            status: err.status,
            details: err.stack
        }
    });
});

export default app;
