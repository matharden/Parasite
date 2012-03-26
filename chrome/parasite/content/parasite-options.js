
// Parasite Object
var parasite = {

	// Gain access to the Prefences service
	prefManager: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	

	// Called when the preference window loads. Populates the Hosts List
	// based on the "extensions.parasite.hosts" preference.
	populateHostsList: function() {
		var prefString = this.prefManager.getCharPref("extensions.parasite.hosts");
	
		if (prefString == "") return;
	
		// Turn preferences string into a JSON object
		var hostsObj = JSON.parse(prefString);

		// Just work with the first project (for now)
		var hosts = hostsObj[0].hosts;
		var hostsList = document.getElementById("hostsList");

		for (var i=0; i<hosts.length; i++) {
			// Create a new table row
			var newItem = document.createElement("treeitem");
			var newRow = document.createElement("treerow");
			newItem.appendChild(newRow);
		
			// Column 1
			var hname = document.createElement("treecell");
			hname.setAttribute("label", hosts[i].hostname);
			newRow.appendChild(hname);
		
			// Column 2
			var lbl = document.createElement("treecell");
			lbl.setAttribute("label", hosts[i].label);
			newRow.appendChild(lbl);

			hostsList.appendChild(newItem);
		}
	},


	// Save the Hosts List to the "extensions.parasite.hosts" preference.
	// This is called by the pref's system when the GUI element is altered.
	saveHostList: function() {
		var hostsList = document.getElementById("hostsList").childNodes,
			proj = [{
				"name":"project1",
				"hosts":[]
			}];

		for (var i=0; i < hostsList.length; i++) {
		
			var columns = hostsList[i].childNodes[0].childNodes;
		
			proj[0].hosts.push(
				{
					"hostname":columns[0].getAttribute("label"),
					"label":columns[1].getAttribute("label")
				}
			);
	      }

		return JSON.stringify(proj);
	},


	// Populates the edit page with the given info
	populateEdit: function(locationsStr, labelsStr, editIndexStr) {
		var locations = document.getElementById("host-text");
		var labels = document.getElementById("label-text");
		var editIndex = document.getElementById("editIndex");

		editIndex.value = "" + editIndexStr;
		locations.value = "" + locationsStr;
		labels.value = "" + labelsStr;

		locations.focus();
	},


	// Edits the currently selected host
	editHost: function() {
		var hostTree = document.getElementById("hostTree");
		var selectedIndex = hostTree.currentIndex;

		// Ignore the button if no host selected
		if (selectedIndex == -1) return;

		var hostsList = document.getElementById("hostsList");
		var entry = hostsList.childNodes[selectedIndex].childNodes[0].childNodes;

		this.populateEdit(
			entry[0].getAttribute("label"),
			entry[1].getAttribute("label"),
			selectedIndex
		);

		this.flipView("edit");
	},


	// Deletes the currently selected host
	deleteHost: function() {
		var hostTree = document.getElementById("hostTree");
		var index = hostTree.currentIndex;

		if(index != -1) {
			var hostsList = document.getElementById("hostsList");
			var toRemove = hostsList.childNodes.item(index);
			hostsList.removeChild(toRemove);
			document.getElementById("parasite-pref-pane").userChangedValue(hostTree);
		}
	},


	// Flips the view from/to informational/edit modes
	flipView: function(mode) {
		//var defaultGroupBox = document.getElementById("defaultGroupBox");
		var hostsListGroupBox = document.getElementById("hostsListGroupBox");
		var hostsEditorGroupBox = document.getElementById("hostsEditorGroupBox");

		if(mode == "edit") {
			//defaultGroupBox.setAttribute("hidden", "true");
			hostsListGroupBox.setAttribute("hidden", "true");
			hostsEditorGroupBox.setAttribute("hidden", "false");
		} else {
			//defaultGroupBox.setAttribute("hidden", "false");
			hostsListGroupBox.setAttribute("hidden", "false");
			hostsEditorGroupBox.setAttribute("hidden", "true");
		}
	},


	// Creates a new host
	newHost: function() {
		this.flipView("edit");

		this.populateEdit("", "", "");
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

	// Select just the protocol and hostname from a full URI
	cropHostname: function(id) {
		var el = document.getElementById(id),
			loc = this.parseUrl(el.value);
			
		el.value = loc.protocol+loc.host;
	},
	
	// Called when a host has been created/modified
	saveHost: function() {
		var locations = document.getElementById("host-text");
		var labels = document.getElementById("label-text");
		var editIndex = document.getElementById("editIndex");
		var hostsList = document.getElementById("hostsList");

		/* sanity checks, should check times, too */
		if (locations.value == "") {
			alert("You must enter a location!");
			return;
		}
		
		this.cropHostname('host-text');
		
		var newRow = document.createElement("treerow");
		var newItem = document.createElement("treeitem");
		newItem.appendChild(newRow);

	 	var url = document.createElement("treecell");
		url.setAttribute("label", locations.value);
		newRow.appendChild(url);

	 	var lbl = document.createElement("treecell");
		lbl.setAttribute("label", labels.value);
		newRow.appendChild(lbl);

		if(editIndex.value == "") {
			hostsList.appendChild(newItem);
		} else {
			var oldItem = hostsList.childNodes[parseInt(editIndex.value)];
			hostsList.replaceChild(newItem, oldItem);
		}

		var hostTree = document.getElementById("hostTree");
	      document.getElementById("parasite-pref-pane").userChangedValue(hostTree);

		this.flipView("normal");
	},


	// Called when a host that has been created/modified is cancelled.
	cancelHost: function() {
		this.flipView("normal");
	},


	// Moves the selected item up/down one place
	move: function(dir) {
		var hostTree = document.getElementById("hostTree");
		var index = hostTree.currentIndex;

		if(index != -1) {
			var hostsList = document.getElementById("hostsList");
			if(dir == "up" && index > 0) {
				var nextIndex = index - 1;
				var top = hostsList.childNodes[nextIndex];
				var bottom = hostsList.childNodes[index];
			} else if(dir == "down" && index < hostsList.childNodes.length - 1) {
				var nextIndex = index + 1;
				var top = hostsList.childNodes[index];
				var bottom = hostsList.childNodes[nextIndex];
			} else {
				return;
			}

			var oA = top.childNodes[0].childNodes[0].getAttribute("label");
			var oB = top.childNodes[0].childNodes[1].getAttribute("label");
	
			var iA = bottom.childNodes[0].childNodes[0].getAttribute("label");
			var iB = bottom.childNodes[0].childNodes[1].getAttribute("label");
			
			top.childNodes[0].childNodes[0].setAttribute("label", iA);
			top.childNodes[0].childNodes[1].setAttribute("label", iB);

			bottom.childNodes[0].childNodes[0].setAttribute("label", oA);
			bottom.childNodes[0].childNodes[1].setAttribute("label", oB);

			hostTree.currentIndex = nextIndex;
			hostTree.focus();
			document.getElementById("parasite-pref-pane").userChangedValue(hostTree);
		}
	}
	
}