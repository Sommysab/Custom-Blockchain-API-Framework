module.exports = function(app) {  
    const index = require('../routes/index'); 
    app.use('/', index); 
}