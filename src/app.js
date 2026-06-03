require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');

// Routes
const indexRoutes = require('./routes');
const { errorHandler, routeHandler } = require('./helpers');
const { swaggerAuthenticate } = require('./middlewares/swagger.middlewares');

// app init
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(helmet());
app.use(morgan('[:date[web]] :method :url :status :response-time ms - :res[content-length]'));

const filePath = path.join(__dirname, './docs/swagger.json');
const publicPath = path.join(__dirname, 'public');

// Read the Swagger JSON file
const swaggerDocument = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Swagger UI route
app.use('/api-docs', swaggerAuthenticate, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve files in the `public` folder
app.use('/public', express.static(publicPath));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is healthy', timestamp: new Date().toISOString() });
});

app.use('/api/v1/', indexRoutes);

// error Handler
app.use(errorHandler);

// route Handler
app.use(routeHandler);

module.exports = app;
