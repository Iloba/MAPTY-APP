'use strict';

//Callback Two (Error)
function Failure() {
  return alert('Could not get your position');
}

//WORKOUT CLASS
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 
    'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click(){
    this.clicks++
    
  }
}

//RUNNING CLASS
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

//CYCLING CLASS
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//TEST DATA
const run1 = new Running([39, -12], 5.2, 34, 178);
const cycling1 = new Cycling([39, -12], 27, 91, 523);

// console.log(run1, cycling1);

//GLOBAL VARIABLES
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetBtn = document.querySelector('.btn-reset');

//APP CLASS
class App {
  //GLOBAL PROPERTIES
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    //Get Users Position
    this._getPosition();

    //Get Data from Local Storage
    this._getLocalStorage();

    //Attach Event Handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    resetBtn.addEventListener('click', this._resetApp)
  }

  _getPosition() {
    //DisplayMap
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        Failure
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    //   console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Add Event Listener to Map
    this.#map.on('click', this._showForm.bind(this));


    this.#workouts.forEach(work => {
     this._renderWorkoutMarker(work);
   })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    //Display Form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Empty Input
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //HELPER FUNCTION
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    //HELPER FUNCTION
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    e.preventDefault();

    //Get Data from Form//
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If Workout  is running, create running Object//
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Check if Data is Valid//
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive Numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If Workout  is Cycling, Create Cycling Object//
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Check if Data is Valid//
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive Numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add New Object to workout Array//
    this.#workouts.push(workout);
    

    //Render Workout on Map as Marker//
    this._renderWorkoutMarker(workout);

    //Render Workout on List//
    this._renderWorkout(workout);

    //Hide form and Clear input fields
    this._hideForm();

    //Set Local storage to store all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${ workout.type === 'running' ? '🏃‍♂️' : '🏍'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🏍'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running')
      html += ` 
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e){

    const workoutEL = e.target.closest('.workout');

    if(!workoutEL) return;

    // console.log(workoutEL);

    //FIND WORKOUT

    const workout = this.#workouts.find(work => work.id === workoutEL.dataset.id);

    // console.log(workout);

    //Move
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1
      }
    });

    // workout.click();
  }

  //Store Workouts in Local Storage
  _setLocalStorage(){
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    //GUARD CLAUSE
    if(!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
       this._renderWorkout(work);
    })


  }

  _resetApp(){
    localStorage.removeItem('workouts');
    location.reload();
  }
  
}

const app = new App();
