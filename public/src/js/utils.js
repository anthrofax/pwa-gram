const dbPromise = idb.open("posts-store", 1, function (db) {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
});

function writeData(dataStore, data) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(dataStore, "readwrite");
    var store = tx.objectStore(dataStore);
    store.put(data);
    return tx.complete;
  });
}

function getAllData(dataStore) {
  return dbPromise.then(function (db) {
    const tx = db.transaction(dataStore, "readonly");
    const store = tx.objectStore(dataStore);

    return store.getAll();
  });
}
