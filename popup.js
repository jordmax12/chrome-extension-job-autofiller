// Simple popup script for the Chrome extension

document.addEventListener('DOMContentLoaded', function() {
  // Get the close button
  const closeBtn = document.getElementById('closeBtn');
  
  // Add click event listener to close the popup
  closeBtn.addEventListener('click', function() {
    // Close the popup window
    window.close();
  });
  
  // Optional: You can also add other functionality here
  console.log('Hello World Chrome Extension loaded!');
});
