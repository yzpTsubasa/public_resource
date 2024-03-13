import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

document.body.onclick = function(event) {
  if (event.target.tagName == "IMG") {
    previewDataURL(event.target.src);
  }
};
function previewDataURL (content) {
  var string = content
  var iframe = "<iframe width='99%' height='99%' src='" + string + "' style='background-color: black;'></iframe>"
  var x = window.open()
  x.document.open()
  x.document.write(iframe)
  x.document.close()
}