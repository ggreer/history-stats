var MAX_RESULTS = 100;
var history_urls = [];
var history_visits = [];
var history_visits_to_urls = [];

var data = [];

var barWidth = 40;
var width = (barWidth + 10) * MAX_RESULTS;
var height = 400;

var svg;
var body;

function init() {
    svg = d3.select("body").append("svg")
            .attr("height", height)
            .attr("width", width)
            .append("g")
            .attr("transform", "translate(" + x(1) + "," + (height - 20) + ")scale(-1,-1)");
    body = svg.append("g")
              .attr("transform", "translate(0,0)");
}

function draw_graph() {
    var i;
    var urls;
    var url;
    var url_node;
    urls = Object.keys(history_urls);
    if (data.length === 0) {
        console.log("no data. retrying in 500ms");
        setTimeout(draw_graph, 500);
    }
    if (body === undefined) {
        console.log("svg doesn't exist yet. retrying in 500ms");
        setTimeout(draw_graph, 500);
    }

    console.log("drawing graph");

    var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
    var y = d3.scale.linear().domain([0, d3.max(data, function(datum) { return datum.books; })]).rangeRound([0, height]);

    for (i = 0; i < urls.length; i++) {
        url = urls[i];
        url_node = svg.append("g").data(url.visits);
        url_node.text(url);
    }
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
            data.push({url: url, visits: visits.length});
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
            draw_graph();
        }
    );
}

get_history();
