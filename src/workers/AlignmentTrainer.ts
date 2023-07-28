self.addEventListener('message', (event) => {
  // Sleep for 7 seconds
  setTimeout(() => {
    // Send a message back to the main thread
    self.postMessage('Worker has finished');
  }, 7000);
});
