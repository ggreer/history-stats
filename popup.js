var MAX_RESULTS = 1000;
var history_urls = {};
var history_visits = {};
var history_visits_to_urls = {};

var data = {};
var domain_data = {};

var width = 600;
var height = 400;

var svg;
var timeout_id;

function init_graph() {
    svg = d3.select("#graph_container").append("svg")
            .attr("height", height)
            .attr("width", width)
            .attr("class", "chart");
}

function visit_timeline(visit_data) {
    var e;
    var i;
    var x;
    var visits;

    d3.select("#graph_container svg").remove();
    svg = d3.select("#graph_container").append("svg")
            .attr("height", height)
            .attr("width", width)
            .attr("class", "chart");

    visits = visit_data;
    visits.sort(function (a, b) {
        if (a.visitTime < b.visitTime) {
            return -1;
        }
        else if (a.visitTime > b.visitTime) {
            return 1;
        }
        return 0;
    });

    var min = visits[0].visitTime;
    var max = visits[visits.length - 1].visitTime;
    x = d3.scale.linear()
          .domain([min, max])
          .range([0, 420]);

    svg.selectAll("circle").data(visits)
       .enter().append("circle")
       .attr("x", function (d) { return x(d.visitTime) + 100; })
       .attr("y", function (d, i) { return 0; })
       .attr("r", 10);

}


function visit_count_graph(graph_data) {
    var i;
    var urls = [];
    var url;
    var x;
    var numbers;
    var labels;
    var bar_height = 20;
    var spacing = 2;
    var x_offset = 100;

    d3.select("#graph_container svg").remove();
    svg = d3.select("#graph_container").append("svg")
            .attr("height", height)
            .attr("width", width)
            .attr("class", "chart");

    var data_arr = [];
    for (var k in graph_data) {
      data_arr.push(graph_data[k]);
    }

    data_arr.sort(function (a, b) {
        if (a.visits.length > b.visits.length) {
            return -1;
        }
        else if (a.visits.length < b.visits.length) {
            return 1;
        }
        return 0;
    });

    x = d3.scale.linear()
          .domain([0, d3.max(data_arr, function (d) {
              return d.visits.length;
          })])
          .range([0, 420]);

    svg.selectAll("rect").data(data_arr)
       .enter().append("rect")
       .attr("x", x_offset)
       .attr("y", function (d, i) { return i * (bar_height + spacing); })
       .attr("width", function (d) {return x(d.visits.length);})
       .attr("height", bar_height);

    numbers = svg.append("g");
    numbers.selectAll("text").data(data_arr)
       .enter().append("text")
       .attr("x", function (d) { return x(d.visits.length) + x_offset; })
       .attr("y", function (d, i) { return i * (bar_height + spacing); })
       .attr("dx", -3)
       .attr("dy", "1.4em")
       .attr("text-anchor", "end")
       .text(function (d) { return d.visits.length; });

    labels = svg.append("g");
    labels.selectAll("text").data(data_arr)
       .enter().append("text")
       .attr("x", 10)
       .attr("y", function(d, i) { return i * (bar_height + spacing); })
       .attr("dx", -3)
       .attr("dy", "1.4em")
       .attr("text-anchor", "start")
       .attr("class", "black")
       .text(function (d) { return d.url; });

    height = (bar_height + spacing) * data_arr.length;
    svg.attr("height", height);
}

function set_history(url) {
    return function(visits) {
        var i;
        var visit;
        var domain;
        var url_no_hash;
        var url_no_protocol;

        console.log("appending " + visits.length + " visits to " + url);
        history_urls[url].visits = visits;
        for (i = 0; i < visits.length; i++) {
            visit = visits[i];
            history_visits_to_urls[visit.visitId] = url;
            history_visits[visit.visitId] = visit;
        }

        url_no_protocol = url.split("://", 2)[1];
        domain = url_no_protocol.split("/", 2)[0];
        if (domain_data[domain] === undefined) {
            domain_data[domain] = {url: domain, visits: []};
        }
        domain_data[domain].visits = domain_data[domain].visits.concat(visits);

        url_no_hash = url_no_protocol.split("#", 2)[0];
        if (data[url_no_hash] === undefined) {
            data[url_no_hash] = {url: url_no_hash, visits: []};
        }
        data[url_no_hash].visits = data[url_no_hash].visits.concat(visits);
        if (timeout_id !== undefined) {
            window.clearTimeout(timeout_id);
        }
        timeout_id = window.setTimeout(function () { visit_count_graph(domain_data); }, 100);
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
                chrome.history.getVisits({"url": hi.url}, set_history(hi.url));
            }
        }
    );
}


document.addEventListener("DOMContentLoaded", function () {
  init_graph();
  get_history();
  document.getElementById("visits_domain").addEventListener("click", function () {
    visit_count_graph(domain_data);
  });
  document.getElementById("visits_url").addEventListener("click", function () {
    visit_count_graph(data);
  });
  document.getElementById("visits_timeline").addEventListener("click", function () {
    visit_timeline(domain_data["www.google.com"].visits);
  });
});
