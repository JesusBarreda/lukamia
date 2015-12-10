/**
 * Constantes
 */
var TIMEZONE = 'Europe/Madrid';

// Fijamos la fecha del sistema a la de 'Europe/Madrid'
process.env.TZ = TIMEZONE;

/**
 * Módulos
 */
var express = require('express'),
    path = require('path'),
    errorHandler = require('errorhandler'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    _ = require('underscore'),
    notificador = require('./modules/notificador');
    
var app = express();

/**
 * Modelos
 */
var Role = require('./models/roles'),
    Sesiones = require('./models/sesiones'),
    Notificaciones = require('./models/notificaciones');
    
/**
 * Configuración
 */ 
var env = process.env.NODE_ENV || 'development';
var configDB = {};

if(env == 'development') {
  configDB.host = 'localhost';
  configDB.port = 27017;
  configDB.db = process.env.DB;
  configDB.user = '';
  configDB.password = '';
  app.use(errorHandler({dumpExceptions: true, showStack: true}));
}

if(env == 'production') {
  configDB.host = process.env.DB_HOST;
  configDB.port = process.env.DB_PORT;
  configDB.db = process.env.DB;
  configDB.user = process.env.DB_USER;
  configDB.password = process.env.DB_PASSWORD;
  app.use(errorHandler());
}

app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('urlMongoDB', 'mongodb://' + configDB.user + ':' + configDB.password + '@' + configDB.host + ':' + configDB.port + '/' + configDB.db);
app.set('RUTA_TEMP', './public/temp/');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride(function(req, res) {
  if(req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(bodyParser.json());
app.use(cookieParser());
  
// Sesión
app.use(session({
  cookie: {maxAge: 60000 * 30}, // Tiempo expiración de sesión: 30 minutos
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
  clear_interval: 3000, // Tiempo chequeo eliminación sesiones expiradas: cada 3 segundos
  store: new MongoStore({
    host: configDB.host,
    port: configDB.port,
    db: configDB.db,
    username: configDB.user,
    password: configDB.password
  })
}));
  
// Middleware gestión mensajes
app.use(function(req, res, next) {
  res.locals.session = req.session;
    
  var msgWarning = req.session.warningMessage;
  delete req.session.warningMessage;
  if(msgWarning) res.locals.warningMessage = msgWarning;
  else res.locals.warningMessage = '';
    
  var msgInfo = req.session.infoMessage;
  delete req.session.infoMessage;
  if(msgInfo) res.locals.infoMessage = msgInfo;
  else res.locals.infoMessage = '';
    
  next();
});
  
// Ruta estática
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Eliminación de sesiones
 */
Sesiones.eliminar(configDB.host, configDB.port, configDB.db, configDB.user, configDB.password);

/**
 * Conexión con MongoDB
 */
mongoose.connect(app.get('urlMongoDB'));

/**
 * Inicialización de roles
 */
Role.inicializar();

/**
 * Inicializamos la estructura de configuración de las notificaciones en caso de que no exista.
 */
Notificaciones.inicializar();

/**
 * Iniciamos el notificador de eventos de la agenda.
 */
notificador.iniciarCronEventosAgenda();

/**
 * Resources
 */
require('./routes')(app);
require('./routes/admin')(app);
require('./routes/misPapas')(app);
require('./routes/albumes')(app);
require('./routes/blog')(app);
require('./routes/gastos')(app);
require('./routes/agenda')(app);
require('./routes/mailing')(app);

/**
 * Arranque servidor
 */
app.listen(app.get('port'), function() {
  console.log("Server listening on " + app.get('port'));
});