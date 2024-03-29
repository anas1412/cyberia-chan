$(document).ready(function() {
	eventBind();
	new Chat();
});

function eventBind () {
	$('.avatar-select').click( function () {
		if ( CHAT.generateAvatar(this) ) {
			$('.chat-avatar-select').fadeOut();
			$('.chat-select').fadeIn();
			//Enter chat directly instead of choosing from menu
			//$('#cyberia-room').fadeIn();
		};
	});

	$('.chat-broadcast').on('click', function () {
		CHAT.initPublicChat();
		$('#cyberia-options').fadeOut();
		$('#cyberia-room').fadeIn();
	});
	//Event click on private chat
	// $('.chat-privately').on('click', function () {
	// 	$('.chat-select').fadeOut();
	// 	$('.chat-name').fadeIn();
	// });

	$('#login-submit').on('click', function () {
		if( CHAT.usernameSubmit() ) {
			$('#cyberia').fadeOut();
			$('#cyberia-options').fadeIn();
		}
	});
	$('#form-name').keydown(function (event) {
		if ( event.which == 13 && CHAT.usernameSubmit() ){
			$('#cyberia').fadeOut();
			$('#cyberia-options').fadeIn();
		}
	});

	$('#form-chat').keydown(function (event) {
		if ( event.which == 13 ) {
			CHAT.initPrivateChat();
			$('#cyberia-options').fadeOut();
			$('#cyberia-room').fadeIn();
		};
	})
	$('#form-private-name').click(function (event) {
		CHAT.initPrivateChat();
		$('#cyberia-options').fadeOut();
		$('#cyberia-room').fadeIn();
	});

	$('.message-input button').on('click', function () {
		CHAT.submit();
	});
	$('.message-input input').keydown(function (event) {
		if ( event.which == 13 )
			CHAT.submit();
	});
	$('.logout button').on('click', function () {
		CHAT.logout();
	});
}


function Chat() {
	window.CHAT = {
		messageObj: $('#talk'),
		scrollObj: false,
		username: null,
		userid: null,
		userto: null,
		socket: null,
		channel: null,
		avatarList: ['bakyura', 'gg', 'setton', 'kanra', 'tanaka', 'zaika', 'zawa', 'kakka'],
		avatar: null,
		sound: new Howl({
			urls: [
				"../javascripts/effect.mp3"
			],
			volume: 1,
			sprite: {
				bubble: [
					0,
					287.3469387755102
				],
				userin: [
					2000,
					975.2380952380952
				],
				userout: [
					4000,
					400.5442176870746
				]
			}
		}),
		logout: function(){
			this.socket.disconnect();
			location.reload();
		},
		submit: function(){
			var message = $("#message").val();
			if($.trim(message) != ''){
				var obj = {
					userid: this.userid,
					username: this.username,
					content: message,
					avatar: this.avatar
				};
				if (this.userto != null) {
					obj.userto = this.userto;
					this.socket.emit('directMessage', obj);
				} else this.socket.emit('message', obj);
				$("#message").val('');
			}
			return false;
		},
		
		randomUid: function(){
			// Give Me 450!
			return new Date().getTime() + "" + Math.floor(Math.random() * 12 + 450);
		},
		generateAvatar: function (that) {
			this.avatar = $(that).data('avatar');
			if (this.avatar != undefined && this.avatarList.indexOf(this.avatar) != -1) {
				return true;
			} else return false;
		},
		getLocalTime: function () {
			var time = new Date();
			function appendZero(s){ return ("00" + s).substr( (s + "").length); }
			return appendZero(time.getHours()) + ":" + appendZero(time.getMinutes()) + ":" + appendZero(time.getSeconds());
		},
		updateInfo:function(o, action){
			 //var onlineUsers = o.onlineUsers;
			 //var onlineCount = o.onlineCount;
			 var users = Object.values(o.onlineUsers);
			var user = o.user;
			
			var html = '';
			html += '<div class="message-system">';
			html += '►► ' + user.username;

			if (action == 'joinPub') {
				html += ' joined the room, '+ o.onlineCount +' connected users: ' + users;
				
			//} else if (action == 'joinPrv') {
			//	html += ' : Private Room コネクト'
			} else html += ' has left the room, '+ o.onlineCount +' connected users: ' + users;

			// html += (action == 'joinPub') ? ' さんが入室しました' : ' さんが退室しました';

			html += '</div>';
			var section = document.createElement('section');
			section.className = 'system';
			section.innerHTML = html;
			this.messageObj.append(section);
			this.scrollToBottom();	
		},
		usernameCheck: function() {
			var username = $("#form-name").val();
			if($.trim(message) != ''){
				return username
			} else {
				alert('The name is incorrect');
				this.logout();
				return false;
			}
		},
		usernameSubmit: function(){
			if(username = this.usernameCheck()){
				this.init(username);
				return true;
			} else return false;
		},
		init:function(username){

			this.userid = this.randomUid();
			this.username = username;
			
			this.socket = io();
			this.socket.emit('login', {userid:this.userid, username:this.username});

			this.socket.on('error' + CHAT.userid, function (status) {
				if (status = -1) {
					alert('The length of the name must be 20 characters or less');
					CHAT.logout();
				} else if (status = -2) {
					alert('The name is already in use');
					CHAT.logout();
				}else if (status = -3) {
					alert('You cant have 2 accounts!');
					CHAT.logout();
				};
			});
		},
		//Send message in public chat
		initMessage: function (obj) {

			// Todo
			//	var isMe = (obj.userid == CHAT.userid) ? true : false;

			var avatarDiv = '<div class="avatar-wrap">' + 
								'<div class="avatar avatar-' + obj.avatar + '"></div>';
			var usernameDiv = '<div class="username">' + obj.username + '</div>'; // Listen on userto's username
			var timeDiv = '<div class="message-time">' + CHAT.getLocalTime() + '</div>' +
							'</div>';
			var contentTailDiv = '<div class="tail-wrap content-' + obj.avatar + '"></div>';
			var contentDiv = '<div class="content-wrap content-text content-' + obj.avatar + '">' + obj.content + '</div>';

			var section = document.createElement('section');

			section.className = 'user';

			section.innerHTML = avatarDiv + usernameDiv + timeDiv + contentTailDiv + contentDiv;

			CHAT.messageObj.append(section);
			CHAT.sound.play('bubble');
			CHAT.scrollToBottom();
		},
		initPublicChat: function(){
			this.socket.emit('joinPub', { userid:this.userid, username:this.username, avatar: CHAT.avatar });

			this.socket.on('joinPub', function(o){
				CHAT.updateInfo(o, 'joinPub');
				CHAT.sound.play('userin');
			});
			
			this.socket.on('logout', function(o){
				CHAT.updateInfo(o, 'logout');
				CHAT.sound.play('userout');
			});

			this.socket.on('message', function(obj){
				CHAT.initMessage(obj);
			});
		},
		// initPrivateChat: function(){
		// 	this.userto = $('#form-chat').val();

		// 	this.socket.emit('joinPrv', {userid:this.userid, username:this.username, avatar: CHAT.avatar, userto: this.userto});
			
		// 	this.socket.on('joinPrv' + CHAT.username + CHAT.userto, function(o){
		// 		CHAT.updateInfo(o, 'joinPrv');
		// 		CHAT.sound.play('userin');
		// 	});
		// 	this.socket.on('joinPrv' + CHAT.userto + CHAT.username, function(o){
		// 		CHAT.updateInfo(o, 'joinPrv');
		// 		CHAT.sound.play('userin');
		// 	});
			
		// 	this.socket.on('logout' + CHAT.username, function(o){
		// 		CHAT.updateInfo(o, 'logout');
		// 		CHAT.sound.play('userout');
		// 	});

		// 	this.socket.on('directMessage' + CHAT.username + CHAT.userto, function (obj) {
		// 		CHAT.initMessage(obj);
		// 	});

		// 	this.socket.on('directMessage' + CHAT.userto + CHAT.username, function (obj) {
		// 		CHAT.initMessage(obj);
		// 	});
		// },
		scrollToBottom: function () {
			// Todo: fix scroll issue or workaround
			// Workaround 1: Use a golden varaible.
			window.scrollTo(0, document.body.scrollHeight);

			this.scrollObj = ($(window).scrollTop() == 0) ? true : false;
			if ( this.scrollObj == true || ( $(document).height() - ( $(window).scrollTop() + $(window).height() ) ) * (Math.sqrt(5) - 1) / 2 <= $('section.user').last().height() )
				$("body").animate({ scrollTop: $('#talk').height() });
		}
	}
}

/*!
 *  howler.js v1.1.25
 *  howlerjs.com
 *
 *  (c) 2013-2014, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
!function(){var e={},t=null,n=!0,r=!1;try{"undefined"!=typeof AudioContext?t=new AudioContext:"undefined"!=typeof webkitAudioContext?t=new webkitAudioContext:n=!1}catch(i){n=!1}if(!n)if("undefined"!=typeof Audio)try{new Audio}catch(i){r=!0}else r=!0;if(n){var s=void 0===t.createGain?t.createGainNode():t.createGain();s.gain.value=1,s.connect(t.destination)}var o=function(e){this._volume=1,this._muted=!1,this.usingWebAudio=n,this.ctx=t,this.noAudio=r,this._howls=[],this._codecs=e,this.iOSAutoEnable=!0};o.prototype={volume:function(e){var t=this;if(e=parseFloat(e),e>=0&&1>=e){t._volume=e,n&&(s.gain.value=e);for(var r in t._howls)if(t._howls.hasOwnProperty(r)&&t._howls[r]._webAudio===!1)for(var i=0;i<t._howls[r]._audioNode.length;i++)t._howls[r]._audioNode[i].volume=t._howls[r]._volume*t._volume;return t}return n?s.gain.value:t._volume},mute:function(){return this._setMuted(!0),this},unmute:function(){return this._setMuted(!1),this},_setMuted:function(e){var t=this;t._muted=e,n&&(s.gain.value=e?0:t._volume);for(var r in t._howls)if(t._howls.hasOwnProperty(r)&&t._howls[r]._webAudio===!1)for(var i=0;i<t._howls[r]._audioNode.length;i++)t._howls[r]._audioNode[i].muted=e},codecs:function(e){return this._codecs[e]},_enableiOSAudio:function(){var e=this;if(!t||!e._iOSEnabled&&/iPhone|iPad|iPod/i.test(navigator.userAgent)){e._iOSEnabled=!1;var n=function(){var r=t.createBuffer(1,1,22050),i=t.createBufferSource();i.buffer=r,i.connect(t.destination),void 0===i.start?i.noteOn(0):i.start(0),setTimeout(function(){(i.playbackState===i.PLAYING_STATE||i.playbackState===i.FINISHED_STATE)&&(e._iOSEnabled=!0,e.iOSAutoEnable=!1,window.removeEventListener("touchstart",n,!1))},0)};return window.addEventListener("touchstart",n,!1),e}}};var u=null,a={};r||(u=new Audio,a={mp3:!!u.canPlayType("audio/mpeg;").replace(/^no$/,""),opus:!!u.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!u.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!u.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),aac:!!u.canPlayType("audio/aac;").replace(/^no$/,""),m4a:!!(u.canPlayType("audio/x-m4a;")||u.canPlayType("audio/m4a;")||u.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(u.canPlayType("audio/x-mp4;")||u.canPlayType("audio/mp4;")||u.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!!u.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")});var f=new o(a),l=function(e){var r=this;r._autoplay=e.autoplay||!1,r._buffer=e.buffer||!1,r._duration=e.duration||0,r._format=e.format||null,r._loop=e.loop||!1,r._loaded=!1,r._sprite=e.sprite||{},r._src=e.src||"",r._pos3d=e.pos3d||[0,0,-.5],r._volume=void 0!==e.volume?e.volume:1,r._urls=e.urls||[],r._rate=e.rate||1,r._model=e.model||null,r._onload=[e.onload||function(){}],r._onloaderror=[e.onloaderror||function(){}],r._onend=[e.onend||function(){}],r._onpause=[e.onpause||function(){}],r._onplay=[e.onplay||function(){}],r._onendTimer=[],r._webAudio=n&&!r._buffer,r._audioNode=[],r._webAudio&&r._setupAudioNode(),void 0!==t&&t&&f.iOSAutoEnable&&f._enableiOSAudio(),f._howls.push(r),r.load()};if(l.prototype={load:function(){var e=this,t=null;if(r)return void e.on("loaderror");for(var n=0;n<e._urls.length;n++){var i,s;if(e._format)i=e._format;else{if(s=e._urls[n],i=/^data:audio\/([^;,]+);/i.exec(s),i||(i=/\.([^.]+)$/.exec(s.split("?",1)[0])),!i)return void e.on("loaderror");i=i[1].toLowerCase()}if(a[i]){t=e._urls[n];break}}if(!t)return void e.on("loaderror");if(e._src=t,e._webAudio)c(e,t);else{var u=new Audio;u.addEventListener("error",function(){u.error&&4===u.error.code&&(o.noAudio=!0),e.on("loaderror",{type:u.error?u.error.code:0})},!1),e._audioNode.push(u),u.src=t,u._pos=0,u.preload="auto",u.volume=f._muted?0:e._volume*f.volume();var l=function(){e._duration=Math.ceil(10*u.duration)/10,0===Object.getOwnPropertyNames(e._sprite).length&&(e._sprite={_default:[0,1e3*e._duration]}),e._loaded||(e._loaded=!0,e.on("load")),e._autoplay&&e.play(),u.removeEventListener("canplaythrough",l,!1)};u.addEventListener("canplaythrough",l,!1),u.load()}return e},urls:function(e){var t=this;return e?(t.stop(),t._urls="string"==typeof e?[e]:e,t._loaded=!1,t.load(),t):t._urls},play:function(e,n){var r=this;return"function"==typeof e&&(n=e),e&&"function"!=typeof e||(e="_default"),r._loaded?r._sprite[e]?(r._inactiveNode(function(i){i._sprite=e;var s=i._pos>0?i._pos:r._sprite[e][0]/1e3,o=0;r._webAudio?(o=r._sprite[e][1]/1e3-i._pos,i._pos>0&&(s=r._sprite[e][0]/1e3+s)):o=r._sprite[e][1]/1e3-(s-r._sprite[e][0]/1e3);var u,a=!(!r._loop&&!r._sprite[e][2]),l="string"==typeof n?n:Math.round(Date.now()*Math.random())+"";if(function(){var t={id:l,sprite:e,loop:a};u=setTimeout(function(){!r._webAudio&&a&&r.stop(t.id).play(e,t.id),r._webAudio&&!a&&(r._nodeById(t.id).paused=!0,r._nodeById(t.id)._pos=0,r._clearEndTimer(t.id)),r._webAudio||a||r.stop(t.id),r.on("end",l)},1e3*o),r._onendTimer.push({timer:u,id:t.id})}(),r._webAudio){var c=r._sprite[e][0]/1e3,h=r._sprite[e][1]/1e3;i.id=l,i.paused=!1,d(r,[a,c,h],l),r._playStart=t.currentTime,i.gain.value=r._volume,void 0===i.bufferSource.start?i.bufferSource.noteGrainOn(0,s,o):i.bufferSource.start(0,s,o)}else{if(4!==i.readyState&&(i.readyState||!navigator.isCocoonJS))return r._clearEndTimer(l),function(){var t=r,s=e,o=n,u=i,a=function(){t.play(s,o),u.removeEventListener("canplaythrough",a,!1)};u.addEventListener("canplaythrough",a,!1)}(),r;i.readyState=4,i.id=l,i.currentTime=s,i.muted=f._muted||i.muted,i.volume=r._volume*f.volume(),setTimeout(function(){i.play()},0)}return r.on("play"),"function"==typeof n&&n(l),r}),r):("function"==typeof n&&n(),r):(r.on("load",function(){r.play(e,n)}),r)},pause:function(e){var t=this;if(!t._loaded)return t.on("play",function(){t.pause(e)}),t;t._clearEndTimer(e);var n=e?t._nodeById(e):t._activeNode();if(n)if(n._pos=t.pos(null,e),t._webAudio){if(!n.bufferSource||n.paused)return t;n.paused=!0,void 0===n.bufferSource.stop?n.bufferSource.noteOff(0):n.bufferSource.stop(0)}else n.pause();return t.on("pause"),t},stop:function(e){var t=this;if(!t._loaded)return t.on("play",function(){t.stop(e)}),t;t._clearEndTimer(e);var n=e?t._nodeById(e):t._activeNode();if(n)if(n._pos=0,t._webAudio){if(!n.bufferSource||n.paused)return t;n.paused=!0,void 0===n.bufferSource.stop?n.bufferSource.noteOff(0):n.bufferSource.stop(0)}else isNaN(n.duration)||(n.pause(),n.currentTime=0);return t},mute:function(e){var t=this;if(!t._loaded)return t.on("play",function(){t.mute(e)}),t;var n=e?t._nodeById(e):t._activeNode();return n&&(t._webAudio?n.gain.value=0:n.muted=!0),t},unmute:function(e){var t=this;if(!t._loaded)return t.on("play",function(){t.unmute(e)}),t;var n=e?t._nodeById(e):t._activeNode();return n&&(t._webAudio?n.gain.value=t._volume:n.muted=!1),t},volume:function(e,t){var n=this;if(e=parseFloat(e),e>=0&&1>=e){if(n._volume=e,!n._loaded)return n.on("play",function(){n.volume(e,t)}),n;var r=t?n._nodeById(t):n._activeNode();return r&&(n._webAudio?r.gain.value=e:r.volume=e*f.volume()),n}return n._volume},loop:function(e){var t=this;return"boolean"==typeof e?(t._loop=e,t):t._loop},sprite:function(e){var t=this;return"object"==typeof e?(t._sprite=e,t):t._sprite},pos:function(e,n){var r=this;if(!r._loaded)return r.on("load",function(){r.pos(e)}),"number"==typeof e?r:r._pos||0;e=parseFloat(e);var i=n?r._nodeById(n):r._activeNode();if(i)return e>=0?(r.pause(n),i._pos=e,r.play(i._sprite,n),r):r._webAudio?i._pos+(t.currentTime-r._playStart):i.currentTime;if(e>=0)return r;for(var s=0;s<r._audioNode.length;s++)if(r._audioNode[s].paused&&4===r._audioNode[s].readyState)return r._webAudio?r._audioNode[s]._pos:r._audioNode[s].currentTime},pos3d:function(e,t,n,r){var i=this;if(t=void 0!==t&&t?t:0,n=void 0!==n&&n?n:-.5,!i._loaded)return i.on("play",function(){i.pos3d(e,t,n,r)}),i;if(!(e>=0||0>e))return i._pos3d;if(i._webAudio){var s=r?i._nodeById(r):i._activeNode();s&&(i._pos3d=[e,t,n],s.panner.setPosition(e,t,n),s.panner.panningModel=i._model||"HRTF")}return i},fade:function(e,t,n,r,i){var s=this,o=Math.abs(e-t),u=e>t?"down":"up",a=o/.01,f=n/a;if(!s._loaded)return s.on("load",function(){s.fade(e,t,n,r,i)}),s;s.volume(e,i);for(var l=1;a>=l;l++)!function(){var e=s._volume+("up"===u?.01:-.01)*l,n=Math.round(1e3*e)/1e3,o=t;setTimeout(function(){s.volume(n,i),n===o&&r&&r()},f*l)}()},fadeIn:function(e,t,n){return this.volume(0).play().fade(0,e,t,n)},fadeOut:function(e,t,n,r){var i=this;return i.fade(i._volume,e,t,function(){n&&n(),i.pause(r),i.on("end")},r)},_nodeById:function(e){for(var t=this,n=t._audioNode[0],r=0;r<t._audioNode.length;r++)if(t._audioNode[r].id===e){n=t._audioNode[r];break}return n},_activeNode:function(){for(var e=this,t=null,n=0;n<e._audioNode.length;n++)if(!e._audioNode[n].paused){t=e._audioNode[n];break}return e._drainPool(),t},_inactiveNode:function(e){for(var t=this,n=null,r=0;r<t._audioNode.length;r++)if(t._audioNode[r].paused&&4===t._audioNode[r].readyState){e(t._audioNode[r]),n=!0;break}if(t._drainPool(),!n){var i;if(t._webAudio)i=t._setupAudioNode(),e(i);else{t.load(),i=t._audioNode[t._audioNode.length-1];var s=navigator.isCocoonJS?"canplaythrough":"loadedmetadata",o=function(){i.removeEventListener(s,o,!1),e(i)};i.addEventListener(s,o,!1)}}},_drainPool:function(){var e,t=this,n=0;for(e=0;e<t._audioNode.length;e++)t._audioNode[e].paused&&n++;for(e=t._audioNode.length-1;e>=0&&!(5>=n);e--)t._audioNode[e].paused&&(t._webAudio&&t._audioNode[e].disconnect(0),n--,t._audioNode.splice(e,1))},_clearEndTimer:function(e){for(var t=this,n=0,r=0;r<t._onendTimer.length;r++)if(t._onendTimer[r].id===e){n=r;break}var i=t._onendTimer[n];i&&(clearTimeout(i.timer),t._onendTimer.splice(n,1))},_setupAudioNode:function(){var e=this,n=e._audioNode,r=e._audioNode.length;return n[r]=void 0===t.createGain?t.createGainNode():t.createGain(),n[r].gain.value=e._volume,n[r].paused=!0,n[r]._pos=0,n[r].readyState=4,n[r].connect(s),n[r].panner=t.createPanner(),n[r].panner.panningModel=e._model||"equalpower",n[r].panner.setPosition(e._pos3d[0],e._pos3d[1],e._pos3d[2]),n[r].panner.connect(n[r]),n[r]},on:function(e,t){var n=this,r=n["_on"+e];if("function"==typeof t)r.push(t);else for(var i=0;i<r.length;i++)t?r[i].call(n,t):r[i].call(n);return n},off:function(e,t){var n=this,r=n["_on"+e],i=t?""+t:null;if(i){for(var s=0;s<r.length;s++)if(i===""+r[s]){r.splice(s,1);break}}else n["_on"+e]=[];return n},unload:function(){for(var t=this,n=t._audioNode,r=0;r<t._audioNode.length;r++)n[r].paused||(t.stop(n[r].id),t.on("end",n[r].id)),t._webAudio?n[r].disconnect(0):n[r].src="";for(r=0;r<t._onendTimer.length;r++)clearTimeout(t._onendTimer[r].timer);var i=f._howls.indexOf(t);null!==i&&i>=0&&f._howls.splice(i,1),delete e[t._src],t=null}},n)var c=function(t,n){if(n in e)return t._duration=e[n].duration,void p(t);if(/^data:[^;]+;base64,/.test(n)){for(var r=atob(n.split(",")[1]),i=new Uint8Array(r.length),s=0;s<r.length;++s)i[s]=r.charCodeAt(s);h(i.buffer,t,n)}else{var o=new XMLHttpRequest;o.open("GET",n,!0),o.responseType="arraybuffer",o.onload=function(){h(o.response,t,n)},o.onerror=function(){t._webAudio&&(t._buffer=!0,t._webAudio=!1,t._audioNode=[],delete t._gainNode,delete e[n],t.load())};try{o.send()}catch(u){o.onerror()}}},h=function(n,r,i){t.decodeAudioData(n,function(t){t&&(e[i]=t,p(r,t))},function(){r.on("loaderror")})},p=function(e,t){e._duration=t?t.duration:e._duration,0===Object.getOwnPropertyNames(e._sprite).length&&(e._sprite={_default:[0,1e3*e._duration]}),e._loaded||(e._loaded=!0,e.on("load")),e._autoplay&&e.play()},d=function(n,r,i){var s=n._nodeById(i);s.bufferSource=t.createBufferSource(),s.bufferSource.buffer=e[n._src],s.bufferSource.connect(s.panner),s.bufferSource.loop=r[0],r[0]&&(s.bufferSource.loopStart=r[1],s.bufferSource.loopEnd=r[1]+r[2]),s.bufferSource.playbackRate.value=n._rate};"function"==typeof define&&define.amd&&define(function(){return{Howler:f,Howl:l}}),"undefined"!=typeof exports&&(exports.Howler=f,exports.Howl=l),"undefined"!=typeof window&&(window.Howler=f,window.Howl=l)}();