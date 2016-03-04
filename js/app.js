$(document).foundation();



// 0. READ DATA ---------------------------------------------------------------

// Read test data
// var data_json = [];
// $.ajax({
//  url: "data/2014-01-01 January 2014 to March 2014.json",
//  dataType: "json",
//  success: function(response) {
//      $.each(response.event, function(item) {
//          data_json.push(item.query);
//      });
//  }
// });



// var test = JSON.parse(data);
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var hours = d3.range(24).map(function(i) { return "" + i + "h"; });


// 1. PROCESS DATA ------------------------------------------------------------

// // Parse timestamps
// var parseTimestamp = function(usec) {
//     var d = new Date(usec / 1000);
//     return d;
// }


// // Obtain timestamp list
// var _usec, _tmsmp;
// var data_timestamps = [];
// for (i = 0, len = test.event.length; i < len; i++) {
//     _usec = parseInt(test.event[i].query.id[0].timestamp_usec);
//     _tmsmp = parseTimestamp(_usec);
//     data_timestamps.push(_tmsmp)
// }


// // Obtain weekday and hourly count of searches
// var _tmsmp;
// var weekday_count = new Uint16Array(7); // 7 days of the week
// var hour_count = new Uint16Array(24);   // 24 hours in a day
// for (i = 0, len = data_timestamps.length; i < len; i++) {
//     _tmsmp = data_timestamps[i];
//     weekday_count[ _tmsmp.getDay() ]++;
//     hour_count[ _tmsmp.getHours() ]++;
// }


// Example of usage
// var usec1 = parseInt(test.event[0].query.id[0].timestamp_usec);
// alert( parseTimestamp(usec1) );



// EVENT HANDLING WITH D3 -----------------------------------------------------


var viz_title;

// Use JQuery for viz selection
var bar_chart = true;
var line_chart = false;
var month_chart = false;


// Select data
var dataset;
if (bar_chart) {
  dataset = weekday_count;
} else if (line_chart) {
  dataset = hour_count;  
}




// 2. D3 VISUALIZATION --------------------------------------------------------

// Constants
var margin = {top: 20, right: 20, bottom: 30, left: 30};

var _w = $("#viz-canvas").width();
var _h = $(".sidebar").height() - $("#viz-title").height();


var width = _w - margin.left - margin.right;
var height = _h - margin.top - margin.bottom;

var padding = 0;
var bar_padding = 4;


// Viz
var create_viz = function() {

    // Set title
    $("#viz-title").text(viz_title);


    // Pre-reqs

    // Tooltip for Bar chart
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d, i) {
        return "<p><strong>" + d + "</strong> searches on <strong>" + days[i] + "</strong></p>";
      })


    // Tooltip for Line chart
    var mousemove = function() {

        var x_mouse = d3.mouse(this)[0];

        var i = Math.round(x_mouse / x_sc_line.rangeBand());
        if (i == 24) { i = 0; }
        var d = dataset[i];

        // Force text inside svg canvas
        var text_x = (x_sc_line(hours[i]) > width - 100) ? x_sc_line(hours[i]) - 120 : x_sc_line(hours[i]);
        var text_y = (y_scale(d) < 10) ? y_scale(d) + 10 : y_scale(d);

        focus.select("circle#circle")
             .attr("transform",
                   "translate(" + x_sc_line(hours[i]) + "," +
                                  y_scale(d) + ")");

        focus.select("#focus>text")
             .attr("transform",
                   "translate(" + text_x + "," +
                                  text_y + ")")
             .text(d + " searches at " + hours[i]);

        focus.select(".x")
             .attr("transform",
                   "translate(" + x_sc_line(hours[i]) + "," +
                                  y_scale(d) + ")")
             .attr("y2", height - y_scale(d));

        focus.select(".y")
             .attr("transform",
                   "translate(" + width * -1 + "," +
                               y_scale(d) + ")")
             .attr("x2", width + width);
    }


    // Select appropriate dataset
    if (bar_chart) {
      dataset = weekday_count;
    } else if (line_chart) {
      dataset = hour_count;  
    }

    // Filter dataset
    // TODO


    // Insert SVG and initialize
    var svg = d3.select("#viz-canvas").append("svg")

    svg.attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append("g");

    svg.call(tip);


    // Scales
    var x_scale = d3.scale.ordinal()
                          .domain(days)
                          .rangeRoundBands([padding, width - padding]);


    var x_sc_line = d3.scale.ordinal()
                            .domain(hours)
                            .rangeRoundBands([padding ,width - padding]);

    var y_scale = d3.scale.linear()
                          .domain([0, d3.max(dataset)])
                          .range([height, 0])
                          .nice();


// Axes
    var x_axis; // depends on the viz selected
    if (bar_chart) {
      x_axis = d3.svg.axis()
                     .scale(x_scale)
                     .orient("bottom")
                     .ticks(0);  
    } else if (line_chart) {
      x_axis = d3.svg.axis()
                     .scale(x_sc_line)
                     .orient("bottom")
                     .ticks(0);  
    }

    var y_axis = d3.svg.axis()
                   .scale(y_scale)
                   .orient("left")
                   .ticks(5);



    if (bar_chart) {

    // -- BAR --
        svg.selectAll(".bar")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr({
            x: function(d, i) { return x_scale(days[i]); },
            y: function(d) { return y_scale(d); },
            width: x_scale.rangeBand(),
            height: function(d) { return height - y_scale(d); },
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    } else if (line_chart) {

    // -- LINE --
        var line = d3.svg.line()
                        .x(function(d, i) { return x_sc_line(hours[i]); })
                        .y(function(d, i) { return y_scale(d); });

        svg.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        // Tooltip for Line
        var focus = svg.append("g")
                    .attr("id", "focus");
                    // .style("display", "none");

        // append the x line
        focus.append("line")
            .attr("class", "x")
            .attr("y1", 0)
            .attr("y2", height);

        // append the y line
        focus.append("line")
            .attr("class", "y")
            .attr("x1", width)
            .attr("x2", width);

        // append the circle at the intersection
        focus.append("circle")
            .attr("id", "circle")
            .attr("r", 4);

        // place the value at the intersection
        focus.append("text")
            .attr("dx", 8)
            .attr("dy", "-.3em");

        // append the rectangle to capture mouse
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            // .style("fill", "none")
            // .style("pointer-events", "all")
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);

    }

    // Plot axes

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate( 0," + (height - padding) + ")")
       .call(x_axis)

    svg.append("g")
       .attr("class", "y axis")
       .call(y_axis)


}

create_viz();




// EVENT HANDLING WITH D3 -----------------------------------------------------

$("#viz-type>a").on("click", function() {
    $("#viz-type>a").removeClass("primary").addClass("secondary")
    $(this).removeClass("secondary").addClass("primary");
    viz_title = this.name;
    console.log(this.id);
    if (this.id === "bbar") {
        bar_chart = true;
        line_chart = false;
        month_chart = false;
    } else if (this.id == "bline") {
        bar_chart = false;
        line_chart = true;
        month_chart = false;
    } else {
        bar_chart = false;
        line_chart = false;
        month_chart = true;        
    }
});


// Replot button
$("#replot-btn").on("click", function() {
    console.log(" Plotting: " + viz_title);
    // console.log(" - Bar: " + bar_chart);
    // console.log(" - Line: " + line_chart);
    // console.log(" - Month: " + month_chart);
    d3.select("svg").remove();
    create_viz();
} );


