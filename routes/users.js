var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){

	res.render('login');
});
router.get('/authenticate',function(req,res){
	res.render('authenticate');
});
router.get('/success',function(req,res){
	res.render('success');
});
router.get('/fail',function(req,res){
	res.render('fail');
});
router.post('/authenticate',function(req,res){
	var user = require('soteria-node/lib/user');
	var authenticate = require('soteria-node/lib/authenticate');

	var u = new user('http://webdev.cse.msu.edu/~yehanlin/vip/vipuserservices-mgmt-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/key.pem ', true);

	var auth = new authenticate('http://webdev.cse.msu.edu/~morcoteg/Symantec/WSDL/vipuserservices-auth-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib//vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib//key.pem', true);

	// console.log()
	// auth.authenticateCredentialWithPush('VSMT66551388', 'This is a push message from Team Symantec. Accept Push to verify identity.', function(res) {
	// 	console.log(res);
	// });

	console.log(res.locals.user);
	var codeinput = req.body.otpcode;
	var smsinput = req.body.sms;
	console.log(codeinput);
	if(codeinput!=""){
		auth.authenticateUserByUserID_OTP(res.locals.user.username, codeinput, function(result) {
			console.log(result);
			if(result.success==1){
				res.redirect('/users/success')
			}
		});
	}
	else{
		res.redirect('/users/fail')
	}
	//res.redirect('/users/success');


});
// Register User
router.post('/register', function(req, res){
	console.log('registering');
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	console.log(name);
	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});



passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'authenticate', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
    // console.log("success");
	 //  console.log(req.body.username);
    // res.redirect('/authenticate');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;