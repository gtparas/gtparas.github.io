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
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

function index_guest_clicked(){
    localStorage.setItem("master_key", null);
    localStorage.setItem("title", "");
    document.location="guest.html"; 
}

function index_login_clicked(){
    document.location="login.html"; 
}

function login_login_clicked(){
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    email = "admin@gmail.com";
    password = "123456";
    if (email.length < 4) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 4) {
      alert('Please enter a password.');
      return;
    }
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
        } else {
            alert(errorMessage);
        }
        console.log(error);
        document.getElementById('quickstart-sign-in').disabled = false;
    });
    localStorage.setItem("user", email);
    document.location="list.html";
}
function login_back_clicked(){
    history.go(-1);
    navigator.app.backHistory();
}

function list_button_clicked(key, title){
    localStorage.setItem("master_key", key);
    localStorage.setItem("title", title);
    document.location="map.html";
}

function map_add_clicked(){
    //insert a new record and update all the other records with index greater or equal to the current record

    var index = localStorage.getItem("index");
    var key = localStorage.getItem("master_key");

    // μεταφέρω τα latitude/longitude/zoom της κάμερας
    var latitude = localStorage.getItem("latitude");
    var longitude = localStorage.getItem("longitude");
    var myzoom = localStorage.getItem("zoom");

    var record_new = {
        body: document.getElementById("myText").value,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        master_key: key,
        seq_num: index,
        zoom: myzoom
    };

    var new_record_key = firebase.database().ref().child('detail').push().key;
    var updates = {};
    updates['/detail/' + new_record_key] = record_new;
    firebase.database().ref().update(updates);

    // παίρνουμε από την βάση όλες τις εγγραφές με inputter τον user μας
    var ref = firebase.database().ref("detail");
    ref.orderByChild("master_key").equalTo(key).on("child_added", function(snapshot) {

        //για κάθε DataSnapshot ελέγχει τα κριτήρια
        if(snapshot.child("seq_num").val() >= index && snapshot.key!=new_record_key) {

            // αύξησε το seq_num των επόμενων εγγραφών για να μπει η νέα.
            var seq_num_new = parseInt(snapshot.child("seq_num").val()) + 1;

            firebase.database().ref('detail/'+snapshot.key).set({
                body: snapshot.child("body").val(),
                latitude: snapshot.child("latitude").val(),
                longitude: snapshot.child("longitude").val(),
                master_key: snapshot.child("master_key").val(),
                seq_num: seq_num_new.toString(),
                zoom: snapshot.child("zoom").val()
            });

        }

    });
   
}

function map_delete_clicked(){
    //delete the current record and update all the other records with index greater than the current record

    var index = localStorage.getItem("index");
    var key = localStorage.getItem("master_key");

    var notfound = 1;

    // todo: πρέπει να ξαστερώσω τα παρακάτω που κάνουν update τα επόμενα records, και να τεστάρω το delete
    // παίρνουμε από την βάση όλες τις εγγραφές με inputter τον user μας
    var ref = firebase.database().ref("detail");
    ref.orderByChild("master_key").equalTo(key).on("child_added", function(snapshot) {

        //για κάθε DataSnapshot ελέγχει τα κριτήρια
        if(snapshot.child("seq_num").val() > index) {

            // όταν βρει το επόμενο record να το εμφανίσει στην σελίδα
            if(snapshot.child("seq_num").val() == parseInt(index) + 1) {

                // βρήκε εγγραφή για να εμφανίσει
                notfound = 0;

                document.getElementById("myText").value = snapshot.child("body").val();

                var latitude = snapshot.child("latitude").val();
                var longitude = snapshot.child("longitude").val();
                var location = {lat: latitude, lng: longitude};
                var zoom = snapshot.child("zoom").val();
                // ενημερώvω την θέση της κάμερας του χάρτη
                window.map.setZoom(parseInt(zoom));
                window.map.setCenter(location);
                window.marker.setPosition(location);
    
            }

            // μείωσε το seq_num των επόμενων εγγραφών για να βγει η τρέχουσα.
            var seq_num_new = parseInt(snapshot.child("seq_num").val()) - 1;

            firebase.database().ref('detail/'+snapshot.key).set({
                body: snapshot.child("body").val(),
                latitude: snapshot.child("latitude").val(),
                longitude: snapshot.child("longitude").val(),
                master_key: snapshot.child("master_key").val(),
                seq_num: seq_num_new.toString(),
                zoom: snapshot.child("zoom").val()
            });
        }

        if(snapshot.child("seq_num").val() == index) {
            firebase.database().ref('detail/'+snapshot.key).remove();
        }

    });
    
    // δεν βρήκε εγγραφή για να εμφανίσει, άρα εμφάνισε κενή εγγραφή
    if(notfound==1){
        document.getElementById("myText").value = "";
    }
}

function map_right_clicked(){
    //load the next record or clear the textboxes to enter a new one

    var index = localStorage.getItem("index");
    var key = localStorage.getItem("master_key");
    var seq_num_new = parseInt(index) + 1;

    var notfound = 1;
    var indexmax = 0;

    // παίρνουμε από την βάση όλες τις εγγραφές με inputter τον user μας
    var ref = firebase.database().ref("detail");
    ref.orderByChild("master_key").equalTo(key).on("child_added", function(snapshot) {

        if(snapshot.child("seq_num").val() > indexmax) {
            indexmax = snapshot.child("seq_num").val();
        }

        //για κάθε DataSnapshot ελέγχει τα κριτήρια
        if(snapshot.child("seq_num").val() == seq_num_new.toString()) {
            localStorage.setItem("index", seq_num_new);
            document.getElementById("H2").innerHTML = "#"+seq_num_new;
            document.getElementById("myText").value = snapshot.child("body").val();

            var latitude = snapshot.child("latitude").val();
            var longitude = snapshot.child("longitude").val();
            var location = {lat: latitude, lng: longitude};
            var zoom = snapshot.child("zoom").val();
            // ενημερώvω την θέση της κάμερας του χάρτη
            window.map.setZoom(parseInt(zoom));
            window.map.setCenter(location);
            window.marker.setPosition(location);

            notfound = 0;
        }

    });

    // δεν υπάρχει ο index στην βάση, άρα πρόκειται για νέα εγγραφή
    if(notfound==1){
        if(seq_num_new > parseInt(indexmax) + 1){
            seq_num_new = parseInt(indexmax) + 1;
        }
        localStorage.setItem("index", seq_num_new);
        document.getElementById("H2").innerHTML = "#"+seq_num_new;
        document.getElementById("myText").value = "";
    }
    
}

function map_left_clicked(){
    //load the previous record 

    var index = localStorage.getItem("index");
    var key = localStorage.getItem("master_key");
    var seq_num_new = parseInt(index) - 1;

    if(seq_num_new>0){
        // παίρνουμε από την βάση όλες τις εγγραφές με inputter τον user μας
        var ref = firebase.database().ref("detail");
        ref.orderByChild("master_key").equalTo(key).on("child_added", function(snapshot) {

            //για κάθε DataSnapshot ελέγχει τα κριτήρια
            if(snapshot.child("seq_num").val() == seq_num_new.toString()) {
                localStorage.setItem("index", seq_num_new);
                document.getElementById("H2").innerHTML = "#"+seq_num_new;
                document.getElementById("myText").value = snapshot.child("body").val();

                var latitude = snapshot.child("latitude").val();
                var longitude = snapshot.child("longitude").val();
                var location = {lat: latitude, lng: longitude};
                var zoom = snapshot.child("zoom").val();
                // ενημερώvω την θέση της κάμερας του χάρτη
                window.map.setZoom(parseInt(zoom));
                window.map.setCenter(location);
                window.marker.setPosition(location);
            }

        });

    }

}
