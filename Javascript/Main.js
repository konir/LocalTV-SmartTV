var widgetAPI = new Common.API.Widget();
var tvKey = new Common.API.TVKeyValue();
var pluginAPI = new Common.API.Plugin();

var Main =
{
    selectedVideo : 0,
    mode : 0,
    mute : 0,
    
    UP : 0,
    DOWN : 1,

    WINDOW : 0,
    FULLSCREEN : 1,
    
    NMUTE : 0,
    YMUTE : 1
}

Main.onLoad = function()
{
	
	window.onShow = onShowHandler;
	
    if ( Player.init() && Audio.init() && Display.init() && Server.init() )
    {
        Display.setVolume( Audio.getVolume() );
        Display.setTime(0);
        
        Player.stopCallback = function()
        {
            /* Return to windowed mode when video is stopped
                (by choice or when it reaches the end) */
            Main.setWindowMode();
        }

        // Start retrieving data from server
        Server.dataReceivedCallback = function()
            {
                /* Use video information when it has arrived */
                Display.setVideoList( Data.getVideoNames(), Data.getVideoIcons() );
                Main.updateCurrentVideo();
            }
        Server.fetchVideoList(); /* Request video information from server */

        // Enable key event processing
        this.enableKeys();

        widgetAPI.sendReadyEvent();    
    }
    else
    {
        alert("Failed to initialise");
    }
}

onShowHandler = function ()
{
	pluginAPI.setOnScreenSaver();
	//pluginAPI.setOffScreenSaver();
};

setScreenTime = function()
{
	// Set screensaver out time to 10 sec - for testing.
	alert ("[APPS] ----- Set screensaver timeout 10 seconds");
	pluginAPI.setOnScreenSaver();
	
}
Main.onUnload = function()
{
    Player.deinit();
    Player.stopVideo();    
}

Main.updateCurrentVideo = function(move)
{
    Player.setVideoURL( Data.getVideoURL(this.selectedVideo) );
    
    Display.setVideoListPosition(this.selectedVideo, move);

    Display.setDescription( Data.getVideoDescription(this.selectedVideo));
}

Main.enableKeys = function()
{
    document.getElementById("anchor").focus();
}

Main.keyDown = function()
{
    var keyCode = event.keyCode;
    alert("Key pressed: " + keyCode);

    var connectionIsReady = checkInternetConnection();

//    if (keyCode == tvKey.KEY_PLAY){
//        checkInternetConnection();
//    } else {
//    	document.getElementById('PhysicalConnection').innerHTML = '';
//    }
    
    switch(keyCode)
    {
        case tvKey.KEY_RETURN:
        case tvKey.KEY_PANEL_RETURN:
            alert("RETURN");

            if (this.mode == this.FULLSCREEN){
                alert("RETURN from FULLSCREEN = setWindowMode()");
                Main.setWindowMode();
                alert("break");
            } else if (Player.getState() == Player.PLAYING){
                alert("RETURN from WINDOW-MODE and isPLAYING = stopVideo()");
                Player.stopVideo();
                alert ("[APPS] ----- Turn on the screensaver");
        		pluginAPI.setOnScreenSaver();
            } else {
            	alert("RETURN else = sendReturnEvent()");
            	widgetAPI.sendReturnEvent(); 
        		pluginAPI.setOnScreenSaver();
            }
            break;
    
        case tvKey.KEY_PLAY:
            alert("PLAY");
 
        	if (connectionIsReady == 3){
        		if (Player.getState() != Player.PAUSED && Player.getState() != Player.PLAYING){
        			alert('Player.getState() = '+Player.getState());
        			document.getElementById('PhysicalConnection').innerHTML = '<img src="icon/loading.gif">';
        			alert ("[APPS] ----- Turn off the screensaver");
        		}
        		pluginAPI.setOffScreenSaver();	
        	}

            this.handlePlayKey();
            break;
            
        case tvKey.KEY_ENTER:
        case tvKey.KEY_PANEL_ENTER:
            alert("ENTER");
            
            if(Player.getState() == Player.PLAYING){
            	this.toggleMode();
            } else {
            	if (connectionIsReady == 3){
            		if (Player.getState() != Player.PAUSED && Player.getState() != Player.PLAYING){
            			alert('Player.getState() = '+Player.getState());
            			document.getElementById('PhysicalConnection').innerHTML = '<img src="icon/loading.gif">';
            		}
            		alert ("[APPS] ----- Turn off the screensaver");
            		pluginAPI.setOffScreenSaver();	
            	}
                this.handlePlayKey();
            }
            break;
            
        case tvKey.KEY_STOP:
        case tvKey.KEY_EXIT:
            alert("STOP");
            Player.stopVideo();
            document.getElementById("progressBar").style.width = 0;
            
            // Turn On the screensaver operation
			alert ("[APPS] ----- Turn on the screensaver with 10 secs");
			pluginAPI.setOnScreenSaver();
            
            break;
            
        case tvKey.KEY_PAUSE:
            alert("PAUSE");
            Player.pauseVideo();
            //this.handlePauseKey();
            
            alert ("[APPS] ----- Turn on the screensaver with 10 secs");
			pluginAPI.setOnScreenSaver();
            
            break;
            
        case tvKey.KEY_VOL_UP:
        case tvKey.KEY_PANEL_VOL_UP:
            alert("VOL_UP");
            if(this.mute == this.NMUTE){
            	Audio.setRelativeVolume(0);
            } else {
            	this.noMuteMode();
            }
            break;
            
        case tvKey.KEY_VOL_DOWN:
        case tvKey.KEY_PANEL_VOL_DOWN:
            alert("VOL_DOWN");
            if(this.mute == 0){
            	Audio.setRelativeVolume(1);
            } else {
            	this.noMuteMode();
            }
            break;      

        case tvKey.KEY_DOWN:
        case tvKey.KEY_PANEL_CH_DOWN:
        case 65:
            alert("DOWN");
            this.selectNextVideo(this.DOWN);
            break;
            
        case tvKey.KEY_UP:
        case tvKey.KEY_PANEL_CH_UP:
        case 68:
            alert("UP");
            this.selectPreviousVideo(this.UP);
            break;            

        case tvKey.KEY_MUTE:
            alert("MUTE");
            this.muteMode();
            break;
            
        default:
            alert("Unhandled key");
            break;
    }
}

Main.handlePlayKey = function()
{
	try{
		switch ( Player.getState() )
		{
		case Player.STOPPED:
			Player.playVideo();
			
			break;
			
		case Player.PAUSED:
			Player.resumeVideo();
			break;
			
		default:
			alert("Ignoring play key, not in correct state");
		break;
		}
	} catch(err) {
		document.getElementById('PhysicalConnection').innerHTML = 'Temporary error. Please try again later... ('+ err +')';
	}
}

Main.handlePauseKey = function()
{
    switch ( Player.getState() )
    {
        case Player.PLAYING:
            Player.pauseVideo();
            break;
        
        default:
            alert("Ignoring pause key, not in correct state");
            break;
    }
}

Main.selectNextVideo = function(down)
{
    Player.stopVideo();
    
    this.selectedVideo = (this.selectedVideo + 1) % Data.getVideoCount();

    this.updateCurrentVideo(down);
}

Main.selectPreviousVideo = function(up)
{
    Player.stopVideo();
    
    if (--this.selectedVideo < 0)
    {
        this.selectedVideo += Data.getVideoCount();
    }

    this.updateCurrentVideo(up);
}

Main.setFullScreenMode = function()
{
    if (this.mode != this.FULLSCREEN)
    {
        Display.hide();
        
        Player.setFullscreen();
        
        this.mode = this.FULLSCREEN;
    }
}

Main.setWindowMode = function()
{
    if (this.mode != this.WINDOW)
    {
        Display.show();
        
        Player.setWindow();
        
        this.mode = this.WINDOW;
    }
}

Main.toggleMode = function()
{
    switch (this.mode)
    {
        case this.WINDOW:
            this.setFullScreenMode();
            break;
            
        case this.FULLSCREEN:
            this.setWindowMode();
            break;
            
        default:
            alert("ERROR: unexpected mode in toggleMode");
            break;
    }
}


Main.setMuteMode = function()
{
    if (this.mute != this.YMUTE)
    {
        var volumeElement = document.getElementById("volumeInfo");
//        Audio.plugin.SetSystemMute(true);
        Audio.plugin.SetUserMute(1);
        document.getElementById("volumeBar").style.backgroundImage = "url(images/videoBox/muteBar.png)";
        document.getElementById("volumeIcon").style.backgroundImage = "url(images/videoBox/mute.png)";
        widgetAPI.putInnerHTML(volumeElement, "MUTE");
        this.mute = this.YMUTE;
    }
}

Main.noMuteMode = function()
{
    if (this.mute != this.NMUTE)
    {
//        Audio.plugin.SetSystemMute(false); 
        Audio.plugin.SetUserMute(0); 
        document.getElementById("volumeBar").style.backgroundImage = "url(images/videoBox/volumeBar.png)";
        document.getElementById("volumeIcon").style.backgroundImage = "url(images/videoBox/volume.png)";
        Display.setVolume( Audio.getVolume() );
        this.mute = this.NMUTE;
    }
}

Main.muteMode = function()
{
    switch (this.mute)
    {
        case this.NMUTE:
            this.setMuteMode();
            break;
            
        case this.YMUTE:
            this.noMuteMode();
            break;
            
        default:
            alert("ERROR: unexpected mode in muteMode");
            break;
    }
}

function checkInternetConnection(){
	var networkPlugin = document.getElementById('pluginObjectNetwork');
	var cType = networkPlugin.GetActiveType();
    var phyConnection = networkPlugin.CheckPhysicalConnection(cType);
    var httpStatus = networkPlugin.CheckHTTP(cType);
	var gateway = networkPlugin.CheckGateway(cType);
    
    alert('phyConnection='+phyConnection);
    alert('httpStatus='+httpStatus);
    alert('gateway='+gateway);

    if (phyConnection == 1 && httpStatus == 1 && gateway == 1){
    	document.getElementById('PhysicalConnection').innerHTML = ''; // Network OK
    } else if (phyConnection == 0 || httpStatus == 0 || gateway == 0){
    	document.getElementById('PhysicalConnection').innerHTML= 'Network Failure';
    } else if (phyConnection == -1 || httpStatus == -1 || gateway == -1) {
    	document.getElementById('PhysicalConnection').innerHTML = 'Network Error';
    } 
    return phyConnection+httpStatus+gateway;
}

