var scripts = [
  'core.js',
  'window-api.js',
  'contextmenus.js',
  'filesystem.js',
  'xp.js',
  'jquery.terminal-2.0.0.min.js',
  'unix_formatting.js',
  'terminal.js',
  'script.js',
  'explorer.js',
  'help.js',
  'browser.js',
  'notepad.js',
  'imageviewer.js',
  'mediaplayer.js',
  'config.js',
  'controlpanel.js',
  'uac.js',
  'audio.js',
  'lambda.js',
  'minesweeper.js',
  '//xpstore.glitch.me/appstore.js',
  'boot.js'
];
var stylesheets = [
  'fonts.css',
  'xp.css',
  'icons.css',
  'widgets.css',
  'window.css',
  'contextmenus.css',
  'cursors.css',
  'desktop.css',
  'startmenu.css',
  'explorer.css',
  'jquery.terminal-2.0.0.min.css'
];
var requiredDirectories = [];

$(function() {
  $('windows').html(`
<div class="_ui_boot">
  <div class="_ui_boot_copyright"></div>
  <div class="_ui_boot_companylogo"></div>
  <center class="_ui_boot_logo">
    <div class="_ui_boot_winlogo"></div>
    <div class="_ui_boot_progress"></div>
    <!--<div style="bottom:0;position:absolute;width:100%;" id="loadingstatus"></div>-->
  </center>
</div>`);
  console.log('Loading scripts and stylesheets...');
  $('<link/>', {rel: 'stylesheet', href: 'boot.css'}).appendTo('head');
  var scriptsindex = 0;
  var stylesindex = 0;
  
  function loadStylesheets() {
    $.ajax({
      url: stylesheets[stylesindex],
      dataType: "script",
      success: function(data){
        $("head").append("<style>" + data + "</style>");
        stylesindex ++;
        if (stylesindex < stylesheets.length) {
          loadStylesheets();
        } else {
          loadScripts();
        }
      }
    });
  }
  
  function loadScripts() {
    $.ajax({
      url: scripts[scriptsindex],
      dataType: "script",
      success: function(data){
        scriptsindex ++;
        if (scriptsindex < scripts.length) {
          loadScripts();
        } else {
          console.log('Finished loading');
          console.log('Checking for necessary directories');
          
          function checkDir(path, callback) {
            var times = 0;
            xp.filesystem.listDir(path, (e) => {
              if (times === 0)
                callback(typeof e === 'string');
              times ++;
            });
          }
          
          var i = 0;
          function checkNextDir(t) {
            var dirToCreate = requiredDirectories[i];
            if (dirToCreate !== undefined) {
              xp.filesystem.createDir(dirToCreate, (e) => {
                i ++;
                checkNextDir();
              });
            } else {
              xp.audio.init();
              var event = new Event('xpboot');
              window.dispatchEvent(event);
              console.log('Dispatched boot event');
              $('windows').html('<div class="_ui_wallpaper fullscreen"><img class="_ui_wallpaper_image" src="https://i.redd.it/p0j4iwha2q351.png"/></div>');
              $.getScript('login.js');
              xp.audio.playURL('https://cdn.glitch.com/01d2e04f-e49d-4304-aa9e-55b9849b4cce%2FWindows%20XP%20Startup.wav?1522620562681');
            }
          }
          
          xp.filesystem.create(512*1024*1024, () => {
            xp.filesystem.fs.root.getDirectory('/', {create: false}, function(dirEntry) {
              var dirReader = dirEntry.createReader();
              var entries = [];

              function readEntries() {
                dirReader.readEntries (function(results) {
                  if (results.length === 0) {
                    $('._ui_boot').remove();
                    $('windows').html('<div class="_ui_wallpaper fullscreen"><img class="_ui_wallpaper_image" src="https://i.redd.it/p0j4iwha2q351.png"/></div>');
                    $.getScript('setup.js');
                  } else {
                    xp.filesystem.createDir('/WINDOWS', (e) => {
                      requiredDirectories = [
                        '/WINDOWS',
                        '/WINDOWS/system32',
                        '/WINDOWS/startup',
                        '/Program Files',
                        '/Documents and Settings'
                      ];
                      checkNextDir();
                    });
                  }
                }, console.error);
              };

              readEntries();
            }, console.error);
          });
        }
      }
    });
  }
  
  loadStylesheets();
});

 

var installedApps = {};

function updateInstalledApps() {
  xp.filesystem.listDir('/Program Files', (name) => {
    if (name.charAt(name.length - 1) !== '/') {
      updateInstalledApp(xp.filesystem.basename(name));
    }
  });
}

$(window).on('xpboot', () => {
  updateInstalledApps();
});

function updateInstalledApp(name) {
  var appName = name.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ").replace(/ /g,"-");
  xp.applications.add(appName, (args) => {
    if (args == undefined || args.length === 0)
      args = ['/Program Files', name + '.js'];
    loadApp(name, args);
  });
  xp.startmenu.add(appName, name, 'https://xpstore.glitch.me/appicon?app=' + name);
}

function loadApp(appName, args) {
  xp.filesystem.readFile('/Program Files/' + appName + '.js', (text) => {
    args = args || [];
    eval(text)
  });
}

function installApp(name) {
  $.ajax({
    url: '//xpstore.glitch.me/appcode?app=' + encodeURIComponent(name),
    async: true,
    success: (text) => {
      xp.filesystem.writeFile('/Program Files/' + name + '.js', new Blob([text], {type: 'text/plain'}), (e) => {
        if (e) {
          xp.dialog('Error', e);
        } else {
          updateInstalledApp(name);
          setTimeout(() => {
            $('.appstore_iframe').each(function() {
              this.contentWindow.postMessage('reload', '*');
              setTimeout(() => this.contentWindow.postMessage('native', '*'), 2000);
            })
          }, 1000);
        }
      });
    }
  });
}

function removeApp(name, callback) {
  xp.dialog('Confirm', 'Are you sure you want to uninstall ' + name + '?', () => {
    xp.filesystem.deleteFile(xp.filesystem.addPaths('/Program Files', name + '.js'), (e) => {
      if (e) {
        xp.dialog('Error', e);
      } else {
        var appname = name.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ").replace(/ /g,"-");
        xp.applications.remove(appname);
        xp.startmenu.remove(appname);
        $('.appstore_iframe').each(function() {
          this.contentWindow.postMessage('reload', '*');
          setTimeout(() => this.contentWindow.postMessage('native', '*'), 2000);
        });
        if (callback !== undefined) callback();
      }
    });
  }, true);
}

$(window).on('xpboot', () => {
  xp.controlpanel.add('Add and Remove Programs', () => {

    document.body.append(el[0]);
    $(el).updateWindow();

    $(el).on('click', function() {
      $(this).find('li').each(function() {
        $(this).attr('data-selected', 'false');
        $(this).find('div').css('display', 'none');
        $(this).css('height', '18px');
      });
    });

    function listDir(el) {
      $(el).find('ul').html('');
      xp.filesystem.listDir('/Program Files', (name) => {
        if (name.charAt(name.length - 1) !== '/') {

          $(el2).on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(el).find('li').each(function() {
              $(this).attr('data-selected', 'false');
              $(this).find('div').css('display', 'none');
              $(this).css('height', '18px');
            });
            $(this).attr('data-selected', 'true');
            $(this).find('div').css('display', 'block');
            $(this).css('height', '38px');
          });
          $(el2).find('button').on('click', function() {
            removeApp(xp.filesystem.basename(name), () => listDir(el));
          });
          $(el).find('ul').append(el2);
        }
      });
    }

    listDir(el);
  });
  xp.applications.add('appstore', () => {

    
    document.body.append(el[0]);
    $(el).updateWindow();
    
    $(el).find('iframe').on('load', function() {
      this.contentWindow.postMessage('native', '*');
    });
  });
  
  window.addEventListener('message', function(e) {
    var key = e.message ? 'message' : 'data';
    var data = e[key];
    console.log(data);
    if ((typeof data) === 'object' && data.length !== undefined && data.length === 2) {
      if (data[0] === 'installApp') {
        installApp(data[1]);
      } else if (data[0] === 'removeApp') {
        removeApp(data[1]);
      } else if (data[0] === 'isInstalled' && data[1] != undefined) {
        $('.appstore_iframe').each(function() {
          xp.filesystem.listDir('/Program Files', (name) => {
            if (xp.filesystem.basename(name).toLowerCase() === data[1].toLowerCase()) {
              this.contentWindow.postMessage(['isInstalled', true], '*');
            }
          });
        });
      }
    }
  }, false);
  
  xp.startmenu.add('appstore', 'Store', 'https://silicophilic.com/wp-content/uploads/2019/12/Microsoft_Windows_Store_Download.png');
});
