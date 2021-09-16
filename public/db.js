// Declare database variable
let db;
// Create a new db request for a "budget" database.
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (e) {
    db = e.target.result;
    db.createObjectStore('newTransaction', { autoIncrement: true });
};

request.onerror = function (e) {
  console.log(`${e.target.errorCode}`);
};

request.onsuccess = function (e) {
    db = e.target.result;
  
    if (navigator.onLine) {
      checkDatabase();
    }
};

function checkDatabase() {

  // Open a transaction on your transaction db
  const transaction = db.transaction(['newTransaction'], 'readwrite');

  // Access your transaction object
  const store = transaction.objectStore('newTransaction');

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // When the store contains items, they will be bulk added upon reconnecting
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to transaction with the ability to read and write
            transaction = db.transaction(['newTransaction'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('newTransaction');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
          }
        });
    }
  };
}

const saveRecord = (record) => {
  // Create a transaction on the budget db with readwrite access
  const transaction = db.transaction(['newTransaction'], 'readwrite');

  // Access your budget object store
  const store = transaction.objectStore('newTransaction');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);