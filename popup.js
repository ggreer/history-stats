var MAX_RESULTS = 1000;
var history_urls = [];
var history_visits = [];
var history_visits_to_urls = [];

function draw_graph() {
    var svg = d3.select("body").append("svg")
    .attr("width", 400)
    .attr("height", 400)
    .append("g");
}

function set_history(url) {
    return function(visits) {
        var i;
        var visit;
        console.log("appending " + visits.length + " visits to " + url);
        history_urls[url].visits = visits;
        for (i = 0; i < visits.length; i++) {
            visit = visits[i];
            history_visits_to_urls[visit.visitId] = url;
            history_visits[visit.visitId] = visit;
        }
    };
}

function get_history(start_time) {
    var i;
    start_time = start_time || new Date() - (1000 * 60 * 60 * 24 * 30);

    chrome.history.search({'text': '', 'startTime': start_time, 'maxResults': MAX_RESULTS },
        function(history_items) {
            console.log("found " + history_items.length + " history items since " + start_time.toLocaleString());
            for (i = 0; i < history_items.length; i++) {
                var hi = history_items[i];
                history_urls[hi.url] = hi;
                //todo: don't declare this function in a loop
                chrome.history.getVisits({"url": hi.url}, set_history(hi.url));
            }
            console.log(history_urls);
            draw_graph();
        }
    );
}

get_history();
