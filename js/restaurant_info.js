let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      fetchRestaurantReviews(restaurant);
      DBHelper.fetchReviews((err, reviews) => {
        DBHelper.initIndexedDB(reviews, 'reviews');
      });
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML(self.restaurant);
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.setAttribute("alt", restaurant.name + " restaurant");
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  
  //fillReviewsHTML(restaurant.reviews);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.tabIndex = 0;
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}



// add new review
function addReview() {
  // get form data
  var name = document.getElementById('name').value;
  var res_id = document.getElementById('res_id').value;
  var rate = document.getElementById('rate').value;
  var comment = document.getElementById('subject').value;
  var data = {};
  data.restaurant_id = res_id;
  data.name = name;
  data.rating = rate;
  data.comments = comment;
  console.log(data);
  const form = document.getElementById('review_form');
  if(navigator.onLine){
    const url = DBHelper.DATABASE_URL_reviews;
    fetch(url, {
      body: JSON.stringify(data),
      method: 'POST',
    }).then(result => {
      console.log('result ', result)
    }).catch(error => {
      console.log('data will be send later');
    })
    form.reset();
    fetchRestaurantReviews_1(restaurant = self.restaurant)
  } else {
    data.createdAt = Date.now();
    data.type = 'review';
    data.id = data.createdAt;
    add_offline_review(data);
    form.reset();
    DBHelper.initIndexedDB([data], 'offline');
  }
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.innerHTML = restaurant.name;
  a.setAttribute("href", "#");
  a.setAttribute("aria-level", "2");
  li.append(a);
  breadcrumb.appendChild(li);
}

fetchRestaurantReviews_1 = (restaurant = self.restaurant) => {
  DBHelper.fetchReviews_1(restaurant.id, (err, reviews) => {
    console.log('Reviews ', reviews);
    fillReviewsHTML(reviews)
  })
}

/**
 * Fetch Restaurants reviews
 */
fetchRestaurantReviews = (restaurant = self.restaurant) => {
  DBHelper.fetchReviews((err, reviews) => {
    const restaurantReviews = reviews.filter(obj => obj.restaurant_id === restaurant.id)
    console.log('restaurantReviews ', restaurantReviews);
    fillReviewsHTML(restaurantReviews)
  })
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// add review offline
add_offline_review = review => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  container.appendChild(ul);
}

// hundel indexed DB while Offline
window.addEventListener("online", () => {
  DBHelper.getRequestData('offline-db', offline_data => {
    if(!offline_data){
      return;
    }
    const reviews = offline_data.filter(object => object.type === 'review');
    const reviewUrl = DBHelper.DATABASE_URL_reviews;
    reviews.forEach(review => {
      fetch(reviewUrl, {
        body: JSON.stringify(review),
        method: 'POST',
      }).then(result => {
        console.log('result ', result)
      }).catch(error => {
        console.log('error in adding review');
      })
    });
  })
}, false);

