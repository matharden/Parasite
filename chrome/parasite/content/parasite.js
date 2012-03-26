// .location object
// href = protocol+'//'+hostname+port+pathname+search+hash
// host = hostname+port
// Parasite object
// href = hostname+port+pathname+search+hash
// hostname = protocol+hostname (hostname includes protocol)
// host = hostname+port
// Components.utils.reportError


// Parasite Object
var parasite = {

	// Gain access to the Prefences service
	prefManager: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	
	// Go to this same URI on another host
	moveHost: function(e) {
		var URLs = this.getURLs();
		
		if (URLs.length == 0) return;

		if (e && typeof e.target.value != 'undefined') {
			openUILink(URLs[e.target.value][0], e);
		}
	},

	// Prints out each available host in the tool drop down
	addDropDownEntries: function(box) {
		
		// Create new entries
		var loc = getBrowser().contentWindow.location,
			URLs = this.getURLs();
		
		// Exit if there are no URL returned, open the host options
		if (URLs.length == 0) {
			return openDialog("chrome://parasite/content/parasite-options.xul", "edithosts", "");
		};
		
		for (var i=0; i<URLs.length; i++) {
			var m = document.createElement('menuitem');
			
			m.setAttribute('label', URLs[i][1]+' ('+ URLs[i][2] +')');
			m.setAttribute('value', i);
			m.setAttribute('type', 'radio');

			// Mark the current host as checked
			if (loc.protocol != 'about:') {
				
				var hn = loc.hostname;
				// If the user defined host has a protocol, then compare using protocol
				if (this.parseUrl(URLs[i][2]).protocol) hn = loc.protocol+'//'+hn;

				if (URLs[i][2].toLowerCase() == hn.toLowerCase()) {
					m.setAttribute('checked', 'true');
				}
			}
			box.appendChild(m);
		}
	},

	getURLs: function() {
		var URLs = [],
			loc = getBrowser().contentWindow.location;

		try {
			var allHosts = this.prefManager.getCharPref('extensions.parasite.hosts'),
				hostObj = JSON.parse(allHosts),
				hosts = hostObj[0].hosts;
			
			// Loop through each host
			for (var i=0; i<hosts.length; i++) {				
				// Append the current URN to each host
				// Add as a 3 part array, 1.URL 2.Label 3.host
				URLs.push(
					[
						hosts[i].hostname+loc.pathname+loc.search+loc.hash,
						hosts[i].label,
						hosts[i].hostname
					]
				);
			}
			
			// Output as an object
			return URLs;
		} catch (e) {
			return URLs;
		}
	},

	showDropDown: function(e) {
		
		var box = e.target,
			children = box.childNodes;
		
		// Remove any existing entries
		/*while (children[0].hasAttribute("type")) {
			try {
				box.removeChild(children[0]);
			} catch (e) {}
		}*/
		
		var rest = children;
		
		// Remove any existing entries
		while (children[0]) {
			try {
				box.removeChild(children[0]);
			} catch (e) {}
		}

		this.addDropDownEntries(box);
		
		/*var m = document.createElement('menu'),
			p = document.createElement('menupopup'),
			l = document.createElement('menuitem'),
			s = document.createElement('menuseparator');
		
		m.setAttribute('label', 'Projects');
		l.setAttribute('label', 'Project 1');*/
		
		//p.appendChild(l);
		//m.appendChild(p);
		//box.appendChild(s);
		//box.appendChild(m);
		//box.appendChild(rest);
	},

	setDisabled: function(url) {
		var but = document.getElementById('parasite-toolbarbutton'),
			dis = 'disabled',
			cls = but.getAttribute('class'),
			classes = cls.split(' ');
		
		// If they don't have the toolbar button, don't toggle it
		if (!but) return;
		
		// Enabled
		if (this.getURLs().length) {
			for (var i=0; i<classes.length; i++) {
				// If the disabled class exists
				if (classes[i] == dis) {
					// Remove it from the array
					classes.splice(i,1);
					// Set the class as the remaining array 
					but.setAttribute('class', classes.join(' '));
					break;
				}
			}
		// Disabled
		} else {
			if (classes.indexOf(dis) < 0) {
				but.setAttribute('class', cls+' '+dis);
			}
		}
	},

	showToolbarButton: function() {
		// Once; enforce that the toolbar button is present. For discoverability.
		if (!this.prefManager.getBoolPref('extensions.parasite.haveInsertedToolbarbutton')) {
		
			var navbar = document.getElementById("nav-bar");
			var newset = navbar.currentSet + ",parasite-toolbarbutton";
			navbar.currentSet = newset;
			navbar.setAttribute("currentset", newset);
			document.persist("nav-bar", "currentset");

			// Set pref to say button added
			this.prefManager.setBoolPref('extensions.parasite.haveInsertedToolbarbutton', true);
		}
	},

	// Allows protocol and path to be blank
	parseUrlRegex: new RegExp('([a-z]+://)?([^/]*)(/.*)?'),

	// Return protocol-hostname-urn as object from a full URI
	parseUrl: function(uri) {
		var m = this.parseUrlRegex.exec(uri);
		if (!m) throw new Error('Could not parse URI: '+uri);

		return {
			// If protocol is blank, return a blank string
			'protocol':typeof m[1] !== 'undefined' ? m[1] : '',
			'host':m[2]+'',
			'path':m[3]+''
		}
	},

	webProgressListener:{
		onProgressChange:function (wp, req, cur, max, curtotal, maxtotal) {},
		onStateChange:function (wp, req, state, status) {},
		onLocationChange:function (wp, req, loc) {
			parasite.setDisabled(loc?loc.asciiSpec:null);
		},
		onStatusChange:function (wp, req, status, message) {},
		onSecurityChange:function (wp, req, state) {},
		startDocumentLoad:function(req) {},
		endDocumentLoad:function(req, status) {}
	}

}


window.addEventListener('load', function() {
	// Add the toolbar button
	parasite.showToolbarButton();
	
	// set initial disabled status
	parasite.setDisabled();

	// set load progress listener
	var doc = document.getElementById('content');
	if (doc) doc.addProgressListener(parasite.webProgressListener);
	
	// also listen for when there are new tabs created
	var tab = gBrowser.tabContainer;
	if (tab) tab.addEventListener('TabSelect', parasite.setDisabled, false);
}, false);
