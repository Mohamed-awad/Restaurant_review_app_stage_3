//import * as idb from '../node_modules/idb';
/**
 * Common database helper functions.
 */

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  // db for review
  static get DATABASE_URL_reviews() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  // using indexed db
  static initIndexedDB(objs, name) {
    return this.openIndexedDB(objs, name);
  }

  // open indexed DB
  static openIndexedDB(obj, db_name) {
    let db, objectStore;
    const indexedDB = window.indexedDB || 
      window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if(!indexedDB) {
      console.log("your browser does not support idb");
    }
    const dbPromise = indexedDB.open(`${db_name}-db`, 1);
    // handle error
    dbPromise.onerror = (error) => {
      console.error(' Failed to open indexed database');
      console.error(' error message', error.target);
      console.error(' error message', error.target);
    };
    // on success
    dbPromise.onsuccess = (event) => {
      db = event.target.result;
      if(db.transaction){
        const transaction = db.transaction(db_name, 'readwrite');
        transaction.oncomplete = event => {
          console.log('event on transaction complete');
        }
        objectStore = transaction.objectStore(db_name);
        this.addObjects(objectStore, obj);
        return;
      }
    };

    // upgrade IndexedDB
    dbPromise.onupgradeneeded = (event) => {
      db = event.target.result;
      objectStore = db.createObjectStore(db_name, { keyPath: 'id' });
      // check for db
      if(db_name === 'restaurants'){
        objectStore.createIndex('name', 'name', { unique: false });
      }
      if(db_name === 'reviews'){
        objectStore.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
      if(db_name === 'workOffline'){
        objectStore.createIndex('type', 'type', { unique: false });
      }
      objectStore.transaction.oncomplete = (event) => {
        objectStore = db.transaction([ db_name ], 'readwrite').objectStore(db_name);
        this.addObjects(objectStore, obj);
      };
    };
  };

  // get request data
  static getRequestData(db_name, callback){
    const indexedDB = window.indexedDB || 
      window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    let objectStore, objectStoreRequest, db, data;
    const dbPromise = indexedDB.open(`${db_name}-db`, 1);
    dbPromise.onsuccess = event => {
      db = dbPromise.result;
      const transaction = db.transaction(db_name, 'readonly');
      transaction.oncomplete = event => {
        console.log('event complete =>', event);
      }
      objectStore = transaction.objectStore(db_name);
      objectStoreRequest = objectStore.getAll();
      objectStoreRequest.onsuccess = event => {
        data = event.target.result;
        if(!data){
          console.error('Error fetching reviews => ', error);
          callback(error, null);
          return;
        }
        callback(null, data);
      }
    };
  }


  // add objects to indexed db
  static addObjects(store, objs){
    if(objs){
      objs.forEach((obj) => {
        store.add(obj);
      });
    }
  };

  // Fetch all restaurants.
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then(
      (response) => {
        return response.json()
    }).then(
      restaurants => {
        DBHelper.initIndexedDB(restaurants, 'restaurants');
        callback(null, restaurants);
      }
    ).catch(error => {
      this.getRequestData('restaurants', callback);
    })
  }

  // fetch reviews 
  static fetchReviews_1(id, callback){
    console.log(id);
    fetch(DBHelper.DATABASE_URL_reviews+'?restaurant_id='+id).then(
      (response) => {
        return response.json()
    }).then(
      reviews => {
        console.log(reviews);
        callback(null, reviews);
    }).catch(error => {
      this.getRequestData('reviews', callback);
    })
  }

  // fetch reviews 
  static fetchReviews(callback){
    fetch(DBHelper.DATABASE_URL_reviews).then(
      (response) => {
        return response.json()
    }).then(
      reviews => {
        callback(null, reviews);
    }).catch(error => {
      this.getRequestData('reviews', callback);
    })
  }


  // update restaurant to be favorite
  static update_fav_true(id) {
    var data = {};
    data.is_favorite = true;
    var json = JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", DBHelper.DATABASE_URL + '/' + id);
    xhr.setRequesrestaurantstHeader('Content-type','application/json; charset=utf-8');
    xhr.onload = function () {
      var restaurant = JSON.parse(xhr.responseText);
      console.log(restaurant);
    }
    xhr.send(json);   
  }

  // update restaurant to be not favorite
  static update_fav_false(id) {
    var data = {};
    data.is_favorite = false;
    var json = JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", DBHelper.DATABASE_URL + '/' + id);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
    xhr.onload = function () {
      var restaurant = JSON.parse(xhr.responseText);
      console.log(restaurant);
    }
    xhr.send(json);   
  }

  

  
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
     DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { 
          // restaurant exists
          callback(null, restaurant);
        } else { 
          // restaurant does not exist 
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * add review page URL.
   */
  static urlForAddReview() {
    return (`./addReview.html`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph === undefined) {
      return (`/img/1.webp`);
    }
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if(!restaurant || !map){
      return;
    }
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
}


