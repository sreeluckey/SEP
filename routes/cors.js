const cors = require('cors');

const whitelist = ['http://localhost:3000', 'http://localhost:5000','https://bhejo.herokuapp.com/','https://bhejo.herokuapp.com:3000','https://bhejo.herokuapp.com:5000'];
const corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log(req.header('Origin'));
    if(whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    }
    else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);