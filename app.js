var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
app.set('view engine','ejs');
app.use(session({
        secret: 'yoursecret',
        resave: true,
        saveUninitialized: true
}));

app.use('/public', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.get('/', function (req, res){
 res.render("home");
 });

 app.get('/login', function(req, res) {
        res.render('login.ejs');
 });

 app.post('/auth' , function(req, res) {
        let name = req.body.username;
        let password = req.body.password;
        if (name && password) {
                conn.query('SELECT * FROM users WHERE name = ? AND password = ?' , [name, password],
                        function(error, results, fields) {
                                if (error) throw error;
                                if (results.length > 0) {
                                        req.session.loggedin = true;
                                        req.session.username = name;
                                        res.redirect('/membersOnly');
                                } else {
                                        res.send('Incorrect Username and/or Password!');

                                }
                                res.end();
                        });
                } else {
                        res.send('Please enter Username and Password!');
                        res.end();
                }
                
        });

// Users can access this if they are logged in
app.get('/membersOnly', function (req, res, next) {
        if (req.session.loggedin) {
                res.render('membersOnly');
        }
        else {
                res.send('Please login to view this page!');
        }
});

// Users can access this only if they are logged in
app.get('/addReview', function (req, res, next) {
        if (req.session.loggedin) {
                res.render('addReview');
        }
        else {
                res.send('Please login to view this page!');
        }
});

// User adds review if they are logged in and get's redirected to /reviews page
app.post('/addReview', function(req, res, next) {
        var platform = req.body.platform;
        var gameName = req.body.gameName;
        var review = req.body.review;
        var sql = 'INSERT INTO reviews (platform, gameName, review) VALUES (?, ?, ?)';
        
        conn.query(sql, [platform, gameName, review], function(err, result) {
            if (err) {
                console.error(err); 
                return res.status(500).send('Error inserting record'); // Send an error response
            }
            console.log('Record inserted');
            
            
            res.redirect('/reviews'); 
        });
    });


// Route to display the registration form
app.get('/register', function(req, res) {
        res.render('register.ejs');
    });
    
    // Route to handle registration form submission
    app.post('/register', function(req, res, next) {
        var username = req.body.username;
        var password = req.body.password;
    
        // Validate input
        if (!username || !password) {
            return res.status(400).send('Please provide a username and password.');
        }
    
        // Check if the username already exists
        conn.query('SELECT * FROM users WHERE name = ?', [username], function(err, results) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error checking username');
            }
    
            if (results.length > 0) {
                return res.status(400).send('Username already exists. Please choose a different username.');
            }
    
            // Insert the new user into the database
            var sql = 'INSERT INTO users (name, password) VALUES (?, ?)';
            conn.query(sql, [username, password], function(err, result) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error registering user');
                }
                console.log('User registered:', username);
    
                // Redirect to the login page after successful registration
                res.redirect('/login');
            });
        });
    });

    // Route to handle contact form submission
app.post('/contact', function (req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var message = req.body.message;
    
        // Validate input
        if (!name || !email || !message) {
            return res.status(400).send('Please fill out all fields.');
        }
    
        // Insert the contact form data into the database
        var sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
        conn.query(sql, [name, email, message], function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error submitting the form.');
            }
            console.log('Contact form submitted:', result);
    
            // Redirect back to the contact page
            res.redirect('/contact');
        });
    });

    // Route to display reviews
app.get('/reviews', function (req, res) {
        // Fetch reviews from the database
        var sql = 'SELECT * FROM reviews ORDER BY created_at DESC';
        conn.query(sql, function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error fetching reviews.');
            }
    
            // Render the reviews page and pass the reviews data
            res.render('reviews', { reviews: results });
        });
    });
    
app.get('/contact', function (req, res){
        res.render("contact");
});

app.get('/reviews', function (req, res){
        res.render("reviews");
});

app.get('/logout',(req,res) => {
        req.session.destroy();
        res.redirect('/');
})

app.listen(3000);
console.log('Node app is running on port 3000');
