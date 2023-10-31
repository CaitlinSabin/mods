Game.registerMod("TrueOffline",{

// Global Data and Config

Config: {			// Constants used for the mod
	calcDelay: 5,	// How many time after loading before calculate offline cookies
},

Sav: {
	twin: -1,			// Memory of the Twin gates upgrade bought
	idle: -1,			// Memory of the Perfect idling upgrade bought
	wrinklers: {},		// Wrinklers data
	lumpT: 0,			// Current lump age
	emptyNotif: true,	// Notify if no change was made offline
	fullNotif: false,	// Add additional infos into notification
},

Icon: [0,0],			// Which icon to use for notification (written in LOAD)

Lumps: {
	Vanilla: {			// lumps stats used at init
		matureAge: 0,
		ripeAge: 0,
		overripeAge: 0,
		nbProduced: 0,	// How many full lumps were produced
		currentAge: 0,	// In proportion of the overripe delay, age of the current sugar lump
		totalAge: 0,	// In proportion of the overripe delay, age of total offline production
	},
	Caramel: {			// Lumps stats used after all is loaded
		matureAge: 0,
		ripeAge: 0,
		overripeAge: 0,
		nbProduced: 0,
		currentAge: 0,
	},
},

OfflineProduction: {	// Was there offline production for this session
	Cookies: false,
	Lumps: false,
	Time: 0,			// in ms
},

OfflineCookies: {},		// Offline data production (structure)
OfflineLumps: 0,		// Offline lumps production (int)

Screen: {
	current: 0,			// Current screen
	previous: 0,		// Previous screen
},




// INIT - Automatically called at mod startup
init: function()
{
	// Register hooks
	Game.registerHook('logic', this.UpdateUpgradesDisplay);
	Game.registerHook('reset', this.resetSave);


	// Register offline time
	this.OfflineProduction.Time = Date.now() - Game.lastDate;

	// Create options in menu - Done to avoid needing CCSE
	let originalCode = Game.UpdateMenu.toString();
	let position = originalCode.lastIndexOf("}");
	if (position >= 0) {
		let newCode = originalCode.substring(0, position) + `
		Game.mods.TrueOffline.initMenu();
		` + originalCode.substring(position);
		eval("Game.UpdateMenu = " + newCode);
	}

},


// Add settings to menu
initMenu: function()
{
	/* Menu sections HTML is structured as
	<div class="block" style="padding:0px;margin:8px 4px;">
		<div class="subsection" style="padding:0px;">
			<div>
				<div class="title">Title</div>
				<div>
					<div class="listing">Interface element</div>
					<div class="listing">Interface element</div>
					...
				</div>
			</div
		</div>
	</div> */

	if (Game.onMenu=='prefs') {
		let allOptions = document.getElementsByClassName('block');
		let lastOption = allOptions[allOptions.length - 1];
		lastOption.outerHTML += `
		<div class="block" style="padding:0px;margin:8px 4px;">
			<div class="subsection" style="padding:0px">
				<div class="title">True Offline Production</div>
				<div class="listing">
					<a class="smallFancyButton prefButton option off"
						id="emptyNotifButton"
						onclick="PlaySound('snd/tick.mp3'); Game.mods.TrueOffline.Sav.emptyNotif = !Game.mods.TrueOffline.Sav.emptyNotif; Game.mods.TrueOffline.updateMenuButtons();">
					</a>
					<label id="emptyNotifDesc"></label>
					<br>
				</div>
				<div class="listing">
					<a class="smallFancyButton prefButton option off"
						id="fullNotifButton"
						onclick="PlaySound('snd/tick.mp3'); Game.mods.TrueOffline.Sav.fullNotif = !Game.mods.TrueOffline.Sav.fullNotif; Game.mods.TrueOffline.updateMenuButtons();">
					</a>
					<label id="fullNotifDesc"></label>
					<br>
				</div>
			</div>
		</div>`;

		// Fill and translate texts
		l("emptyNotifDesc").innerHTML = loc("Displays a notification when offline production is enabled but no production was done.");
		l("fullNotifDesc").innerHTML = loc("Displays additional details on offline production notification.")
		Game.mods.TrueOffline.updateMenuButtons();
	}
},




// LOAD - Automatically called after game stats are loaded
// Important note: is not called if saved data does not exist (aka first launch before saving!)
load: function(str)
{
	// Load saved data (create a copy)
	const savedData = JSON.parse(str);
	this.Sav = { ...savedData };

	// Add default values for settings from new versions
	if (this.Sav.emptyNotif === undefined) this.Sav.emptyNotif = true;
	if (this.Sav.fullNotif === undefined) this.Sav.fullNotif = false;


	// WRINKLERS
	if (this.Sav.wrinklers) Game.wrinklers = { ...this.Sav.wrinklers };


	// SUGAR LUMPS
	this.OfflineProduction.Lumps = Game.canLumps();

	// Compute Vanilla offline sugar lumps
	if (this.OfflineProduction.Lumps) this.computeVanillaLumps(this.OfflineProduction.Time);


	// COOKIES
	this.OfflineProduction.Cookies = true;

	// If upgrades are already bought, save the state but do not proceed offline production
	if (Game.Has('Twin Gates of Transcendence') || Game.Has('Perfect idling')) {
		this.Sav.twin = Game.Has('Twin Gates of Transcendence');
		this.Sav.idle = Game.Has('Perfect idling');
		Game.Upgrades['Twin Gates of Transcendence'].bought = 0;
		Game.Upgrades['Perfect idling'].bought = 0;
		this.OfflineProduction.Cookies = false;
	}

	// Check if offline cookies production is still possible
	let twinChilds = Game.Has('Angels') || Game.Has('Archangels') || Game.Has('Virtues') || Game.Has('Dominions') || Game.Has('Cherubim') || Game.Has('Seraphim') || Game.Has('God') ||
					 Game.Has('Belphegor') || Game.Has('Mammon') || Game.Has('Abaddon') || Game.Has('Satan') || Game.Has('Asmodeus') || Game.Has('Beelzebub') || Game.Has('Lucifer') ||
					 Game.Has('Chimera');
	if (!this.Sav.twin && !twinChilds && !this.Sav.idle) this.OfflineProduction.Cookies = false;


	// Is there offline Cookies or Lumps production?
	if (this.OfflineProduction.Cookies || this.OfflineProduction.Lumps) {
		// Notification - Using the same random icon formula as vanilla game
		this.Icon = [Math.floor(Math.random() * 16), 11];
		Game.Notify(loc('Processing True Offline production'),
					loc('True Offline Production is monitoring CpS and lumps to calc offline production.') + "<br><q>" + loc("This won't be long, promise.") + "</q>",
					this.Icon, 5, 1);

		// Setting a delay to let the game and the mods load
		setTimeout(this.computeOfflineProduction, this.Config.calcDelay * 1000);
	}
},

// Reset stats (when wiping save)
resetSave: function(wipe)
{
	const Me = Game.mods["TrueOffline"].Sav;
	if (wipe) {
		Me.twin = 0;
		Me.idle = 0;
		Me.wrinklers = {};
		Me.lumpT = 0;
	}
},




// Calculate true offline production
computeOfflineProduction: function()
{
	// Initialize
	const Me = Game.mods['TrueOffline'];
	Game.CalculateGains();


	// SUGAR LUMPS
	if (Me.OfflineProduction.Lumps) Me.computeCaramelLumps();


	// COOKIES
	if (Me.OfflineProduction.Cookies) Me.computeCaramelCookies();


	// Notification
	let title = loc("Welcome back!"), desc = '';
	// COOKIES
	if (Me.OfflineProduction.Cookies && Me.OfflineCookies.total > 0) {
		desc += loc("You earned <b>%1</b> while you were away.", loc("%1 cookie", Beautify(Me.OfflineCookies.total))) + '<br><br>';
		// Optimal cookie production
		desc += loc("<b>%1</b> at <b>%2%</b> of your unbuffed CpS during %3", [Beautify(Me.OfflineCookies.optimal), Me.OfflineCookies.percent, Game.sayTime(Me.OfflineCookies.optimalTime * Game.fps, -1)]);
		// Reduced cookie production
		if (Me.OfflineCookies.reduced > 0) {
			desc += ", " + loc("and") + " <br>" + loc("<b>%1</b> at <b>%2%</b> of your unbuffed CpS during %3", [Beautify(Me.OfflineCookies.reduced), Me.OfflineCookies.percent * 0.1, Game.sayTime(Me.OfflineCookies.reducedTime * Game.fps, -1)]) + ".";
		}
		else { desc += "." }
		// Is there any wrinkler
		if (Me.OfflineCookies.nbWrinklers > 0) {
			desc += '<br><br>' + loc("Wrinklers ate <b>%1%</b> of them, aka", Math.round(Game.cpsSucked * 100)) + " <b>" + loc("%1 cookie", Beautify(Me.OfflineCookies.sucked)) + "</b>";
			desc += Me.Sav.fullNotif ? "<br>(" + loc("%1 cookie", Beautify(Me.OfflineCookies.sucked / Me.OfflineCookies.nbWrinklers)) + " " + loc("by wrinkler") + ")." : ".";
		}
	}

	// SEPARATOR
	if (Me.OfflineProduction.Cookies && Me.OfflineProduction.Lumps && Me.OfflineLumps > 0) desc += '<br><div class="line"></div>';

	// LUMPS
	if (Me.OfflineProduction.Lumps && Me.OfflineLumps > 0) {
		desc += loc("You harvested <b>%1</b> while you were away.", loc("%1 sugar lump", Beautify(Me.OfflineLumps)) + " " + loc("more"));
	}

	// Nothing?
	if ((!Me.OfflineProduction.Cookies || Me.OfflineCookies.total <= 0) && (!Me.OfflineProduction.Lumps || Me.OfflineLumps <= 0)) {
		// No notification and no change? Exit
		if (!Me.Sav.emptyNotif) return;
		desc += loc("No change was made to your offline production.");
	}

	Game.Notify(title, desc, Me.Icon);
},




// Compute offline Sugar Lumps production
// This function returns the same values as the game does when starting
computeVanillaLumps()
{
	// Shortcut to times
	let tMature = 0, tRipe = 0, tOverripe = 0;

	// Define default times
	let oneSecond = 1000;						// in ms
	let oneMinute = 1000 * 60;					// in ms
	let oneHour = 1000 * 3600;					// in ms
	tMature = 20 * oneHour;	// by default: Mature time is 20 hours
	tRipe = 23 * oneHour;		// by default: Ripe time is 23 hours (and overripe is ripe + 1 hour)

	// Reduce times according to vanilla upgrades - WORKS in vanilla function
	if (Game.Has('Stevia Caelestis'))		tRipe -= oneHour;
	if (Game.Has('Diabetica Daemonicus'))	tMature -= oneHour;
	if (Game.Has('Ichor syrup'))			tMature -= 7 * oneMinute;
	if (Game.Has('Sugar aging process'))	tRipe -= 6 * oneSecond * Math.min(600, Game.Objects['Grandma'].amount);

	// Reduce times according to Pantheon - DOES NOT WORK in vanilla function
/* 	if (Game.hasGod && Game.BuildingsOwned%10 == 0) {
		let godLvl = Game.hasGod('order');
		if (godLvl == 1) 	tRipe -= oneHour;
		else if (godLvl==2) tRipe -= 40 * oneMinute;
		else if (godLvl==3) tRipe -= 20 * oneMinute;
	} */

	// Reduce times according to Dragon Auras - WORKS in vanilla function
	tMature /= 1 + Game.auraMult('Dragon\'s Curve') * 0.05;
	tRipe /= 1 + Game.auraMult('Dragon\'s Curve') * 0.05;

	// Overripe time = Ripe time + 1 hour
	tOverripe = tRipe + oneHour;

	// Special debug upgrade - WORKS in vanilla function
	if (Game.Has('Glucose-charged air')) { tMature /= 2000; tRipe /= 2000; tOverripe /= 2000; }


	// Affect times
	this.Lumps.Vanilla.matureAge = tMature;
	this.Lumps.Vanilla.ripeAge = tRipe;
	this.Lumps.Vanilla.overripeAge = tOverripe;


	// How many Sugar Lumps would have been produced (in multiples of the overripe time)
	this.Lumps.Vanilla.totalAge = this.OfflineProduction.Time / tOverripe;
	this.Lumps.Vanilla.nbProduced = Math.floor(this.Lumps.Vanilla.totalAge);
	this.Lumps.Vanilla.currentAge = this.Lumps.Vanilla.nbProduced > 0 ? this.Lumps.Vanilla.totalAge % this.Lumps.Vanilla.nbProduced : this.Lumps.Vanilla.totalAge;

	// Debug
	console.log("Vanilla : les sucres s'affinent après " + Game.sayTime(tMature / 1000 * Game.fps, -1));
	console.log("Vanilla : les sucres mûrissent après " + Game.sayTime(tRipe / 1000 * Game.fps, -1));
	console.log("Vanilla : les sucres tombent après " + Game.sayTime(tOverripe / 1000 * Game.fps, -1));
	console.log("Vanilla : Production en proportion de la durée de récole = " + this.Lumps.Vanilla.totalAge);
	console.log("Vanilla : Nombre de sucres complètement produits = " + this.Lumps.Vanilla.nbProduced);
	console.log("Vanilla : Âge du sucre en cours de formation (proportionnel au temps de récolte) = " + this.Lumps.Vanilla.currentAge);
},




computeCaramelLumps: function()
{
	const Me = Game.mods['TrueOffline'];
	let memLumps = Game.lumps;

	// Step 1: Calc production with real times
	Me.Lumps.Caramel.matureAge = Game.lumpMatureAge;
	Me.Lumps.Caramel.ripeAge = Game.lumpRipeAge;
	Me.Lumps.Caramel.overripeAge = Game.lumpOverripeAge;
	Me.Lumps.Caramel.totalAge = Me.OfflineProduction.Time / Me.Lumps.Caramel.overripeAge;	// In proportion of the new overripe age
	Me.Lumps.Caramel.nbProduced = Math.floor(Me.Lumps.Caramel.totalAge);
	Me.Lumps.Caramel.currentAge = Me.Lumps.Caramel.nbProduced > 0 ? Me.Lumps.Caramel.totalAge % Me.Lumps.Caramel.nbProduced : Me.Lumps.Caramel.totalAge;


	// Step 2: Remove gains from vanilla game
	// Remember: lumpT = Date.now() for a 0 hour old lump. An overriped lump means Game.lumpT = Date.now() - Game.lumpoverripeAge
	Game.lumps -= Me.Lumps.Vanilla.nbProduced;	// Remove fully produced lumps
	Game.lumpT += Me.Lumps.Vanilla.currentAge * Me.Lumps.Caramel.overripeAge;	// New time unit is caramel one
/* 	while (Game.lumpT > Date.now()) {
		// If removing the age of the current lump makes a "negative" age, remove another lump and give the overripe time to the current
		Game.lumps--;
		Game.lumpT -= Me.Lumps.Vanilla.overripeAge;
		Me.OfflineLumps--;
	} */


	// Step 3: Add gains from caramel production
	Game.lumps += Me.Lumps.Caramel.nbProduced;
	Game.lumpT -= Me.Lumps.Caramel.currentAge * Me.Lumps.Caramel.overripeAge;
	while (Game.lumpT < Date.now() - Me.Lumps.Caramel.overripeAge) {
		// If adding the age of the current lump make a negative number, add another lump and remove the overripe time to the current
		Game.lumps++;
		Game.lumpT += Me.Lumps.Caramel.overripeAge;
	}


	// Step 4: Store how many lumps were added
	Me.OfflineLumps = Game.lumps - memLumps;
},




computeCaramelCookies: function()
{
	const Me = Game.mods['TrueOffline'];

	// Get unbuffed CpS (raw CpS ignores effects such as Elder covenant, Golden switch, Shimmering veil...)
	let trueUnbuffedCps = Game.unbuffedCps;

	// Remove the dragon aura which depends of golden cookies are no one is present during offline time (code from main.js)
	let n = Game.shimmerTypes['golden'].n;
	let auraMult = Game.auraMult('Dragon\'s Fortune');
	for (var i=0; i < n; i++) { trueUnbuffedCps /= 1 + auraMult * 1.23; }

	// Calc how many cookies we produced
	Me.OfflineCookies = Me.SimulateOffineCookies(trueUnbuffedCps);
	let cookiesToEarn = Me.OfflineCookies.total;	// Final amount to add to cookies

	// If there are wrinklers sucking cookies, some of the offline production will go in their stomach
	let cookiesByWrinkler = 0;
	if (Game.cpsSucked > 0) {
		// How many wrinklers sucking cookies?
		for (var i in Game.wrinklers) {
			if (Game.wrinklers[i].phase == 2) Me.OfflineCookies.nbWrinklers++;
		}

		// How many cookies are sucked?
		Me.OfflineCookies.sucked = Me.SimulateOffineCookies(trueUnbuffedCps * Game.cpsSucked, Me.OfflineProduction.Time).total;
		cookiesToEarn -= Me.OfflineCookies.sucked;
		cookiesByWrinkler = Math.round(Me.OfflineCookies.sucked / Me.OfflineCookies.nbWrinklers);

		// Give the sucked cookies to the winklers
		for (var i in Game.wrinklers) {
			if (Game.wrinklers[i].phase == 2) Game.wrinklers[i].sucked += cookiesByWrinkler;
		}
	}

	// Give the remaining cookies to the total
	if (cookiesToEarn > 0) Game.Earn(cookiesToEarn);
},




// Keep the illusion of bought Twin gates and/or Perfect idling upgrades bought (in fact, this mod keeps them disabled to avoid vanilla offline production process)
UpdateUpgradesDisplay: function ()
{
	// Shortcuts
	const Me = Game.mods['TrueOffline'];


	// Saving game?
	let GameIsSaving = (Game.toSave || Game.isSaving || (Game.T%(Game.fps*60)==0 && Game.T>Game.fps*10 && Game.prefs.autosave)) && !Game.OnAscend;

	// Registering current screen - To avoid cumulative effect, when the game is saving is treated as returning in None screen
	if (GameIsSaving) Me.Screen.current = -1;
	else if (Game.OnAscend) Me.Screen.current = 1;
	else if (Game.onMenu == 'stats') Me.Screen.current = 2;
	else Me.Screen.current = 0;


	// Did the player enter/leave a special screen?
	let enteredSpecial = Me.Screen.current > 0 && Me.Screen.previous <= 0,
		leftSpecial = Me.Screen.current <= 0 && Me.Screen.previous > 0;
	
	// If switching from or to a special screen while saved data is undefined, do not interfere but save current values
	if ((enteredSpecial || leftSpecial) && (Me.Sav.twin < 0 || Me.Sav.idle < 0)) {
		Me.UpgradesToSav();
	}

	// What to do when screen changed to/from a special screen?
	if (enteredSpecial) Me.SavToUpgrades();
	else if (leftSpecial) Me.UpgradesToSav();
	
	// Sync previous screen with current
	Me.Screen.previous = Me.Screen.current;
},

// Copy info from Upgrades to Sav and disable Bought status
UpgradesToSav: function() {
	const Me = Game.mods['TrueOffline'];

	Me.Sav.twin = Game.Upgrades['Twin Gates of Transcendence'].bought;
	Me.Sav.idle = Game.Upgrades['Perfect idling'].bought;
	Game.Upgrades['Twin Gates of Transcendence'].bought = 0;
	Game.Upgrades['Perfect idling'].bought = 0;
	
},

// Copy info from Sav to Upgrades
SavToUpgrades: function() {
	const Me = Game.mods['TrueOffline'];

	Game.Upgrades['Twin Gates of Transcendence'].bought = Me.Sav.twin;
	Game.Upgrades['Perfect idling'].bought = Me.Sav.idle;
},




// Formula to get offline cookies from CpS - Copied and adapted from main.js
// Returns an object
SimulateOffineCookies:function(CpS)
{
	let maxTime = 0, percent = 0;

	if (Game.Has('Perfect idling') || Game.mods["TrueOffline"].Sav.idle) {
		maxTime=60*60*24*1000000000;
		percent=100;
	}
	else {
		maxTime=60*60;
		if (Game.Has('Belphegor')) maxTime*=2;
		if (Game.Has('Mammon')) maxTime*=2;
		if (Game.Has('Abaddon')) maxTime*=2;
		if (Game.Has('Satan')) maxTime*=2;
		if (Game.Has('Asmodeus')) maxTime*=2;
		if (Game.Has('Beelzebub')) maxTime*=2;
		if (Game.Has('Lucifer')) maxTime*=2;
		
		percent=5;
		if (Game.Has('Angels')) percent+=10;
		if (Game.Has('Archangels')) percent+=10;
		if (Game.Has('Virtues')) percent+=10;
		if (Game.Has('Dominions')) percent+=10;
		if (Game.Has('Cherubim')) percent+=10;
		if (Game.Has('Seraphim')) percent+=10;
		if (Game.Has('God')) percent+=10;
		
		if (Game.Has('Chimera')) {maxTime+=60*60*24*2;percent+=5;}
		
		if (Game.Has('Fern tea')) percent+=3;
		if (Game.Has('Ichor syrup')) percent+=7;
		if (Game.Has('Fortune #102')) percent+=1;
	}
	
	let offlineTime = (Date.now()-Game.lastDate) / 1000 - Game.mods["TrueOffline"].Config.calcDelay;
	let timeOfflineOptimal=Math.min(offlineTime,maxTime),
		timeOfflineReduced=Math.max(0,offlineTime-timeOfflineOptimal);

	let amountOptimal = timeOfflineOptimal * CpS * percent / 100,
		amountReduced = timeOfflineReduced * CpS * 0.1 * percent / 100;
	let amountTotal = amountOptimal + amountReduced;
	
	return {
		optimal: amountOptimal,
		reduced: amountReduced,
		total: amountTotal,
		percent: percent,
		optimalTime: timeOfflineOptimal,
		reducedTime: timeOfflineReduced,
		// Following are not used here but needed later
		sucked: 0,
		nbWrinklers: 0,
	};
},




// Update buttons and text displays (on/off, translation...)
updateMenuButtons: function() {
	const Me = Game.mods.TrueOffline;

	// Notification when no offline production
	l("emptyNotifButton").innerHTML = loc("Always notify") + "<br>" + (Me.Sav.emptyNotif ? ON : OFF);
	l("emptyNotifButton").className = "smallFancyButton prefButton option " + (Me.Sav.emptyNotif ? "on" : "off");

	l("fullNotifButton").innerHTML = loc("Additinal info") + "<br>" + (Me.Sav.fullNotif ? ON : OFF);
	l("fullNotifButton").className = "smallFancyButton prefButton option " + (Me.Sav.fullNotif ? "on" : "off");
},




// SAVE - Automatically called when saving game
save: function()
{
	// If no data about upgrades, process initial copy
	if (this.Sav.twin < 0 || this.Sav.idle < 0) this.UpgradesToSav();

	// Save wrinklers
	if (Game.wrinklers) this.Sav.wrinklers = { ...Game.wrinklers };

	// Save data
	return JSON.stringify(this.Sav);
},

});
	
	

//=================================================




// English translation - Required to manage "%1"
ModLanguage('*',
{
	'<b>%1</b> at <b>%2%</b> of your unbuffed CpS during %3' : '<b>%1</b> at <b>%2%</b> of your unbuffed CpS during %3',
	'Wrinklers ate <b>%1%</b> of them, aka' : 'Wrinklers ate <b>%1%</b> of them, aka'
});




// Traduction française
ModLanguage('FR',
{
	'Processing True Offline production' : 'Génération de la production hors-ligne',
	'True Offline Production is monitoring CpS and lumps to calc offline production.' : 'True Offline Production surveille les CpS et sucres pour calculer la production hors-ligne.',
	"This won't be long, promise." : "Ce ne sera pas long, promis.",

	'<b>%1</b> at <b>%2%</b> of your unbuffed CpS during %3' : '<b>%1</b> à <b>%2 %</b> de tes CpS hors améliorations pendant %3',
	'and' : 'ainsi que',
	'Wrinklers ate <b>%1%</b> of them, aka' : 'Les rideux ont mangé <b>%1 %</b> d\'entre eux, soit',
	'more' : 'supplémentaire',
	'by wrinkler' : 'par rideux',

	'No change was made to your offline production.' : 'Aucun changement n\'a été apporté à ta production hors ligne.',

	"Always notify" : "Toujours notifier",
	"Displays a notification when offline production is enabled but no production was done." : "Affiche une notification lorsque la production hors-ligne est activée mais que rien n'a été produit.",
	"Additinal info" : "Infos additionnelles",
	"Displays additional details on offline production notification." : "Affiche des détails supplémentaires dans la notification de production hors-ligne.",
});