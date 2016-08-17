// Model data
var locationList = [
    {
        name: 'Sextant Coffee Roasters',
        location: {lat: 37.772437, lng: -122.412901},
        address: '1415 Folsom St San Francisco, CA 94103',
        phone: '+14153551415',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Sightglass Coffee',
        location: {lat: 37.776900, lng: -122.408637},
        address: '270 7th St San Francisco, CA 94103',
        phone: '+14158611313',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Epicenter Cafe',
        location: {lat: 37.781531, lng: -122.399010},
        address: '764 Harrison St San Francisco, CA 94107',
        phone: '+14155435436',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Capricorn Coffees & Teas',
        location: {lat: 37.772315, lng: -122.411811},
        address: '353 10th St San Francisco, CA 94103',
        phone: '+14156218500',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Equator Coffees & Teas',
        location: {lat: 37.782663, lng: -122.409811},
        address: '986 Market St San Francisco, CA 94102',
        phone: '+14156149129',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Philz Coffee',
        location: {lat: 37.764608, lng: -122.401302},
        address: '1775 17th St. San Francisco, CA 94107',
        phone: '+14158148096',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Ritual Coffee Roasters',
        location: {lat: 37.776391, lng: -122.424194},
        address: '432b Octavia St, San Francisco, CA 94102',
        phone: '+14158650989',
        placeId: '',
        yelp: {}
    },
    {
        name: 'Four Barrel Coffee',
        location: {lat: 37.767019, lng: -122.421780},
        address: '375 Valencia St San Francisco, CA 94103',
        phone: '+14152520800',
        placeId: '',
        yelp: {}
    }
];

var ViewModel = function() {
    var self = this;

    self.locationListItems = ko.observableArray(locationList);
    self.filterText = ko.observable("");
    self.filteredList = ko.computed(function() {
        // Closing the info window in case one is open.
        if(popupWindow) {
            popupWindow.close();
        };
        // Retrieving strings from input.
        var filterStr = self.filterText().toLowerCase();
        if(!filterStr) {
            // Input was empty so showing all the markers.
            showAllMarkers();
            return self.locationListItems();
        } else {
            return ko.utils.arrayFilter(self.locationListItems(), function(locationListItem) {
                if(locationListItem.name.toLowerCase().indexOf(self.filterText().toLowerCase()) != -1) {
                    locationListItem.marker.setVisible(true);
                    return true;
                } else {
                    locationListItem.marker.setVisible(false);
                }
            });
    }});
    // A click handler for the search button next to the text input.
    self.applyFilter = function() {
        self.filteredList();
    }
    // A click handler for the list item.
    self.showInfoWindow = function(item) {
        bounceMarker(item.marker);
        populateInfoWindow(item.marker, popupWindow);
        closeNavListIfOpened();
    }

};


// View
var map;
var popupWindow;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {center: {lat: 37.771206, lng: -122.401662}, zoom: 14});
    popupWindow = new google.maps.InfoWindow();
    setMarkers();
}
// Show error message in case of failure with Google Maps API
function googleMapErrorHandler() {
    showErrorMessage();
}
// Create markers.
function setMarkers() {
    var markerIcon = {url: './images/coffee.png', size: (new google.maps.Size(30, 35)), origin: (new google.maps.Point(0, 0)), anchor: (new google.maps.Point(0, 32))};

    for (var i = 0; i < locationList.length; i++) {
        var cafe = locationList[i];
        var marker = new google.maps.Marker({position: cafe.location, map: map, title: cafe.name, phone: cafe.phone, icon: markerIcon, animation: google.maps.Animation.DROP});
        marker.addListener('click', function() {
            bounceMarker(this);
            populateInfoWindow(this, popupWindow);
        });
        locationList[i].marker = marker;
    }
}
// Show all the markers.
function showAllMarkers() {
    for (var i = 0; i < locationList.length; i++) {
        if(locationList[i].marker) {
            locationList[i].marker.setVisible(true);
        }
    };
}
// Animate a marker.
function bounceMarker (marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {marker.setAnimation(null)}, 700);
}
// Call Yelp API to get data for an info window content if a different marker is clicked
function populateInfoWindow(marker, infoWindow) {
    if(infoWindow.marker != marker) {
        getYelpData(marker, infoWindow);
        infoWindow.marker = marker;

        infoWindow.addListener('closeclick', function() {
            infoWindow.marker = null;
            infoWindow.close();
        });
        infoWindow.addListener('content_changed', function() {
            infoWindow.open(map, marker);
        });
    }
}

function generateNonce() {
    return (Math.floor(Math.random() * 1e12).toString());
}
// Call Yelp API for the selected marker
function getYelpData(marker, infoWindow) {
    var parameters = {
        oauth_consumer_key: '6BgYReWVicr4ExkS9ENi0A',
        oauth_token: '-f0FBlKKv1sZvlIVbwhFQ_euubIRI4_x',
        oauth_nonce: generateNonce(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version : '1.0',
        phone: marker.phone,
        callback: 'cb'
    };

    var base_url = 'https://api.yelp.com/v2/phone_search';

    var encodedSignature = oauthSignature.generate('GET', base_url, parameters, 'Q9pIusKHyHoQ78x9UCFCGjLbtDk', '9vRoYE3HxkJuWGTKgNG0l3nxqgU');
    parameters.oauth_signature = encodedSignature;
    var settings = {
        url: base_url,
        data: parameters,
        cache: true,
        dataType: 'jsonp',
        timeout: 1000,
        success: function(results) {
            var cafeData = results.businesses[0];
            infoWindow.setContent('');
            infoWindow.setContent("<div class='infoWindow'><p style='font-size:20px'>" + cafeData.name + "</p><p>Yelp rating:  <span style='font-size:18px;font-weight:bold'>" + cafeData.rating +"</span></p><p><a href='" + cafeData.url + "' target='_blank'>  More info</a></p><img src='" + cafeData.image_url + "' alt='" + cafeData.name + "'/></div>");
        },
        error : function(error) {
            //console.log(error);
            showErrorMessage();
        }
    };
    $.ajax(settings);
}
// For tablet and mobile. Close the list when an item was clicked.
function closeNavListIfOpened() {
    if($('#nav-burger-icon').css('display') === 'block') {
        $('header').toggleClass('open-nav');
        $('nav').toggleClass('open');
    }
}

function showErrorMessage() {
    // Get the modal window element
    var $modal = $('#modalWindow');
    // Get the <span> element that acts as a close button
    var $closebutton = $(".close");
    // Message to present users
    var message = "<p>An error has occured.</p>Pleae try again later.";
    var $msg = $('#modalMessage');
    $msg.html(message);
    // When <span> (x) is clicked, close the modal
    // Then reset the game
    $closebutton.click(function() {
        $msg.html("");
        $modal.css('display','none');
    });
    // Show the modal window
    $modal.css('display', 'block');
}

ko.applyBindings(new ViewModel());
// Add click handler to the burger menu icon.
$(function() {
    $('#nav-burger-icon').click(function(){
        $('header').toggleClass('open-nav');
        $('nav').toggleClass('open');
    });
});

