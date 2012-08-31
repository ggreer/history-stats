var MAX_RESULTS = 100;
var history_urls = [];
var history_visits = [];
var history_visits_to_urls = [];

var data = [];
var values = [];

var barWidth = 40;
var width = 600; //(barWidth + 10) * MAX_RESULTS;
var height = 400;

var x_offset;

var svg;

function init_graph() {
    svg = d3.select("body").append("svg")
            .attr("height", height)
            .attr("width", width)
            .attr("class", "chart");
}

function draw_graph() {
    var i;
    var urls = [];
    var url;
    var x;
    var numbers;
    var labels;

    if (data.length < MAX_RESULTS) {
        console.log("not enough data. retrying in 500ms");
        setTimeout(draw_graph, 500);
        return;
    }
    if (svg === undefined) {
        console.log("svg doesn't exist yet. retrying in 500ms");
        setTimeout(draw_graph, 500);
        return;
    }

    console.log("drawing graph...");

    data.sort(function (a,b) {
        if (a.visits > b.visits) {
            return -1;
        }
        else if (a.visits < b.visits) {
            return 1;
        }
        return 0;
    });

    for (i = 0; i < data.length; i++) {
        urls.push(data[i].url);
    }

    values.sort(function (a, b) {
        return b - a;
    });

    x_offset = 100;

    x = d3.scale.linear()
          .domain([0, d3.max(values)])
          .range([0, 420]);

    svg.selectAll("rect").data(data)
       .enter().append("rect")
       .attr("x", x_offset)
       .attr("y", function (d, i) { return i * 20; })
       .attr("width", function (d) {return x(d.visits);})
       .attr("height", 20);

    numbers = svg.append("g");
    numbers.selectAll("text").data(values)
       .enter().append("text")
       .attr("x", function (d) { return x(d) + x_offset; })
       .attr("y", function (d, i) { return (i * 20); })
       .attr("dx", -3)
       .attr("dy", "1.4em")
       .attr("text-anchor", "end")
       .text(String);

    labels = svg.append("g");
    labels.selectAll("text").data(urls)
       .enter().append("text")
       .attr("x", 10)
       .attr("y", function(d, i) { return (i * 20); })
       .attr("dx", -3)
       .attr("dy", "1.4em")
       .attr("text-anchor", "start")
       .attr("class", "black")
       .text(String);
    
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
        data.push({url: url, visits: visits.length});
        values.push(visits.length);
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

document.addEventListener('DOMContentLoaded', init_graph);
