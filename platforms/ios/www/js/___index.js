/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



    var model;
    var platform;
    var version;
    var uuid;
    var appversion;
    var gpsactive;
    var ref;
    var name = '';
    var network = '1';
    var registrationId;
    var networkState;
    var regpush = '0';
    var server = '';
    var savedserver = 0;
    var serverschools = 'https://geocommerce.com.ec/www/rutasescolares/';


var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {  
    model   = device.model;
    platform  = device.platform;
    version   = device.version;
    uuid    = device.uuid; 
    document.addEventListener("backbutton", onBackKeyDown, false);
    networkState = navigator.connection.type;
    // check if server is set
    NativeStorage.getItem("data", getSuccess, getError);
    // Enable background mode 
    cordova.plugins.backgroundMode.enable(); 

    cordova.getAppVersion(function (version) {
        $('#appversion').text('V '+version);
        appversion = version;
    });
    
    },
};

function getSuccess(obj){
    savedserver = 1;
    if (obj.school)  { 
        $('#schoolname').text(obj.school);
        $('#selchool').hide();
    } else {
        $('#divschoolname').hide();
    }
    server = obj.server;
    $('#changeschool').show();   
    register();
}

function getError(){
    savedserver = 0;
    getschools();
}

function setSuccess(){
    savedserver = 1;
    register();
}
function setError(){
    alert('Error: no se pudo almacenar la institución, comuníque el error a rutas@geocommerce.com.ec.');
    return false;
}

function changeschool(){
    savedserver = 0;
    $('#divschoolname').hide();
    NativeStorage.remove("data", this.removeSuccess, this.removeError);
}

function removeSuccess(){
    getschools();
}
function removeError(){
    alert('Hay un error, por favor informelo a rutas@geocommerce.com.ec');
    return false;
}

function getschools(){
    $('#screen1').show();
    $('#screen2').hide();
    $('#changeschool').hide();
    $('#selchool').show(); 
    $.ajax({
            type: 'get',
            url: serverschools + "assets/connect/schools.php", 
            contentType: "application/json",
            dataType: 'json',
            jsonp : "callback",
            jsonpCallback: 'jsonpCallback',
            success: function(response) {
                $('.selectschool').find('option:not(:first)').remove();
                var schools = response.schools;
                $.each(schools, function( index, value ) {
                  $('.selectschool')
                    .append($("<option></option>")
                    .attr("value",value)
                    .text(index.replace("_", " ")));
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert("Error: revise su conexión a Internet.");
                $('#screen1').show();
                $('#screen2').hide();
                if (savedserver == 1) {
                    $('#selchool').hide();
                    $('#changeschool').show();
                } else {
                   $('#selchool').show();
                   $('#changeschool').hide(); 
                }
            }
        });
}

function register() {
    if(savedserver == '0' && $(".selectschool option:selected").val() == '-1') {
        alert('Error: Debe escoger una Institución para ingresar');
        return false;
    }

    if(savedserver == '0' && $(".selectschool option:selected").val() !== '-1') {
        server = $(".selectschool option:selected").val();
        $('#schoolname').text($(".selectschool option:selected").text());
        var data = {server: $(".selectschool option:selected").val(), school: $(".selectschool option:selected").text()}; 
        NativeStorage.setItem("data", data, setSuccess, setError);
    }

    if(navigator.connection.type == Connection.NONE || navigator.connection.type == Connection.CELL_2G) { 
        alert('Error: no estás conectado a Internet o tu conexión - 2G - es muy lenta para usar el servicio, revisa tu conexión.');
        navigator.app.exitApp();
    } else {
    setTimeout(function(){if (regpush == '0') connect()},4000);
    var pushNotification = window.plugins.pushNotification;
        pushNotification.register(function(result) {                
            //alert('Status: ' + result);
        }, function(result) {
            alert('Error notificaciones push: ' + result);
            connect();
        }, {
            "senderID": "489695636573", /* Google developers project number */
            "ecb" : "onNotificationGCM" /* Function name to handle notifications */
        });
    }
}

function onNotificationGCM(e) {
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                registrationId = e.regid; //GCM Registration ID
                regpush = '1';
                connect();
                //registerOn3rdPartyServer(registrationId);
            }
            break;

        case 'message':
            if (e.foreground) {
                alert('Rutas escolares: ' + e.payload.title + ' - ' + e.payload.message);
            } else if (e.coldstart) {
                alert('Rutas escolares: ' + e.payload.title + ' - ' + e.payload.message);
            } else {
                alert('Rutas escolares: ' + e.payload.title + ' - ' + e.payload.message);
            }
            break;

        case 'error':
            // handle error
            break;

        default:
            // handle default
            break;
    }
} 

function onBackKeyDown() 
{
 navigator.app.exitApp();
}

function connect(){
    $('#screen1').hide();
    $('#screen2').show();
    $('#changeschool').hide(); 
    $('#selchool').hide(); 
    $('#divschoolname').show(); 
    $.ajax({
            type: 'get',
            url: server + "assets/connect/connect.php", //http://rutas.buskoo.com/assets/connect/connect.php
            contentType: "application/json",
            dataType: 'json',
            jsonp : "callback",
            jsonpCallback: 'jsonpCallback',
            success: function(response) {
                cordova.plugins.backgroundMode.setDefaults({ text:'GeoCommerce'});
                params = 'uuid='+uuid+'&model='+model+'&platform='+platform+'&version='+version+'&appversion='+appversion+'&registerid='+registrationId+'&school='+$(".selectschool option:selected").text();
                cordova.plugins.backgroundMode.setDefaults({ text:'Aplicación activa!'});
                window.plugins.insomnia.keepAwake();
                ref = cordova.InAppBrowser.open(server + "es/ulogin?"+params, ' _blank', 'hidden=yes,location=yes'); //http://rutas.buskoo.com/es/ulogin?
                ref.addEventListener('loadstart', loadStartCallBack);
                ref.addEventListener('loadstop', loadStopCallBack);
                ref.addEventListener('loaderror', loadErrorCallBack);
                ref.addEventListener('exit', detectexit);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert("Error: revise su conexión a Internet.");
                $('#screen1').show();
                $('#screen2').hide();
                if (savedserver == 1) {
                    $('#selchool').hide();
                    $('#changeschool').show();
                } else {
                   $('#selchool').show();
                   $('#changeschool').hide(); 
                }
            }
        });
}

function loadStartCallBack() {
    setTimeout(function(){ref.show();},4000);
}

function loadStopCallBack() {
    ref.show();
}

function loadErrorCallBack() {
    alert('Existe un error posiblemente con la conexión, revisa que tengas acceso a Internet.');
    $('#screen1').show();
    $('#screen2').hide();
    if (savedserver == 1) {
        $('#selchool').hide();
        $('#changeschool').show();
    } else {
       $('#selchool').show();
       $('#changeschool').hide(); 
    }
    ref.close();
}

function detectexit() {
    regpush = '0';
    $('#screen1').show();
    $('#screen2').hide();
    if (savedserver == 1) {
        $('#selchool').hide();
        $('#changeschool').show();
    } else {
       $('#selchool').show();
       $('#changeschool').hide(); 
    }
}
