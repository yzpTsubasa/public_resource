if (/\/\S+\/\S+\/console/.test(window.location.href)) {
    function createScrollButton(title, handler) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#">${title}</a>`;
        li.onclick = function(e) {
            handler();
            e.preventDefault();
        }
        document.getElementById("breadcrumbs").appendChild(li)
    }
    function createSeparator() {
        var li = document.createElement("li");
        li.className = "separator";
        document.getElementById("breadcrumbs").appendChild(li)
    }
    
    createScrollButton("Top", () => window.scrollTo({top: 0, behavior: "smooth"}));
    createSeparator();
    createScrollButton("Bottom", () => window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"}));
}