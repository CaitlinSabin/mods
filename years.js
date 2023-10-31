/*
 *========================================== 
 * Inspired by: Cookies per Minute - Claudz  
 *========================================== 
 * Make sure to correlate the variable with  
 * the correlating innerHTML under display   
 * cookie count.			     
 *========================================== 
 */

Game.registerMod("CookiesPerMillionYears",{
	init:function(){
		Game.Notify(`"Cookies per Million Years" loaded!`,'See how many cookies are produced for varying lengths of time.',[16,5],5.5);
		
		drawCPMY = function(){			
			if (!Game.OnAscend)
			{
				// time period variables
				var perMinute = '<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerMinute"'+'>'+loc("per minute:")+' '+Beautify(Game.cookiesPs*60*(1-Game.cpsSucked),1)+'</div>';
				var per20Minutes = '<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPer20Minutes"'+'>'+loc("per 20 minutes:")+' '+Beautify(Game.cookiesPs*60*20*(1-Game.cpsSucked),1)+'</div>';
				var perHour = '<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerHour"'+'>'+loc("per hour:")+' '+Beautify(Game.cookiesPs*3600*(1-Game.cpsSucked),1)+'</div>';
				var perDay = '<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerDay"'+'>'+loc("per day:")+' '+Beautify(Game.cookiesPs*(3600*24)*(1-Game.cpsSucked),1)+'</div>';
				var perWeek = '<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerWeek"'+'>'+loc("per week:")+' '+Beautify(Game.cookiesPs*(3600*168)*(1-Game.cpsSucked),1)+'</div>';
				var perMonth ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerMonth"'+'>'+loc("per month:")+' '+Beautify(Game.cookiesPs*(3600*(24*30))*(1-Game.cpsSucked),1)+'</div>';
				var perYear ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerYear"'+'>'+loc("per year:")+' '+Beautify(Game.cookiesPs*(3600*8760)*(1-Game.cpsSucked),1)+'</div>';
				var perDecade ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerDecade"'+'>'+loc("per decade:")+' '+Beautify(Game.cookiesPs*(3600*8760*10)*(1-Game.cpsSucked),1)+'</div>';
				var perCentury ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerCentury"'+'>'+loc("per century:")+' '+Beautify(Game.cookiesPs*(3600*8760*100)*(1-Game.cpsSucked),1)+'</div>';
				var perMillennium ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerMillennium"'+'>'+loc("per millennium:")+' '+Beautify(Game.cookiesPs*(3600*8760*1000)*(1-Game.cpsSucked),1)+'</div>';
				var perMillionYears ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerMillionYears"'+'>'+loc("per million years:")+' '+Beautify(Game.cookiesPs*(3600*8760*1000000)*(1-Game.cpsSucked),1)+'</div>';
				var perUniverse ='<div style="font-size:50%;'+(Game.cpsSucked>0?' color:#f00;':'')+'" id="cookiesPerUniverse"'+'>'+loc("per age of universe:")+' '+Beautify(Game.cookiesPs*(3600*8760*1000000 * 13787)*(1-Game.cpsSucked),1)+'</div>';

				/*
				 * If you don't want to display all of these time periods, simply comment out
				 * the ones you don't want by putting a double slash ("//") at the beginning 
				 * of the line containing them.  To add a new interval, you need to add a
				 * definition of the new interval above, and also a new line below.
				 */
				
				l('cookies').innerHTML=l('cookies').innerHTML+perMinute; 	// 1 minute
				l('cookies').innerHTML=l('cookies').innerHTML+per20Minutes;   	// 20 minutes   
				l('cookies').innerHTML=l('cookies').innerHTML+perHour;   	// hour    
				l('cookies').innerHTML=l('cookies').innerHTML+perDay;	 	// day
				l('cookies').innerHTML=l('cookies').innerHTML+perWeek;   	// week
				l('cookies').innerHTML=l('cookies').innerHTML+perMonth;  	// month
				l('cookies').innerHTML=l('cookies').innerHTML+perYear;   	// year
				l('cookies').innerHTML=l('cookies').innerHTML+perDecade;   	// decade
				l('cookies').innerHTML=l('cookies').innerHTML+perCentury;   	// century
				l('cookies').innerHTML=l('cookies').innerHTML+perMillennium;   	// millennium
				l('cookies').innerHTML=l('cookies').innerHTML+perMillionYears;  // million years
				l('cookies').innerHTML=l('cookies').innerHTML+perUniverse;   	// age of universe in years
			}
		}; 
		Game.registerHook('draw', drawCPMY);		
	},	
});
