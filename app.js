// node modules
var express = require('express');
var request = require('request');
var querystring = require('querystring');

var client_id = '42b90932c49944f48758b87b7b021f7e'; // Your client id
var client_secret = '332388211e874073b6a42bdec032bb92'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.set('view engine', 'jade');

app.get('/', function (req, res){
  if (req.query.access_token){
    var options = {
      url: 'https://api.spotify.com/v1/users/setzerml/playlists',
      headers: { 'Authorization': 'Bearer ' + req.query.access_token },
      json: true
    };

    request.get(options, function(error, response, body) {
      var max = body.total;
      var randomPlaylist = Math.floor(Math.random() * (max - 1)) + 1;
      var playlist_id = body.item[randomPlayList].id;

      var options = {
        url: 'https://api.spotify.com/v1/users/setzerml/playlists/' + playlist_id + '/tracks',
          headers: { 'Authorization': 'Bearer ' + req.query.access_token },
          json: true
        };
      request.get(options, function(error, response, body){
        var howManyTracks = body.items.length;
        var randomTrack = Math.floor(Math.random() * (howManyTracks - 1));
        var trackId = body.items[randomTrack].track.id;

        res.render('index', { title: 'tracks', track: trackId});
      });
    });
  } else {
    res.render('index', { title: 'Hey', message: 'Hello there!'});
  }
});

app.get('/login', function(req, res){
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  // var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null) { // || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // we can also pass the token to the browser to make requests from there
        res.redirect('/?' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);









































