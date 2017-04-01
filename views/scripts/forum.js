/* global io, $, Remarkable, hljs */
( function ( socket, md, Application ) {
	
// Application {
	
	new Application (
		
		socket,
		md,
		
		// io
		{
			_error_: function ( err, message ) {
				if ( err ) {
					console.log ( err );
				} else if ( arguments.length === 1 ) {
					message = err;
				}
				
				this.errorMessage ( message ); },
			
			chatin: function ( id, name, message ) {
				this.chatMessage ( id, name, message ); },
			
			joined: function ( id, name ) {
				this.chatMessage ( id, id,  '"' + name + '" joined the room' ); },
			
			left: function ( id, name ) {
				this.chatMessage ( id, id, '"' + name + '" left the room' ); },
			
			submission: function ( res ) {
				// logic fetch ? then
				// socket.emit ( 'request', 'submission', res.id, function ( article ) {
					
				// } );
			},
			
			article: function ( article ) {
				alert ( 'debugging article communications' ); }
		},
		
		// ui handles by id
		{
			/*
			forumContent: {
				click: [ '[id$="stubs"]', function ( event ) {
					var $ui = event.data.$ui,
						$forumContent = $ui.forumContent,
						view = ( event.target.id ).split ( '-' ) [ 0 ],
						$view = $ui [ view + 'View'];
					
					$forumContent.find ( '>[id]' ).addClass ( 'hidden' );
					
					if ( view === 'category' ) {        // this is a category stub, requesting to view the category
					} else {                            // this is a topic stub, requesting to view the topic
					}
					
				} ] },
			*/
			articleStubs: {
				click: [ '.stub', function ( event ) {
					let $stub = $ ( this ),
						$title = $stub.find ( '.title' ),
						$owner = $stub.find ( '.owner' );
					if ( event.target === this || event.target === $title [ 0 ] ) {
						console.log ( 'clicked stub' );
						var app = event.data,
							$id = app.$ui.id,
							$container = $id.articleView,
							index = +this.getAttribute ( 'data-index' ),
							article = app.articles.category [ index ],
							topics = article.topics,
							comments = article.posts,
							location = { to: 'topic', references: { category: article.id } };
						
						$id.articleStubs.addClass ( 'hidden' );
						$container.removeClass ( 'hidden' );
						
						app.appendArticles ( $container, $id.templateArticle, [ article ], false );
						
						$id.forumInput.attr ( 'data-location', JSON.stringify ( location ) );
						$id.inputHeading.text ( 'New Topic in Category' );
						$id.inputTitle.text ( $ ( article.title ).html () ).removeClass ( 'hidden' );
						$id.userTitle.focus ();
						
						app.listenChannel ( 'category_' + article.id );
						if ( article.topics.length === 0 ) {
							app.requestPage ( { from: 'topic', rank: { type: 'topic', category: article.id } } );
						}
						
						if ( article.posts.length === 0 ) {
							app.requestPage ( { from: 'post', rank: { type: 'post', category: article.id } } );
						}
						
					} else if ( event.target === $owner [ 0 ] ) {
						// clicking on owner should show the current location ordered by owner
					}
				} ]
			},
			
			menu: {
				click: function () { return false; } },
			
			menuContent: {
				click: [ '.menu-item', function ( event ) {
					$ ( this ).find ( '.check' ).toggleClass ( 'checked' );
				} ] },
			
			page: {
				click: function ( event ) {
					var $ui = event.data.$ui;
					
					$ui.id.menuContent.addClass ( 'hidden' );
					$ui.id.userChat.addClass ( 'hidden' );
					$ui.id.userChatNew.addClass ( 'hidden' );
				} },
			
			preview: {
				click: function ( event ) {
					var app = event.data, $id = app.$ui.id;
					if ( this.value === 'Preview' ) {
						
						// get a promise to handle the content render
						new Promise ( function ( resolve, reject ) {
							
							$id.userPost.addClass ( 'hidden' );
							$id.previewContent.html ( '' );
							$id.userPreview.removeClass ( 'hidden' );
							$id.previewLoading.removeClass ( 'hidden' );
							
							// some views do not have a title
							var title = $id.titleSection.hasClass( 'hidden' ) ? '' : '### ' + $id.userTitle.val () + '\n\n';
							
							try { // try to render content
								resolve ( app.sanitize ( md.render ( title + $id.userBody.val () ) ) );  //
							} catch ( err ) {                                                                   //
								// reject content ---------------------------------------                       //
								reject ( err );                                         //                      //
							}                                                           //                      //
						} ).then ( function ( html ) {  // success  <-------------------//----------------------//
							$id.previewLoading.addClass ( 'hidden' );                   //
							$id.previewContent.html ( html );                           //
						} ).catch ( function ( err ) {  // something went wrong  <------//
							$id.previewLoading.addClass ( 'hidden' );
							$id.previewContent.text ( err );
						} );
						
						this.value = 'Edit';
						
					} else if ( this.value === 'Edit' ) {
						$id.userPost.removeClass ( 'hidden' );
						$id.previewLoading.addClass ( 'hidden' );
						$id.userPreview.addClass ( 'hidden' );
						this.value = 'Preview';
					}
				} },
			
			select: {
				click: [
					'option', function ( event ) {
						var $forumContent = event.data.$ui.id.forumContent;
						
						// poor ui design consider having specific controls for navigating stubs/categories/topics
						$forumContent.find ( '>[id]' ).addClass ( 'hidden' );
						$forumContent.find ( '>[id=' + this.id + '-stubs]' ).removeClass ( 'hidden' );
					}
				] },
			
			showMessages: {
				click: function ( event ) {
					event.data.$ui.id.userMessageBox.toggleClass ( 'hidden', !!$ ( this ).find ( '.checked' ).length );
				} },
			
			submit: {
				click: function ( event ) {
					var app = event.data,
						$id = app.$ui.id,
						$forumInput = $id.forumInput,
						// seems data attributes with valid JSON strings are automatically parsed
						params = $forumInput.data ( 'location' ),
						title = $id.userTitle.val (),
						body = $id.userBody.val ();
					
					// which kind of submission?
					// there will be different submit handlers for different kinds
					// of submission
					if ( !title ) {
						app.errorMessage ( 'Submission must have a title.' );
						$id.userTitle.focus ();
						return;
					}
					
					if ( !body ) {
						app.errorMessage ( 'Submission must have a body.' );
						$id.userBody.focus ();
						return;
					}
					
					params.title = title;
					params.body = body;
					// TODO: configure based on UI
					params.order = 'newest';
					
					event.data.submitArticle ( params );
				}
			},
			
			toggleMenu: {
				click: function ( event ) {
					event.data.$ui.id.menuContent.toggleClass ( 'hidden' );
				} },
			
			userChat: {
				click: [
					function ( event ) {
						// page clicks hide user chat, which is not what we want
						// here so we stop propagation of this click event
						return false; },
					'.minimize', function ( event ) {
						event.data.$ui.id.userChat.addClass ( 'hidden' );
					} ] },
			
			userChatBar: {
				click: [
					'.room', function ( event ) {
						console.log ( 'clicked room...' );
						var $id = event.data.$ui.id,
							$userChat = $id.userChat,
							$userChatRoom = $id.userChatRoom,
							$userChatTitle = $id.userChatTitle,
							$userChatOwner = $id.userChatOwner,
							$userChatContent = $id.userChatContent,
							$room = $ ( this ),
							$chatMin = $room.parent (),
							id = $room.text (),
							chat = event.data.rooms [ id ],
							messages = chat.messages;
						
						console.log ( id );
						$userChatRoom.text ( id );
						$userChatTitle.text ( chat.title || '' );
						$userChatOwner.text ( chat.owner || '' );
						
						$userChatContent.empty ();
						for ( var i in messages ) {
							$id.userChatContent.append ( $.parseHTML ( messages [ i ] ) );
						}
						//$userChatContent.html ( chat.messages.join ( '' ) );
						
						$userChat.attr ( 'data-room', $chatMin.attr ( 'data-room' ) );
						$userChat.removeAttr ( 'style' );
						$userChat.removeClass ( 'hidden' );
						$userChat.css ( { width: $userChat.width (), height: $userChat.height () } );
						
						$chatMin.removeClass ( 'notify' );
						
						event.data.$ui.id.menuContent.addClass ( 'hidden' );
						
						// page clicks hide user chat, which is not what we want
						// here so we stop propagation of this click event
						return false; },
					'.close', function ( event ) {
						//var room = $ ( this ).parent ().attr ( 'data-room' );
						//alert ( typeof room + ': ' + room );
						event.data.leaveChat ( $ ( this ).parent ().attr ( 'data-room' ) );
						event.data.$ui.id.userChat.addClass ( 'hidden' );
						event.data.$ui.id.menuContent.addClass ( 'hidden' );
						return false;
					} ] },
					
			userChatSubmit: {
				click: function ( event ) {
					var app = event.data,
						$id = app.$ui.id;
					
					app.sendChat ( $id.userChat.attr ( 'data-room' ), $id.userChatInput.val () );
				}
			},
			
			userChatInput: {
				keydown: function ( event ) {
					var app = event.data,
						$id = app.$ui.id;
					
					if ( event.which === 13 && ( event.ctrlKey || event.metaKey ) ) {
						event.preventDefault ();
						$id.userChatSubmit.trigger ( 'click' );
						return false;
					}
				}
			}
		},
		
		// ui handles by class name
		{
			menuItem: {
				click: [ '.check', () => {
					$ ( this ).toggleClass ( 'checked' );
				} ] }
		},
		
		// after everything is hooked up
		function ( app ) {
			$ ( window ).on ( 'beforeunload', () => {
				for ( let id in app.rooms ) {
					socket.emit ( 'leave', id, app.noop );
				}
			} );
			
			console.log ( 'joining chat "Forum"...' );
			
			app.$ui.id.userChatBar.sortable ( {
				scroll: false,
				tolerance: 'pointer',
				cursorAt: { bottom: 0, left: 0 },
				helper: 'clone',
				appendTo: 'body',
				//forcePlaceholderSize: true,
				//forceHelperSize: true
			} );
			
			app.$ui.id.userChat.draggable ( {
				scroll: false,
				cancel: '.client'  // all drag events that originate on input portions of the control are cancelled
			} );
			
			app.joinChat ( 'Forum' );
			
			app.$ui.id.forumInput.attr ( 'data-location', JSON.stringify ( { to: 'category' } ) );
			app.listenChannel ( 'category' );
			app.requestPage ( { from: 'category', rank: { type: 'category' } } );
		}
	);
	
// }
	
} ) (
	io ( '/forum' ),
	new Remarkable ( 'full', {
		html: true,
		linkify: true,
		typographer: true,
		highlight: function ( str, lang ) {
			function padNum ( str, len ) {
				while ( str.length < len ) {
					str = "0" + str;
				}
				return str;
			}
			var line = str.split ( '\n' ),
				pad = Math.max ( 2, ( line.length ).toString ().length );
			
			// remove incidental trailing line
			if ( !line [ line.length - 1 ] ) {
				line.length = line.length - 1;
			}
			
			if ( lang && hljs.getLanguage ( lang ) ) {
				try {
					for ( let i = 0, l = line.length; i < l; i = i + 1 ) {
						line [ i ] = '' +
							'<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
								hljs.highlight ( lang, line [ i ], true ).value +
							'</li>';
					}
					return '<ol>' + line.join ( '' ) + '</ol>';
				} catch ( err ) {
					console.error ( err );
					return err.toString ();
				}
			} else {
				try {
					for ( let i = 0, l = line.length; i < l; i = i + 1 ) {
						line [ i ] = '' +
							'<li data-line="' + padNum ( '' + ( i + 1 ), pad ) + '">' +
								hljs.highlightAuto ( line [ i ] ).value +
							'</li>';
					}
					return '<ol>' + line.join ( '' ) + '</ol>';
				} catch (err) {
					console.error ( err );
					return err.toString ();
				}
			}
		}
	} ),
	function Application ( socket, md, ioHandles, uiHandlesById, uiHandlesByClass, then ) {
		var _$ui = { id: {}, "class": {} },
			_rooms = {},
			_views = {},
			_articles = {
				category: [],
				chat: []
			},
			_responses = [],
			_queue = [],
			_$escapeHTML = ( function ( $ ) {
				return function ( text ) {
					return $.text ( text ).text();
				};
			} ) ( $ ( '<div>' ) ),
			_app = {
				articles: _articles,
				requestLimit: 10,
				$ui: _$ui,
				rooms: _rooms,
				views: _views,
				responses: _responses,
				queue: _queue,
				escapeHTML: _$escapeHTML,
				listening: null,
				
				errorMessage: function ( message ) {
					_$ui.id.userMessage.html ( '<span class="error-message">' + ( message || 'Something went wrong, but I don\'t know what.  Sorry about that. See console and contact system administrator.' ) + '</span>' );
				},
				
				message: function ( message ) {
					_$ui.id.userMessage.html ( '<span class="message">' + message + '</span>' );
				},
				
				objToDataValue: function ( obj, def ) {
					let key, list = [], data;
					
					for ( key in obj ) {
						list.push ( key + '_' + obj [ key ] );
					}
					
					data = list.join ( '-' );
					
					if ( !data.length ) {
						return def;
					}
					
					return data;
				},
				
				formatDate: function ( date ) {
					let hours = date.getHours (),
						weekday = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ] [ date.getDay () ],
						month = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ] [ date.getMonth () ],
						day = date.getDate (),
						year = date.getFullYear (),
						hour = ( hours % 12 ) || 12,
						minutes = date.getMinutes (),
						meridian = hours > 11 ? 'pm' : 'am';
					
					minutes = ( '' + minutes ).length < 2 ? '0' + minutes : minutes;
					
					return `${weekday}, ${month} ${day}, ${year} at ${hour}:${minutes}${meridian}`;
				},
				
				noop: () => {},
				
				sortNewest: ( a, b ) => ( a = 'created' in a ? a.created : a.getAttribute ( 'data-created' ) ) >
										( b = 'created' in b ? b.created : b.getAttribute ( 'data-created' ) ) ? -1 : a < b ? 1 : 0,
				
				sortOldest: ( a, b ) => ( a = 'created' in a ? a.created : a.getAttribute ( 'data-created' ) ) <
										( b = 'created' in b ? b.created : b.getAttribute ( 'data-created' ) ) ? -1 : a > b ? 1 : 0,
				
				sortRecent: ( a, b ) => ( a = 'created' in a ? a.edited || a.created : a.getAttribute ( 'data-edited' ) || a.getAttribute ( 'data-created' ) ) >
										( b = 'created' in b ? b.edited || b.created : b.getAttribute ( 'data-edited' ) || b.getAttribute ( 'data-created' ) ) ? -1 : a < b ? 1 : 0,
				
				// prevent undesirable content
				sanitize: function ( html ) {
					var src = $ ( '<div>' ).append ( html );
					
					src.find ( 'audio,embed,iframe,media,object,script,video' ).remove ();
					
					src.find ( '*' ).each ( function () {
						var attr, attrs = this.attributes, name, value;
						for ( var i = 0, l = attrs.length; i < l; i = i + 1 ) {
							attr = attrs [ i ];
							name = attr.name;
							value = attr.value;
							if ( name.match ( /^on.*/i ) || ( name.match ( /href/i ) && value.match ( /^\s*javascript.*/i ) ) ) {
								this.removeAttribute ( name );
							}
						}
					} );
					
					return src.html ();
				},
				
				renderHTML: function ( content, error, then ) {
					new Promise ( ( resolve, reject ) => {
						if ( typeof content === 'function' ) {
							content = content ();
						} else {
							if ( typeof content !== 'string' ) {
								_app.errorMessage ( 'wrong type of content provided, contact system adminstrator' );
								console.error ( new TypeError ( 'cannot fetch content on type "' + typeof content + '"' ) );
								return;
							}
						}
						
						try {
							resolve ( _app.sanitize ( md.render ( content ) ) );
						} catch ( e ) {
							reject ( e );
						}
						
					} ).then ( html => {
						if ( typeof then === 'function' ) {
							then ( html );
						} else {
							_app.errorMessage ( 'no where to send content, "then" executor was not provided, contact system adminstrator' );
							console.error ( new TypeError ( 'executor unavailable' ) );
						}
					} ).catch ( err => {
						if ( typeof error === 'function' ) {
							error ( err );
						} else {
							_app.errorMessage ( 'could not render html ( see console )' );
							console.log ( err );
						}
					} );
				},
				
				cacheArticles: function ( collection, extend, articles ) {
					var article, i, l, key, from = collection.length;
					
					for ( i = 0, l = articles.length; i < l; i = i + 1 ) {
						article = articles [ i ];
						if ( extend ) {
							for ( key in extend ) {
								article [ key ] = extend [ key ];
							}
						}
						
						if ( 'title' in article ) {
							article.title = _app.sanitize ( md.render ( '### ' + article.title ) );
						}
						
						article.body = _app.sanitize ( md.render ( article.body ) );
						article.index = from + i;
					}
					
					Array.prototype.push.apply ( collection, articles );
				},
				
				appendArticles: function ( $container, $template, articles, stub, sort ) {
					let $id = _app.$ui.id,
						article,
						$tempView,
						$aboutTemplate = $id.templateAbout;
					
					if ( articles.length > 0 ) {
						$container.addClass ( 'hidden' );
						
						for ( let i = 0, l = articles.length; i < l; i = i + 1 ) {
							article = articles [ i ];
							
							$tempView = $ ( $template.html () );
							$tempView.find ( '.about' ).append ( $aboutTemplate.html () );
							
							let $edited = $tempView.find ( '.edited' ),
								$created = $tempView.find ( '.created' ),
								$owner = $tempView.find ( '.owner' ),
								$title = $tempView.find ( '.title' ),
								$body = $tempView.find ( '.body' ),
								{ category, topic, chat } = article,
								ref = { category, topic, chat }, from,
								title = stub ? $ ( article.title ).html() : article.title;
							
							$tempView.attr ( { 'data-id': article.id, 'data-created': article.created, 'data-index': article.index } );
							
							// if any of title, body or about does not exist
							// the html insertion will do nothing
							$title.html ( title );
							$body.html ( article.body );
							$owner.text ( article.username );
							$created.text (  _app.formatDate( new Date ( article.created ) ) );
							
							//$tempAbout.attr ( 'data-owner-id', article.owner );
							if ( article.edited ) {
								$tempView.attr ( 'data-edited', article.edited );
								$edited.text ( _app.formatDate( new Date ( article.edited ) ) ).removeClass ( 'hidden' );
							} else {
								$edited.text ( '' ).addClass ( 'hidden' );
							}
							
							for ( from in ref ) {
								if ( ref [ from ] ) {
									$tempView.attr ( 'data-ref-' + from, ref [ from ] );
								}
							}
							
							$container.append ( $tempView );
						}
						
						if ( typeof sort === 'function' ) {
							// sort the jquery order then rebuild the dom structure
							// based on the sorted order
							$container.children ().sort ( sort ).each ( function ( i, e ) {
								e.parentNode.appendChild ( e );
							} );
						}
						
						$container.removeClass ( 'hidden' );
						$container.parent ().removeClass ( 'hidden' );
					}
				},
				
				getPresentationLayer: function ( rank, room ) {
					let $id = _$ui.id,
						{ type, category, topic, chat, } = rank,
						collection, extend, container, template;
					
					if ( type === 'post' ) {
						if ( 'chat' in rank ) {
							collection = _articles.chat [ chat ];
							container = $id.userChat.hasClass ( '.hidden' ) ? null : $id.userChat.attr ( 'data-room' ) === room ? $id.userChatContent : null;
						} else {
							if ( ! ( 'topic' in rank ) ) {
								collection = _articles.category [ category ].posts;
							} else {
								collection = _articles.category [ category ].topics [ topic ].posts;
							}
							
							container = $id.articleView.find ( '.replies' );
						}
						
						template = $id.templateReply;
					} else {
						if ( type === 'category' ) {
							collection = _articles.category;
							extend = { topics: [], posts: [] };
							container = $id.articleStubs;
						} else if ( type === 'topic' ) {
							collection = _articles.category [ category ].topics;
							extend = { posts: [] };
							container = $id.articleView.find ( '.topic-stubs' );
						}
						template = $id.templateStub;
					}
					
					return { collection, extend, container, template };
				},
				
				requestPage: function ( params ) {
					
					// if stuff not already here??? ( before making this call )
					
					var $id = _$ui.id;
					
					let {	from, rank, references, index = 0, limit = _app.requestLimit,
							// use $select ( '[selected]' ), but those must toggle first
							order = 'oldest'
						} = params,
						data = { from, index, limit };
					
					'references' in params && ( data.references = references );
					
					socket.emit ( 'request', 'page', data, function ( err, res ) {
						if ( err ) {
							_app.errorMessage ( 'page request failed ( see console ), please contact system administrator' );
							console.log ( err );
						} else {
							console.log ( 'fetched page' );
								// TODO: fixme!
							let room = 'chat_' + ( ( 'references' in data && 'chat' in data.references && data.references.chat ) || '' ),
								{ collection, extend, container, template } = _app.getPresentationLayer ( rank, room ),
								articles = res.articles,
								sortBy = order [ 0 ].toUpperCase () + order.slice ( 1 ),
								sort = _app [ 'sort' + sortBy ];
							
							_app.cacheArticles ( collection, extend, articles );
							
							collection.received = res.timestamp;
							collection.total = res.total;
							
							if ( container ) {
								_app.appendArticles ( container, template, articles, true, sort );
							} else {
								$id.userChat.find ( `[data-room=${room}]` ).addClass ( 'notify' );
							}
							
							if ( res.total > collection.length ) {
								// show the more option
							}
						}
					} );
				},
				
				requestUpdate: function ( params ) {
					alert ( 'apologies, page update request is not yet implemented' );
				},
				
				submitArticle: function ( params ) {
					let { order } = params;
					socket.emit ( 'request', 'submit', params, function ( err, res ) {
						if ( err ) {
							_app.errorMessage ( 'submission request failed ( see console ), please contact system administrator' );
							console.log ( err );
						} else {
							let $id = _app.$ui.id,
								room = _app.listening,
								{ collection, extend, container } = _app.getPresentationLayer ( res.rank, room ),
								articles = [ res ],
								sortBy = order [ 0 ].toUpperCase () + order.slice ( 1 ),
								sort = _app [ 'sort' + sortBy ];
							
							// if not all articles are displaying ( More to come )
							// then rendering and displaying of the submission
							// stub will be deferred until it comes up in
							// a later page fetch
							if ( res.rank [ res.rank.type ] <= collection.length ) {
								'title' in params && ( res.title = params.title );
								res.body = params.body;
								
								_app.cacheArticles ( collection, extend, [ res ] );
								collection.received = res.created;
								
								if ( container ) {
									_app.appendArticles ( container, articles, sort );
								} else {
									$id.userChat.find ( `[data-room=${room}]` ).addClass ( 'notify' );
								}
							}
							
							// clear the submission form and refocus on title input
							$id.userTitle.val ( '' );
							$id.userBody.val ( '' );
							$id.userTitle.focus ();
						}
					} );
				},
				
				listenChannel: function ( room ) {
					
					if ( _app.listening ) {
						socket.emit ( 'leave', _app.listening, _app.noop );
					}
					
					socket.emit ( 'join', room, function ( id ) {
						_app.listening = id;
					} );
				},
				
				joinChat: function ( room, title, owner ) {
					
					var argLength = arguments.length;
					
					socket.emit ( 'join', room, function response ( id ) {
						var jq,
							chat = _rooms [ id ],
							tip = ( owner ? owner + ': ' : '' ) + ( title ? title : '' );
						
						if ( !chat ) {
							jq = $ ( _$ui.id.templateChatMin.html () );
							if ( tip ) {
								jq.find ( '.room' ).text ( id ).attr ( 'data-title', tip );
							} else {
								jq.find ( '.room' ).text ( id );
							}
							jq.attr ( 'data-room', id );
							jq.find ( '.close' ).attr ( 'data-title', 'leave chat "' + id + '"' );
							chat = _rooms [ id ] = { messages: [], $: jq };
						} else {
							chat.messages.length = [];
							jq = chat.$;
							jq.attr ( 'data-room', id );
						}
						
						if ( argLength > 1 ) {
							chat.title = title;
						} else {
							delete chat.title;
						}
						
						if ( argLength > 2 ) {
							chat.owner = owner;
						} else {
							delete chat.owner;
						}
						
						_$ui.id.userChatBar.append ( jq );
						_$ui.id.userChatBar.sortable ( 'refresh' );
						_$ui.id.userMessage.html ( '<span class="message">You are in room "' + id + '", happy chatting!</span>' );
					} );
				},
				
				leaveChat: function ( room ) {
					socket.emit ( 'leave', room, function response ( id ) {
						
						delete _rooms [ id ];
						_$ui.id.userChatBar.find ( '[data-room="'+ id +'"]' ).remove ();
						_$ui.id.userMessage.html ( '<span class="message">You are no longer in room "' + id + '".</span>' );
						
					} );
				},
				
				sendChat: function ( id, message ) {
					
					socket.emit ( 'chat', id, message, function ( id ) {
						_app.chatMessage ( id, 'You', message );
						_$ui.id.userChatInput.val ( '' );
						_$ui.id.userChatInput.focus ();
					} );
				},
				
				// TODO: wash me
				chatMessage: function ( id, name, message ) {
					var chat = _rooms [ id ],
						$id = _$ui.id;
					
					function wrapMessage ( err, message ) {
						if ( err ) {
							message = $ ( '<div>' )
								.append ( $ ( '<div class="error">' )
									.append ( $ ( '<p>' )
										.append ( document.createTextNode ( err ) )
										.append ( '<br><br>' )
										.append ( document.createTextNode ( message ) )
									)
								).html ();
						} else {
							message = $ ( '<div>' )
								.append ( $ ( '<div class="message">' )
									.append ( message )
								).html ();
						}
						return message;
					}
					
					function logMessage ( message ) {
							
						if ( typeof message === 'string' ) {
							if ( !$id.userChat.hasClass ( 'hidden' ) && $id.userChatRoom.text () === id ) {
								$id.userChatContent.append ( message );
							} else {
								$id.userChatBar.find ( '[data-room="'+ id +'"]' ).addClass ( 'notify' );
							}
						}
					}
					
					if ( chat ) {
						
						new Promise ( function ( resolve, reject ) {
							try {
								resolve ( _app.sanitize ( md.render ( name + ': ' + message ) ) );
							} catch ( e ) {
								reject ( e );
							}
						} ). then ( function ( html ) {
							var message = wrapMessage ( null, html );
							chat.messages.push ( message );
							logMessage ( message );
						} ).catch ( function ( err ) {
							console.error ( `message from "${ name }" failed\n`, err, '\noriginal message: ' + message );
							message = wrapMessage ( id + ': ( failed to render content, original message below - see console )', message );
							chat.messages.push ( message );
							logMessage ( message );
						} );
					}
				},
			},
			__trigger, __name;
		
		console.log ( 'binding socket events...' );
		// set up socket io events
		$.each ( ioHandles, function ( event, handle ) {
			var type = typeof handle;
			if ( Array.isArray ( handle ) ) {
				if ( handle.length === 0 ) {
					console.error ( 'io event binding: cannot bind with empty array to socket event ' + event );
				} else {
					var callback = handle [ handle.length - 1 ];
					if ( typeof callback === 'function' ) {
						handle [ handle.length - 1 ] = callback.bind ( _app );
					}
					
					// push the event onto the left side of the argument bindings
					handle.unshift ( event );
					socket.on.apply ( socket, handle );
				}
			} else if ( type === 'function' ) {
				socket.on ( event, handle.bind ( _app ) );
			} else {
				console.error ( 'io event binding: cannot bind argument of type "' + type + '" to socket event "' + event + '"' );
			}
		} );
		
		console.log ( 'binding jquery id events...' );
		// set up jquery id events
		$ ( '[id]' ).each ( function ( i, element ) {
			
			let jq, handles;
			
			__name = ( this.id ).replace ( /-(.)/g, ( m, sub ) => sub.toUpperCase () );
			
			//debug
			if ( __name in _$ui ) {
				console.error ( '$ui assignment: element id "' + __name + '" already exists' );
			} else {
				jq = _$ui.id [ __name ] = $ ( element );
			}
			
			handles = uiHandlesById [ __name ];
			
			if ( handles ) {
				applyHandles ( jq, handles );
				
				// debug
				// if ( __name === 'userChatBar' ) {
				//     console.log ( 'connecting chatbar callbacks...' );
				//     __trigger = 'click';
				//     console.log ( handles.click.reduce ( reduceArgs, [] ) )
				//     applyHandles ( jq, handles );
				//     console.log ( 'connected successfully...')
				// } else {
				//     applyHandles ( jq, handles );
				// }
			}
		} );
		
		console.log ( 'binding jquery class events...' );
		// set up jquery id events
		$.each ( uiHandlesByClass, function ( classname, handles ) {
			var jq;
			
			__name = ( classname ).replace ( /([A-Z])/g, ( m, sub ) => '-' + sub.toLowerCase () );
			
			jq = _$ui.class [ classname ] = $ ( __name );
			
			applyHandles ( jq, handles );
		} );
		
		if ( typeof then !== 'function' ) {
			console.error ( 'application: cannot invoke callback of type "' + ( typeof then ) + '"' );
		} else {
			then ( _app );
		}
		
		function applyHandles ( jq, handles ) {
			for ( __trigger in handles ) {
				
				var args = handles [ __trigger ], type = typeof args;
				
				if ( Array.isArray ( args ) ) {                         // either delegates are selected for a handle or there are multiple handles under this trigger
							
					var stack = args.reduce ( reduceArgs, [] );
					
					for ( var i in stack ) {
						jq.on.apply ( jq, stack [ i ] );
					}
					
				} else if ( type === 'function' ) {              // no delegates
					jq.on ( __trigger, _app, args );
				} else {                                        // user error
					console.error ( '$ui event binding: cannot bind handler of type "' + type + '" to object "' + __name + '"' );
				}
			}
		}
		
		function reduceArgs ( stack, item ) {
			var type = typeof item;
			if ( type === 'string' || type === 'function') {
				if ( stack.length > 0 ) {
					var prev = stack [ stack.length - 1 ];
					if ( typeof prev === 'string' ) {       // assume multiple selectors, concat them
						if ( type === 'string ' ) {
							stack [ stack.length - 1 ] = prev + ' ' + item;
						} else {
							stack [ stack.length - 1 ] = [ __trigger, prev, _app, item ];
						}
					} else {
						if ( type === 'string' ) {
							stack [ stack.length ] = item;
						} else {
							stack [ stack.length ] = [ __trigger, _app, item ];
						}
					}
				} else {
					if ( type === 'string' ) {
						stack [ stack.length ] = item;
					} else {
						stack [ stack.length ] = [ __trigger, _app, item ];
					}
				}
			} else {
				console.error ( '$ui event binding: unrecognized binding type "' + type + '" on "' + __trigger + '" of "' + __name + '"' );
			}
			
			return stack;
		}
	}
);