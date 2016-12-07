var express = require('express');
var sleep = require('sleep');
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
router.post('/sendOtp',function(req, res){
	var user = require('soteria-node/lib/management');

	var u = new user('http://webdev.cse.msu.edu/~yehanlin/vip/vipuserservices-mgmt-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/key.pem', true);
	console.log(res.locals.user.name)
	u.sendOtp("test@beta.com", res.locals.user.name, function(result){
		res.redirect("/users/authenticate");
	})


});
router.post('/authenticate',function(req, res){
	var user = require('soteria-node/lib/management');
	var authenticate = require('soteria-node/lib/authenticate');
	var qu = require('soteria-node/lib/query')

	var u = new user('http://webdev.cse.msu.edu/~yehanlin/vip/vipuserservices-mgmt-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/key.pem', true);

	var auth = new authenticate('http://webdev.cse.msu.edu/~morcoteg/Symantec/WSDL/vipuserservices-auth-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib//vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib//key.pem', true);

	var q = new qu('http://webdev.cse.msu.edu/~yehanlin/vip/vipuserservices-query-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/key.pem', true);





	var codeinput = req.body.otpcode;
	var smsinput = req.body.smscode;
	console.log(req.body.options)
	if(req.body.options=="code"){
		auth.authenticateUserByUserID_OTP(res.locals.user.username, codeinput, function(result) {
			console.log(result);
			if(result.success==1){

				return res.redirect("/users/success")

			}
			else{
				res.redirect('/users/fail')
			}

		console.log(locations)
		});
	}
	console.log("code:",codeinput,"sms:",smsinput);

	if(req.body.options=="push"){
		var locations;
		auth.authenticateUserWithPush(res.locals.user.username, 'This is a push message from Team Symantec. ' +
			'Accept Push to verify identity.', function(res1) {

			sleep.sleep(5);

			q.pollPushStatus(res1.transactionId,function(res2){
				console.log(res2.message);
				if(res2.message=='Mobile push request approved by user'){
					console.log("yes");

					return res.redirect("/users/success")

				}
				else{
					if(res2.message=='Mobile push request in progress'){
						req.flash("error_msg", "Time Out")
					}
					res.redirect("/users/fail")
				}
			});

		});
	}


	if(req.body.options == "sms"){
		console.log("==="+res.locals.user.name)
		auth.authenticateCredentialSMS(res.locals.user.name, smsinput, function(result){
			//console.log(req.headers)
			if(result.success == 1){
				return res.redirect("/users/success")
			}
			else{
				return res.redirect('/users/fail')
			}
		});
	}


});
// Register User
router.post('/register', function(req, res){
	var user = require('soteria-node/lib/management');

	var u = new user('http://webdev.cse.msu.edu/~yehanlin/vip/vipuserservices-mgmt-1.7.wsdl',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/vip_certificate.crt',
		'/Users/hanlinye/Desktop/node-sample/loginapp-master/node_modules/soteria-node/lib/key.pem', true);

	console.log('registering');
	var name = req.body.name;
	var email = req.body.email;
	var otp  = req.body.otp;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	console.log(name);
	// Validation
	req.checkBody('name', 'Phone Number is required').notEmpty();
	req.checkBody('email', 'CredentialID is required').notEmpty();
	//req.checkBody('email', 'Email is not valid').isEmail();
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


		User.createNewUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);

		});

		u.createUser(username, password, function(result){
			console.log("New User")
			//console.log(result)
			//return;

			u.addCredential(username, name, "SMS_OTP", null, function(result){
				console.log("SMS REG")
				//console.log(result);
				//return;
			})
			u.addCredential(username, email, "STANDARD_OTP",null,function(result){
				console.log("MB REG")
				//console.log(result);
				//return;
			})
		})



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